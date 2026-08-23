import { PrismaClient } from '@prisma/client';
import { orderService } from './src/modules/order/order.service';
import { adminService } from './src/modules/admin/admin.service';

const prisma = new PrismaClient();

async function testOrderFlow() {
  console.log('Testing Order Flow...');

  // 1. Get an admin user
  const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
  if (!admin) throw new Error('No admin found');

  // 2. Get a product with stock
  const product = await prisma.product.findFirst({ where: { stock: { gt: 1 } } });
  if (!product) throw new Error('No product with stock found');
  const initialStock = product.stock;
  console.log(`Initial stock for ${product.name}: ${initialStock}`);

  // 3. Create a test order
  console.log('Creating guest COD order...');
  const order = await orderService.createGuestOrder({
    guestName: 'Test Flow',
    guestEmail: 'testflow@example.com',
    guestPhone: '03001234567',
    address: {
      fullName: 'Test Flow',
      phone: '03001234567',
      address: 'Test Addr',
      city: 'Lahore',
      province: 'Punjab',
    },
    items: [{ productId: product.id, quantity: 1 }],
  });
  console.log(`Order created: ${order.orderNumber}`);

  // 4. Create a fake payment to simulate COD initiation
  await prisma.payment.create({
    data: {
      orderId: order.id,
      method: 'COD',
      status: 'PENDING',
      transactionId: `COD-${order.orderNumber}`,
      amount: order.total,
    }
  });

  // 5. Verify stock HAS NOT changed
  const productAfterOrder = await prisma.product.findUnique({ where: { id: product.id } });
  console.log(`Stock after order creation: ${productAfterOrder?.stock} (Expected: ${initialStock})`);
  if (productAfterOrder?.stock !== initialStock) throw new Error('Stock changed at order creation!');

  // 6. Mark order as DELIVERED
  console.log('Admin marking order as DELIVERED...');
  await adminService.updateOrderStatus(order.id, 'DELIVERED', admin.id);

  // 7. Verify stock HAS decremented
  const productAfterDelivery = await prisma.product.findUnique({ where: { id: product.id } });
  console.log(`Stock after delivery: ${productAfterDelivery?.stock} (Expected: ${initialStock - 1})`);
  if (productAfterDelivery?.stock !== initialStock - 1) throw new Error('Stock did not decrement on delivery!');

  // 8. Cancel order
  console.log('Admin marking order as CANCELLED...');
  await adminService.updateOrderStatus(order.id, 'CANCELLED', admin.id);

  // 9. Verify stock HAS restored
  const productAfterCancel = await prisma.product.findUnique({ where: { id: product.id } });
  console.log(`Stock after cancellation: ${productAfterCancel?.stock} (Expected: ${initialStock})`);
  if (productAfterCancel?.stock !== initialStock) throw new Error('Stock did not restore on cancellation!');

  console.log('✅ Flow test passed!');
}

testOrderFlow()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
