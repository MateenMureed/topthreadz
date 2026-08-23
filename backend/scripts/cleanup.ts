/**
 * Data Cleanup Script
 * 
 * Clears all transactional/test data while preserving products and admin users.
 * Run: npx ts-node scripts/cleanup.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanup() {
  console.log('🧹 Starting data cleanup...\n');

  const result = await prisma.$transaction(async (tx) => {
    // 1. Delete order-related data (must go first due to FK constraints)
    const refunds = await tx.refund.deleteMany({});
    console.log(`  ✓ Deleted ${refunds.count} refunds`);

    const returnRequests = await tx.returnRequest.deleteMany({});
    console.log(`  ✓ Deleted ${returnRequests.count} return requests`);

    const orderTimelines = await tx.orderTimeline.deleteMany({});
    console.log(`  ✓ Deleted ${orderTimelines.count} order timeline entries`);

    const orderDeliverySlots = await tx.orderDeliverySlot.deleteMany({});
    console.log(`  ✓ Deleted ${orderDeliverySlots.count} order delivery slots`);

    const payments = await tx.payment.deleteMany({});
    console.log(`  ✓ Deleted ${payments.count} payments`);

    const loyaltyLedger = await tx.loyaltyPointLedger.deleteMany({});
    console.log(`  ✓ Deleted ${loyaltyLedger.count} loyalty ledger entries`);

    const referralEvents = await tx.referralEvent.deleteMany({});
    console.log(`  ✓ Deleted ${referralEvents.count} referral events`);

    const couponRedemptions = await tx.couponRedemption.deleteMany({});
    console.log(`  ✓ Deleted ${couponRedemptions.count} coupon redemptions`);

    const orderItems = await tx.orderItem.deleteMany({});
    console.log(`  ✓ Deleted ${orderItems.count} order items`);

    const orders = await tx.order.deleteMany({});
    console.log(`  ✓ Deleted ${orders.count} orders`);

    // 2. Delete cart data
    const cartItems = await tx.cartItem.deleteMany({});
    console.log(`  ✓ Deleted ${cartItems.count} cart items`);

    const carts = await tx.cart.deleteMany({});
    console.log(`  ✓ Deleted ${carts.count} carts`);

    // 3. Delete user engagement data
    const wishlistItems = await tx.wishlistItem.deleteMany({});
    console.log(`  ✓ Deleted ${wishlistItems.count} wishlist items`);

    const compareItems = await tx.compareItem.deleteMany({});
    console.log(`  ✓ Deleted ${compareItems.count} compare items`);

    const savedForLater = await tx.savedForLaterItem.deleteMany({});
    console.log(`  ✓ Deleted ${savedForLater.count} saved-for-later items`);

    const reviews = await tx.review.deleteMany({});
    console.log(`  ✓ Deleted ${reviews.count} reviews`);

    const productAlerts = await tx.productAlert.deleteMany({});
    console.log(`  ✓ Deleted ${productAlerts.count} product alerts`);

    // 4. Delete analytics/tracking data
    const analyticsEvents = await tx.analyticsEvent.deleteMany({});
    console.log(`  ✓ Deleted ${analyticsEvents.count} analytics events`);

    const searchQueries = await tx.searchQuery.deleteMany({});
    console.log(`  ✓ Deleted ${searchQueries.count} search queries`);

    const productViews = await tx.productView.deleteMany({});
    console.log(`  ✓ Deleted ${productViews.count} product views`);

    // 5. Delete notifications
    const notifications = await tx.notification.deleteMany({});
    console.log(`  ✓ Deleted ${notifications.count} notifications`);

    const notificationPrefs = await tx.notificationPreference.deleteMany({});
    console.log(`  ✓ Deleted ${notificationPrefs.count} notification preferences`);

    // 6. Delete audit logs
    const auditLogs = await tx.auditLog.deleteMany({});
    console.log(`  ✓ Deleted ${auditLogs.count} audit logs`);

    // 7. Delete referral codes
    const referralCodes = await tx.referralCode.deleteMany({});
    console.log(`  ✓ Deleted ${referralCodes.count} referral codes`);

    // 8. Delete addresses for non-admin users
    const nonAdminUsers = await tx.user.findMany({
      where: { role: { not: 'ADMIN' } },
      select: { id: true },
    });
    const nonAdminIds = nonAdminUsers.map((u) => u.id);

    let addressesDeleted = 0;
    if (nonAdminIds.length > 0) {
      const addr = await tx.address.deleteMany({
        where: { userId: { in: nonAdminIds } },
      });
      addressesDeleted = addr.count;
    }
    console.log(`  ✓ Deleted ${addressesDeleted} addresses (non-admin)`);

    // 9. Delete non-admin users
    const users = await tx.user.deleteMany({
      where: { role: { not: 'ADMIN' } },
    });
    console.log(`  ✓ Deleted ${users.count} non-admin users`);

    return {
      refunds: refunds.count,
      returnRequests: returnRequests.count,
      orderTimelines: orderTimelines.count,
      payments: payments.count,
      orderItems: orderItems.count,
      orders: orders.count,
      cartItems: cartItems.count,
      carts: carts.count,
      wishlistItems: wishlistItems.count,
      reviews: reviews.count,
      analyticsEvents: analyticsEvents.count,
      searchQueries: searchQueries.count,
      productViews: productViews.count,
      auditLogs: auditLogs.count,
      nonAdminUsers: users.count,
    };
  });

  console.log('\n✅ Data cleanup completed!');
  console.log(JSON.stringify(result, null, 2));
}

cleanup()
  .catch((err) => {
    console.error('❌ Cleanup failed:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
