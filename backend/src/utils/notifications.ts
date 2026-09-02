import prisma from './prisma';
import logger from './logger';
import nodemailer from 'nodemailer';

export interface OrderNotificationData {
  orderId: string; orderNumber: string; customerName: string; customerEmail: string; customerPhone?: string;
  subtotal: number; tax: number; deliveryCharges: number; total: number; paymentMethod: string;
  status?: string; estimatedDeliveryAt?: Date | null;
  shippingAddress: { fullName: string; phone: string; address: string; city: string; province: string };
  items: Array<{ name: string; quantity: number; price: number; size?: string; color?: string; imageUrl?: string }>;
  userId?: string;
}

const brevoConfig = {
  host: process.env.BREVO_SMTP_HOST,
  port: Number(process.env.BREVO_SMTP_PORT || 587),
  user: process.env.BREVO_SMTP_USER,
  pass: process.env.BREVO_SMTP_PASS,
  from: process.env.MAIL_FROM,
  fromName: process.env.MAIL_FROM_NAME,
};

const missingBrevoConfig = () => [
  !brevoConfig.host && 'BREVO_SMTP_HOST',
  !brevoConfig.user && 'BREVO_SMTP_USER',
  !brevoConfig.pass && 'BREVO_SMTP_PASS',
  !brevoConfig.from && 'MAIL_FROM',
  !brevoConfig.fromName && 'MAIL_FROM_NAME',
].filter(Boolean) as string[];

const missingConfig = missingBrevoConfig();
if (missingConfig.length) logger.error(`Brevo SMTP configuration is missing: ${missingConfig.join(', ')}`);

const transporter = missingConfig.length === 0
  ? nodemailer.createTransport({
    host: brevoConfig.host,
    port: brevoConfig.port,
    secure: false,
    auth: { user: brevoConfig.user, pass: brevoConfig.pass },
  })
  : null;

