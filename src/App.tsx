/**
 * Isaiah Sixty Creations - Catering Order & Payment Tracker Web Application
 * 
 * Features:
 * - Dynamic categorized menu list with adding/removing item quantities.
 * - Customer order arrangements (Delivery/Pickup, Special chef notes).
 * - Live Payment Tracker: Deposit Paid & Full Payment checkboxes with dynamic billing.
 * - Collapsible Card Details container with real-time credit card mock formatting.
 * - Collapsible Interac e-Transfer panel with copy-to-clipboard functionality.
 * - Beautiful receipt generation with a confirmation details modal.
 */

import React, { useState, useMemo, useEffect } from 'react';
// Import vector icons for clean culinary branding
import { 
  ChefHat, Beef, Soup, Cookie, Croissant, Utensils, CircleDot,
  Plus, Minus, Trash2, CreditCard, Send, CheckCircle, Clock,
  Calendar, MapPin, Sparkles, Phone, Mail, User, Check,
  ChevronDown, ChevronUp, Copy, Printer, CheckSquare, Square,
  ShoppingBag, ClipboardCheck, ArrowRight, X, AlertCircle, LogOut
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Import our custom types and structural datasets
import { MenuItem, FoodCategory, CartItem, CardDetails, OrderDetails } from './types';
import { MENU_ITEMS, CATEGORIES } from './data';

// Import our generated premium logo image
// @ts-ignore
import logoUrl from './assets/images/Logo/IsaiahSixty Logo.png';
import AdminDashboard from './components/AdminDashboard';

export default function App() {
  // --- STATE MANAGEMENT ---
  
  // Active state to track if we are viewing the Admin Workspace Sync Portal
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // Monitor both sub-directory pathname and window hash for route matching
    const handleLocationChange = () => {
      const isRoute = window.location.pathname === '/admin' || window.location.hash === '#admin';
      setIsAdmin(isRoute);
    };

    handleLocationChange();
    window.addEventListener('popstate', handleLocationChange);
    window.addEventListener('hashchange', handleLocationChange);

    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener('hashchange', handleLocationChange);
    };
  }, []);
  
  // Active selected food category filter ('All' displays everything)
  const [selectedCategory, setSelectedCategory] = useState<FoodCategory | 'All'>('All');
  
  // User search string to find dishes quickly
  const [searchQuery, setSearchQuery] = useState('');
  
  // Shopping cart items state holding products and selected quantities
  const [cart, setCart] = useState<CartItem[]>([]);
  
  // Tracking if the "Enter Card Details" accordion is expanded
  const [isCardExpanded, setIsCardExpanded] = useState(false);
  
  // Tracking if the "Enter Email for Interac" accordion is expanded
  const [isInteracExpanded, setIsInteracExpanded] = useState(false);
  
  // Tracking if the small cart dropdown in header is expanded
  const [isCartDropdownOpen, setIsCartDropdownOpen] = useState(false);

  // Client info form inputs
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventTime, setEventTime] = useState('');
  const [orderType, setOrderType] = useState<'delivery' | 'pickup'>('pickup');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [specialInstructions, setSpecialInstructions] = useState('');

  // Payment Tracking States (Mandatory requirement)
  const [isDepositPaid, setIsDepositPaid] = useState(false);
  const [isFullPaymentMade, setIsFullPaymentMade] = useState(false);

  // Card details state (simulated input values)
  const [cardData, setCardData] = useState<CardDetails>({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardholderName: ''
  });

  // State to manage showing the submitted order receipt modal
  const [submittedOrder, setSubmittedOrder] = useState<OrderDetails | null>(null);
  
  // State for announcement banner visibility
  const [isBannerVisible, setIsBannerVisible] = useState(true);
  
  // Copy feedback state for copying interac email or receipt summary
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [copiedReceipt, setCopiedReceipt] = useState(false);

  // Error alert message state
  const [validationError, setValidationError] = useState('');

  // Track selected portion variant per menu item (e.g., '1.5kg', '1kg', '0.5kg')
  const [selectedPortions, setSelectedPortions] = useState<Record<string, string>>({});

  // Resolves the currently active portion and returns the variant MenuItem
  const getActiveItemVariant = (item: MenuItem): { resolvedItem: MenuItem; activePortionId?: string } => {
    if (!item.portions || item.portions.length === 0) {
      return { resolvedItem: item };
    }
    const activePortionId = selectedPortions[item.id] || item.portions[0].id;
    const activePortion = item.portions.find(p => p.id === activePortionId) || item.portions[0];
    const resolvedItem: MenuItem = {
      ...item,
      id: `${item.id}-${activePortion.id}`,
      name: `${item.name} (${activePortion.label})`,
      unit: activePortion.unit,
      price: activePortion.price,
      isCustomPrice: activePortion.isCustomPrice ?? item.isCustomPrice
    };
    return { resolvedItem, activePortionId };
  };

  // --- DYNAMIC CALCULATIONS (MEMOIZED) ---

  // Filter menu items by selected category and user search keyword
  const filteredMenuItems = useMemo(() => {
    return MENU_ITEMS.filter(item => {
      const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            item.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchQuery]);

  // Calculate shopping cart summary figures (Subtotal, Delivery Fee, Total, and 80% Deposit)
  const billingSummary = useMemo(() => {
    const subtotal = cart.reduce((sum, item) => sum + (item.menuItem.price * item.quantity), 0);
    // Flat rate delivery fee of $25 if delivery selected and subtotal is greater than 0
    const deliveryFee = (orderType === 'delivery' && subtotal > 0) ? 25.00 : 0.00;
    const total = subtotal + deliveryFee;
    const deposit80 = total * 0.8;
    
    // Calculate outstanding due balances based on payment tracker states
    let totalPaid = 0;
    if (isFullPaymentMade) {
      totalPaid = total;
    } else if (isDepositPaid) {
      // Calculate 80% of the total amount for the retainer deposit
      totalPaid = total * 0.8;
    }

    const remainingBalance = total - totalPaid;

    return {
      subtotal,
      deliveryFee,
      total,
      deposit80,
      totalPaid,
      remainingBalance
    };
  }, [cart, orderType, isDepositPaid, isFullPaymentMade]);

  // --- HANDLERS & INTERACTIONS ---

  // Adds an item to the shopping cart, or increments quantity if already exists
  const handleAddToCart = (item: MenuItem) => {
    setCart(prevCart => {
      const existingIndex = prevCart.findIndex(cartItem => cartItem.menuItem.id === item.id);
      if (existingIndex > -1) {
        const updated = [...prevCart];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + 1
        };
        return updated;
      }
      return [...prevCart, { menuItem: item, quantity: 1 }];
    });
  };

  // Decrements item quantity in cart, removes item entirely if quantity drops to 0
  const handleRemoveFromCart = (itemId: string) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(cartItem => cartItem.menuItem.id === itemId);
      if (!existingItem) return prevCart;
      
      if (existingItem.quantity === 1) {
        return prevCart.filter(cartItem => cartItem.menuItem.id !== itemId);
      }
      
      return prevCart.map(cartItem => 
        cartItem.menuItem.id === itemId 
          ? { ...cartItem, quantity: cartItem.quantity - 1 }
          : cartItem
      );
    });
  };

  // Completely deletes a item line from the cart
  const handleDeleteLineItem = (itemId: string) => {
    setCart(prevCart => prevCart.filter(cartItem => cartItem.menuItem.id !== itemId));
  };

  // Fast utility to map custom icons to food categories
  const getCategoryIcon = (category: FoodCategory) => {
    switch (category) {
      case 'Meats': return <Beef className="w-4 h-4" />;
      case 'Pastries': return <Croissant className="w-4 h-4" />;
      case 'Rice': return <ChefHat className="w-4 h-4" />;
      case 'Sides': return <Utensils className="w-4 h-4" />;
      case 'Small chops': return <Cookie className="w-4 h-4" />;
      case 'Soups': return <Soup className="w-4 h-4" />;
      case 'Swallows': return <CircleDot className="w-4 h-4" />;
      default: return <Utensils className="w-4 h-4" />;
    }
  };

  // Safe Interac Email copier trigger
  const handleCopyEmail = () => {
    navigator.clipboard.writeText('isaiahsixtycreations@gmail.com');
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2500);
  };

  // Handles dynamic changes in deposit/full payment checkboxes
  const handleDepositChange = (checked: boolean) => {
    setIsDepositPaid(checked);
    // If deposit is turned off, full payment cannot logically remain active
    if (!checked) {
      setIsFullPaymentMade(false);
    }
  };

  const handleFullPaymentChange = (checked: boolean) => {
    setIsFullPaymentMade(checked);
    // If full payment is checked, deposit is automatically checked
    if (checked) {
      setIsDepositPaid(true);
    }
  };

  // Formats credit card input with spaces every 4 digits
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/\D/g, '');
    const formatted = rawValue.slice(0, 16).replace(/(\d{4})(?=\d)/g, '$1 ');
    setCardData(prev => ({ ...prev, cardNumber: formatted }));
  };

  // Formats expiry input with MM/YY slash separator
  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/\D/g, '');
    let formatted = rawValue.slice(0, 4);
    if (formatted.length > 2) {
      formatted = `${formatted.slice(0, 2)}/${formatted.slice(2)}`;
    }
    setCardData(prev => ({ ...prev, expiryDate: formatted }));
  };

  // Limits CVV code to 3 numerical digits
  const handleCvvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = e.target.value.replace(/\D/g, '').slice(0, 3);
    setCardData(prev => ({ ...prev, cvv: formatted }));
  };

  // Submits the finalized order details and opens the invoice receipt
  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');

    // Cart validation
    if (cart.length === 0) {
      setValidationError('Your catering cart is empty. Please add items before placing an order.');
      return;
    }

    // Required fields validation
    if (!customerName.trim()) {
      setValidationError('Please enter your name for the order record.');
      return;
    }
    if (!customerPhone.trim()) {
      setValidationError('Please provide a contact phone number.');
      return;
    }
    if (!customerEmail.trim()) {
      setValidationError('Please provide a contact email address.');
      return;
    }
    if (!eventDate) {
      setValidationError('Please select the date for fulfillment.');
      return;
    }
    if (!eventTime) {
      setValidationError('Please select a target delivery or pickup time.');
      return;
    }
    if (orderType === 'delivery' && !deliveryAddress.trim()) {
      setValidationError('Please specify a delivery address.');
      return;
    }

    // Determine chosen payment flow
    let finalPaymentMethod: 'card' | 'interac' | null = null;
    if (cardData.cardNumber.trim().length > 12) {
      finalPaymentMethod = 'card';
    } else if (isInteracExpanded) {
      finalPaymentMethod = 'interac';
    }

    // Generate random mock order reference ID
    const randomId = 'ISC-' + Math.floor(100000 + Math.random() * 900000);

    // Build finalized order report object
    const finalOrder: OrderDetails = {
      id: randomId,
      customerName,
      customerEmail,
      customerPhone,
      eventDate,
      eventTime,
      orderType,
      deliveryAddress: orderType === 'delivery' ? deliveryAddress : undefined,
      specialInstructions,
      isDepositPaid,
      isFullPaymentMade,
      paymentMethod: finalPaymentMethod,
      cardDetails: cardData
    };

    setSubmittedOrder(finalOrder);
    
    // Construct rich text summaries and metrics for Google Workspace logging
    const itemsText = cart.map(item => 
      `- ${item.menuItem.name} (${item.menuItem.unit}) x ${item.quantity} : $${(item.menuItem.price * item.quantity).toFixed(2)} CAD`
    ).join('\n');

    const categories = cart.map(item => item.menuItem.category).join(', ');
    const quantities = cart.map(item => item.quantity).join(', ');
    const itemsList = cart.map(item => `${item.menuItem.name} (x${item.quantity})`).join(', ');

    const paymentStatus = isFullPaymentMade
      ? 'FULLY PAID'
      : isDepositPaid
        ? '80% DEPOSIT PAID'
        : 'PENDING PAYMENT';

    const now = new Date();
    const dateOrdered = now.toISOString().split('T')[0];
    const timeOrdered = now.toTimeString().split(' ')[0].substring(0, 5);

    const billingHtml = `
      <p style="margin: 4px 0; font-size: 13px;"><b>Subtotal:</b> $${billingSummary.subtotal.toFixed(2)} CAD</p>
      ${orderType === 'delivery' ? `<p style="margin: 4px 0; font-size: 13px;"><b>Delivery Fee:</b> $25.00 CAD</p>` : ''}
      <p style="margin: 4px 0; font-size: 14px; font-weight: bold; color: #4B2F1D;"><b>Total:</b> $${billingSummary.total.toFixed(2)} CAD</p>
      <p style="margin: 4px 0; font-size: 13px; color: #065f46;"><b>Amount Paid:</b> $${billingSummary.totalPaid.toFixed(2)} CAD</p>
      <p style="margin: 4px 0; font-size: 13px; color: #991b1b;"><b>Remaining Balance:</b> $${billingSummary.remainingBalance.toFixed(2)} CAD</p>
    `;

    // Call backend API for workspace integration
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
                amountPaid: billingSummary.totalPaid,
                paymentStatus,
                dateOrdered,
                timeOrdered,
                orderDate: eventDate,
                orderTime: eventTime,
                billingHtml
            })
        });
        
        if (!response.ok) {
            throw new Error('Failed to submit order to server.');
        }
    } catch (err: any) {
        console.error('Submission failed:', err);
        setValidationError(`Order submitted, but sync failed: ${err.message}`);
    }
  };

  // Generate plain text receipt summaries for client storage/sharing
  const generateReceiptTextSummary = () => {
    if (!submittedOrder) return '';
    
    const itemsText = cart.map(item => 
      `- ${item.menuItem.name} (${item.menuItem.unit}) x ${item.quantity} : $${(item.menuItem.price * item.quantity).toFixed(2)} CAD`
    ).join('\n');

    const paymentStatus = submittedOrder.isFullPaymentMade 
      ? 'FULLY PAID' 
      : submittedOrder.isDepositPaid 
        ? '80% DEPOSIT PAID (Balance Due on Delivery)' 
        : 'PENDING PAYMENT';

    return `
=========================================
      ISAIAH SIXTY CREATIONS RECEIPT
=========================================
Order ID: ${submittedOrder.id}
Client: ${submittedOrder.customerName}
Phone: ${submittedOrder.customerPhone}
Email: ${submittedOrder.customerEmail}
Date: ${submittedOrder.eventDate} @ ${submittedOrder.eventTime}
Fulfillment: ${submittedOrder.orderType.toUpperCase()}
${submittedOrder.deliveryAddress ? `Address: ${submittedOrder.deliveryAddress}\n` : ''}
-----------------------------------------
ORDERED ITEMS:
${itemsText}
-----------------------------------------
Subtotal: $${billingSummary.subtotal.toFixed(2)} CAD
${submittedOrder.orderType === 'delivery' ? `Delivery Fee: $25.00 CAD\n` : ''}Total Value: $${billingSummary.total.toFixed(2)} CAD
-----------------------------------------
PAYMENT TRACKING STATUS:
[${paymentStatus}]
Paid to Date: $${billingSummary.totalPaid.toFixed(2)} CAD
Remaining Balance: $${billingSummary.remainingBalance.toFixed(2)} CAD
Payment Route: ${submittedOrder.paymentMethod ? submittedOrder.paymentMethod.toUpperCase() : 'None Specified'}
=========================================
Thank you for booking Isaiah Sixty Creations!
We turn your catering events into golden culinary moments.
    `.trim();
  };

  // Helper to copy entire text receipt to user clipboard
  const handleCopyReceipt = () => {
    const text = generateReceiptTextSummary();
    navigator.clipboard.writeText(text);
    setCopiedReceipt(true);
    setTimeout(() => setCopiedReceipt(false), 2500);
  };

  // Clears active cart and form inputs for a fresh booking session
  const resetFormAndCart = () => {
    setCart([]);
    setCustomerName('');
    setCustomerPhone('');
    setCustomerEmail('');
    setEventDate('');
    setEventTime('');
    setDeliveryAddress('');
    setSpecialInstructions('');
    setIsDepositPaid(false);
    setIsFullPaymentMade(false);
    setCardData({
      cardNumber: '',
      expiryDate: '',
      cvv: '',
      cardholderName: ''
    });
    setSubmittedOrder(null);
  };

  if (isAdmin) {
    return <AdminDashboard />;
  }

  return (
    <div id="catering_app" className="min-h-screen bg-[#F9FAFB] text-[#1F2937] font-sans selection:bg-[#8B5E34] selection:text-white">
      
      {/* ANNOUNCEMENT BANNER */}
      <AnimatePresence>
        {isBannerVisible && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-gradient-to-r from-[#8B5E34] via-[#A87948] to-[#8B5E34] text-white overflow-hidden relative z-50 shadow-md"
          >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex items-center justify-between">
              <div className="flex items-center gap-2 flex-1 justify-center">
                <Sparkles className="w-4 h-4 text-amber-200 animate-pulse" />
                <p className="text-sm font-medium tracking-wide">
                  <span className="font-bold text-amber-100">Special Offer:</span> Book your wedding catering this month and receive a complimentary assorted pastry platter!
                </p>
              </div>
              <button 
                onClick={() => setIsBannerVisible(false)}
                className="text-white/80 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-white/20 ml-2"
                aria-label="Dismiss announcement"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* HEADER SECTION WITH USER LOGO IMAGE ATTACHED AS REQUESTED */}
      <header id="app_header" className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            
            {/* BRAND LOGO AND TITLE */}
            <div className="flex items-center gap-4">
              <div className="relative group overflow-hidden rounded-full border-2 border-[#8B5E34] shadow-md h-16 w-16 bg-white shrink-0">
                {/* Fallback support in case logo asset has any rendering delay */}
                <img 
                  src={logoUrl} 
                  alt="Isaiah Sixty Creations Logo" 
                  className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-110"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    // Inject text styling fallback if the image fails to load
                    e.currentTarget.style.display = 'none';
                    const parent = e.currentTarget.parentElement;
                    if (parent) {
                      const fallback = document.createElement('div');
                      fallback.className = 'w-full h-full flex items-center justify-center bg-[#8B5E34] text-white font-serif font-bold text-lg';
                      fallback.innerText = 'ISC';
                      parent.appendChild(fallback);
                    }
                  }}
                />
              </div>
              <div className="text-center md:text-left">
                {/* Brand name and catering badge */}
                <h1 className="font-display font-bold text-2xl tracking-tight text-[#1F2937] flex flex-wrap items-center gap-2 justify-center md:justify-start">
                  <span>Isaiah Sixty Creations</span>
                  <span className="text-[#8B5E34] text-[11px] font-sans font-semibold px-2.5 py-0.5 rounded-full bg-[#fdfbf7] border border-[#f5efeb] whitespace-nowrap">Catering Service</span>
                </h1>
                {/* Custom requested italicized subtext explaining business motivation */}
                <p className="text-xs text-gray-500 mt-1 font-sans italic">Your satisfaction keeps us in business</p>
              </div>
            </div>

              {/* QUICK CONTACT METRICS AND CART BUTTON */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 text-xs text-gray-600 border-t md:border-t-0 border-gray-100 pt-3 md:pt-0 w-full md:w-auto">
                <div className="flex flex-wrap justify-center gap-4 text-xs text-gray-600">
                  <div className="flex items-center gap-1.5">
                    <Mail className="w-4 h-4 text-[#8B5E34]" />
                    {/* Updated business email address to our primary gmail account */}
                    <span className="font-medium">isaiahsixtycreations@gmail.com</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {/* SVG Phone icon styled with brown brand accent color */}
                    <Phone className="w-4 h-4 text-[#8B5E34]" />
                    {/* The main business contact phone number updated to (639)-470-6430 */}
                    <span className="font-medium">(639)-470-6430</span>
                  </div>
                </div>

                {/* Small Cart Active Button */}
                <div className="relative">
                  <button 
                    onClick={() => setIsCartDropdownOpen(!isCartDropdownOpen)}
                    className="flex items-center gap-2 bg-[#8B5E34] text-white px-4 py-2 rounded-full text-xs font-semibold hover:bg-[#a67341] transition-colors shadow-sm"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    <span>Cart ({cart.reduce((sum, item) => sum + item.quantity, 0)}) - ${billingSummary.total.toFixed(2)}</span>
                  </button>

                  {/* Cart Dropdown */}
                  <AnimatePresence>
                    {isCartDropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute right-0 top-full mt-2 w-72 bg-white rounded-2xl shadow-xl border border-gray-100 p-4 z-50"
                      >
                        <h4 className="font-bold text-gray-900 mb-3 text-sm">Your Order</h4>
                        {cart.length === 0 ? (
                          <p className="text-gray-500 text-xs">Your cart is empty.</p>
                        ) : (
                          <div className="space-y-2 max-h-60 overflow-y-auto">
                            {cart.map(item => (
                              <div key={item.menuItem.id} className="flex justify-between items-center text-xs">
                                <span>{item.menuItem.name} x {item.quantity}</span>
                                <span>${(item.menuItem.price * item.quantity).toFixed(2)}</span>
                              </div>
                            ))}
                            <div className="border-t pt-2 mt-2 font-bold flex justify-between text-sm">
                              <span>Total</span>
                              <span>${billingSummary.total.toFixed(2)}</span>
                            </div>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

          </div>
        </div>
      </header>

      {/* DYNAMIC PROMOTIONAL HERO */}
      <section id="banner_hero" className="bg-gradient-to-r from-[#1f2937] via-[#2d251e] to-[#1f2937] text-white py-14 px-4 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#8b5e34_1px,transparent_1px)] [background-size:16px_16px]"></div>
        <div className="max-w-7xl mx-auto text-center relative z-10">
          <span className="text-[#a67341] font-display font-semibold text-xs tracking-widest uppercase bg-[#8B5E34]/10 px-3.5 py-1 rounded-full border border-[#8B5E34]/20">
            Isaiah Sixty Creations Special
          </span>
          <h2 className="text-3xl md:text-4xl font-serif font-semibold mt-4 tracking-tight">
            Order Exquisite West African & Continental Catering
          </h2>
          <p className="text-gray-300 max-w-2xl mx-auto mt-3 text-sm md:text-base font-light leading-relaxed">
            Select your premium meats, pastries, traditional soups, and small chops. Simply compile your culinary cart and configure your payment tracking in the sidebar below.
          </p>
        </div>
      </section>

      {/* MAIN LAYOUT WRAPPER */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT SECTION (MENU SELECTION) - TAKES UP 7 COLUMNS */}
          <section id="menu_section" className="lg:col-span-7 space-y-6">
            
            {/* SEARCH AND FILTERS PANEL */}
            <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <h3 className="font-display font-bold text-lg text-gray-900 flex items-center gap-2">
                  <ChefHat className="w-5 h-5 text-[#8B5E34]" />
                  Explore Our Menu
                </h3>
                
                {/* Search input field */}
                <div className="relative w-full sm:w-64">
                  <input
                    type="text"
                    placeholder="Search dishes or categories..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full text-sm bg-gray-50 border border-gray-200 rounded-lg py-1.5 pl-3 pr-8 focus:outline-none focus:border-[#8B5E34] transition-colors"
                  />
                  {searchQuery && (
                    <button 
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-2.5 text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* HORIZONTAL CATEGORY SCROLL FILTER */}
              <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
                <button
                  onClick={() => setSelectedCategory('All')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-full transition-all shrink-0 flex items-center gap-1.5 ${
                    selectedCategory === 'All'
                      ? 'bg-[#8B5E34] text-white shadow-sm'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  All Categories
                </button>
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.name}
                    onClick={() => setSelectedCategory(cat.name)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-full transition-all shrink-0 flex items-center gap-1.5 ${
                      selectedCategory === cat.name
                        ? 'bg-[#8B5E34] text-white shadow-sm'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {getCategoryIcon(cat.name)}
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            {/* FOOD ITEMS BENTO GRID */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <AnimatePresence mode="popLayout">
                {filteredMenuItems.length > 0 ? (
                  filteredMenuItems.map((item) => {
                    const { resolvedItem, activePortionId } = getActiveItemVariant(item);
                    const quantityInCart = cart.find(c => c.menuItem.id === resolvedItem.id)?.quantity || 0;
                    return (
                      <motion.div
                        key={item.id}
                        layout
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="bg-white border border-gray-200 hover:border-[#8B5E34] p-4 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between h-full group"
                      >
                        <div className="space-y-3">
                          {/* DYNAMIC CULINARY PICTURE: Real image or elegant styled card image container with category-themed icon */}
                          <div className="relative w-full h-64 rounded-xl overflow-hidden bg-gradient-to-br from-[#fdfbf7] via-[#f5efeb] to-[#eaddd3] border border-gray-100 flex flex-col items-center justify-center group-hover:shadow-inner transition-all duration-300">
                            {item.imageUrl ? (
                              <img 
                                src={item.imageUrl} 
                                alt={item.name} 
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              <>
                                {/* Circular geometric layout lines simulating gourmet dish plating */}
                                <div className="absolute inset-0 opacity-25 pointer-events-none">
                                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 rounded-full border border-[#8B5E34]/20"></div>
                                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-18 h-18 rounded-full border border-dashed border-[#8B5E34]/15"></div>
                                </div>
                                
                                {/* Centered category-themed emblem with smooth pop animation on group-hover */}
                                <div className="relative z-10 p-3 rounded-full bg-white/90 backdrop-blur-sm shadow-sm border border-gray-50/50 text-[#8B5E34] transform group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                                  {getCategoryIcon(item.category)}
                                </div>
                              </>
                            )}
                            
                            {/* Watermark badge identifying the representation plate */}
                            <span className="absolute bottom-2 right-2 text-[8px] font-mono tracking-widest text-white/90 bg-black/40 px-1.5 py-0.5 rounded backdrop-blur-sm uppercase">
                              {item.category} Showcase
                            </span>
                          </div>

                          <div className="flex items-center justify-between pt-1">
                            <span className="text-[10px] font-semibold text-[#8B5E34] bg-[#fdfbf7] border border-[#f5efeb] px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                              {getCategoryIcon(item.category)}
                              {item.category}
                            </span>
                            <span className="text-xs font-mono text-gray-500 bg-gray-50 px-2 py-0.5 rounded border border-gray-100">
                              Portion: {resolvedItem.unit}
                            </span>
                          </div>
                          
                          <h4 className="font-display font-bold text-base text-[#1F2937] group-hover:text-[#8B5E34] transition-colors">
                            {item.name}
                          </h4>
                          
                          <p className="text-xs text-gray-500 line-clamp-3 leading-relaxed">
                            {item.description}
                          </p>

                          {/* SELECTABLE PORTIONS (if item has portion variants) */}
                          {item.portions && item.portions.length > 0 && (
                            <div className="pt-2 border-t border-gray-50">
                              <div className="flex items-center justify-between mb-1.5">
                                <span className="text-[11px] font-semibold text-gray-700">Select Portion Size:</span>
                                <span className="text-[10px] text-gray-400 font-mono">
                                  Selected: {resolvedItem.unit}
                                </span>
                              </div>
                              <div className="grid grid-cols-3 gap-1.5 p-1 bg-gray-50 border border-gray-200/80 rounded-xl">
                                {item.portions.map((portion) => {
                                  const isSelected = activePortionId === portion.id;
                                  const portionCartQty = cart.find(c => c.menuItem.id === `${item.id}-${portion.id}`)?.quantity || 0;
                                  return (
                                    <button
                                      key={portion.id}
                                      type="button"
                                      onClick={() => setSelectedPortions(prev => ({ ...prev, [item.id]: portion.id }))}
                                      className={`py-1.5 px-2 text-center rounded-lg text-xs font-medium transition-all relative ${
                                        isSelected 
                                          ? 'bg-[#8B5E34] text-white shadow-sm font-semibold' 
                                          : 'text-gray-700 hover:bg-gray-200/70 hover:text-gray-900 bg-white border border-gray-100'
                                      }`}
                                    >
                                      <div className="font-semibold text-xs">{portion.label}</div>
                                      <div className={`text-[10px] ${isSelected ? 'text-white/90' : 'text-gray-500'}`}>
                                        ${portion.price.toFixed(2)}
                                      </div>
                                      {portionCartQty > 0 && (
                                        <span className={`absolute -top-1.5 -right-1 min-w-4 h-4 px-1 rounded-full text-[9px] font-bold flex items-center justify-center ${
                                          isSelected ? 'bg-amber-300 text-amber-950 shadow' : 'bg-[#8B5E34] text-white shadow'
                                        }`}>
                                          {portionCartQty}
                                        </span>
                                      )}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="mt-4 pt-3 border-t border-gray-50 flex items-center justify-between">
                          <div className="flex flex-col">
                            <span className="text-xs text-gray-400 font-medium">CAD Price</span>
                            <span className="font-mono font-bold text-lg text-gray-900">
                              ${resolvedItem.price.toFixed(2)}
                            </span>
                            {resolvedItem.isCustomPrice && (
                              <span className="text-[9px] text-[#8B5E34] font-semibold italic">* Est. pricing</span>
                            )}
                          </div>

                          {/* Interactive add state controller with optimized mobile touch targets */}
                          {quantityInCart > 0 ? (
                            <div className="flex items-center bg-[#fdfbf7] border border-[#f5efeb] rounded-lg p-1 gap-3 sm:gap-2">
                              <button
                                onClick={() => handleRemoveFromCart(resolvedItem.id)}
                                className="w-10 h-10 sm:w-7 sm:h-7 rounded-md bg-white border border-[#f5efeb] text-[#8B5E34] flex items-center justify-center hover:bg-gray-100 transition-colors active:scale-90 duration-75"
                                title="Remove one"
                              >
                                <Minus className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                              </button>
                              <span className="font-mono font-bold text-sm sm:text-xs text-[#8B5E34] min-w-5 sm:min-w-4 text-center">
                                {quantityInCart}
                              </span>
                              <button
                                onClick={() => handleAddToCart(resolvedItem)}
                                className="w-10 h-10 sm:w-7 sm:h-7 rounded-md bg-[#8B5E34] text-white flex items-center justify-center hover:bg-[#a67341] transition-colors active:scale-90 duration-75"
                                title="Add another"
                              >
                                <Plus className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleAddToCart(resolvedItem)}
                              className="px-4.5 py-2.5 sm:px-3 sm:py-1.5 text-xs font-semibold sm:font-medium rounded-lg bg-[#8B5E34] hover:bg-[#a67341] text-white transition-colors flex items-center gap-1.5 shadow-sm active:scale-95 duration-100 cursor-pointer"
                            >
                              <Plus className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                              Add to Cart
                            </button>
                          )}
                        </div>
                      </motion.div>
                    );
                  })
                ) : (
                  <div className="col-span-2 bg-white border border-dashed border-gray-300 rounded-2xl py-12 px-4 text-center text-gray-500">
                    <p className="font-medium text-base">No menu items match your selection.</p>
                    <p className="text-xs text-gray-400 mt-1">Try searching for other ingredients or browse alternative categories.</p>
                  </div>
                )}
              </AnimatePresence>
            </div>

            {/* DIETARY & POLICIES FOOTNOTE */}
            <div className="bg-[#fdfbf7] rounded-2xl p-4 border border-gray-200 text-xs text-gray-600 space-y-1">
              <p className="font-semibold text-gray-800 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-[#8B5E34]" />
                Isaiah Sixty Creations Ordering Notice:
              </p>
              <ul className="list-disc list-inside space-y-1 text-gray-500 pl-1">
                <li>We require a minimum 48-hour advanced booking for large tray sizes.</li>
                <li>Estimated items (*) like swallow rolls and plain rice trays are custom adjustable to cater to custom crowd guest count requests.</li>
                <li>Please explicitly state allergies or spices customization requests inside the Special Instructions chef box.</li>
              </ul>
            </div>

          </section>

          {/* RIGHT SECTION (CART SUMMARY & PAYMENT TRACKING) - TAKES UP 5 COLUMNS */}
          <section id="checkout_and_tracking" className="lg:col-span-5 space-y-6">

            {/* SHOPPING CART CONTAINER */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="bg-[#1F2937] px-4 py-3.5 text-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-[#8B5E34]" />
                  <h3 className="font-display font-semibold text-sm">Catering Cart Summary</h3>
                </div>
              </div>

              {cart.length > 0 ? (
                <div className="p-4 space-y-4">
                  {/* SCROLLABLE LINE ITEMS */}
                  <div className="divide-y divide-gray-100 max-h-60 overflow-y-auto pr-1">
                    {cart.map((item) => (
                      <div key={item.menuItem.id} className="py-2.5 flex items-center justify-between gap-3 group">
                        <div className="min-w-0 flex-1">
                          <h5 className="text-xs font-semibold text-gray-800 truncate">{item.menuItem.name}</h5>
                          <p className="text-[10px] text-gray-400 flex items-center gap-1 mt-0.5">
                            <span className="font-medium text-[#8B5E34] bg-[#fdfbf7] px-1 py-0.2 rounded uppercase">
                              {item.menuItem.category}
                            </span>
                            <span>({item.menuItem.unit})</span>
                          </p>
                        </div>

                        {/* COUNTERS AND REMOVE */}
                        <div className="flex items-center gap-2">
                          <div className="flex items-center bg-gray-50 border border-gray-100 rounded-lg p-0.5 gap-1.5 sm:gap-1">
                            <button
                              onClick={() => handleRemoveFromCart(item.menuItem.id)}
                              className="w-8 h-8 sm:w-6 sm:h-6 rounded hover:bg-gray-200 text-gray-600 flex items-center justify-center text-sm sm:text-xs font-bold active:scale-90 transition-transform cursor-pointer"
                            >
                              -
                            </button>
                            <span className="font-mono text-xs sm:text-[11px] font-bold text-gray-700 w-6 sm:w-5 text-center">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => handleAddToCart(item.menuItem)}
                              className="w-8 h-8 sm:w-6 sm:h-6 rounded hover:bg-gray-200 text-gray-600 flex items-center justify-center text-sm sm:text-xs font-bold active:scale-90 transition-transform cursor-pointer"
                            >
                              +
                            </button>
                          </div>
                          
                          <span className="font-mono text-xs font-bold text-gray-900 w-16 text-right shrink-0">
                            ${(item.menuItem.price * item.quantity).toFixed(2)}
                          </span>

                          <button
                            onClick={() => handleDeleteLineItem(item.menuItem.id)}
                            className="text-gray-400 hover:text-red-500 p-1 rounded transition-colors"
                            title="Delete line"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* FULFILLMENT SELECTOR (DELIVERY OR PICKUP) */}
                  <div className="pt-3 border-t border-gray-100">
                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-2 font-sans">
                      Fulfillment Method
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setOrderType('pickup')}
                        className={`py-2 px-3 text-xs font-semibold rounded-lg border transition-all flex items-center justify-center gap-2 ${
                          orderType === 'pickup'
                            ? 'bg-[#8B5E34]/10 border-[#8B5E34] text-[#8B5E34]'
                            : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        <Clock className="w-3.5 h-3.5" />
                        Kitchen Pickup (Free)
                      </button>
                      <button
                        type="button"
                        onClick={() => setOrderType('delivery')}
                        className={`py-2 px-3 text-xs font-semibold rounded-lg border transition-all flex items-center justify-center gap-2 ${
                          orderType === 'delivery'
                            ? 'bg-[#8B5E34]/10 border-[#8B5E34] text-[#8B5E34]'
                            : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        <MapPin className="w-3.5 h-3.5" />
                        Door Delivery ($25)
                      </button>
                    </div>
                  </div>

                  {/* CONDITIONAL DELIVERY ADDRESS */}
                  {orderType === 'delivery' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="space-y-1 pt-1"
                    >
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                        Delivery Target Address
                      </label>
                      <input
                        type="text"
                        placeholder="Suite #, Street name, City, Postal Code"
                        value={deliveryAddress}
                        onChange={(e) => setDeliveryAddress(e.target.value)}
                        className="w-full text-xs bg-gray-50 border border-gray-200 rounded-lg p-2 focus:outline-none focus:border-[#8B5E34]"
                        required={orderType === 'delivery'}
                      />
                    </motion.div>
                  )}
                  
                </div>
              ) : (
                <div className="p-8 text-center text-gray-400 space-y-2">
                  <ShoppingBag className="w-8 h-8 text-gray-300 mx-auto stroke-1" />
                  <p className="text-sm font-medium">Your catering order cart is empty.</p>
                  <p className="text-xs text-gray-400">Click the small "+" icon on any menu dish on the left to begin compiling your feast.</p>
                </div>
              )}
            </div>

            {/* PAYMENT TRACKING SWITCHES - MANDATORY REQUIREMENT */}
            <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm space-y-4">
              <h3 className="font-display font-bold text-sm text-gray-900 flex items-center gap-2 pb-2 border-b border-gray-100">
                <ClipboardCheck className="w-4 h-4 text-[#8B5E34]" />
                Catering Payment Status Tracker
              </h3>

              <div className="space-y-2.5">
                {/* Checkbox 1: Deposit Paid */}
                <div 
                  onClick={() => handleDepositChange(!isDepositPaid)}
                  className={`flex items-start gap-3 p-2.5 rounded-xl border transition-all cursor-pointer ${
                    isDepositPaid 
                      ? 'bg-emerald-50/60 border-emerald-200 text-emerald-950' 
                      : 'bg-gray-50/50 border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <button type="button" className="shrink-0 mt-0.5 text-emerald-600">
                    {isDepositPaid ? (
                      <CheckSquare className="w-4 h-4 fill-emerald-100" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>
                  <div className="text-xs">
                    <p className="font-bold flex items-center gap-1">
                      Deposit Has Been Paid
                    </p>
                    {/* Information caption advising customers of the 80% minimum retainer deposit */}
                    <p className="text-gray-500 text-[10px] mt-0.5 font-light">Toggle this checkmark once the initial 80% retainer has been processed for the kitchen booking.</p>
                  </div>
                </div>

                {/* Checkbox 2: Full Payment Made */}
                <div 
                  onClick={() => handleFullPaymentChange(!isFullPaymentMade)}
                  className={`flex items-start gap-3 p-2.5 rounded-xl border transition-all cursor-pointer ${
                    isFullPaymentMade 
                      ? 'bg-emerald-50/60 border-emerald-200 text-emerald-950' 
                      : 'bg-gray-50/50 border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <button type="button" className="shrink-0 mt-0.5 text-emerald-600">
                    {isFullPaymentMade ? (
                      <CheckSquare className="w-4 h-4 fill-emerald-100" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>
                  <div className="text-xs">
                    <p className="font-bold flex items-center gap-1">
                      Full Payment Has Been Made
                      {isFullPaymentMade && <span className="text-[9px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded-full font-medium">100% Cleared</span>}
                    </p>
                    <p className="text-gray-500 text-[10px] mt-0.5 font-light">Toggle this checkmark once the total catering fees have been settled completely.</p>
                  </div>
                </div>
              </div>

              {/* LIVE BILLING BREAKDOWN */}
              <div className="pt-3 border-t border-gray-100 space-y-1.5 text-xs">
                <div className="flex justify-between text-gray-500">
                  <span>Cart Subtotal:</span>
                  <span className="font-mono font-medium">${billingSummary.subtotal.toFixed(2)}</span>
                </div>
                {orderType === 'delivery' && (
                  <div className="flex justify-between text-gray-500">
                    <span>Door Delivery Fee:</span>
                    <span className="font-mono font-medium">$25.00</span>
                  </div>
                )}
                
                <div className="flex justify-between font-bold text-gray-900 pt-1.5 border-t border-dashed border-gray-100 text-sm">
                  <span>Total Catering Fees:</span>
                  <span className="font-mono text-[#8B5E34]">${billingSummary.total.toFixed(2)}</span>
                </div>

                {/* 80% Deposit calculation shown above outstanding balance due tag */}
                <div className="flex justify-between text-xs bg-[#fdfbf7] border border-[#f5efeb] p-2 rounded-lg text-[#4b2f1d] font-bold mt-2">
                  <span>80% Retainer Deposit Due:</span>
                  <span className="font-mono">${billingSummary.deposit80.toFixed(2)} CAD</span>
                </div>

                {/* Tracking payments calculations */}
                <div className="flex justify-between text-[11px] text-emerald-700 bg-emerald-50/50 p-2 rounded-lg">
                  <span className="font-semibold">Paid Amount:</span>
                  <span className="font-mono font-bold">-${billingSummary.totalPaid.toFixed(2)}</span>
                </div>

                <div className="flex justify-between text-xs bg-[#1F2937] text-white p-2.5 rounded-lg font-bold">
                  <span>Outstanding Balance Due:</span>
                  <span className="font-mono text-amber-300">${billingSummary.remainingBalance.toFixed(2)} CAD</span>
                </div>
              </div>
            </div>

            {/* COLLAPSIBLE PAYMENT GATEWAYS - MANDATORY REQS */}
            <div className="space-y-3">
              
              {/* COLLAPSIBLE 1: UNDER CONSTRUCTION */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <button
                  type="button"
                  disabled={true}
                  className="w-full px-4 py-3 bg-gray-100 flex items-center justify-between text-left cursor-not-allowed opacity-80"
                >
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-gray-400" />
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">"ENTER CARD DETAILS" [UNDER CONSTRUCTION]</span>
                  </div>
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                </button>

                <AnimatePresence initial={false}>
                  {isCardExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="border-t border-gray-100 p-4 space-y-4"
                    >
                      {/* CREDIT CARD INTERACTIVE LIVE PREVIEW */}
                      <div className="relative rounded-xl p-4 text-white overflow-hidden bg-gradient-to-br from-[#8B5E34] to-[#4B2F1D] shadow-md min-h-36 flex flex-col justify-between">
                        <div className="absolute inset-0 opacity-15 bg-[radial-gradient(circle_at_bottom_left,#fff_10px,transparent_10px)] [background-size:20px_20px]"></div>
                        <div className="flex justify-between items-start z-10">
                          <div>
                            <p className="text-[10px] uppercase font-bold tracking-widest text-stone-300">Catering retainer card</p>
                            <p className="text-sm font-semibold mt-0.5">Isaiah Sixty Creations</p>
                          </div>
                          <Sparkles className="w-5 h-5 text-stone-200 animate-pulse" />
                        </div>

                        <div className="my-2 text-center z-10">
                          <p className="font-mono text-base sm:text-lg tracking-[0.25em] font-medium min-h-6 text-white">
                            {cardData.cardNumber || '•••• •••• •••• ••••'}
                          </p>
                        </div>

                        <div className="flex justify-between items-end z-10">
                          <div>
                            <p className="text-[8px] uppercase tracking-wider text-stone-300">Cardholder</p>
                            <p className="font-medium text-xs truncate max-w-[150px] text-white">
                              {cardData.cardholderName.toUpperCase() || 'YOUR FULL NAME'}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-[8px] uppercase tracking-wider text-stone-300">Expires</p>
                            <p className="font-mono font-medium text-xs text-white">
                              {cardData.expiryDate || 'MM/YY'}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* CREDIT CARD FORM FIELD INPUTS */}
                      <div className="space-y-3">
                        <div>
                          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                            Cardholder Name
                          </label>
                          <input
                            type="text"
                            placeholder="Johnathan Doe"
                            value={cardData.cardholderName}
                            onChange={(e) => setCardData(prev => ({ ...prev, cardholderName: e.target.value }))}
                            className="w-full text-xs bg-gray-50 border border-gray-200 rounded-lg p-2 focus:outline-none focus:border-[#8B5E34]"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                            Card Number
                          </label>
                          <input
                            type="text"
                            placeholder="4532 9012 3456 7890"
                            value={cardData.cardNumber}
                            onChange={handleCardNumberChange}
                            className="w-full text-xs font-mono bg-gray-50 border border-gray-200 rounded-lg p-2 focus:outline-none focus:border-[#8B5E34]"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                              Expiry Date
                            </label>
                            <input
                              type="text"
                              placeholder="MM/YY"
                              value={cardData.expiryDate}
                              onChange={handleExpiryChange}
                              className="w-full text-xs font-mono bg-gray-50 border border-gray-200 rounded-lg p-2 focus:outline-none focus:border-[#8B5E34] text-center"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                              Security Code (CVV)
                            </label>
                            <input
                              type="password"
                              placeholder="•••"
                              value={cardData.cvv}
                              onChange={handleCvvChange}
                              className="w-full text-xs font-mono bg-gray-50 border border-gray-200 rounded-lg p-2 focus:outline-none focus:border-[#8B5E34] text-center"
                            />
                          </div>
                        </div>

                        <p className="text-[10px] text-gray-400 leading-relaxed text-center italic mt-1">
                          🔒 Secure Mock Portal: Your card details are stored locally in active state variables and are never transmitted to unauthorized databases.
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* COLLAPSIBLE 2: Enter Email for Interac - PROVIDES EMAIL ADDRESS AS REQUESTED */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <button
                  type="button"
                  onClick={() => {
                    setIsInteracExpanded(!isInteracExpanded);
                    if (!isInteracExpanded) setIsCardExpanded(false); // Close other Accordion
                  }}
                  className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors flex items-center justify-between text-left"
                >
                  <div className="flex items-center gap-2">
                    <Send className="w-4 h-4 text-[#8B5E34]" />
                    <span className="text-xs font-bold text-gray-800 uppercase tracking-wider">Enter Email for Interac</span>
                  </div>
                  {isInteracExpanded ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
                </button>

                <AnimatePresence initial={false}>
                  {isInteracExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="border-t border-gray-100 p-4 space-y-3.5"
                    >
                      <div className="p-3 bg-[#fdfbf7] border border-[#f5efeb] rounded-xl space-y-2">
                        <p className="text-xs text-gray-700 font-medium leading-relaxed">
                          {/* Instructive paragraph detailing that an 80% retainer deposit is accepted via Interac e-Transfer */}
                          We accept fast Interac e-Transfers for both the 80% retainer deposit and full settlement. Please send transfers to the following registered address:
                        </p>

                        {/* HIGHLY INTERACTIVE EMAIL COPY BLOCK */}
                        <div className="flex items-center justify-between bg-white border border-[#f5efeb] p-2 rounded-lg">
                          <span className="font-mono text-xs font-bold text-gray-800 select-all px-1">
                            {/* Updated business email address for Interac e-Transfers */}
                            isaiahsixtycreations@gmail.com
                          </span>
                          <button
                            type="button"
                            onClick={handleCopyEmail}
                            className="bg-[#8B5E34] hover:bg-[#a67341] text-white p-1.5 rounded transition-all flex items-center gap-1 active:scale-95 shrink-0"
                            title="Copy email to clipboard"
                          >
                            {copiedEmail ? (
                              <>
                                <Check className="w-3.5 h-3.5" />
                                <span className="text-[10px] font-semibold px-1">Copied</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                <span className="text-[10px] font-semibold px-1 font-sans">Copy</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>

                      <div className="text-[11px] text-gray-500 space-y-1.5 pl-1 font-light">
                        <p className="font-bold text-gray-700 font-sans">How to pay via e-Transfer:</p>
                        <ol className="list-decimal list-inside space-y-1">
                          <li>Log into your online banking app or portal.</li>
                          <li>Navigate to "Send Money via Interac e-Transfer".</li>
                          <li>Add recipient <strong className="text-gray-700 font-mono font-bold">Isaiah Sixty Creations</strong> with email above.</li>
                          <li>Input either the 80% retainer or the full total.</li>
                          <li>After transferring, toggle the payment checkmarks above to automatically generate your verified invoice receipt.</li>
                        </ol>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

            </div>

            {/* CUSTOMER INFO & CONTACT FORM */}
            <form onSubmit={handleSubmitOrder} className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm space-y-4">
              <h3 className="font-display font-bold text-sm text-gray-900 pb-2 border-b border-gray-100">
                Fulfillment & Customer Details
              </h3>

              <div className="space-y-3">
                {/* Name */}
                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                    Contact Full Name *
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

                {/* Grid Phone / Email */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                      Phone Number *
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-2.5 top-2.5 w-4 h-4 text-gray-400" />
                      <input
                        type="tel"
                        placeholder="(587) 555-0199"
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

                {/* Grid Date / Time */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                      Fulfillment Date *
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-2.5 top-2.5 w-4 h-4 text-gray-400" />
                      <input
                        type="date"
                        value={eventDate}
                        onChange={(e) => setEventDate(e.target.value)}
                        className="w-full text-xs bg-gray-50 border border-gray-200 rounded-lg py-2 pl-9 pr-3 focus:outline-none focus:border-[#8B5E34]"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                      Fulfillment Time *
                    </label>
                    <div className="relative">
                      <Clock className="absolute left-2.5 top-2.5 w-4 h-4 text-gray-400" />
                      <input
                        type="time"
                        value={eventTime}
                        onChange={(e) => setEventTime(e.target.value)}
                        className="w-full text-xs bg-gray-50 border border-gray-200 rounded-lg py-2 pl-9 pr-3 focus:outline-none focus:border-[#8B5E34]"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Special Instructions */}
                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1 font-semibold text-gray-600">
                    Dietary Customizations / Special Instructions
                  </label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Please make the native soup medium spicy. No shellfish in egusi. Delivery instructions..."
                    value={specialInstructions}
                    onChange={(e) => setSpecialInstructions(e.target.value)}
                    className="w-full text-xs bg-gray-50 border border-gray-200 rounded-lg p-2 focus:outline-none focus:border-[#8B5E34] resize-none"
                  ></textarea>
                </div>
              </div>

              {/* DYNAMIC ERROR ALERTS */}
              {validationError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>{validationError}</span>
                </div>
              )}

              {/* ACTION COMPILATION BUTTON */}
              <button
                type="submit"
                className="w-full py-3.5 bg-[#1F2937] hover:bg-[#8B5E34] hover:text-white text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 duration-150"
              >
                <span>Finalize Catering Order & Book Event</span>
                <ArrowRight className="w-4 h-4 animate-bounce-horizontal" />
              </button>
            </form>

          </section>

        </div>
      </main>

      {/* --- RECEIPT INVOICE MODAL (SLIDES OVER THE MAIN PAGE UPON SUCCESSFUL SUBMIT) --- */}
      <AnimatePresence>
        {submittedOrder && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white max-w-lg w-full rounded-2xl border border-gray-200 shadow-2xl overflow-hidden text-sm"
            >
              {/* MODAL HEADER WITH PRINTING CONTROLS */}
              <div className="bg-[#1F2937] text-white px-5 py-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-emerald-400" />
                  <div>
                    <h4 className="font-display font-semibold text-base">Booking Placed Successfully</h4>
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

              {/* MODAL INVOICE CARD CONTAINER */}
              <div id="printable_area" className="p-6 space-y-4">
                
                {/* BUSINESS WATERMARK LOGO */}
                <div className="text-center pb-3 border-b border-gray-100 flex flex-col items-center gap-1">
                  <img 
                    src={logoUrl} 
                    alt="Isaiah Sixty Creations Logo" 
                    className="w-12 h-12 object-cover rounded-full border border-[#8B5E34] shadow-sm"
                    referrerPolicy="no-referrer"
                  />
                  <h3 className="font-display font-bold text-base text-gray-900">Isaiah Sixty Creations</h3>
                  <p className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold">Official Catering Invoice Receipt</p>
                </div>

                {/* ARRANGEMENTS SUMMARY */}
                <div className="grid grid-cols-2 gap-3 text-xs bg-gray-50 p-3 rounded-xl border border-gray-100">
                  <div className="space-y-1">
                    <p className="text-gray-400 uppercase font-bold text-[9px] tracking-wider font-sans">Client Info</p>
                    <p className="font-bold text-gray-800">{submittedOrder.customerName}</p>
                    <p className="text-gray-500 font-mono">{submittedOrder.customerPhone}</p>
                    <p className="text-gray-500 truncate">{submittedOrder.customerEmail}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-gray-400 uppercase font-bold text-[9px] tracking-wider font-sans">Arrangements</p>
                    <p className="font-bold text-gray-800 capitalize">{submittedOrder.orderType}</p>
                    <p className="text-gray-500 font-medium font-sans">Date: {submittedOrder.eventDate}</p>
                    <p className="text-gray-500 font-medium font-sans">Time: {submittedOrder.eventTime}</p>
                  </div>
                  {submittedOrder.deliveryAddress && (
                    <div className="col-span-2 pt-1 border-t border-gray-100/60">
                      <p className="text-gray-400 uppercase font-bold text-[9px] tracking-wider font-sans">Fulfillment Address</p>
                      <p className="text-gray-700 font-medium">{submittedOrder.deliveryAddress}</p>
                    </div>
                  )}
                </div>

                {/* ITEMIZED PRODUCTS SCROLL */}
                <div>
                  <p className="text-gray-400 uppercase font-bold text-[9px] tracking-wider block mb-1.5 font-sans">
                    Itemized Order Details
                  </p>
                  <div className="border border-gray-100 rounded-xl overflow-hidden divide-y divide-gray-50">
                    {cart.map(item => (
                      <div key={item.menuItem.id} className="p-2.5 flex items-center justify-between text-xs bg-white">
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-gray-800 truncate">{item.menuItem.name}</p>
                          <p className="text-[10px] text-gray-400">Unit portion: {item.menuItem.unit}</p>
                        </div>
                        <div className="flex items-center gap-4 text-right shrink-0">
                          <span className="font-mono text-gray-500">Qty: {item.quantity}</span>
                          <span className="font-mono font-bold text-gray-900 w-16">${(item.menuItem.price * item.quantity).toFixed(2)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* SPECIAL INSTRUCTIONS */}
                {submittedOrder.specialInstructions && (
                  <div className="text-xs">
                    <span className="text-gray-400 uppercase font-bold text-[9px] tracking-wider block mb-1 font-sans">
                      Chef Specifications & Notes
                    </span>
                    <p className="p-2.5 bg-[#fdfbf7] text-[#4b2f1d] border border-[#f5efeb] rounded-lg italic font-light">
                      "{submittedOrder.specialInstructions}"
                    </p>
                  </div>
                )}

                {/* FINANCIAL STATUS TRACKING */}
                <div className="pt-3 border-t border-gray-100 space-y-1.5 text-xs">
                  <div className="flex justify-between font-bold text-gray-900">
                    <span>Total Billable Amount:</span>
                    <span className="font-mono">${billingSummary.total.toFixed(2)} CAD</span>
                  </div>
                  <div className="flex justify-between text-emerald-700 font-semibold bg-emerald-50 px-2.5 py-1 rounded-md">
                    <span>Amount Paid to Date:</span>
                    <span className="font-mono">-${billingSummary.totalPaid.toFixed(2)} CAD</span>
                  </div>
                  <div className="flex justify-between text-[#4b2f1d] font-bold bg-[#fdfbf7] border border-[#f5efeb] px-2.5 py-1.5 rounded-md text-sm">
                    <span>Balance Remaining Due:</span>
                    <span className="font-mono">${billingSummary.remainingBalance.toFixed(2)} CAD</span>
                  </div>
                </div>

                {/* INTERAC NOTICE IN MODAL */}
                {billingSummary.remainingBalance > 0 && (
                  <div className="p-3 bg-blue-50/50 border border-blue-100 rounded-xl text-[11px] text-blue-900 leading-relaxed space-y-1">
                    <p className="font-bold flex items-center gap-1">
                      <Send className="w-3 h-3 text-blue-600" />
                      Awaiting Interac Retainer Transfer?
                    </p>
                    <p className="text-blue-700/90 font-light">
                      {/* Explaining the correct Interac transfer email target */}
                      If paying via e-Transfer, please transfer your due balance to: <strong className="font-mono text-blue-950 font-bold">isaiahsixtycreations@gmail.com</strong>.
                    </p>
                  </div>
                )}

              </div>

              {/* SYSTEM SHARING & UTILITY BUTTONS */}
              <div className="bg-gray-50 border-t border-gray-100 p-4 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={handleCopyReceipt}
                  className="py-2.5 px-3 text-xs font-semibold rounded-lg border border-gray-200 text-gray-700 bg-white hover:bg-gray-50 flex items-center justify-center gap-1.5"
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
                  onClick={() => {
                    // Quick browser print integration
                    window.print();
                  }}
                  className="py-2.5 px-3 text-xs font-semibold rounded-lg bg-[#8B5E34] hover:bg-[#a67341] text-white flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Receipt</span>
                </button>

                <button
                  type="button"
                  onClick={resetFormAndCart}
                  className="col-span-2 py-2.5 text-xs font-bold rounded-lg border border-dashed border-[#8B5E34] hover:border-[#a67341] hover:bg-[#fdfbf7] text-[#8B5E34] transition-colors"
                >
                  Book Another New Catering Session
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>




      {/* SYSTEM CONSOLE FOOTER */}
      <footer className="bg-[#1F2937] text-gray-400 text-xs py-8 border-t border-gray-800 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-3">
          <p className="font-semibold text-gray-200">© 2026 Isaiah Sixty Creations Catering. All Rights Reserved.</p>
          <p className="max-w-md mx-auto text-[11px] text-gray-400 leading-relaxed font-light">
            Crafting premium West African, traditional soups, and Continental meals for weddings, birthdays, corporate functions, and intimate banquet feasts.
          </p>
          <div>
            <a
              href="/admin"
              onClick={(e) => {
                e.preventDefault();
                window.location.hash = '#admin';
                window.history.pushState({}, '', '/admin');
                window.dispatchEvent(new PopStateEvent('popstate'));
              }}
              className="text-[11px] font-semibold text-gray-400 hover:text-white underline transition-colors"
            >
              🔒 Admin Google Workspace Portal
            </a>
          </div>
        </div>
      </footer>

    </div>
  );
}
