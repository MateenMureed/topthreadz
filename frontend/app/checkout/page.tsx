'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';
import { FiCheckCircle, FiChevronDown, FiEdit2, FiTruck, FiPackage } from 'react-icons/fi';
import { useCartStore } from '@/store/cartStore';
import { useHydration } from '@/hooks/useHydration';
import { orderService, paymentService } from '@/services/order.service';
import { productService } from '@/services/product.service';
import Image from 'next/image';
import { submitHostedCheckout } from '@/lib/paymentCheckout';
import { isBackendUploadUrl, resolveImageUrl } from '@/lib/images';
import toast from 'react-hot-toast';

const PAKISTAN_LOCATIONS: Record<string, string[]> = {
  Punjab: ['Lahore', 'Rawalpindi', 'Faisalabad', 'Multan', 'Gujranwala', 'Sialkot'],
  Sindh: ['Karachi', 'Hyderabad', 'Sukkur', 'Larkana', 'Nawabshah', 'Mirpur Khas'],
  KPK: ['Peshawar', 'Mardan', 'Abbottabad', 'Swat', 'Kohat', 'Dera Ismail Khan'],
  Balochistan: ['Quetta', 'Gwadar', 'Khuzdar', 'Turbat', 'Sibi', 'Zhob'],
  Islamabad: ['Islamabad'],
  GilgitBaltistan: ['Gilgit', 'Skardu', 'Hunza'],
  AzadKashmir: ['Muzaffarabad', 'Mirpur', 'Kotli'],
};

type ShippingMethod = 'FIXED';
type PaymentMethod = 'SAFEPAY' | 'COD';
type SectionMode = 'edit' | 'summary';
type AccordionSection = 'email' | 'shipping' | 'payment';

