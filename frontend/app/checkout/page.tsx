'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';
import { FiCheckCircle } from 'react-icons/fi';
import { useCartStore } from '@/store/cartStore';
import { useHydration } from '@/hooks/useHydration';
import { orderService, paymentService } from '@/services/order.service';
import { productService } from '@/services/product.service';
import Image from 'next/image';
import { submitHostedCheckout } from '@/lib/paymentCheckout';
import { isBackendUploadUrl, isCloudinaryUrl, cloudinaryLoader, resolveImageUrl } from '@/lib/images';
import toast from 'react-hot-toast';
import { SelectField, StepHeader, TextAreaField, TextField } from '@/components/checkout/CheckoutFields';

const PAKISTAN_LOCATIONS: Record<string, string[]> = {
  Punjab: ['Lahore', 'Rawalpindi', 'Faisalabad', 'Multan', 'Gujranwala', 'Sialkot'],
  Sindh: ['Karachi', 'Hyderabad', 'Sukkur', 'Larkana', 'Nawabshah', 'Mirpur Khas'],
  KPK: ['Peshawar', 'Mardan', 'Abbottabad', 'Swat', 'Kohat', 'Dera Ismail Khan'],
  Balochistan: ['Quetta', 'Gwadar', 'Khuzdar', 'Turbat', 'Sibi', 'Zhob'],
  Islamabad: ['Islamabad'],
  GilgitBaltistan: ['Gilgit', 'Skardu', 'Hunza'],
  AzadKashmir: ['Muzaffarabad', 'Mirpur', 'Kotli'],
};

const PROVINCE_LABELS: Record<string, string> = {
  GilgitBaltistan: 'Gilgit Baltistan',
  AzadKashmir: 'Azad Kashmir',
};

const PROVINCE_OPTIONS = Object.keys(PAKISTAN_LOCATIONS).map((province) => ({
  value: province,
  label: PROVINCE_LABELS[province] ?? province,
}));

type ShippingMethod = 'FIXED';
type PaymentMethod = 'SAFEPAY' | 'COD';
type AccordionSection = 'email' | 'shipping' | 'payment';

