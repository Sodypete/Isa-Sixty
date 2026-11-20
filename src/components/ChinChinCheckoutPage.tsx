import React, { useState, useMemo } from 'react';
import {
  ArrowLeft,
  ShoppingBag,
  Plus,
  Minus,
  Trash2,
  Truck,
  CreditCard,
  Send,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  User,
  Phone,
  Mail,
  MapPin,
  AlertCircle,
  CheckCircle,
  Printer,
  X,
  ArrowRight,
  Cookie,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { CartItem, MenuItem, OrderDetails, CardDetails } from '../types';
// @ts-ignore
import logoUrl from '../assets/images/Logo/IsaiahSixty Logo.png';

interface ChinChinCheckoutPageProps {
  cart: CartItem[];
  onAddToCart: (item: MenuItem) => void;
  onRemoveFromCart: (itemId: string) => void;
  onDeleteLineItem: (itemId: string) => void;
  onClearCart: () => void;
  onBackToChinChin: () => void;
  onBackToMainMenu: () => void;
}

export const ChinChinCheckoutPage: React.FC<ChinChinCheckoutPageProps> = ({
  cart,
  onAddToCart,
  onRemoveFromCart,
  onDeleteLineItem,
  onClearCart,
  onBackToChinChin,
  onBackToMainMenu
}) => {
  // Customer & Shipping Form Inputs
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [shippingStreet, setShippingStreet] = useState('');
  const [shippingCity, setShippingCity] = useState('');
  const [shippingState, setShippingState] = useState('');
  const [shippingPostalCode, setShippingPostalCode] = useState('');
  const [interacRefNumber, setInteracRefNumber] = useState('');
  const [specialInstructions, setSpecialInstructions] = useState('');

  // Payment accordions
  const [isInteracExpanded, setIsInteracExpanded] = useState(true);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [copiedReceipt, setCopiedReceipt] = useState(false);

  // Submission & validation
  const [validationError, setValidationError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedOrder, setSubmittedOrder] = useState<OrderDetails | null>(null);
  const [submittedSnapshot, setSubmittedSnapshot] = useState<{
    items: CartItem[];
    subtotal: number;
    shippingFee: number;
    total: number;
  } | null>(null);

  const emptyCardData: CardDetails = {
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardholderName: ''
  };

  // Shipping & Order Calculations:
  // - Free shipping for all orders over $100 ($100+)
  // - $10 shipping charge applies for Orders < $100
  const billing = useMemo(() => {
    const subtotal = cart.reduce((sum, item) => sum + item.menuItem.price * item.quantity, 0);
    const shippingFee = subtotal > 0 && subtotal < 100 ? 10.0 : 0.0;
    const total = subtotal + shippingFee;
    const amountNeededForFreeShipping = subtotal > 0 && subtotal < 100 ? Math.max(0, 100 - subtotal) : 0;

    return {
      subtotal,
      shippingFee,
      total,
      amountNeededForFreeShipping,
      qualifiesForFreeShipping: subtotal >= 100
    };
  }, [cart]);

  const totalItemCount = useMemo(
    () => cart.reduce((sum, item) => sum + item.quantity, 0),
    [cart]
  );

  const handleCopyEmail = () => {
    navigator.clipboard.writeText('isaiahsixtycreations@gmail.com');
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2500);
  };

  const handleSubmitChinChinOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');

    if (cart.length === 0) {
      setValidationError('Your Chin Chin cart is empty. Please add at least one bag before checking out.');
      return;
    }
    if (!customerName.trim()) {
      setValidationError('Please enter your full name.');
      return;
    }
    if (!customerPhone.trim()) {
      setValidationError('Please provide a contact phone number.');
      return;
    }
    if (!customerEmail.trim()) {
      setValidationError('Please provide an email address for your receipt.');
      return;
    }
    if (!shippingStreet.trim()) {
      setValidationError('Please enter your street address.');
      return;
    }
    if (!shippingCity.trim()) {
      setValidationError('Please enter your shipping city.');
      return;
    }
    if (!shippingState.trim()) {
      setValidationError('Please enter your state or province.');
      return;
    }
    if (!shippingPostalCode.trim()) {
      setValidationError('Please enter your ZIP or postal code.');
      return;
    }

    setIsSubmitting(true);

    const formattedAddress = `${shippingStreet.trim()}, ${shippingCity.trim()}, ${shippingState.trim()} ${shippingPostalCode.trim()}`;
    const orderId = 'ISC-CC-' + Math.floor(100000 + Math.random() * 900000);
    const now = new Date();
    const dateOrdered = now.toISOString().split('T')[0];
    const timeOrdered = now.toTimeString().split(' ')[0].substring(0, 5);

    const finalOrder: OrderDetails = {
      id: orderId,
      customerName: customerName.trim(),
      customerEmail: customerEmail.trim(),
      customerPhone: customerPhone.trim(),
      eventDate: dateOrdered,
      eventTime: timeOrdered,
      orderType: 'delivery',
      deliveryAddress: formattedAddress,
      specialInstructions: specialInstructions.trim(),
      isDepositPaid: false,
      isFullPaymentMade: false,
      paymentMethod: 'interac',
      interacRefNumber: interacRefNumber.trim() || undefined,
      cardDetails: emptyCardData,
      isChinChinOnly: true,
      subtotal: billing.subtotal,
      shippingFee: billing.shippingFee,
      totalAmount: billing.total,
      shippingStreet: shippingStreet.trim(),
      shippingCity: shippingCity.trim(),
      shippingState: shippingState.trim(),
      shippingPostalCode: shippingPostalCode.trim()
    };

    const snapshot = {
      items: [...cart],
      subtotal: billing.subtotal,
      shippingFee: billing.shippingFee,
      total: billing.total
    };

    setSubmittedSnapshot(snapshot);
    setSubmittedOrder(finalOrder);

    const itemsText = cart
      .map(
        (item) =>
          `- ${item.menuItem.name} (${item.menuItem.unit}) x ${item.quantity} : $${(
            item.menuItem.price * item.quantity
          ).toFixed(2)}`
      )
      .join('\n');

    const categories = cart.map((item) => item.menuItem.category).join(', ');
    const quantities = cart.map((item) => item.quantity).join(', ');
    const itemsList = cart.map((item) => `${item.menuItem.name} (x${item.quantity})`).join(', ');

    const shippingDisplay = billing.shippingFee === 0 ? 'FREE ($0.00)' : `$${billing.shippingFee.toFixed(2)}`;
    const billingHtml = `
      <p style="margin: 4px 0; font-size: 13px;"><b>Subtotal:</b> $${billing.subtotal.toFixed(2)}</p>
      <p style="margin: 4px 0; font-size: 13px;"><b>Shipping Fee:</b> ${shippingDisplay}</p>
      <p style="margin: 4px 0; font-size: 14px; font-weight: bold; color: #4B2F1D;"><b>Total:</b> $${billing.total.toFixed(2)}</p>
    `;

    try {
      const response = await fetch('/api/submit-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...finalOrder,
          itemsText,
          categories,
          quantities,
          items: itemsList,
          amountPaid: billing.total,
          paymentStatus: 'PENDING PAYMENT',
          dateOrdered,
          timeOrdered,
          orderDate: dateOrdered,
          orderTime: timeOrdered,
          billingHtml
        })
      });

      if (!response.ok) {
        throw new Error('Failed to submit order to server.');
      }
    } catch (err: any) {
      console.error('Chin Chin order submission failed:', err);
      setValidationError(`Order recorded, but sync encountered a warning: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const generateReceiptTextSummary = () => {
    if (!submittedOrder || !submittedSnapshot) return '';

    const itemsText = submittedSnapshot.items
      .map(
        (item) =>
          `- ${item.menuItem.name} (${item.menuItem.unit}) x ${item.quantity} : $${(
            item.menuItem.price * item.quantity
          ).toFixed(2)}`
      )
      .join('\n');

    return `
=========================================
   ISAIAH SIXTY CREATIONS - CHIN CHIN
=========================================
Order ID: ${submittedOrder.id}
Client: ${submittedOrder.customerName}
Phone: ${submittedOrder.customerPhone}
Email: ${submittedOrder.customerEmail}
Shipping Address: ${submittedOrder.deliveryAddress || ''}
-----------------------------------------
ORDERED ITEMS:
${itemsText}
-----------------------------------------
Subtotal: $${submittedSnapshot.subtotal.toFixed(2)}
Shipping: ${submittedSnapshot.shippingFee === 0 ? 'FREE ($0.00)' : `$${submittedSnapshot.shippingFee.toFixed(2)}`}
Total: $${submittedSnapshot.total.toFixed(2)}
-----------------------------------------
Payment Route: INTERAC E-TRANSFER (isaiahsixtycreations@gmail.com)
${submittedOrder.interacRefNumber ? `Interac Ref Number: ${submittedOrder.interacRefNumber}\n` : ''}=========================================
Thank you for ordering Isaiah Sixty Creations Chin Chin!
    `.trim();
  };

  const handleCopyReceipt = () => {
    const text = generateReceiptTextSummary();
    navigator.clipboard.writeText(text);
    setCopiedReceipt(true);
    setTimeout(() => setCopiedReceipt(false), 2500);
  };

  const handleFinishAndReset = () => {
    onClearCart();
    setCustomerName('');
    setCustomerPhone('');
    setCustomerEmail('');
    setShippingStreet('');
    setShippingCity('');
    setShippingState('');
    setShippingPostalCode('');
    setInteracRefNumber('');
    setSpecialInstructions('');
    setSubmittedOrder(null);
    setSubmittedSnapshot(null);
    onBackToChinChin();
  };

  return (
    <div id="chinchin_checkout_page" className="min-h-screen bg-[#FAF8F5] text-gray-800 font-sans pb-16">
      {/* HEADER */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-xs">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onBackToChinChin}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Chin Chin</span>
          </button>

          <div className="flex items-center gap-2.5">
            <img
              src={logoUrl}
              alt="Isaiah Sixty Creations Logo"
              className="w-8 h-8 rounded-full object-cover border border-[#8B5E34]"
              referrerPolicy="no-referrer"
            />
            <span className="font-display font-bold text-sm sm:text-base text-gray-900">
              Chin Chin Checkout
            </span>
          </div>

          <button
            type="button"
            onClick={onBackToMainMenu}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-[#8B5E34] bg-[#FAF5EE] hover:bg-[#F3E7D5] border border-[#DFCBB2] transition-colors cursor-pointer"
          >
            <Cookie className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Main Menu</span>
          </button>
        </div>
      </header>

      {/* SHIPPING THRESHOLD INFO BAR */}
      <div className="bg-amber-50 border-b border-amber-200 py-2.5 px-4">
        <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-center gap-2 text-center text-xs font-semibold text-amber-900">
          <Truck className="w-4 h-4 text-amber-800 shrink-0" />
          {billing.qualifiesForFreeShipping ? (
            <span className="text-emerald-800">
              Your order qualifies for FREE shipping (Orders over $100)!
            </span>
          ) : (
            <span>
              Orders over $100 ship FREE • Standard shipping for orders under $100 is $10.00
              {billing.amountNeededForFreeShipping > 0 && (
                <span className="ml-1.5 text-amber-700 font-normal">
                  (Add <strong>${billing.amountNeededForFreeShipping.toFixed(2)}</strong> more for free shipping)
                </span>
              )}
            </span>
          )}
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-6">
        {cart.length === 0 && !submittedOrder ? (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-10 text-center max-w-lg mx-auto space-y-4 mt-8">
            <ShoppingBag className="w-10 h-10 text-gray-300 mx-auto" />
            <h2 className="text-lg font-bold text-gray-900">Your Chin Chin Cart is Empty</h2>
            <p className="text-xs text-gray-500">
              Select from our 300g, 700g, or 1500g Chin Chin packs to begin your order.
            </p>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={onBackToChinChin}
                className="px-4 py-2 rounded-lg bg-[#8B5E34] hover:bg-[#724a25] text-white text-xs font-bold cursor-pointer"
              >
                Select Chin Chin Sizes
              </button>
              <button
                type="button"
                onClick={onBackToMainMenu}
                className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold cursor-pointer"
              >
                Main Catering Menu
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* LEFT COLUMN: ITEMS & SHIPPING / CUSTOMER FORM */}
            <div className="lg:col-span-7 space-y-6">
              {/* CHIN CHIN CART ITEMS */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="bg-[#1F2937] px-4 py-3 text-white flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShoppingBag className="w-4 h-4 text-[#DFCBB2]" />
                    <h2 className="font-display font-semibold text-sm">
                      Your Chin Chin Order ({totalItemCount} {totalItemCount === 1 ? 'bag' : 'bags'})
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={onBackToChinChin}
                    className="text-[11px] font-semibold text-amber-200 hover:text-white underline cursor-pointer"
                  >
                    + Add More Bags
                  </button>
                </div>

                <div className="p-4 divide-y divide-gray-100">
                  {cart.map((item) => (
                    <div key={item.menuItem.id} className="py-3 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        {item.menuItem.imageUrl && (
                          <img
                            src={item.menuItem.imageUrl}
                            alt={item.menuItem.name}
                            className="w-12 h-12 rounded-lg object-cover border border-gray-100 shrink-0"
                            referrerPolicy="no-referrer"
                          />
                        )}
                        <div className="min-w-0">
                          <h3 className="text-xs font-bold text-gray-900 truncate">{item.menuItem.name}</h3>
                          <p className="text-[11px] text-gray-500">{item.menuItem.unit}</p>
                          <p className="text-[11px] font-mono text-[#8B5E34] font-semibold">
                            ${item.menuItem.price.toFixed(2)} each
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5 shrink-0">
                        <div className="flex items-center bg-gray-50 border border-gray-200 rounded-lg p-0.5 gap-1">
                          <button
                            type="button"
                            onClick={() => onRemoveFromCart(item.menuItem.id)}
                            className="w-7 h-7 rounded hover:bg-gray-200 text-gray-700 flex items-center justify-center cursor-pointer"
                            title="Decrease quantity"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="font-mono text-xs font-bold text-gray-800 w-6 text-center">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => onAddToCart(item.menuItem)}
                            className="w-7 h-7 rounded hover:bg-gray-200 text-gray-700 flex items-center justify-center cursor-pointer"
                            title="Increase quantity"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <span className="font-mono text-xs font-bold text-gray-900 w-16 text-right">
                          ${(item.menuItem.price * item.quantity).toFixed(2)}
                        </span>

                        <button
                          type="button"
                          onClick={() => onDeleteLineItem(item.menuItem.id)}
                          className="text-gray-400 hover:text-red-500 p-1 transition-colors cursor-pointer"
                          title="Remove item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="bg-[#FAF5EE] border-t border-[#DFCBB2]/60 px-4 py-2.5 flex items-center justify-between gap-2 text-xs">
                  <span className="text-gray-600">Want to include catering dishes (rice, soups, meats)?</span>
                  <button
                    type="button"
                    onClick={onBackToMainMenu}
                    className="font-bold text-[#8B5E34] hover:underline whitespace-nowrap cursor-pointer"
                  >
                    Add from Main Menu →
                  </button>
                </div>
              </div>

              {/* CUSTOMER & SHIPPING DETAILS FORM */}
              <form
                id="chinchin_checkout_form"
                onSubmit={handleSubmitChinChinOrder}
                className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm space-y-4"
              >
                <h3 className="font-display font-bold text-sm text-gray-900 pb-2 border-b border-gray-100 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-[#8B5E34]" />
                  <span>Contact & Shipping Location</span>
                </h3>

                <div className="space-y-3">
                  <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                      Full Name *
                    </label>
                    <div className="relative">
                      <User className="absolute left-2.5 top-2.5 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Jane Doe"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        className="w-full text-xs bg-gray-50 border border-gray-200 rounded-lg py-2 pl-9 pr-3 focus:outline-none focus:border-[#8B5E34]"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                        Phone Number *
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-2.5 top-2.5 w-4 h-4 text-gray-400" />
                        <input
                          type="tel"
                          placeholder="(312) 555-0199"
                          value={customerPhone}
                          onChange={(e) => setCustomerPhone(e.target.value)}
                          className="w-full text-xs bg-gray-50 border border-gray-200 rounded-lg py-2 pl-9 pr-3 focus:outline-none focus:border-[#8B5E34]"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                        Email Address *
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-2.5 top-2.5 w-4 h-4 text-gray-400" />
                        <input
                          type="email"
                          placeholder="jane.doe@example.com"
                          value={customerEmail}
                          onChange={(e) => setCustomerEmail(e.target.value)}
                          className="w-full text-xs bg-gray-50 border border-gray-200 rounded-lg py-2 pl-9 pr-3 focus:outline-none focus:border-[#8B5E34]"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                      Shipping Street Address *
                    </label>
                    <input
                      type="text"
                      placeholder="123 Main St, Apt 4B"
                      value={shippingStreet}
                      onChange={(e) => setShippingStreet(e.target.value)}
                      className="w-full text-xs bg-gray-50 border border-gray-200 rounded-lg py-2 px-3 focus:outline-none focus:border-[#8B5E34]"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                        City *
                      </label>
                      <input
                        type="text"
                        placeholder="City (e.g. Chicago)"
                        value={shippingCity}
                        onChange={(e) => setShippingCity(e.target.value)}
                        className="w-full text-xs bg-gray-50 border border-gray-200 rounded-lg py-2 px-3 focus:outline-none focus:border-[#8B5E34]"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                        State / Province *
                      </label>
                      <input
                        type="text"
                        placeholder="IL"
                        value={shippingState}
                        onChange={(e) => setShippingState(e.target.value)}
                        className="w-full text-xs bg-gray-50 border border-gray-200 rounded-lg py-2 px-3 focus:outline-none focus:border-[#8B5E34]"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                        ZIP / Postal Code *
                      </label>
                      <input
                        type="text"
                        placeholder="60601"
                        value={shippingPostalCode}
                        onChange={(e) => setShippingPostalCode(e.target.value)}
                        className="w-full text-xs bg-gray-50 border border-gray-200 rounded-lg py-2 px-3 focus:outline-none focus:border-[#8B5E34]"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                      Interac Ref Number
                    </label>
                    <input
                      type="text"
                      placeholder="Enter Interac reference number (optional)"
                      value={interacRefNumber}
                      onChange={(e) => setInteracRefNumber(e.target.value)}
                      className="w-full text-xs bg-gray-50 border border-gray-200 rounded-lg py-2 px-3 focus:outline-none focus:border-[#8B5E34]"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                      Order Notes (Optional)
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Any delivery notes or flavor preferences..."
                      value={specialInstructions}
                      onChange={(e) => setSpecialInstructions(e.target.value)}
                      className="w-full text-xs bg-gray-50 border border-gray-200 rounded-lg p-2.5 focus:outline-none focus:border-[#8B5E34] resize-none"
                    />
                  </div>
                </div>

                {validationError && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                    <span>{validationError}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 bg-[#1F2937] hover:bg-[#8B5E34] text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  <span>{isSubmitting ? 'Submitting Order...' : 'Complete Chin Chin Order'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            </div>

            {/* RIGHT COLUMN: SUMMARY & PAYMENT */}
            <div className="lg:col-span-5 space-y-5">
              {/* BILLING SUMMARY CARD */}
              <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm space-y-3">
                <h3 className="font-display font-bold text-sm text-gray-900 flex items-center justify-between pb-2 border-b border-gray-100">
                  <span className="flex items-center gap-2">
                    <Truck className="w-4 h-4 text-[#8B5E34]" />
                    Order & Shipping Summary
                  </span>
                  <span className="text-xs font-normal text-gray-500">
                    {totalItemCount} {totalItemCount === 1 ? 'item' : 'items'}
                  </span>
                </h3>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between text-gray-600">
                    <span>Chin Chin Subtotal:</span>
                    <span className="font-mono font-semibold">${billing.subtotal.toFixed(2)}</span>
                  </div>

                  <div className="flex justify-between text-gray-600">
                    <span>Shipping:</span>
                    {billing.shippingFee === 0 ? (
                      <span className="font-mono font-bold text-emerald-700">FREE ($0.00)</span>
                    ) : (
                      <span className="font-mono font-semibold text-gray-900">
                        ${billing.shippingFee.toFixed(2)}
                      </span>
                    )}
                  </div>

                  {!billing.qualifiesForFreeShipping && billing.amountNeededForFreeShipping > 0 && (
                    <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-900 flex items-center gap-2">
                      <Sparkles className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                      <span>
                        Add <strong>${billing.amountNeededForFreeShipping.toFixed(2)}</strong> more to unlock{' '}
                        <strong>FREE shipping</strong> (Orders $100+).
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between font-bold text-gray-900 pt-2.5 border-t border-dashed border-gray-200 text-sm">
                    <span>Total Due:</span>
                    <span className="font-mono text-[#8B5E34] text-base font-extrabold">
                      ${billing.total.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {/* PAYMENT METHODS */}
              <div className="space-y-3">
                {/* CARD DETAILS UNDER CONSTRUCTION */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                  <button
                    type="button"
                    disabled
                    className="w-full px-4 py-3 bg-gray-100 flex items-center justify-between text-left cursor-not-allowed opacity-80"
                  >
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-gray-400" />
                      <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                        "ENTER CARD DETAILS" [UNDER CONSTRUCTION]
                      </span>
                    </div>
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  </button>
                </div>

                {/* INTERAC E-TRANSFER */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setIsInteracExpanded(!isInteracExpanded)}
                    className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors flex items-center justify-between text-left cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <Send className="w-4 h-4 text-[#8B5E34]" />
                      <span className="text-xs font-bold text-gray-800 uppercase tracking-wider">
                        Pay via Interac e-Transfer
                      </span>
                    </div>
                    {isInteracExpanded ? (
                      <ChevronUp className="w-4 h-4 text-gray-500" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-500" />
                    )}
                  </button>

                  <AnimatePresence initial={false}>
                    {isInteracExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="border-t border-gray-100 p-4 space-y-3"
                      >
                        <p className="text-xs text-gray-600 leading-relaxed">
                          Please send your order total (<strong className="font-mono text-gray-900">${billing.total.toFixed(2)}</strong>) via Interac e-Transfer to:
                        </p>
                        <div className="flex items-center justify-between bg-[#fdfbf7] border border-[#f5efeb] p-2 rounded-lg">
                          <span className="font-mono text-xs font-bold text-gray-800 select-all px-1">
                            isaiahsixtycreations@gmail.com
                          </span>
                          <button
                            type="button"
                            onClick={handleCopyEmail}
                            className="bg-[#8B5E34] hover:bg-[#a67341] text-white p-1.5 rounded transition-all flex items-center gap-1 shrink-0 cursor-pointer"
                          >
                            {copiedEmail ? (
                              <>
                                <Check className="w-3.5 h-3.5" />
                                <span className="text-[10px] font-semibold px-1">Copied</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                <span className="text-[10px] font-semibold px-1">Copy</span>
                              </>
                            )}
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* RECEIPT MODAL */}
      <AnimatePresence>
        {submittedOrder && submittedSnapshot && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white max-w-lg w-full rounded-2xl border border-gray-200 shadow-2xl overflow-hidden text-sm"
            >
              <div className="bg-[#1F2937] text-white px-5 py-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-emerald-400" />
                  <div>
                    <h4 className="font-display font-semibold text-base">Chin Chin Order Placed</h4>
                    <p className="text-[10px] text-stone-300 font-mono">Reference: {submittedOrder.id}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSubmittedOrder(null)}
                  className="p-1 rounded-full bg-white/10 text-gray-300 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div id="printable_area" className="p-6 space-y-4">
                <div className="text-center pb-3 border-b border-gray-100 flex flex-col items-center gap-1">
                  <img
                    src={logoUrl}
                    alt="Isaiah Sixty Creations Logo"
                    className="w-12 h-12 object-cover rounded-full border border-[#8B5E34] shadow-sm"
                    referrerPolicy="no-referrer"
                  />
                  <h3 className="font-display font-bold text-base text-gray-900">Isaiah Sixty Creations</h3>
                  <p className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold">
                    Chin Chin Order Receipt
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs bg-gray-50 p-3 rounded-xl border border-gray-100">
                  <div className="space-y-1">
                    <p className="text-gray-400 uppercase font-bold text-[9px] tracking-wider">Customer</p>
                    <p className="font-bold text-gray-800">{submittedOrder.customerName}</p>
                    <p className="text-gray-500 font-mono">{submittedOrder.customerPhone}</p>
                    <p className="text-gray-500 truncate">{submittedOrder.customerEmail}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-gray-400 uppercase font-bold text-[9px] tracking-wider">Order Date</p>
                    <p className="text-gray-700 font-medium">{submittedOrder.eventDate}</p>
                    <p className="text-gray-500">{submittedOrder.eventTime}</p>
                  </div>
                  {submittedOrder.deliveryAddress && (
                    <div className="col-span-2 pt-1 border-t border-gray-200/70">
                      <p className="text-gray-400 uppercase font-bold text-[9px] tracking-wider">Shipping Address</p>
                      <p className="text-gray-700 font-medium">{submittedOrder.deliveryAddress}</p>
                    </div>
                  )}
                  {submittedOrder.interacRefNumber && (
                    <div className="col-span-2 pt-1 border-t border-gray-200/70">
                      <p className="text-gray-400 uppercase font-bold text-[9px] tracking-wider">Interac Ref Number</p>
                      <p className="text-gray-800 font-mono font-semibold">{submittedOrder.interacRefNumber}</p>
                    </div>
                  )}
                </div>

                <div>
                  <p className="text-gray-400 uppercase font-bold text-[9px] tracking-wider block mb-1.5">
                    Itemized Chin Chin Packs
                  </p>
                  <div className="border border-gray-100 rounded-xl overflow-hidden divide-y divide-gray-50">
                    {submittedSnapshot.items.map((item) => (
                      <div key={item.menuItem.id} className="p-2.5 flex items-center justify-between text-xs bg-white">
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-gray-800 truncate">{item.menuItem.name}</p>
                          <p className="text-[10px] text-gray-400">{item.menuItem.unit}</p>
                        </div>
                        <div className="flex items-center gap-4 text-right shrink-0">
                          <span className="font-mono text-gray-500">Qty: {item.quantity}</span>
                          <span className="font-mono font-bold text-gray-900 w-16">
                            ${(item.menuItem.price * item.quantity).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-3 border-t border-gray-100 space-y-1.5 text-xs">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal:</span>
                    <span className="font-mono">${submittedSnapshot.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Shipping:</span>
                    <span className="font-mono font-semibold">
                      {submittedSnapshot.shippingFee === 0
                        ? 'FREE ($0.00)'
                        : `$${submittedSnapshot.shippingFee.toFixed(2)}`}
                    </span>
                  </div>
                  <div className="flex justify-between font-bold text-gray-900 pt-1.5 border-t border-dashed border-gray-200 text-sm">
                    <span>Total Amount:</span>
                    <span className="font-mono text-[#8B5E34]">${submittedSnapshot.total.toFixed(2)}</span>
                  </div>
                </div>

                <div className="p-3 bg-blue-50/50 border border-blue-100 rounded-xl text-[11px] text-blue-900 leading-relaxed space-y-1">
                  <p className="font-bold flex items-center gap-1">
                    <Send className="w-3 h-3 text-blue-600" />
                    Interac e-Transfer Instructions
                  </p>
                  <p className="text-blue-700/90 font-light">
                    Please send <strong className="font-mono font-bold">${submittedSnapshot.total.toFixed(2)}</strong> via Interac e-Transfer to:{' '}
                    <strong className="font-mono text-blue-950 font-bold">isaiahsixtycreations@gmail.com</strong>.
                  </p>
                </div>
              </div>

              <div className="bg-gray-50 border-t border-gray-100 p-4 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={handleCopyReceipt}
                  className="py-2.5 px-3 text-xs font-semibold rounded-lg border border-gray-200 text-gray-700 bg-white hover:bg-gray-50 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {copiedReceipt ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-500" />
                      <span>Copied Summary</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Copy Full Receipt</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="py-2.5 px-3 text-xs font-semibold rounded-lg bg-[#8B5E34] hover:bg-[#a67341] text-white flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Receipt</span>
                </button>

                <button
                  type="button"
                  onClick={handleFinishAndReset}
                  className="col-span-2 py-2.5 text-xs font-bold rounded-lg border border-dashed border-[#8B5E34] hover:border-[#a67341] hover:bg-[#fdfbf7] text-[#8B5E34] transition-colors cursor-pointer"
                >
                  Start Another Order
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ChinChinCheckoutPage;