export default function CheckoutPage() {
  const router = useRouter();
  const hydrated = useHydration();
  const { items, getSubtotal, clearCart, setItems } = useCartStore();

  const [loading, setLoading] = useState(false);
  const [orderId, setOrderId] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');

  const [checkoutEmail, setCheckoutEmail] = useState('');
  const [shippingMethod, setShippingMethod] = useState<ShippingMethod>('FIXED');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('COD');
  const [emailMode, setEmailMode] = useState<SectionMode>('edit');
  const [shippingMode, setShippingMode] = useState<SectionMode>('edit');
  const [paymentMode, setPaymentMode] = useState<SectionMode>('edit');
  const [activeSection, setActiveSection] = useState<AccordionSection>('email');

  const [address, setAddress] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    streetAddress: '',
    country: 'Pakistan',
    city: '',
    province: '',
  });

  const { data: storeSettings } = useQuery({
    queryKey: ['store-settings'],
    queryFn: () => api.get('/settings/store').then((res) => res.data?.data),
    retry: false,
  });

  const freeDeliveryThreshold = Number(storeSettings?.freeDeliveryThreshold ?? 10000);
  const standardDeliveryFee = Number(storeSettings?.standardDeliveryFee ?? 250);

  const cityOptions = address.province ? (PAKISTAN_LOCATIONS[address.province] || []) : [];
  const subtotal = getSubtotal();
  const isFreeDelivery = subtotal >= freeDeliveryThreshold;
  const delivery = isFreeDelivery ? 0 : standardDeliveryFee;
  const total = Math.round(subtotal + delivery);
  const bagItem = items[0];
  const bagItemImage = resolveImageUrl(bagItem?.image);
  const isEmailValid = useMemo(() => /.+@.+\..+/.test(checkoutEmail.trim()), [checkoutEmail]);
  const isPhoneValid = useMemo(() => /^(\+92|0)?3[0-9]{9}$/.test(address.phone.trim()), [address.phone]);

  const isShippingValid = useMemo(() => {
    return Boolean(
      address.firstName.trim() &&
      address.lastName.trim() &&
      isPhoneValid &&
      address.streetAddress.trim() &&
      address.province.trim() &&
      address.city.trim()
    );
  }, [address, isPhoneValid]);

  const canPlaceOrder = useMemo(() => {
    return items.length > 0 && isEmailValid && isShippingValid;
  }, [items.length, isEmailValid, isShippingValid]);

  const saveEmailSection = () => {
    if (!isEmailValid) {
      toast.error('Please provide a valid email');
      return;
    }
    setEmailMode('summary');
    setActiveSection('shipping');
  };

  const saveShippingSection = () => {
    if (!isShippingValid) {
      toast.error('Please complete all shipping fields correctly');
      return;
    }
    setShippingMode('summary');
    setActiveSection('payment');
  };

  const savePaymentSection = () => {
    setPaymentMode('summary');
    setActiveSection('payment');
  };

  const handlePlaceOrder = async () => {
    if (!canPlaceOrder) {
      toast.error('Please complete all required checkout details');
      return;
    }

    setLoading(true);
    try {
      const validItems = items
        .map((item) => ({ ...item, productId: String(item.productId || '').trim() }))
        .filter((item) => item.productId && Number.isInteger(Number(item.quantity)) && Number(item.quantity) > 0);

      if (validItems.length === 0) {
        clearCart();
        toast.error('Cart is invalid. Please add products again.');
        return;
      }

      const resolvedItems: typeof validItems = [];
      const unresolvedNames: string[] = [];

      for (const item of validItems) {
        try {
          let resolved = await productService.getById(item.productId);
          if (!resolved?.data?.id) {
            throw new Error('Missing product id response');
          }
          resolvedItems.push({ ...item, productId: resolved.data.id });
        } catch {
          try {
            const bySlug = await productService.getBySlug(item.productId);
            if (bySlug?.data?.id) {
              resolvedItems.push({ ...item, productId: bySlug.data.id });
            } else {
              unresolvedNames.push(item.name || 'Unavailable product');
            }
          } catch {
            unresolvedNames.push(item.name || 'Unavailable product');
          }
        }
      }

      if (resolvedItems.length !== items.length) {
        setItems(resolvedItems);
      }

      if (unresolvedNames.length > 0) {
        toast.error(`${unresolvedNames.length} unavailable product(s) were removed from checkout.`);
      }

      if (resolvedItems.length === 0) {
        clearCart();
        toast.error('No available products left in cart. Please add products again.');
        return;
      }

      const fullName = `${address.firstName.trim()} ${address.lastName.trim()}`.trim();
      const createdOrder = await orderService.createGuest({
        guestName: fullName,
        guestEmail: checkoutEmail.trim(),
        guestPhone: address.phone.trim(),
        address: { fullName, phone: address.phone.trim(), address: address.streetAddress.trim(), city: address.city.trim(), province: address.province.trim() },
        items: resolvedItems.map((item) => ({ productId: item.productId, quantity: Number(item.quantity), size: item.size, color: item.color })),
      });
      const createdOrderId = createdOrder?.data?.id || createdOrder?.id;
      const createdOrderNumber = createdOrder?.data?.orderNumber || createdOrder?.orderNumber;
      if (!createdOrderId) throw new Error('Order could not be created');

      const paymentInit = await paymentService.initiateGuest({ orderId: createdOrderId, method: paymentMethod });
      const paymentPayload = paymentInit?.data || paymentInit;
      clearCart();
      if (paymentMethod === 'COD') {
        setOrderId(createdOrderId);
        setTrackingNumber(createdOrderNumber || createdOrderId);
        toast.success('Order placed with cash on delivery.');
        return;
      }

      toast.success('Redirecting to Safepay secure checkout.');
      if (paymentPayload?.checkout) {
        submitHostedCheckout(paymentPayload.checkout);
        return;
      }
      const redirectUrl = paymentPayload?.redirectUrl;
      if (redirectUrl) {
        window.location.href = redirectUrl;
        return;
      }
      setOrderId(createdOrderId);
      setTrackingNumber(createdOrderNumber || createdOrderId);
      router.push('/orders');
    } catch (error: any) {
      toast.error(error?.response?.data?.error || error?.message || 'Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  if (!hydrated) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <div className="h-8 w-48 mx-auto bg-surface-200 rounded-full animate-pulse" />
        <div className="h-4 w-64 mx-auto bg-surface-100 rounded-full animate-pulse mt-4" />
      </div>
    );
  }

  if (items.length === 0 && !orderId) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-bold mb-4">Your bag is empty</h1>
        <Link href="/products" className="btn-primary">Continue Shopping</Link>
      </div>
    );
  }

  if (orderId) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 sm:py-24 text-center">
        <div className="mx-auto w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-6 shadow-soft">
          <FiCheckCircle className="w-10 h-10" />
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-surface-950 font-display">Order Confirmed!</h1>
        <p className="text-surface-600 mt-3 text-sm sm:text-base">
          Thank you for choosing Top Threadz. We have received your order and sent a confirmation receipt with full tracking details.
        </p>

        {/* Unique Tracking Card */}
        <div className="mt-6 p-6 rounded-2xl bg-white border-2 border-surface-900 shadow-soft text-left">
          <div className="flex items-center justify-between border-b border-surface-200 pb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-surface-500">Unique Tracking Number</span>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">Order Placed</span>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <span className="font-mono text-2xl sm:text-3xl font-black text-surface-950 tracking-wider">
              {trackingNumber || orderId}
            </span>
          </div>
          <p className="mt-2 text-xs text-surface-500">
            Keep this unique order number handy to track the live progress of your shipment.
          </p>
        </div>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/orders" className="btn-primary w-full sm:w-auto px-8 py-3 text-sm uppercase font-bold tracking-wider">
            Track Order
          </Link>
          <Link href="/products" className="btn-secondary w-full sm:w-auto px-8 py-3 text-sm uppercase font-bold tracking-wider">
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  const emailExpanded = activeSection === 'email';
  const shippingExpanded = activeSection === 'shipping';
  const paymentExpanded = activeSection === 'payment';

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_400px] gap-5 md:gap-7">
        <div className="space-y-4">
          <section className="border border-surface-300 rounded-2xl bg-surface-100 p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <p className="font-bold text-xl text-black flex items-center gap-2">
                <FiCheckCircle className="text-green-600" /> 1 ENTER EMAIL
              </p>
              <div className="flex items-center gap-2">
                {emailMode === 'summary' ? (
                  <button
                    type="button"
                    className="text-black"
                    onClick={() => {
                      setEmailMode('edit');
                      setActiveSection('email');
                    }}
                  >
                    <FiEdit2 className="w-5 h-5" />
                  </button>
                ) : null}
                <button type="button" className="text-black" onClick={() => setActiveSection('email')}>
                  <FiChevronDown className={`w-5 h-5 transition-transform ${emailExpanded ? 'rotate-180' : ''}`} />
                </button>
              </div>
            </div>

            {emailExpanded ? (
              emailMode === 'edit' ? (
              <div className="mt-4">
                <p className="text-surface-700 text-sm mb-2">Already have an account? <Link href="/login" className="font-semibold underline">SIGN IN</Link></p>
                <input
                  id="checkout-email"
                  name="email"
                  type="email"
                  value={checkoutEmail}
                  onChange={(e) => setCheckoutEmail(e.target.value)}
                  className="input-field"
                  placeholder="user@test.pk"
                />
                <button type="button" onClick={saveEmailSection} className="btn-primary mt-3 px-5 py-2">Save Email</button>
              </div>
              ) : (
                <p className="mt-3 text-black font-medium">{checkoutEmail}</p>
              )
            ) : (
              emailMode === 'summary' ? <p className="mt-3 text-black font-medium">{checkoutEmail}</p> : null
            )}
          </section>

          <section className="border border-surface-300 rounded-2xl bg-surface-100 p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <p className="font-bold text-xl text-black flex items-center gap-2">
                <FiCheckCircle className="text-green-600" /> 2 SHIPPING
              </p>
              <div className="flex items-center gap-2">
                {shippingMode === 'summary' ? (
                  <button
                    type="button"
                    className="text-black"
                    onClick={() => {
                      setShippingMode('edit');
                      setActiveSection('shipping');
                    }}
                  >
                    <FiEdit2 className="w-5 h-5" />
                  </button>
                ) : null}
                <button type="button" className="text-black" onClick={() => setActiveSection('shipping')}>
                  <FiChevronDown className={`w-5 h-5 transition-transform ${shippingExpanded ? 'rotate-180' : ''}`} />
                </button>
              </div>
            </div>

            {shippingExpanded ? (
              shippingMode === 'edit' ? (
              <div className="mt-4">
                <h3 className="font-bold text-black mb-2">Customer Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-semibold text-black">First Name</label>
                    <input id="checkout-first-name" name="given-name" autoComplete="given-name" value={address.firstName} onChange={(e) => setAddress({ ...address, firstName: e.target.value })} className="input-field mt-1" placeholder="First Name" />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-black">Last Name</label>
                    <input id="checkout-last-name" name="family-name" autoComplete="family-name" value={address.lastName} onChange={(e) => setAddress({ ...address, lastName: e.target.value })} className="input-field mt-1" placeholder="Last Name" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-sm font-semibold text-black">Mobile Number</label>
                    <input id="checkout-phone" name="tel" autoComplete="tel" value={address.phone} onChange={(e) => setAddress({ ...address, phone: e.target.value })} className="input-field mt-1" placeholder="Ex: +923451234567" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-sm font-semibold text-black">Street Address</label>
                    <input id="checkout-address" name="street-address" autoComplete="street-address" value={address.streetAddress} onChange={(e) => setAddress({ ...address, streetAddress: e.target.value })} className="input-field mt-1" placeholder="Street Address" />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-black">Country</label>
                    <input id="checkout-country" name="country" autoComplete="country-name" value={address.country} readOnly className="input-field mt-1 bg-surface-200" />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-black">State/Province</label>
                    <select id="checkout-province" name="address-level1" autoComplete="address-level1" value={address.province} onChange={(e) => setAddress({ ...address, province: e.target.value, city: '' })} className="input-field mt-1">
                      <option value="">Select Your Region</option>
                      {Object.keys(PAKISTAN_LOCATIONS).map((province) => (
                        <option key={province} value={province}>{province}</option>
                      ))}
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-sm font-semibold text-black">City</label>
                    <select id="checkout-city" name="address-level2" autoComplete="address-level2" value={address.city} onChange={(e) => setAddress({ ...address, city: e.target.value })} className="input-field mt-1" disabled={!address.province}>
                      <option value="">Select Your City</option>
                      {cityOptions.map((city) => (
                        <option key={city} value={city}>{city}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <h3 className="font-bold text-black mt-5 mb-2">Shipping Method</h3>
                <div className="space-y-2">
                  <label className="border-2 border-surface-900 rounded-xl bg-white p-3.5 flex items-start gap-3 cursor-pointer shadow-xs">
                    <input type="radio" checked readOnly className="mt-1 accent-surface-950" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="font-bold text-black text-sm">
                          {isFreeDelivery ? 'Free Nationwide Shipping' : 'Standard Shipping'}
                        </p>
                        <span className={`font-bold text-sm ${isFreeDelivery ? 'text-emerald-600' : 'text-black'}`}>
                          {isFreeDelivery ? 'FREE (PKR 0.00)' : `PKR ${delivery.toLocaleString()}`}
                        </span>
                      </div>
                      <p className="text-xs text-surface-500 mt-0.5">
                        {isFreeDelivery
                          ? 'Your order qualifies for FREE Delivery on orders over PKR 10,000!'
                          : `Orders over PKR ${freeDeliveryThreshold.toLocaleString()} qualify for FREE delivery (Shop PKR ${(freeDeliveryThreshold - subtotal).toLocaleString()} more for free shipping).`}
                      </p>
                    </div>
                  </label>
                </div>

                <button type="button" onClick={saveShippingSection} className="btn-primary mt-4 px-5 py-2">Save Shipping</button>
              </div>
              ) : (
                <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="font-bold text-black">Shipping Type</p>
                    <p className="text-black">{isFreeDelivery ? 'Free Delivery (Orders > 10k)' : `Standard Shipping (PKR ${delivery.toLocaleString()})`}</p>
                  </div>
                  <div>
                    <p className="font-bold text-black">Customer Details</p>
                    <p className="text-black">{address.firstName} {address.lastName}</p>
                    <p className="text-black">{address.streetAddress}</p>
                    <p className="text-black">{address.city} {address.province}</p>
                    <p className="text-black">{address.phone}</p>
                  </div>
                </div>
              )
            ) : shippingMode === 'summary' ? (
              <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="font-bold text-black">Shipping Type</p>
                  <p className="text-black">{isFreeDelivery ? 'Free Delivery (Orders > 10k)' : `Standard Shipping (PKR ${delivery.toLocaleString()})`}</p>
                </div>
                <div>
                  <p className="font-bold text-black">Customer Details</p>
                  <p className="text-black">{address.firstName} {address.lastName}</p>
                  <p className="text-black">{address.streetAddress}</p>
                  <p className="text-black">{address.city} {address.province}</p>
                  <p className="text-black">{address.phone}</p>
                </div>
              </div>
            ) : null}
          </section>

          <section className="border border-surface-300 rounded-2xl bg-surface-100 p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <p className="font-bold text-xl text-black flex items-center gap-2">
                <FiCheckCircle className="text-green-600" /> 3 PAYMENT
              </p>
              <div className="flex items-center gap-2">
                {paymentMode === 'summary' ? (
                  <button
                    type="button"
                    className="text-black"
                    onClick={() => {
                      setPaymentMode('edit');
                      setActiveSection('payment');
                    }}
                  >
                    <FiEdit2 className="w-5 h-5" />
                  </button>
                ) : null}
                <button type="button" className="text-black" onClick={() => setActiveSection('payment')}>
                  <FiChevronDown className={`w-5 h-5 transition-transform ${paymentExpanded ? 'rotate-180' : ''}`} />
                </button>
              </div>
            </div>

            {paymentExpanded ? (
              paymentMode === 'edit' ? (
              <div className="mt-4 space-y-3">
                <label className="border-2 border-surface-900 rounded-xl bg-surface-50/50 p-4 flex items-center gap-3 cursor-pointer shadow-sm">
                  <input
                    type="radio"
                    name="payment_method"
                    checked={paymentMethod === 'COD'}
                    onChange={() => setPaymentMethod('COD')}
                    className="h-4 w-4 accent-surface-900"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-surface-900 text-sm">CASH ON DELIVERY (COD)</span>
                      <span className="rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 uppercase tracking-wide">Active</span>
                    </div>
                    <p className="text-xs text-surface-600 mt-0.5">Pay with cash when your parcel is delivered to your address.</p>
                  </div>
                  <div className="ml-auto flex items-center gap-2 shrink-0">
                    <Image src="/payment-logos/cod.svg" alt="Cash on delivery" width={72} height={24} sizes="72px" className="h-6 w-auto shrink-0" />
                  </div>
                </label>

                <label className="border border-surface-200 rounded-xl bg-surface-100/60 p-4 flex items-center gap-3 opacity-75 cursor-not-allowed">
                  <input
                    type="radio"
                    name="payment_method"
                    disabled
                    checked={false}
                    className="h-4 w-4 opacity-50"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-surface-600 text-sm">CREDIT / DEBIT CARD</span>
                      <span className="rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold px-2.5 py-0.5 uppercase tracking-wide">Coming Soon</span>
                    </div>
                    <p className="text-xs text-surface-500 mt-0.5">Online card payment via Safepay will be activated soon.</p>
                  </div>
                  <div className="ml-auto flex items-center gap-2 shrink-0 opacity-60">
                    <Image src="/payment-logos/visa.svg" alt="Visa" width={72} height={24} sizes="72px" className="h-6 w-auto shrink-0" />
                    <Image src="/payment-logos/mastercard.svg" alt="Mastercard" width={72} height={24} sizes="72px" className="h-6 w-auto shrink-0" />
                  </div>
                </label>

                <p className="text-xs text-surface-500 mt-1">
                  Cash on Delivery is currently available for all orders across Pakistan.
                </p>
                <button type="button" onClick={savePaymentSection} className="btn-primary mt-2 px-6 py-2.5 text-xs font-bold uppercase tracking-wide">Save Payment</button>
              </div>
              ) : (
                <p className="mt-3 text-black font-medium">
                  {paymentMethod === 'COD' ? 'Cash on delivery' : 'Credit / debit card via Safepay'}
                </p>
              )
            ) : (
              paymentMode === 'summary' ? (
                <p className="mt-3 text-black font-medium">
                  {paymentMethod === 'COD' ? 'Cash on delivery' : 'Credit / debit card via Safepay'}
                </p>
              ) : null
            )}
          </section>
        </div>

        <aside className="space-y-4 xl:sticky xl:top-24 h-fit">
          <div className="sidebar-line-card">
            <div className="flex items-center justify-between border-b border-surface-300 pb-3">
              <p className="font-bold text-black text-2xl uppercase">Your Bag ({items.length})</p>
              <p className="font-bold text-black text-xl">PKR {Math.round(subtotal).toLocaleString()}</p>
            </div>

            {bagItem ? (
              <div className="pt-4 grid grid-cols-[88px_1fr] gap-3">
                <div className="w-[88px] h-[110px] rounded-lg bg-surface-200 overflow-hidden">
                  {bagItemImage ? <Image src={bagItemImage} alt={bagItem.name} width={88} height={110} unoptimized={isBackendUploadUrl(bagItemImage)} sizes="88px" className="w-full h-full object-cover" /> : null}
                </div>
                <div>
                  <p className="font-semibold text-black text-lg">{bagItem.name}</p>
                  <p className="font-bold text-black mt-1">PKR {Math.round(bagItem.price * (1 - bagItem.discount / 100)).toLocaleString()}</p>
                  <p className="text-sm text-surface-700 mt-2">Size <span className="font-semibold">{bagItem.size || 'N/A'}</span></p>
                  <p className="text-sm text-surface-700">Qty <span className="font-semibold">{bagItem.quantity}</span></p>
                </div>
              </div>
            ) : null}
          </div>

          <div className="sidebar-line-card">
            <p className="font-bold text-black text-2xl">ORDER SUMMARY</p>
            <div className="mt-4 space-y-3 text-sm text-black">
              <div className="flex justify-between"><span>Subtotal</span><span className="font-bold">PKR {subtotal.toLocaleString()}</span></div>
              <div className="flex justify-between"><span>Shipping</span><span className="font-bold">PKR {delivery.toLocaleString()}</span></div>
              <div className="flex justify-between border-t border-surface-300 pt-3"><span>Total Amount</span><span className="font-bold">PKR {total.toLocaleString()}</span></div>
            </div>

            <button
              onClick={handlePlaceOrder}
              disabled={loading || !canPlaceOrder}
              className="bag-pill-btn mt-5"
            >
              {loading ? 'PLACING ORDER...' : `PLACE ORDER - PKR ${total.toLocaleString()}`}
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}
