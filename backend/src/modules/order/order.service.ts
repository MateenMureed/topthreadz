import { randomUUID } from 'crypto';
import prisma from '../../utils/prisma';
import { OrderStatus, Prisma, ReturnType } from '@prisma/client';
import { NotFoundError, BadRequestError } from '../../utils/errors';
import { env } from '../../config/env';
import logger from '../../utils/logger';
import { sendOrderConfirmationNotification, sendOrderStatusNotification } from '../../utils/notifications';

interface AdminOrderFilters {
  status?: string;
  paymentStatus?: string;
  search?: string;
}

export class OrderService {
  async getDeliveryConfig(): Promise<{ freeDeliveryThreshold: number; standardDeliveryFee: number }> {
    try {
      const setting = await prisma.siteSetting.findUnique({ where: { key: 'store_settings' } });
      if (setting) {
        const parsed = JSON.parse(setting.value);
        const freeDeliveryThreshold = Number(parsed.freeDeliveryThreshold);
        const standardDeliveryFee = Number(parsed.standardDeliveryFee);
        return {
          freeDeliveryThreshold: Number.isFinite(freeDeliveryThreshold) && freeDeliveryThreshold >= 0 ? freeDeliveryThreshold : 10000,
          standardDeliveryFee: Number.isFinite(standardDeliveryFee) && standardDeliveryFee >= 0 ? standardDeliveryFee : 250,
        };
      }
    } catch { /* fallback to defaults */ }
    return {
      freeDeliveryThreshold: 10000,
      standardDeliveryFee: 250,
    };
  }

