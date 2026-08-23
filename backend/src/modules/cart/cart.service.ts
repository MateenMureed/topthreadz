import prisma from '../../utils/prisma';
import { NotFoundError, BadRequestError } from '../../utils/errors';

export class CartService {
  async getCart(userId: string) {
    let cart = await prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: { product: { select: { id: true, name: true, price: true, discount: true, images: true, stock: true } } },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!cart) {
      cart = await prisma.cart.create({
        data: { userId },
        include: { items: { include: { product: { select: { id: true, name: true, price: true, discount: true, images: true, stock: true } } } } },
      });
    }

    return cart;
  }

  async addItem(userId: string, data: { productId: string; quantity: number; size?: string; color?: string }) {
    const productId = String(data.productId || '').trim();
    const quantity = Number(data.quantity);
    const size = typeof data.size === 'string' ? data.size.trim() : undefined;
    const color = typeof data.color === 'string' ? data.color.trim() : undefined;

    if (!productId) throw new BadRequestError('Product is required');
    if (!Number.isInteger(quantity) || quantity <= 0) {
      throw new BadRequestError('Quantity must be a positive integer');
    }

    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) throw new NotFoundError('Product not found');
    if (product.stock < quantity) throw new BadRequestError('Insufficient stock');

    let cart = await prisma.cart.findUnique({ where: { userId } });
    if (!cart) {
      cart = await prisma.cart.create({ data: { userId } });
    }

    const existing = await prisma.cartItem.findFirst({
      where: { cartId: cart.id, productId, size: size || null, color: color || null },
    });

    if (existing) {
      const newQty = existing.quantity + quantity;
      if (newQty > product.stock) throw new BadRequestError('Insufficient stock');
      await prisma.cartItem.update({ where: { id: existing.id }, data: { quantity: newQty } });
    } else {
      const createData: { cartId: string; productId: string; quantity: number; size?: string; color?: string } = {
        cartId: cart.id,
        productId,
        quantity,
      };
      if (size) createData.size = size;
      if (color) createData.color = color;

      await prisma.cartItem.create({
        data: createData,
      });
    }

    return this.getCart(userId);
  }

  async updateItem(userId: string, itemId: string, quantity: number) {
    const cart = await prisma.cart.findUnique({ where: { userId } });
    if (!cart) throw new NotFoundError('Cart not found');

    const item = await prisma.cartItem.findFirst({ where: { id: itemId, cartId: cart.id }, include: { product: true } });
    if (!item) throw new NotFoundError('Cart item not found');
    if (quantity > item.product.stock) throw new BadRequestError('Insufficient stock');

    if (quantity <= 0) {
      await prisma.cartItem.delete({ where: { id: itemId } });
    } else {
      await prisma.cartItem.update({ where: { id: itemId }, data: { quantity } });
    }

    return this.getCart(userId);
  }

  async removeItem(userId: string, itemId: string) {
    const cart = await prisma.cart.findUnique({ where: { userId } });
    if (!cart) throw new NotFoundError('Cart not found');

    const item = await prisma.cartItem.findFirst({ where: { id: itemId, cartId: cart.id } });
    if (!item) throw new NotFoundError('Cart item not found');

    await prisma.cartItem.delete({ where: { id: itemId } });
    return this.getCart(userId);
  }

  async clearCart(userId: string) {
    const cart = await prisma.cart.findUnique({ where: { userId } });
    if (cart) {
      await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
    }
    return { message: 'Cart cleared' };
  }
}

export const cartService = new CartService();