/** Safely verifies the configured Brevo SMTP connection for deployment checks. */
export async function verifyBrevoSmtpConnection() {
  if (!transporter) throw new Error('Brevo SMTP configuration is missing');
  await transporter.verify();
}
const esc = (value: unknown) => String(value ?? '').replace(/[&<>'"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[c]!));
const money = (value: number) => `PKR ${Math.round(value || 0).toLocaleString('en-PK')}`;
const trackingUrl = (orderNumber: string) => `${process.env.FRONTEND_URL || 'https://www.topthreadz.com.pk'}/orders?tracking=${encodeURIComponent(orderNumber)}`;
const statusCopy: Record<string, { title: string; message: string }> = {
  PENDING: { title: 'Order received', message: 'We have received your order and are preparing it for dispatch.' },
  PAID: { title: 'Payment confirmed', message: 'Your payment has been confirmed and your order is being prepared.' },
  SHIPPED: { title: 'Your order is on its way', message: 'Your parcel has been shipped. Use the tracking number below for the latest progress.' },
  DELIVERED: { title: 'Order delivered', message: 'Your order has been marked as delivered. We hope you enjoy it!' },
  CANCELLED: { title: 'Order cancelled', message: 'Your order has been cancelled. Contact support if you need help.' },
};

function estimatedDelivery(data: OrderNotificationData) {
  const date = data.estimatedDeliveryAt || new Date(Date.now() + 5 * 86400000);
  return new Intl.DateTimeFormat('en-PK', { day: 'numeric', month: 'long', year: 'numeric' }).format(date);
}

function renderEmail(data: OrderNotificationData, kind: 'confirmation' | 'status') {
  const copy = statusCopy[data.status || 'PENDING'] || statusCopy.PENDING;
  const title = kind === 'confirmation' ? 'Order confirmed' : copy.title;
  const message = kind === 'confirmation' ? statusCopy.PENDING.message : copy.message;
  const rows = data.items.map((item) => `<tr>
    <td style="padding:14px 8px;border-bottom:1px solid #e5e7eb;vertical-align:top;width:64px;">${item.imageUrl ? `<img src="${esc(item.imageUrl)}" alt="${esc(item.name)}" width="56" height="56" style="display:block;object-fit:cover;border-radius:6px;border:0;"/>` : ''}</td>
    <td style="padding:14px 8px;border-bottom:1px solid #e5e7eb;font:14px Arial;color:#111827;"><strong>${esc(item.name)}</strong><br/><span style="color:#6b7280;font-size:12px;">${[item.size && `Size: ${esc(item.size)}`, item.color && `Colour: ${esc(item.color)}`].filter(Boolean).join(' · ')}</span></td>
    <td style="padding:14px 8px;border-bottom:1px solid #e5e7eb;font:14px Arial;text-align:center;color:#374151;">${item.quantity}</td><td style="padding:14px 8px;border-bottom:1px solid #e5e7eb;font:14px Arial;text-align:right;color:#111827;white-space:nowrap;">${money(item.price * item.quantity)}</td></tr>`).join('');
  return `<!doctype html><html><body style="margin:0;padding:0;background:#f3f4f6;"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f3f4f6;"><tr><td align="center" style="padding:24px 12px;"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:620px;background:#ffffff;border:1px solid #e5e7eb;">
    <tr><td align="center" style="background:#0f1f3d;padding:28px 24px;"><img src="${esc(process.env.EMAIL_LOGO_URL || 'https://www.topthreadz.com.pk/images/topthreadz-logo-light.png')}" alt="Top Threadz" width="150" style="display:block;max-width:150px;height:auto;border:0;"/><p style="margin:9px 0 0;color:#dbe3f0;font:11px Arial;letter-spacing:1.5px;">PREMIUM MENSWEAR PAKISTAN</p></td></tr>
    <tr><td style="padding:28px 24px;font-family:Arial,sans-serif;color:#111827;"><h1 style="margin:0 0 12px;font-size:24px;">${title}</h1><p style="margin:0 0 20px;color:#4b5563;font-size:15px;line-height:1.6;">Assalam-o-Alaikum ${esc(data.customerName)},<br/>${message}</p>
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f8fafc;border:1px solid #dbe3f0;"><tr><td align="center" style="padding:18px;"><p style="margin:0;color:#64748b;font:11px Arial;font-weight:bold;letter-spacing:1px;">ORDER &amp; TRACKING NUMBER</p><p style="margin:8px 0 14px;color:#0f1f3d;font:700 23px Arial;letter-spacing:1px;">${esc(data.orderNumber)}</p><a href="${trackingUrl(data.orderNumber)}" style="display:inline-block;background:#b91c2b;color:#ffffff;padding:12px 22px;font:700 13px Arial;text-decoration:none;">TRACK YOUR ORDER</a></td></tr></table>
      <p style="margin:20px 0 8px;font:700 16px Arial;">Estimated delivery: ${esc(estimatedDelivery(data))}</p><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;"><tr><th style="text-align:left;padding:12px 8px;background:#f8fafc;font:11px Arial;color:#64748b;">PRODUCT</th><th style="background:#f8fafc;font:11px Arial;color:#64748b;">QTY</th><th style="text-align:right;padding:12px 8px;background:#f8fafc;font:11px Arial;color:#64748b;">PRICE</th></tr>${rows}</table>
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top:18px;background:#f8fafc;"><tr><td style="padding:16px 18px;color:#4b5563;font:14px Arial;line-height:1.8;">Subtotal<br/>Shipping<br/>Tax<br/><strong style="color:#111827;font-size:16px;">Total</strong></td><td align="right" style="padding:16px 18px;color:#111827;font:14px Arial;line-height:1.8;">${money(data.subtotal)}<br/>${data.deliveryCharges ? money(data.deliveryCharges) : 'FREE'}<br/>${money(data.tax)}<br/><strong style="font-size:16px;">${money(data.total)}</strong></td></tr></table>
      <p style="margin:22px 0 0;padding:14px;border-left:3px solid #b91c2b;background:#fff7f7;color:#4b5563;font:13px Arial;line-height:1.5;"><strong style="color:#111827;">Shipping address</strong><br/>${esc(data.shippingAddress.fullName)} · ${esc(data.shippingAddress.phone)}<br/>${esc(data.shippingAddress.address)}, ${esc(data.shippingAddress.city)}, ${esc(data.shippingAddress.province)}</p></td></tr>
    <tr><td align="center" style="padding:18px 24px;background:#f8fafc;color:#6b7280;font:12px Arial;">Need help? <a href="mailto:support@topthreadz.pk" style="color:#0f1f3d;">support@topthreadz.pk</a> · +92 300 9070520</td></tr></table></td></tr></table></body></html>`;
}

async function sendOrderEmail(data: OrderNotificationData, kind: 'confirmation' | 'status') {
  const subject = kind === 'confirmation' ? `Order confirmation #${data.orderNumber} | Top Threadz` : `Order update: ${(statusCopy[data.status || 'PENDING'] || statusCopy.PENDING).title} #${data.orderNumber}`;
  if (data.userId) prisma.notification.create({ data: { userId: data.userId, channel: 'EMAIL', subject, message: `${subject}. Track: ${trackingUrl(data.orderNumber)}`, status: transporter ? 'PENDING' : 'FAILED', metadata: { orderNumber: data.orderNumber, status: data.status, type: kind } } }).catch((error) => logger.warn('Could not persist order email notification', error));
  if (!transporter || !data.customerEmail) { logger.warn(`Order email not sent for ${data.orderNumber}: Brevo SMTP is not configured or customer email is missing`); return; }
  try { await transporter.sendMail({ from: `"${brevoConfig.fromName}" <${brevoConfig.from}>`, to: data.customerEmail, subject, html: renderEmail(data, kind) }); logger.info(`Order ${kind} email sent for ${data.orderNumber} to ${data.customerEmail}`); }
  catch (error) { logger.error(`Order ${kind} email failed for ${data.orderNumber}`, error); }
}

export const sendOrderConfirmationNotification = (data: OrderNotificationData) => sendOrderEmail(data, 'confirmation');
export const sendOrderStatusNotification = (data: OrderNotificationData) => sendOrderEmail(data, 'status');
