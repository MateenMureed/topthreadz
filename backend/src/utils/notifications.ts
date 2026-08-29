import prisma from './prisma';
import logger from './logger';
import nodemailer from 'nodemailer';

export interface OrderNotificationData {
  orderId: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  subtotal: number;
  deliveryCharges: number;
  total: number;
  paymentMethod: string;
  shippingAddress: {
    fullName: string;
    phone: string;
    address: string;
    city: string;
    province: string;
  };
  items: Array<{
    name: string;
    quantity: number;
    price: number;
    size?: string;
    color?: string;
  }>;
  userId?: string;
}

// Nodemailer transport setup (falls back gracefully to logger if SMTP credentials are omitted)
const smtpConfig = {
  host: process.env.SMTP_HOST || '',
  port: parseInt(process.env.SMTP_PORT || '587', 10),
  secure: process.env.SMTP_SECURE === 'true',
  auth: process.env.SMTP_USER && process.env.SMTP_PASS ? {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  } : undefined,
};

const transporter = smtpConfig.auth
  ? nodemailer.createTransport(smtpConfig)
  : null;

export async function sendOrderConfirmationNotification(data: OrderNotificationData) {
  const trackingUrl = `https://www.topthreadz.com.pk/orders?tracking=${encodeURIComponent(data.orderNumber)}`;
  const isFreeDelivery = data.deliveryCharges === 0;

  const itemsHtml = data.items
    .map(
      (item) => `
      <tr style="border-bottom: 1px solid #f0f0f0;">
        <td style="padding: 12px 8px; font-size: 14px; color: #111;">
          <strong>${item.name}</strong>
          ${item.size ? `<br/><span style="font-size: 12px; color: #666;">Size: ${item.size}</span>` : ''}
          ${item.color ? `<span style="font-size: 12px; color: #666;"> | Color: ${item.color}</span>` : ''}
        </td>
        <td style="padding: 12px 8px; font-size: 14px; text-align: center; color: #333;">${item.quantity}</td>
        <td style="padding: 12px 8px; font-size: 14px; text-align: right; color: #111; font-weight: 600;">
          PKR ${(item.price * item.quantity).toLocaleString()}
        </td>
      </tr>
    `
    )
    .join('');

  const htmlEmail = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Order Confirmation - ${data.orderNumber}</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f7f7f7; margin: 0; padding: 20px;">
      <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06); border: 1px solid #eaeaea;">
        
        <!-- Header -->
        <div style="background-color: #0a0a0a; color: #ffffff; padding: 32px 24px; text-align: center;">
          <h1 style="margin: 0; font-size: 24px; letter-spacing: 2px; font-weight: 900; text-transform: uppercase;">TOP THREADZ</h1>
          <p style="margin: 6px 0 0 0; font-size: 13px; color: #d0d0d0; letter-spacing: 1px;">PREMIUM MENSWEAR PAKISTAN</p>
        </div>

        <!-- Body -->
        <div style="padding: 32px 24px;">
          <h2 style="font-size: 20px; color: #111; margin-top: 0; font-weight: 700;">Order Confirmed!</h2>
          <p style="font-size: 14px; color: #555; line-height: 1.6;">
            Assalam-o-Alaikum <strong>${data.customerName}</strong>,<br/>
            Thank you for shopping with Top Threadz. We have received your order and are currently preparing it for dispatch.
          </p>

          <!-- Tracking Card -->
          <div style="background-color: #f8f9fa; border: 1px solid #e5e7eb; border-radius: 12px; padding: 18px; margin: 24px 0; text-align: center;">
            <span style="font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #6b7280;">Your Unique Order & Tracking Number</span>
            <div style="font-size: 24px; font-weight: 900; color: #111827; letter-spacing: 2px; margin: 8px 0;">${data.orderNumber}</div>
            <p style="font-size: 12px; color: #6b7280; margin: 0 0 12px 0;">Use this number to track your package anytime.</p>
            <a href="${trackingUrl}" style="display: inline-block; background-color: #000000; color: #ffffff; text-decoration: none; padding: 10px 24px; border-radius: 9999px; font-size: 13px; font-weight: 700; letter-spacing: 0.5px;">TRACK YOUR ORDER</a>
          </div>

          <!-- Items Table -->
          <h3 style="font-size: 16px; color: #111; border-bottom: 2px solid #000; padding-bottom: 8px; margin-bottom: 0;">Order Summary</h3>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <thead>
              <tr style="border-bottom: 1px solid #ddd; background: #fafafa;">
                <th style="padding: 8px; text-align: left; font-size: 12px; color: #555; text-transform: uppercase;">Item</th>
                <th style="padding: 8px; text-align: center; font-size: 12px; color: #555; text-transform: uppercase;">Qty</th>
                <th style="padding: 8px; text-align: right; font-size: 12px; color: #555; text-transform: uppercase;">Price</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>

          <!-- Financial Summary -->
          <div style="background-color: #fafafa; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
            <div style="display: flex; justify-content: space-between; font-size: 14px; color: #555; margin-bottom: 6px;">
              <span>Subtotal:</span>
              <span style="font-weight: 600; color: #111;">PKR ${data.subtotal.toLocaleString()}</span>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 14px; color: #555; margin-bottom: 6px;">
              <span>Delivery Charges:</span>
              <span style="font-weight: 600; color: ${isFreeDelivery ? '#16a34a' : '#111'};">
                ${isFreeDelivery ? 'FREE (Orders over 10k)' : `PKR ${data.deliveryCharges.toLocaleString()}`}
              </span>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 16px; font-weight: 800; color: #111; border-top: 1px solid #e5e7eb; padding-top: 8px; margin-top: 6px;">
              <span>Total Amount:</span>
              <span>PKR ${data.total.toLocaleString()}</span>
            </div>
            <div style="font-size: 12px; color: #6b7280; margin-top: 6px;">
              Payment Method: <strong>${data.paymentMethod === 'COD' ? 'Cash On Delivery' : 'Online Payment'}</strong>
            </div>
          </div>

          <!-- Shipping Details -->
          <div style="font-size: 13px; color: #555; line-height: 1.5; border-left: 3px solid #000; padding-left: 12px;">
            <strong style="color: #111;">Delivery Address:</strong><br/>
            ${data.shippingAddress.fullName} (${data.shippingAddress.phone})<br/>
            ${data.shippingAddress.address}, ${data.shippingAddress.city}, ${data.shippingAddress.province}
          </div>

          <!-- Outlet Info & Help -->
          <div style="margin-top: 32px; padding-top: 20px; border-top: 1px solid #eaeaea; font-size: 12px; color: #666; text-align: center;">
            <p style="margin: 0 0 6px 0;"><strong>Our Outlets:</strong> Zamzama DHA Phase 5 Karachi | F-8 Markaz Islamabad</p>
            <p style="margin: 0;">Need help? WhatsApp us at <a href="https://wa.me/923009070520" style="color: #000; font-weight: 700;">+92 300 9070520</a> or email <a href="mailto:support@topthreadz.pk" style="color: #000;">support@topthreadz.pk</a></p>
          </div>
        </div>

        <div style="background-color: #f3f4f6; text-align: center; padding: 16px; font-size: 11px; color: #9ca3af;">
          © ${new Date().getFullYear()} Top Threadz Pakistan. All rights reserved.
        </div>
      </div>
    </body>
    </html>
  `;

  // 1. Record notification in database if userId is present
  if (data.userId) {
    try {
      await prisma.notification.create({
        data: {
          userId: data.userId,
          channel: 'EMAIL',
          subject: `Order Confirmation - ${data.orderNumber}`,
          message: `Your Top Threadz order ${data.orderNumber} for PKR ${data.total.toLocaleString()} has been placed. Track here: ${trackingUrl}`,
          status: 'SENT',
          metadata: {
            orderNumber: data.orderNumber,
            total: data.total,
            itemsCount: data.items.length,
          },
        },
      });
    } catch (dbErr) {
      logger.warn('Could not persist notification record in DB', dbErr);
    }
  }

  // 2. Dispatch email via nodemailer if configured
  if (transporter && data.customerEmail) {
    try {
      await transporter.sendMail({
        from: process.env.SMTP_FROM || '"Top Threadz" <orders@topthreadz.com.pk>',
        to: data.customerEmail,
        subject: `Order Confirmation #${data.orderNumber} - Top Threadz`,
        html: htmlEmail,
      });
      logger.info(`Order confirmation email sent to ${data.customerEmail} for order ${data.orderNumber}`);
    } catch (mailErr) {
      logger.error(`Failed to send order confirmation email to ${data.customerEmail}`, mailErr);
    }
  } else {
    logger.info(`[Order Notification Triggered] Order ${data.orderNumber} created for ${data.customerName} (${data.customerEmail}). Tracking: ${trackingUrl}`);
  }
}
