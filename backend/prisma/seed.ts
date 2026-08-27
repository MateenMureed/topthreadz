import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();
const SALT_ROUNDS = 12;

async function main() {
  console.log('👑 Creating/updating Admin account in Neon PostgreSQL database...');

  const adminEmail = 'mateenmurid@gmail.com';
  // Standard clean password for admin login
  const adminPasswordRaw = 'mm@Ma3nM';
  const hashedPassword = await bcrypt.hash(adminPasswordRaw, SALT_ROUNDS);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      password: hashedPassword,
      role: Role.ADMIN,
      isVerified: true,
      isLocked: false,
      failedAttempts: 0,
      name: 'Admin',
    },
    create: {
      name: 'Admin',
      email: adminEmail,
      password: hashedPassword,
      role: Role.ADMIN,
      isVerified: true,
      isLocked: false,
      failedAttempts: 0,
    },
  });

  console.log('✅ Admin account successfully created/updated in Neon PostgreSQL!');
  console.log(`   ID: ${admin.id}`);
  console.log(`   Email: ${admin.email}`);
  console.log(`   Role: ${admin.role}`);

  const defaults = ['Unstitched Fabric', 'Stitched', 'Waist Coats', 'Two Piece', 'Three Piece', 'Kids Section'];
  for (const [sortOrder, name] of defaults.entries()) {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    await prisma.category.upsert({ where: { slug }, update: { name, sortOrder, isActive: true }, create: { name, slug, sortOrder, isActive: true } });
  }
  console.log('✅ Default clothing categories upserted.');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