  generateOrderNumber(prefix = 'TT'): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const rand = Math.floor(100 + Math.random() * 900);
    return `${prefix}-${timestamp}${rand}`;
  }
  async createOrder(userId: string, data: { addressId: string; notes?: string; couponCode?: string; deliverySlotId?: string; deliveryDate?: string }) {
    const addressId = String(data.addressId || '').trim();
    const notes = typeof data.notes === 'string' ? data.notes.trim() : undefined;
    const couponCode = typeof data.couponCode === 'string' ? data.couponCode.trim() : undefined;
    const deliverySlotId = typeof data.deliverySlotId === 'string' ? data.deliverySlotId.trim() : undefined;
    const deliveryDate = typeof data.deliveryDate === 'string' ? data.deliveryDate.trim() : undefined;

    if (!addressId) {
      throw new BadRequestError('Address is required');
    }

    const cart = await prisma.cart.findUnique({
      where: { userId },
      include: { items: { include: { product: true } } },
    });

    if (!cart || cart.items.length === 0) {
      throw new BadRequestError('Cart is empty');
    }

    // Validate address
    const address = await prisma.address.findFirst({ where: { id: addressId, userId } });
    if (!address) throw new NotFoundError('Address not found');

    // Validate stock
    for (const item of cart.items) {
      if (item.product.stock < item.quantity) {
        throw new BadRequestError(`Insufficient stock for ${item.product.name}`);
      }
    }

    // Calculate totals
    const { freeDeliveryThreshold, standardDeliveryFee } = await this.getDeliveryConfig();
    const subtotal = cart.items.reduce((sum: number, item: (typeof cart.items)[number]) => {
      const effectivePrice = item.product.price * (1 - item.product.discount / 100);
      return sum + effectivePrice * item.quantity;
    }, 0);

    const tax = Math.round(subtotal * env.TAX_RATE);
    const deliveryCharges = subtotal >= freeDeliveryThreshold ? 0 : standardDeliveryFee;
    const couponMeta = await this.resolveCoupon(couponCode, subtotal, cart.items.map((item) => item.product.category));
    const autoDiscount = this.getAutoDiscount(subtotal);
    const total = Math.max(0, Math.round(subtotal + tax + deliveryCharges - couponMeta.discount - autoDiscount));

    // Create order in a transaction
    const order = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const orderId = randomUUID();
      const orderNumber = this.generateOrderNumber('TT');
      const createdAt = new Date();
      const roundedSubtotal = Math.round(subtotal);

      await tx.$executeRaw`
        INSERT INTO "Order" (
          "id", "orderNumber", "userId", "addressId", "subtotal", "tax", "deliveryCharges", "total", "notes", "createdAt", "updatedAt"
        )
        VALUES (
          ${orderId}, ${orderNumber}, ${userId}, ${addressId}, ${roundedSubtotal}, ${tax}, ${deliveryCharges}, ${total}, ${notes ?? null}, ${createdAt}, ${createdAt}
        )
      `;

      const items = await Promise.all(
        cart.items.map((item: (typeof cart.items)[number]) => {
          const createItem: {
            orderId: string;
            productId: string;
            quantity: number;
            price: number;
            size?: string;
            color?: string;
          } = {
            orderId,
            productId: item.productId,
            quantity: item.quantity,
            price: item.product.price * (1 - item.product.discount / 100),
          };

          const size = item.size?.trim();
          const color = item.color?.trim();
          if (size) createItem.size = size;
          if (color) createItem.color = color;

          return tx.orderItem.create({ data: createItem, include: { product: true } });
        })
      );

      // Clear cart
      await tx.cartItem.deleteMany({ where: { cartId: cart.id } });

      return {
        id: orderId,
        orderNumber,
        userId,
        addressId,
        status: OrderStatus.PENDING,
        subtotal: roundedSubtotal,
        tax,
        deliveryCharges,
        total,
        notes: notes ?? null,
        createdAt,
        updatedAt: createdAt,
        address,
        items,
      };
    });

    // Send order confirmation notification asynchronously
    prisma.user.findUnique({ where: { id: userId }, select: { name: true, email: true, phone: true } })
      .then((userRecord) => {
        sendOrderConfirmationNotification({
          orderId: order.id,
          orderNumber: order.orderNumber,
          customerName: order.address.fullName || userRecord?.name || 'Customer',
          customerEmail: userRecord?.email || '',
          customerPhone: order.address.phone || userRecord?.phone || '',
          subtotal: order.subtotal,
          tax: order.tax,
          deliveryCharges: order.deliveryCharges,
          total: order.total,
          paymentMethod: 'COD',
          shippingAddress: {
            fullName: order.address.fullName,
            phone: order.address.phone,
            address: order.address.address,
            city: order.address.city,
            province: order.address.province,
          },
          items: order.items.map((it) => ({
            name: it.product.name,
            quantity: it.quantity,
            price: it.price,
            size: it.size || undefined,
            color: it.color || undefined,
            imageUrl: it.product.images[0],
          })),
          userId,
        }).catch((err) => logger.error('Order notification dispatch error', err));
      })
      .catch((err) => logger.error('Failed to lookup user for order notification', err));

    logger.info(`Order created: ${order.orderNumber} by user ${userId} - Total: PKR ${total}`);
    return order;
  }

  async createGuestOrder(data: {
    guestName: string;
    guestEmail: string;
    guestPhone: string;
    address: {
      fullName: string;
      phone: string;
      address: string;
      city: string;
      province: string;
      postalCode?: string;
    };
    items: Array<{ productId: string; quantity: number; size?: string; color?: string }>;
    notes?: string;
    couponCode?: string;
    deliverySlotId?: string;
    deliveryDate?: string;
  }) {
    const normalizedItems = (data.items || []).map((item) => ({
      productId: String(item.productId || '').trim(),
      quantity: Number(item.quantity),
      size: typeof item.size === 'string' ? item.size.trim() : undefined,
      color: typeof item.color === 'string' ? item.color.trim() : undefined,
    })).filter((item) => item.productId && Number.isInteger(item.quantity) && item.quantity > 0);

    if (!data.items || data.items.length === 0) {
      throw new BadRequestError('Order must contain at least one product');
    }

    if (normalizedItems.length !== data.items.length) {
      throw new BadRequestError('Order contains invalid items');
    }

    const products = await prisma.product.findMany({
      where: { id: { in: normalizedItems.map((item) => item.productId) } },
    });

    if (products.length !== normalizedItems.length) {
      throw new NotFoundError('One or more products were not found');
    }

    const productMap = new Map(products.map((p) => [p.id, p]));

    const subtotal = normalizedItems.reduce((sum, item) => {
      const product = productMap.get(item.productId)!;
      if (item.quantity > product.stock) {
        throw new BadRequestError(`Insufficient stock for ${product.name}`);
      }
      const effectivePrice = product.price * (1 - product.discount / 100);
      return sum + effectivePrice * item.quantity;
    }, 0);

    const { freeDeliveryThreshold, standardDeliveryFee } = await this.getDeliveryConfig();
    const tax = Math.round(subtotal * env.TAX_RATE);
    const deliveryCharges = subtotal >= freeDeliveryThreshold ? 0 : standardDeliveryFee;
    const couponCode = typeof data.couponCode === 'string' ? data.couponCode.trim() : undefined;
    const couponMeta = await this.resolveCoupon(couponCode, subtotal, products.map((p) => p.category));
    const autoDiscount = this.getAutoDiscount(subtotal);
    const total = Math.max(0, Math.round(subtotal + tax + deliveryCharges - couponMeta.discount - autoDiscount));

    const order = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const guestUser = await tx.user.create({
        data: {
          name: data.guestName,
          email: `guest+${Date.now()}-${Math.random().toString(36).slice(2, 8)}@menswear.pk`,
          phone: null,
          password: null,
          authProvider: 'GUEST',
          isVerified: true,
        },
      });

      const address = await tx.address.create({
        data: {
          userId: guestUser.id,
          label: 'Guest Checkout',
          fullName: data.address.fullName,
          phone: data.address.phone,
          address: data.address.address,
          city: data.address.city,
          province: data.address.province,
          postalCode: data.address.postalCode,
          isDefault: false,
        },
      });

      const orderId = randomUUID();
      const orderNumber = this.generateOrderNumber('TT');
      const createdAt = new Date();
      const roundedSubtotal = Math.round(subtotal);
      const guestNotes = typeof data.notes === 'string' ? data.notes.trim() : undefined;

      await tx.$executeRaw`
        INSERT INTO "Order" (
          "id", "orderNumber", "userId", "addressId", "subtotal", "tax", "deliveryCharges", "total", "notes", "isGuest", "guestEmail", "guestPhone", "guestName", "createdAt", "updatedAt"
        )
        VALUES (
          ${orderId}, ${orderNumber}, ${guestUser.id}, ${address.id}, ${roundedSubtotal}, ${tax}, ${deliveryCharges}, ${total}, ${guestNotes ?? null}, true, ${data.guestEmail}, ${data.guestPhone}, ${data.guestName}, ${createdAt}, ${createdAt}
        )
      `;

      const items = await Promise.all(
        normalizedItems.map((item) => {
          const product = productMap.get(item.productId)!;
          const createItem: {
            orderId: string;
            productId: string;
            quantity: number;
            price: number;
            size?: string;
            color?: string;
          } = {
            orderId,
            productId: item.productId,
            quantity: item.quantity,
            price: product.price * (1 - product.discount / 100),
          };

          if (item.size) createItem.size = item.size;
          if (item.color) createItem.color = item.color;

          return tx.orderItem.create({ data: createItem, include: { product: true } });
        })
      );

      return {
        id: orderId,
        orderNumber,
        userId: guestUser.id,
        addressId: address.id,
        status: OrderStatus.PENDING,
        subtotal: roundedSubtotal,
        tax,
        deliveryCharges,
        total,
        notes: guestNotes ?? null,
        createdAt,
        updatedAt: createdAt,
        address,
        items,
      };
    });

    // Send order confirmation notification asynchronously
    sendOrderConfirmationNotification({
      orderId: order.id,
      orderNumber: order.orderNumber,
      customerName: data.guestName,
      customerEmail: data.guestEmail,
      customerPhone: data.guestPhone,
      subtotal: order.subtotal,
      tax: order.tax,
      deliveryCharges: order.deliveryCharges,
      total: order.total,
      paymentMethod: 'COD',
      shippingAddress: {
        fullName: data.address.fullName,
        phone: data.address.phone,
        address: data.address.address,
        city: data.address.city,
        province: data.address.province,
      },
      items: order.items.map((it) => ({
        name: it.product.name,
        quantity: it.quantity,
        price: it.price,
        size: it.size || undefined,
        color: it.color || undefined,
        imageUrl: it.product.images[0],
      })),
      userId: order.userId,
    }).catch((err) => logger.error('Guest order notification error', err));

    logger.info(`Guest order created: ${order.orderNumber} for ${data.guestName} (${data.guestEmail}) - Total: PKR ${total}`);
    return order;
  }

  async getOrders(userId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where: { userId },
        include: { items: { include: { product: { select: { name: true, images: true } } } }, payment: true },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.order.count({ where: { userId } }),
    ]);
    return { orders, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async getOrderById(userId: string, orderId: string) {
    const order = await prisma.order.findFirst({
      where: { id: orderId, userId },
      include: { items: { include: { product: true } }, payment: true, address: true },
    });
    if (!order) throw new NotFoundError('Order not found');
    return order;
  }

  async updateStatus(orderId: string, status: string) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { payment: true, user: { select: { name: true, email: true } }, address: true, items: { include: { product: { select: { name: true, images: true } } } } },
    });
    if (!order) throw new NotFoundError('Order not found');

    const normalizedStatus = status?.toUpperCase();
    if (!Object.values(OrderStatus).includes(normalizedStatus as OrderStatus)) {
      throw new BadRequestError('Invalid order status');
    }

    const previousStatus = order.status;

    const updated = await prisma.order.update({ where: { id: orderId }, data: { status: normalizedStatus as OrderStatus } });

    // COD orders: decrement stock when marked DELIVERED
    if (
      normalizedStatus === 'DELIVERED' &&
      previousStatus !== 'DELIVERED' &&
      order.payment?.method === 'COD'
    ) {
      await this.decrementStockForOrder(orderId);
      logger.info(`Stock decremented for COD order ${orderId} on delivery`);
    }

    // Restore stock when order is cancelled (only if stock was previously deducted)
    if (
      normalizedStatus === 'CANCELLED' &&
      previousStatus !== 'CANCELLED'
    ) {
      const wasStockDeducted =
        (order.payment?.method === 'COD' && previousStatus === 'DELIVERED') ||
        (order.payment?.method !== 'COD' && order.payment?.status === 'VERIFIED');

      if (wasStockDeducted) {
        await this.restoreStockForOrder(orderId);
        logger.info(`Stock restored for cancelled order ${orderId}`);
      }
    }

    await prisma.orderTimeline.create({
      data: {
        orderId,
        status: normalizedStatus as OrderStatus,
        title: `Order ${normalizedStatus.toLowerCase()}`,
        description: `Order status has been updated to ${normalizedStatus}.`,
      },
    });

    // Dispatch after the status and timeline are committed. A mail outage must
    // never make an admin status change fail or delay its HTTP response.
    if (previousStatus !== normalizedStatus) {
      void sendOrderStatusNotification({
        orderId: order.id,
        orderNumber: order.orderNumber,
        customerName: order.guestName || order.address.fullName || order.user.name,
        customerEmail: order.guestEmail || order.user.email,
        subtotal: order.subtotal,
        tax: order.tax,
        deliveryCharges: order.deliveryCharges,
        total: order.total,
        paymentMethod: order.payment?.method || 'COD',
        status: normalizedStatus,
        estimatedDeliveryAt: order.estimatedDeliveryAt,
        shippingAddress: { fullName: order.address.fullName, phone: order.address.phone, address: order.address.address, city: order.address.city, province: order.address.province },
        items: order.items.map((item) => ({ name: item.product.name, quantity: item.quantity, price: item.price, size: item.size || undefined, color: item.color || undefined, imageUrl: item.product.images[0] })),
        userId: order.userId,
      }).catch((error) => logger.error(`Order status email dispatch failed for ${order.orderNumber}`, error));
    }

    return updated;
  }

  async decrementStockForOrder(orderId: string) {
    const items = await prisma.orderItem.findMany({ where: { orderId } });
    for (const item of items) {
      await prisma.product.update({
        where: { id: item.productId },
        data: {
          stock: { decrement: item.quantity },
        },
      });
      // Update stockStatus if stock reaches 0
      const product = await prisma.product.findUnique({ where: { id: item.productId }, select: { stock: true } });
      if (product && product.stock <= 0) {
        await prisma.product.update({
          where: { id: item.productId },
          data: { stockStatus: 'OUT_OF_STOCK' },
        });
      }
    }
  }

  async restoreStockForOrder(orderId: string) {
    const items = await prisma.orderItem.findMany({ where: { orderId } });
    for (const item of items) {
      await prisma.product.update({
        where: { id: item.productId },
        data: {
          stock: { increment: item.quantity },
          stockStatus: 'IN_STOCK',
        },
      });
    }
  }

  async getDeliverySlots() {
    return prisma.deliverySlot.findMany({
      where: { isActive: true },
      orderBy: { startHour: 'asc' },
    });
  }

  async getTrackingByOrderNumber(orderNumber: string) {
    const order = await prisma.order.findUnique({
      where: { orderNumber },
      include: {
        items: { include: { product: true } },
        address: true,
        payment: true,
        timeline: { orderBy: { createdAt: 'asc' } },
        slotBooking: { include: { slot: true } },
      },
    });

    if (!order) throw new NotFoundError('Order not found');
    return order;
  }

  async getTrackingByOrderId(userId: string, orderId: string) {
    const order = await prisma.order.findFirst({
      where: { id: orderId, userId },
      include: {
        items: { include: { product: true } },
        address: true,
        payment: true,
        timeline: { orderBy: { createdAt: 'asc' } },
        slotBooking: { include: { slot: true } },
      },
    });

    if (!order) throw new NotFoundError('Order not found');
    return order;
  }

  async createReturnRequest(userId: string, orderId: string, data: { orderItemId?: string; type: string; reason: string; refundAmount?: number }) {
    const order = await prisma.order.findFirst({
      where: { id: orderId, userId },
      include: { items: true },
    });

    if (!order) throw new NotFoundError('Order not found');
    if (order.status !== 'DELIVERED') {
      throw new BadRequestError('Return or exchange is allowed only for delivered orders');
    }

    const normalizedType = String(data.type || '').toUpperCase();
    if (!Object.values(ReturnType).includes(normalizedType as ReturnType)) {
      throw new BadRequestError('Invalid return type');
    }

    const request = await prisma.returnRequest.create({
      data: {
        orderId,
        userId,
        orderItemId: data.orderItemId,
        type: normalizedType as ReturnType,
        reason: data.reason,
      },
    });

    if (typeof data.refundAmount === 'number' && data.refundAmount > 0) {
      await prisma.refund.create({
        data: {
          orderId,
          returnRequestId: request.id,
          amount: data.refundAmount,
          status: 'REQUESTED',
          notes: 'Partial refund requested by customer',
        },
      });
    }

    await prisma.orderTimeline.create({
      data: {
        orderId,
        status: order.status,
        title: normalizedType === 'EXCHANGE' ? 'Exchange requested' : 'Return requested',
        description: data.reason,
      },
    });

    return request;
  }

  async getAllOrders(page = 1, limit = 20, filters: AdminOrderFilters = {}) {
    const skip = (page - 1) * limit;

    const where: Prisma.OrderWhereInput = {};

    if (filters.status) {
      where.status = filters.status as OrderStatus;
    }

    if (filters.paymentStatus) {
      where.payment = { is: { status: filters.paymentStatus as any } };
    }

    if (filters.search) {
      where.OR = [
        { orderNumber: { contains: filters.search, mode: 'insensitive' } },
        { user: { name: { contains: filters.search, mode: 'insensitive' } } },
        { user: { email: { contains: filters.search, mode: 'insensitive' } } },
      ];
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, email: true, phone: true } },
          address: true,
          items: {
            include: {
              product: { select: { id: true, name: true, images: true, slug: true } },
            },
          },
          payment: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.order.count({ where }),
    ]);
    return { orders, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  private async resolveCoupon(code: string | undefined, subtotal: number, categories: string[]) {
    if (!code) {
      return { code: null as string | null, discount: 0, couponId: null as string | null };
    }

    // Coupon tables are not available in all deployed schemas.
    return { code: null as string | null, discount: 0, couponId: null as string | null };

  }

  private getAutoDiscount(subtotal: number) {
    // Automatic discount for high-value carts to improve conversion.
    if (subtotal >= 30000) return 2500;
    if (subtotal >= 20000) return 1200;
    if (subtotal >= 12000) return 500;
    return 0;
  }
}

export const orderService = new OrderService();