// Flat accordion rows separated by hairlines (see the wrapper's divide-y below).
const sectionClass = 'py-3 sm:py-4';
const subHeadingClass = 'mb-3 text-sm font-bold text-surface-700';
// Pill button: full-width on phones (easy thumb target), auto width from `sm` up.
const stepButtonClass = 'btn-primary !rounded-full min-h-[44px] w-full justify-center px-8 text-sm font-bold sm:w-auto';

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
  const [completed, setCompleted] = useState({ email: false, shipping: false, payment: false });
  const [activeSection, setActiveSection] = useState<AccordionSection | null>('email');
  const [shippingAttempted, setShippingAttempted] = useState(false);

  const [address, setAddress] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    streetAddress: '',
    country: 'Pakistan',
    city: '',
    province: '',
  });

  const setField = (key: keyof typeof address, value: string) =>
    setAddress((prev) => ({ ...prev, [key]: value }));

  const { data: storeSettings } = useQuery({
    queryKey: ['store-settings'],
    queryFn: () => api.get('/settings/store').then((res) => res.data?.data),
    retry: false,
  });

  const freeDeliveryThreshold = Number(storeSettings?.freeDeliveryThreshold ?? 10000);
  const standardDeliveryFee = Number(storeSettings?.standardDeliveryFee ?? 250);

  const cityOptions = (address.province ? PAKISTAN_LOCATIONS[address.province] || [] : []).map((city) => ({
    value: city,
    label: city,
  }));
  const subtotal = getSubtotal();
  const isFreeDelivery = subtotal >= freeDeliveryThreshold;
  const delivery = isFreeDelivery ? 0 : standardDeliveryFee;
  const total = Math.round(subtotal + delivery);
  const isEmailValid = useMemo(() => /.+@.+\..+/.test(checkoutEmail.trim()), [checkoutEmail]);

  // People type numbers like "0300 1234567" or "0300-1234567" on phones.
  // Validate (and send) the cleaned version so those don't get rejected.
  const normalizedPhone = useMemo(() => address.phone.replace(/[\s()-]/g, ''), [address.phone]);
  const isPhoneValid = useMemo(() => /^(?:\+?92|0)?3\d{9}$/.test(normalizedPhone), [normalizedPhone]);

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

  // Inline errors: shown after the first failed "Continue", phone also while typing.
  const fieldErrors = {
    firstName: shippingAttempted && !address.firstName.trim() ? 'Enter your first name.' : undefined,
    lastName: shippingAttempted && !address.lastName.trim() ? 'Enter your last name.' : undefined,
    phone:
      address.phone && !isPhoneValid
        ? 'Enter a valid mobile number, e.g. 0300 1234567.'
        : shippingAttempted && !address.phone
          ? 'Enter your mobile number.'
          : undefined,
    streetAddress:
      shippingAttempted && !address.streetAddress.trim() ? 'Enter your delivery address.' : undefined,
    province: shippingAttempted && !address.province ? 'Select your province.' : undefined,
    city: shippingAttempted && !address.city ? 'Select your city.' : undefined,
  };

  // Real accordion: tapping an open section closes it, tapping a closed one opens it.
  const toggleSection = (section: AccordionSection) =>
    setActiveSection((prev) => (prev === section ? null : section));
  const markDone = (section: AccordionSection) =>
    setCompleted((prev) => ({ ...prev, [section]: true }));

  const saveEmailSection = () => {
    if (!isEmailValid) {
      toast.error('Enter a valid email address');
      document.getElementById('checkout-email')?.focus();
      return;
    }
    markDone('email');
    setActiveSection('shipping');
  };

  const saveShippingSection = () => {
    const firstInvalidId = !address.firstName.trim()
      ? 'checkout-first-name'
      : !address.lastName.trim()
        ? 'checkout-last-name'
        : !isPhoneValid
          ? 'checkout-phone'
          : !address.streetAddress.trim()
            ? 'checkout-address'
            : !address.province
              ? 'checkout-province'
              : !address.city
                ? 'checkout-city'
                : null;

    if (firstInvalidId) {
      setShippingAttempted(true);
      // Jump straight to the first field that needs attention.
      document.getElementById(firstInvalidId)?.focus();
      return;
    }
    markDone('shipping');
    setActiveSection('payment');
  };

  const savePaymentSection = () => {
    markDone('payment');
    setActiveSection(null);
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
        guestPhone: normalizedPhone,
        address: {
          fullName,
          phone: normalizedPhone,
          address: address.streetAddress.trim(),
          city: address.city.trim(),
          province: address.province.trim(),
        },
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
        <div className="mt-6 p-5 sm:p-6 rounded-2xl bg-white border-2 border-surface-900 shadow-soft text-left">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-surface-200 pb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-surface-500">Unique Tracking Number</span>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">Order Placed</span>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <span className="break-all font-mono text-xl sm:text-3xl font-black text-surface-950 tracking-wider">
              {trackingNumber || orderId}
            </span>
          </div>
          <p className="mt-2 text-xs text-surface-500">
            Keep this unique order number handy to track the live progress of your shipment.
          </p>
        </div>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
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

  // One-line recap shown under a completed section's title while it is collapsed.
  const compactLine = 'mt-0.5 truncate text-sm text-surface-600';
  const paymentLabel = paymentMethod === 'COD' ? 'Cash on delivery' : 'Credit / debit card via Safepay';

  return (
    <div className="mx-auto max-w-[1280px] px-4 py-5 sm:px-6 md:py-8 lg:px-8">
      {/* minmax(0,1fr) stops long content (emails, addresses) from stretching the grid past the screen */}
      <div className="grid grid-cols-1 gap-5 md:gap-7 xl:grid-cols-[minmax(0,1fr)_400px]">
        <div className="divide-y divide-surface-200 border-y border-surface-200">
          {/* ------------------------------ EMAIL ------------------------------ */}
          <section className={sectionClass}>
            <StepHeader
              title="Email"
              done={completed.email}
              expanded={emailExpanded}
              onToggle={() => toggleSection('email')}
            />

            {emailExpanded ? (
              <form
                noValidate
                className="pb-2 pt-3"
                onSubmit={(e) => {
                  e.preventDefault();
                  saveEmailSection();
                }}
              >
                <p className="mb-3 text-sm text-surface-700">
                  Already have an account?{' '}
                  <Link href="/login" className="font-semibold text-navy underline underline-offset-2">
                    Sign in
                  </Link>
                </p>
                <TextField
                  id="checkout-email"
                  name="email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  enterKeyHint="next"
                  label="Email address"
                  value={checkoutEmail}
                  onChange={(e) => setCheckoutEmail(e.target.value)}
                  error={checkoutEmail && !isEmailValid ? 'Enter a valid email address.' : undefined}
                  hint="Your order confirmation will be sent here."
                />
                <button type="submit" className={`${stepButtonClass} mt-4`}>
                  Continue
                </button>
              </form>
            ) : completed.email ? (
              <p className={compactLine}>{checkoutEmail}</p>
            ) : null}
          </section>

          {/* ---------------------------- SHIPPING ----------------------------- */}
          <section className={sectionClass}>
            <StepHeader
              title="Shipping details"
              done={completed.shipping}
              expanded={shippingExpanded}
              onToggle={() => toggleSection('shipping')}
            />

            {shippingExpanded ? (
              <form
                noValidate
                className="pb-2 pt-3"
                onSubmit={(e) => {
                  e.preventDefault();
                  saveShippingSection();
                }}
              >
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
                  <TextField
                    id="checkout-first-name"
                    name="given-name"
                    autoComplete="given-name"
                    autoCapitalize="words"
                    enterKeyHint="next"
                    label="First name"
                    value={address.firstName}
                    onChange={(e) => setField('firstName', e.target.value)}
                    error={fieldErrors.firstName}
                  />
                  <TextField
                    id="checkout-last-name"
                    name="family-name"
                    autoComplete="family-name"
                    autoCapitalize="words"
                    enterKeyHint="next"
                    label="Last name"
                    value={address.lastName}
                    onChange={(e) => setField('lastName', e.target.value)}
                    error={fieldErrors.lastName}
                  />
                  <TextField
                    id="checkout-phone"
                    name="tel"
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    enterKeyHint="next"
                    maxLength={16}
                    label="Mobile number"
                    className="sm:col-span-2"
                    value={address.phone}
                    onChange={(e) => setField('phone', e.target.value)}
                    error={fieldErrors.phone}
                    hint="We'll call or message this number about your delivery. e.g. 0300 1234567"
                  />
                  <TextAreaField
                    id="checkout-address"
                    name="street-address"
                    autoComplete="street-address"
                    autoCapitalize="sentences"
                    label="Delivery address"
                    className="sm:col-span-2"
                    value={address.streetAddress}
                    onChange={(e) => setField('streetAddress', e.target.value)}
                    error={fieldErrors.streetAddress}
                    hint="House or flat number, street, area, nearest landmark"
                  />
                  <TextField
                    id="checkout-country"
                    name="country"
                    autoComplete="country-name"
                    label="Country"
                    className="sm:col-span-2"
                    value={address.country}
                    readOnly
                    locked
                    tabIndex={-1}
                  />
                  <SelectField
                    id="checkout-province"
                    name="address-level1"
                    autoComplete="address-level1"
                    label="State / Province"
                    placeholder="Select your province"
                    options={PROVINCE_OPTIONS}
                    value={address.province}
                    onChange={(e) => setAddress((prev) => ({ ...prev, province: e.target.value, city: '' }))}
                    error={fieldErrors.province}
                  />
                  <SelectField
                    id="checkout-city"
                    name="address-level2"
                    autoComplete="address-level2"
                    label="City"
                    placeholder={address.province ? 'Select your city' : 'Select a province first'}
                    options={cityOptions}
                    value={address.city}
                    onChange={(e) => setField('city', e.target.value)}
                    disabled={!address.province}
                    error={fieldErrors.city}
                  />
                </div>

                <h3 className={`${subHeadingClass} mt-6`}>Shipping method</h3>
                <label className="flex cursor-pointer items-start gap-3 rounded-2xl border-2 border-surface-900 bg-white p-4 shadow-sm">
                  <input
                    type="radio"
                    name="shipping_method"
                    checked={shippingMethod === 'FIXED'}
                    onChange={() => setShippingMethod('FIXED')}
                    className="mt-0.5 h-5 w-5 shrink-0 accent-surface-900"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
                      <p className="text-sm font-bold text-surface-900">
                        {isFreeDelivery ? 'Free Nationwide Shipping' : 'Standard Shipping'}
                      </p>
                      <span className={`text-sm font-bold ${isFreeDelivery ? 'text-emerald-600' : 'text-surface-900'}`}>
                        {isFreeDelivery ? 'FREE (PKR 0.00)' : `PKR ${delivery.toLocaleString()}`}
                      </span>
                    </div>
                    <p className="mt-1 text-xs leading-relaxed text-surface-600">
                      {isFreeDelivery
                        ? `Your order qualifies for free delivery on orders over PKR ${freeDeliveryThreshold.toLocaleString()}.`
                        : `Orders over PKR ${freeDeliveryThreshold.toLocaleString()} qualify for free delivery. Add PKR ${Math.max(0, freeDeliveryThreshold - subtotal).toLocaleString()} more to get it.`}
                    </p>
                  </div>
                </label>

                <button type="submit" className={`${stepButtonClass} mt-5`}>
                  Continue to payment
                </button>
              </form>
            ) : completed.shipping ? (
              <>
                <p className={compactLine}>
                  {address.firstName} {address.lastName} · {address.phone}
                </p>
                <p className={compactLine}>
                  {address.streetAddress.replace(/\s+/g, ' ')}, {address.city}
                </p>
              </>
            ) : null}
          </section>

          {/* ----------------------------- PAYMENT ----------------------------- */}
          <section className={sectionClass}>
            <StepHeader
              title="Payment method"
              done={completed.payment}
              expanded={paymentExpanded}
              onToggle={() => toggleSection('payment')}
            />

            {paymentExpanded ? (
              <div className="space-y-3 pb-2 pt-3">
                <label className="flex cursor-pointer flex-col gap-3 rounded-2xl border-2 border-surface-900 bg-white p-4 shadow-sm sm:flex-row sm:items-center">
                  <div className="flex min-w-0 flex-1 items-start gap-3">
                    <input
                      type="radio"
                      name="payment_method"
                      checked={paymentMethod === 'COD'}
                      onChange={() => setPaymentMethod('COD')}
                      className="mt-0.5 h-5 w-5 shrink-0 accent-surface-900"
                    />
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <span className="text-sm font-bold text-surface-900">Cash on delivery (COD)</span>
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-800">Active</span>
                      </div>
                      <p className="mt-1 text-xs leading-relaxed text-surface-600">
                        Pay with cash when your parcel is delivered to your address.
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2 pl-8 sm:pl-0">
                    <Image src="/payment-logos/cod.svg" alt="Cash on delivery" width={72} height={24} sizes="72px" className="h-6 w-auto shrink-0" />
                  </div>
                </label>

                <label className="flex cursor-not-allowed flex-col gap-3 rounded-2xl border border-surface-200 bg-surface-100/60 p-4 opacity-75 sm:flex-row sm:items-center">
                  <div className="flex min-w-0 flex-1 items-start gap-3">
                    <input
                      type="radio"
                      name="payment_method"
                      disabled
                      checked={false}
                      readOnly
                      className="mt-0.5 h-5 w-5 shrink-0 opacity-50"
                    />
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <span className="text-sm font-bold text-surface-600">Credit / debit card</span>
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-800">Coming soon</span>
                      </div>
                      <p className="mt-1 text-xs leading-relaxed text-surface-500">
                        Online card payment via Safepay will be activated soon.
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2 pl-8 opacity-60 sm:pl-0">
                    <Image src="/payment-logos/visa.svg" alt="Visa" width={72} height={24} sizes="72px" className="h-6 w-auto shrink-0" />
                    <Image src="/payment-logos/mastercard.svg" alt="Mastercard" width={72} height={24} sizes="72px" className="h-6 w-auto shrink-0" />
                  </div>
                </label>

                <p className="px-1 text-xs text-surface-500">
                  Cash on delivery is currently available for all orders across Pakistan.
                </p>
                <button type="button" onClick={savePaymentSection} className={stepButtonClass}>
                  Save payment method
                </button>
              </div>
            ) : completed.payment ? (
              <p className={compactLine}>{paymentLabel}</p>
            ) : null}
          </section>
        </div>

        {/* ------------------------------- SIDEBAR ------------------------------- */}
        <aside className="h-fit space-y-4 xl:sticky xl:top-24">
          <div className="sidebar-line-card">
            <div className="flex items-baseline justify-between gap-3 border-b border-surface-300 pb-3">
              <p className="text-lg font-bold uppercase text-black sm:text-xl">Your Bag ({items.length})</p>
              <p className="shrink-0 text-base font-bold text-black sm:text-lg">PKR {Math.round(subtotal).toLocaleString()}</p>
            </div>

            <ul className="divide-y divide-surface-200">
              {items.map((item) => {
                const image = resolveImageUrl(item.image);
                return (
                  <li key={`${item.productId}-${item.size ?? ''}-${item.color ?? ''}`} className="grid grid-cols-[72px_minmax(0,1fr)] gap-3 py-4 last:pb-0 sm:grid-cols-[88px_minmax(0,1fr)]">
                    <div className="h-[90px] w-[72px] overflow-hidden rounded-lg bg-surface-200 sm:h-[110px] sm:w-[88px]">
                      {image ? (
                        <Image
                          src={image}
                          alt={item.name}
                          width={88}
                          height={110}
                          loader={isCloudinaryUrl(image) ? cloudinaryLoader : undefined}
                          unoptimized={isBackendUploadUrl(image)}
                          sizes="88px"
                          className="h-full w-full object-cover"
                        />
                      ) : null}
                    </div>
                    <div className="min-w-0">
                      <p className="break-words text-base font-semibold text-black">{item.name}</p>
                      <p className="mt-1 font-bold text-black">PKR {Math.round(item.price * (1 - item.discount / 100)).toLocaleString()}</p>
                      <p className="mt-2 text-sm text-surface-700">Size <span className="font-semibold">{item.size || 'N/A'}</span></p>
                      <p className="text-sm text-surface-700">Qty <span className="font-semibold">{item.quantity}</span></p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="sidebar-line-card">
            <p className="text-lg font-bold text-black sm:text-xl">ORDER SUMMARY</p>
            <div className="mt-4 space-y-3 text-sm text-black">
              <div className="flex justify-between gap-3"><span>Subtotal</span><span className="font-bold">PKR {subtotal.toLocaleString()}</span></div>
              <div className="flex justify-between gap-3"><span>Shipping</span><span className="font-bold">PKR {delivery.toLocaleString()}</span></div>
              <div className="flex justify-between gap-3 border-t border-surface-300 pt-3"><span>Total Amount</span><span className="font-bold">PKR {total.toLocaleString()}</span></div>
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