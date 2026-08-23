import prisma from '../../utils/prisma';
import { OrderStatus, Role } from '@prisma/client';
import { NotFoundError } from '../../utils/errors';
import { orderService } from '../order/order.service';
import { paymentService } from '../payment/payment.service';
import logger from '../../utils/logger';
import { BadRequestError } from '../../utils/errors';

export class AdminService {
  // ============ USERS ============
  async getUsers(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        select: { id: true, name: true, email: true, phone: true, role: true, isVerified: true, isLocked: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.user.count(),
    ]);
    return { users, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async updateUserRole(userId: string, role: string, adminId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundError('User not found');

    const normalizedRole = role?.toUpperCase();
    if (!Object.values(Role).includes(normalizedRole as Role)) {
      throw new BadRequestError('Invalid user role');
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { role: normalizedRole as Role },
      select: { id: true, name: true, email: true, role: true },
    });

    await this.createAuditLog(adminId, 'UPDATE_ROLE', 'User', userId, { role: user.role }, { role: normalizedRole });
    return updated;
  }

  async unlockUser(userId: string, adminId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundError('User not found');

    await prisma.user.update({
      where: { id: userId },
      data: { isLocked: false, failedAttempts: 0 },
    });

    await this.createAuditLog(adminId, 'UNLOCK_USER', 'User', userId, null, null);
    return { message: 'User unlocked' };
  }

  // ============ ORDERS ============
  async getOrders(page = 1, limit = 20, filters: { status?: string; paymentStatus?: string; search?: string } = {}) {
    return orderService.getAllOrders(page, limit, filters);
  }

  async updateOrderStatus(orderId: string, status: string, adminId: string) {
    const normalizedStatus = status?.toUpperCase();
    if (!Object.values(OrderStatus).includes(normalizedStatus as OrderStatus)) {
      throw new BadRequestError('Invalid order status');
    }
    const order = await orderService.updateStatus(orderId, normalizedStatus);
    await this.createAuditLog(adminId, 'UPDATE_ORDER_STATUS', 'Order', orderId, null, { status: normalizedStatus });
    return order;
  }

  // ============ PAYMENTS ============
  async verifyPayment(paymentId: string, adminId: string, approved: boolean) {
    const result = await paymentService.adminVerifyPayment(paymentId, adminId, approved);
    await this.createAuditLog(adminId, approved ? 'APPROVE_PAYMENT' : 'REJECT_PAYMENT', 'Payment', paymentId, null, { approved });
    return result;
  }

