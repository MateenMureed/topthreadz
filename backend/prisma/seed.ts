import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();
const SALT_ROUNDS = 12;

async function main() {
  console.log('🧹 Clearing all data from database...');

  try {
    // Truncate all tables in PostgreSQL public schema with CASCADE
    await prisma.$executeRawUnsafe(`
      DO $$ DECLARE
        r RECORD;
      BEGIN
        FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename != '_prisma_migrations') LOOP
          EXECUTE 'TRUNCATE TABLE "' || r.tablename || '" CASCADE;';
        END LOOP;
      END $$;
    `);
    console.log('✅ Database cleared successfully.');
  } catch (error) {
    console.warn('Fallback: deleting records via Prisma model deleteMany...');
    // Fallback if TRUNCATE fails for any reason
    await prisma.address.deleteMany({});
    await prisma.cartItem.deleteMany({});
    await prisma.cart.deleteMany({});
    await prisma.orderItem.deleteMany({});
    await prisma.order.deleteMany({});
    await prisma.review.deleteMany({});
    await prisma.productView.deleteMany({});
    await prisma.auditLog.deleteMany({});
    await prisma.wishlistItem.deleteMany({});
    await prisma.compareItem.deleteMany({});
    await prisma.savedForLaterItem.deleteMany({});
    await prisma.productAlert.deleteMany({});
    await prisma.notification.deleteMany({});
    await prisma.searchQuery.deleteMany({});
    await prisma.couponRedemption.deleteMany({});
    await prisma.analyticsEvent.deleteMany({});
    await prisma.returnRequest.deleteMany({});
    await prisma.refund.deleteMany({});
    await prisma.referralEvent.deleteMany({});
    await prisma.referralCode.deleteMany({});
    await prisma.loyaltyPointLedger.deleteMany({});
    await prisma.notificationPreference.deleteMany({});
    await prisma.productImage.deleteMany({});
    await prisma.productVariant.deleteMany({});
    await prisma.productCategory.deleteMany({});
    await prisma.product.deleteMany({});
    await prisma.category.deleteMany({});
    await prisma.coupon.deleteMany({});
    await prisma.user.deleteMany({});
    console.log('✅ Database cleared via deleteMany.');
  }

  console.log('👑 Creating new Admin account...');

  const adminEmail = 'mateenmurid@gmail.com';
  const adminPasswordRaw = 'mm@Ma3nM.....';
  const hashedPassword = await bcrypt.hash(adminPasswordRaw, SALT_ROUNDS);

  const admin = await prisma.user.create({
    data: {
      name: 'Admin',
      email: adminEmail,
      password: hashedPassword,
      role: Role.ADMIN,
      isVerified: true,
    },
  });

  console.log(`✅ Admin account created successfully!`);
  console.log(`   ID: ${admin.id}`);
  console.log(`   Email: ${admin.email}`);
  console.log(`   Role: ${admin.role}`);
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