  async getPendingPayments(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where: { status: 'PENDING' },
        include: { order: { include: { user: { select: { name: true, email: true } } } } },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.payment.count({ where: { status: 'PENDING' } }),
    ]);
    return { payments, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  // ============ DASHBOARD STATS ============
  async getDashboardStats() {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(todayStart);
    weekStart.setDate(todayStart.getDate() - 6);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalUsers,
      totalOrders,
      totalProducts,
      revenue,
      pendingOrders,
      pendingPayments,
      dailyRevenue,
      weeklyRevenue,
      monthlyRevenue,
      lowStockProducts,
      recentOrders,
      recentUsers,
      recentAuditLogs,
      topSellingByQuantity,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.order.count(),
      prisma.product.count(),
      prisma.order.aggregate({ _sum: { total: true }, where: { status: { in: ['PAID', 'SHIPPED', 'DELIVERED'] } } }),
      prisma.order.count({ where: { status: 'PENDING' } }),
      prisma.payment.count({ where: { status: 'PENDING' } }),
      prisma.order.aggregate({
        _sum: { total: true },
        where: { status: { in: ['PAID', 'SHIPPED', 'DELIVERED'] }, createdAt: { gte: todayStart } },
      }),
      prisma.order.aggregate({
        _sum: { total: true },
        where: { status: { in: ['PAID', 'SHIPPED', 'DELIVERED'] }, createdAt: { gte: weekStart } },
      }),
      prisma.order.aggregate({
        _sum: { total: true },
        where: { status: { in: ['PAID', 'SHIPPED', 'DELIVERED'] }, createdAt: { gte: monthStart } },
      }),
      prisma.product.findMany({
        where: { stock: { lte: 10 } },
        select: { id: true, name: true, stock: true, category: true },
        orderBy: { stock: 'asc' },
        take: 8,
      }),
      prisma.order.findMany({
        select: { id: true, orderNumber: true, status: true, total: true, createdAt: true, user: { select: { name: true } } },
        orderBy: { createdAt: 'desc' },
        take: 6,
      }),
      prisma.user.findMany({
        select: { id: true, name: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
        take: 4,
      }),
      prisma.auditLog.findMany({
        select: { id: true, action: true, entity: true, createdAt: true, user: { select: { name: true } } },
        orderBy: { createdAt: 'desc' },
        take: 6,
      }),
      prisma.orderItem.groupBy({
        by: ['productId'],
        _sum: { quantity: true },
        orderBy: { _sum: { quantity: 'desc' } },
        take: 8,
      }),
    ]);

    const topProductIds = topSellingByQuantity.map((item) => item.productId);
    const productLookup = topProductIds.length
      ? await prisma.product.findMany({
          where: { id: { in: topProductIds } },
          select: { id: true, name: true, category: true },
        })
      : [];

    const productMap = new Map(productLookup.map((p) => [p.id, p]));

    const topProducts = topSellingByQuantity.map((item) => ({
      productId: item.productId,
      name: productMap.get(item.productId)?.name || 'Unknown Product',
      category: productMap.get(item.productId)?.category || 'Uncategorized',
      soldQty: item._sum.quantity || 0,
    }));

    const categoryMap = new Map<string, number>();
    for (const item of topProducts) {
      categoryMap.set(item.category, (categoryMap.get(item.category) || 0) + item.soldQty);
    }

    const topCategories = Array.from(categoryMap.entries())
      .map(([category, soldQty]) => ({ category, soldQty }))
      .sort((a, b) => b.soldQty - a.soldQty)
      .slice(0, 6);

    const recentActivity = [
      ...recentOrders.map((order) => ({
        id: `order-${order.id}`,
        type: 'ORDER',
        label: `${order.user?.name || 'Customer'} placed ${order.orderNumber}`,
        createdAt: order.createdAt,
      })),
      ...recentUsers.map((u) => ({
        id: `user-${u.id}`,
        type: 'USER',
        label: `New customer signup: ${u.name}`,
        createdAt: u.createdAt,
      })),
      ...recentAuditLogs.map((log) => ({
        id: `audit-${log.id}`,
        type: 'AUDIT',
        label: `${log.user?.name || 'Admin'} ${log.action.toLowerCase().replace(/_/g, ' ')} ${log.entity}`,
        createdAt: log.createdAt,
      })),
    ]
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 12);

    return {
      totalUsers,
      totalOrders,
      totalProducts,
      totalRevenue: revenue._sum.total || 0,
      pendingOrders,
      pendingPayments,
      dailyRevenue: dailyRevenue._sum.total || 0,
      weeklyRevenue: weeklyRevenue._sum.total || 0,
      monthlyRevenue: monthlyRevenue._sum.total || 0,
      topProducts,
      topCategories,
      lowStockProducts,
      recentActivity,
    };
  }

  async cleanupLegacyData(adminId: string) {
    const result = await prisma.$transaction(async (tx) => {
      const staleSearchQueries = await tx.searchQuery.deleteMany({});
      const staleAnalyticsEvents = await tx.analyticsEvent.deleteMany({});
      const staleProductViews = await tx.productView.deleteMany({});
      const staleCartItems = await tx.cartItem.deleteMany({});
      const staleCarts = await tx.cart.deleteMany({});

      const legacyProducts = await tx.product.deleteMany({
        where: {
          OR: [
            { isActive: false },
            { category: { not: 'Unstitched' } },
            { gender: { not: 'MALE' } },
          ],
        },
      });

      return {
        staleSearchQueries: staleSearchQueries.count,
        staleAnalyticsEvents: staleAnalyticsEvents.count,
        staleProductViews: staleProductViews.count,
        staleCartItems: staleCartItems.count,
        staleCarts: staleCarts.count,
        legacyProducts: legacyProducts.count,
      };
    });

    await this.createAuditLog(adminId, 'CLEANUP_LEGACY_DATA', 'Maintenance', 'legacy-data', null, result);
    return { message: 'Legacy data cleanup completed', removed: result };
  }

  // ============ AUDIT LOGS ============
  async getAuditLogs(page = 1, limit = 50) {
    const skip = (page - 1) * limit;
    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        include: { user: { select: { name: true, email: true } } },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.auditLog.count(),
    ]);
    return { logs, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  private async createAuditLog(userId: string, action: string, entity: string, entityId: string, oldData: any, newData: any) {
    try {
      await prisma.auditLog.create({
        data: { userId, action, entity, entityId, oldData, newData },
      });
      logger.info(`Audit: ${action} on ${entity}:${entityId} by ${userId}`);
    } catch (error) {
      logger.error(`Audit log failed for ${action} on ${entity}:${entityId}`, error);
    }
  }
}

export const adminService = new AdminService();
