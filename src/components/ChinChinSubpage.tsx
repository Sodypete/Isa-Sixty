import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  ShoppingBag, 
  Plus, 
  Minus, 
  Check, 
  Maximize2, 
  X,
  Share2,
  DollarSign,
  Truck,
  ChevronLeft,
  ChevronRight,
  Info
} from 'lucide-react';
import { MenuItem, CartItem } from '../types';
import { CHIN_CHIN_SIZES_DATA, ChinChinSizeSpecification, ChinChinPictureItem } from '../data';

interface ChinChinSubpageProps {
  cart: CartItem[];
  onAddToCart: (item: MenuItem) => void;
  onRemoveFromCart: (itemId: string) => void;
  onBack: () => void;
  onCheckout: () => void;
}

export const ChinChinSubpage: React.FC<ChinChinSubpageProps> = ({
  cart,
  onAddToCart,
  onRemoveFromCart,
  onBack,
  onCheckout
}) => {
  // Currency state: USD or CAD (Defaulting to USD)
  const [currency, setCurrency] = useState<'USD' | 'CAD'>('USD');

  // Currently selected bag size at top: '300g' | '700g' | '1500g'
  const [selectedSizeId, setSelectedSizeId] = useState<'300g' | '700g' | '1500g'>('300g');

  // Active slide index in carousel (0 = beside Pringles can, 1 = all sizes together)
  const [activeSlideIndex, setActiveSlideIndex] = useState<number>(0);

  // Lightbox enlarged image view
  const [lightboxImage, setLightboxImage] = useState<ChinChinPictureItem | null>(null);

  // Toast feedback states
  const [addedToast, setAddedToast] = useState<{ sizeId: string; title: string } | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Pricing based on user specifications: 300g = $17.50, 700g = $27.50, 1500g = $48.50
  const getPrice = (sizeId: '300g' | '700g' | '1500g') => {
    if (sizeId === '300g') return 17.50;
    if (sizeId === '700g') return 27.50;
    return 48.50;
  };

  // Find active size specification
  const currentSizeSpec = CHIN_CHIN_SIZES_DATA.find(s => s.id === selectedSizeId) || CHIN_CHIN_SIZES_DATA[0];

  // The 2 pictures for the currently selected size:
  // [0] = bag beside a pringles can
  // [1] = all sizes together in one picture
  const carouselPictures = currentSizeSpec.defaultPictures;

  // Reset slide index to 0 whenever size changes
  const handleSelectSize = (sizeId: '300g' | '700g' | '1500g') => {
    setSelectedSizeId(sizeId);
    setActiveSlideIndex(0);
  };

  // Carousel previous / next controls
  const handlePrevSlide = () => {
    setActiveSlideIndex(prev => (prev === 0 ? carouselPictures.length - 1 : prev - 1));
  };

  const handleNextSlide = () => {
    setActiveSlideIndex(prev => (prev === carouselPictures.length - 1 ? 0 : prev + 1));
  };

  // Compute shareable URL
  const getShareableUrl = () => {
    if (typeof window !== 'undefined') {
      const origin = window.location.origin;
      if (origin && !origin.includes('localhost')) {
        return `${origin}/#chinchin`;
      }
    }
    return 'https://ais-pre-kfdtnqzjw2yo2firfhgc64-553658120484.us-east1.run.app/#chinchin';
  };

  // Copy shareable link
  const handleCopyLink = async () => {
    const url = getShareableUrl();
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(url);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = url;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 3000);
    } catch (e) {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 3000);
    }
  };

  // Native share option for mobile
  const handleNativeShare = async () => {
    const url = getShareableUrl();
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Isaiah Sixty Chin Chin',
          text: 'Order Chin Chin in 300g ($17.50), 700g ($27.50), and 1500g ($48.50):',
          url: url
        });
        return;
      } catch (e) {
        // user cancelled or share failed, fallback to copy
      }
    }
    handleCopyLink();
  };

  // Create MenuItem for cart integration
  const createMenuItemForSize = (size: ChinChinSizeSpecification): MenuItem => {
    const price = getPrice(size.id);
    return {
      id: `chops-chin-chin-${size.id}`,
      name: `Chin Chin (${size.weight})`,
      category: 'Small chops',
      unit: size.packaging,
      price: price,
      description: `${size.header} — ${size.servings}. ${currency}.`,
      imageUrl: size.defaultPictures[0]?.url
    };
  };

  // Get quantity of a size in cart
  const getQuantityInCart = (sizeId: string): number => {
    const targetId = `chops-chin-chin-${sizeId}`;
    return cart.find(item => item.menuItem.id === targetId)?.quantity || 0;
  };

  // Handle add to cart
  const handleAdd = (size: ChinChinSizeSpecification) => {
    const menuItem = createMenuItemForSize(size);
    onAddToCart(menuItem);
    setAddedToast({ sizeId: size.id, title: size.header });
    setTimeout(() => {
      setAddedToast(null);
    }, 2000);
  };

  // Handle remove from cart
  const handleRemove = (sizeId: string) => {
    onRemoveFromCart(`chops-chin-chin-${sizeId}`);
  };

  // Total Chin Chin items in cart
  const totalChinChinCount = cart
    .filter(item => item.menuItem.id.startsWith('chops-chin-chin'))
    .reduce((sum, item) => sum + item.quantity, 0);

  const totalChinChinCost = cart
    .filter(item => item.menuItem.id.startsWith('chops-chin-chin'))
    .reduce((sum, item) => sum + (item.menuItem.price * item.quantity), 0);

  // Active slide
  const activePicture = carouselPictures[activeSlideIndex] || carouselPictures[0];

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-gray-800 font-sans pb-28">
      {/* TOAST: ADDED TO CART */}
      {addedToast && (
        <div className="fixed top-5 right-5 z-50 bg-[#8B5E34] text-white px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2 text-xs animate-bounce">
          <Check className="w-4 h-4 text-white" />
          <span>Added <strong>{addedToast.title}</strong> to cart</span>
        </div>
      )}

      {/* TOAST: LINK COPIED */}
      {copiedLink && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 text-xs">
          <Check className="w-3.5 h-3.5 text-emerald-400" />
          <span>Link copied to clipboard!</span>
        </div>
      )}

      {/* TOP BAR WITH BACK, USD BUTTON, SHARE, AND CART */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-xs">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
          
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Main Menu</span>
          </button>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* THE USD BUTTON DISPLAYED AT THE TOP */}
            <div className="flex items-center bg-gray-100 p-0.5 rounded-lg border border-gray-200">
              <button
                type="button"
                onClick={() => setCurrency('USD')}
                className={`px-3 py-1 rounded-md text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                  currency === 'USD'
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                title="View prices in USD ($17.50, $27.50, $48.50)"
              >
                <DollarSign className="w-3.5 h-3.5" />
                <span>USD</span>
              </button>

              <button
                type="button"
                onClick={() => setCurrency('CAD')}
                className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                  currency === 'CAD'
                    ? 'bg-[#8B5E34] text-white shadow-xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                title="View prices in CAD"
              >
                CAD
              </button>
            </div>

            {/* SHARE BUTTON */}
            <button
              type="button"
              onClick={handleNativeShare}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-[#8B5E34] bg-[#FAF5EE] hover:bg-[#F3E7D5] border border-[#DFCBB2] transition-colors cursor-pointer"
              title="Share this page"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Share</span>
            </button>

            {/* CART BUTTON */}
            <button 
              onClick={onCheckout}
              className="flex items-center gap-1.5 bg-[#8B5E34] hover:bg-[#724a25] text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Cart ({totalChinChinCount})</span>
            </button>
          </div>
        </div>
      </header>

      {/* REQUIRED NATIONWIDE SHIPPING NOTICE */}
      <div className="bg-amber-50 border-b border-amber-200 py-3 px-4">
        <div className="max-w-4xl mx-auto flex items-center justify-center gap-2.5 text-center text-xs sm:text-sm font-semibold text-amber-900">
          <Truck className="w-4 h-4 text-amber-800 shrink-0" />
          <span>We ship nationwide, however only sizes above 700g are eligible.</span>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-6 space-y-6">
        
        {/* PAGE TITLE */}
        <div className="text-center space-y-1">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
            Chin Chin Bag Sizes
          </h1>
          <p className="text-xs sm:text-sm text-gray-600">
            Click any size below to view comparison photos and pricing.
          </p>
        </div>

        {/* 1. THE THREE BAG SIZES AT THE TOP */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
          {CHIN_CHIN_SIZES_DATA.map((size) => {
            const isSelected = selectedSizeId === size.id;
            const price = getPrice(size.id);
            const inCartQty = getQuantityInCart(size.id);
            const isEligibleForShipping = size.id === '700g' || size.id === '1500g';

            return (
              <button
                key={size.id}
                type="button"
                onClick={() => handleSelectSize(size.id)}
                className={`px-3 py-2.5 sm:p-3 rounded-xl text-left transition-all relative flex items-center justify-between sm:flex-col sm:items-stretch sm:justify-between gap-2 cursor-pointer border-2 ${
                  isSelected
                    ? 'bg-white border-[#8B5E34] shadow-sm ring-2 ring-[#8B5E34]/20'
                    : 'bg-white/80 border-gray-200 hover:border-gray-300 hover:bg-white shadow-xs'
                }`}
              >
                <div className="min-w-0 flex-1 space-y-0.5">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className={`px-1.5 py-0.5 rounded text-[11px] font-bold shrink-0 ${
                      isSelected ? 'bg-[#8B5E34] text-white' : 'bg-gray-100 text-gray-700'
                    }`}>
                      {size.weight}
                    </span>
                    <h3 className="font-bold text-sm text-gray-900 truncate">
                      {size.header.replace(size.weight, '').trim()}
                    </h3>
                    {inCartQty > 0 && (
                      <span className="text-[10px] font-bold text-[#8B5E34] bg-[#FAF5EE] px-1.5 py-0.5 rounded shrink-0">
                        {inCartQty} in cart
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 text-[11px] text-gray-500 truncate">
                    <span>{size.servings}</span>
                    <span>•</span>
                    {isEligibleForShipping ? (
                      <span className="text-emerald-700 font-medium inline-flex items-center gap-1">
                        <Truck className="w-3 h-3 shrink-0" />
                        <span>Ships nationwide</span>
                      </span>
                    ) : (
                      <span className="text-amber-700 font-medium inline-flex items-center gap-1">
                        <Info className="w-3 h-3 shrink-0" />
                        <span>Local only</span>
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 sm:justify-between sm:pt-1.5 sm:border-t sm:border-gray-100 shrink-0">
                  <span className="text-base sm:text-lg font-bold font-mono text-gray-900">
                    ${price.toFixed(2)} <span className="text-[11px] font-semibold text-emerald-700">{currency}</span>
                  </span>
                  {isSelected && (
                    <span className="w-4 h-4 rounded-full bg-[#8B5E34] text-white flex items-center justify-center shrink-0">
                      <Check className="w-2.5 h-2.5" />
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* 2. ONE PICTURE CAROUSEL THAT CHANGES WITH EACH SIZE CLICKED */}
        <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden p-4 sm:p-6 space-y-4">
          
          {/* CAROUSEL HEADER: ACTIVE SIZE TITLE */}
          <div className="pb-3 border-b border-gray-100">
            <h2 className="text-lg font-bold text-gray-900">
              {activePicture.title}
            </h2>
          </div>

          {/* MAIN CAROUSEL IMAGE VIEWPORT */}
          <div className="relative aspect-4/3 sm:aspect-16/10 w-full rounded-2xl overflow-hidden bg-gray-100 border border-gray-100 group">
            <img
              src={activePicture.url}
              alt={activePicture.title}
              className="w-full h-full object-cover transition-opacity duration-300"
              referrerPolicy="no-referrer"
            />

            {/* Left arrow button */}
            <button
              type="button"
              onClick={handlePrevSlide}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center transition-all cursor-pointer shadow-md"
              title="Previous picture"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            {/* Right arrow button */}
            <button
              type="button"
              onClick={handleNextSlide}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center transition-all cursor-pointer shadow-md"
              title="Next picture"
            >
              <ChevronRight className="w-6 h-6" />
            </button>

            {/* Fullscreen zoom button */}
            <button
              type="button"
              onClick={() => setLightboxImage(activePicture)}
              className="absolute bottom-3 right-3 p-2 rounded-lg bg-black/70 hover:bg-black/90 text-white cursor-pointer transition-colors"
              title="Enlarge photo"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>

          {/* PICTURE CAPTION & DOTS */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-1 text-xs text-gray-600">
            <p className="leading-relaxed">
              <strong>Note:</strong> {activePicture.caption}
            </p>

            <div className="flex items-center gap-1.5 self-center sm:self-auto">
              {carouselPictures.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveSlideIndex(idx)}
                  className={`h-2 rounded-full transition-all cursor-pointer ${
                    activeSlideIndex === idx ? 'w-6 bg-[#8B5E34]' : 'w-2 bg-gray-300 hover:bg-gray-400'
                  }`}
                  aria-label={`Go to slide ${idx + 1}`}
                />
              ))}
            </div>
          </div>

          {/* ACTIVE SIZE PURCHASE BAR */}
          <div className="pt-4 border-t border-gray-100 flex items-center justify-center sm:justify-end bg-gray-50/80 -mx-4 -mb-4 sm:-mx-6 sm:-mb-6 p-4 sm:p-5 rounded-b-3xl">
            {/* Quantity & Add to Cart button */}
            <div className="flex items-center gap-3">
              {getQuantityInCart(currentSizeSpec.id) > 0 ? (
                <div className="flex items-center bg-white border border-gray-200 rounded-xl p-1 gap-2.5">
                  <button
                    onClick={() => handleRemove(currentSizeSpec.id)}
                    className="w-9 h-9 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 flex items-center justify-center font-bold cursor-pointer"
                    title="Remove one"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="font-mono font-bold text-sm text-gray-900 px-1">
                    {getQuantityInCart(currentSizeSpec.id)} in cart
                  </span>
                  <button
                    onClick={() => handleAdd(currentSizeSpec)}
                    className="w-9 h-9 rounded-lg bg-[#8B5E34] hover:bg-[#724a25] text-white flex items-center justify-center font-bold cursor-pointer"
                    title="Add another"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => handleAdd(currentSizeSpec)}
                  className="px-5 py-2.5 rounded-xl bg-[#8B5E34] hover:bg-[#724a25] text-white font-bold text-xs transition-colors flex items-center gap-2 shadow-xs cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add {currentSizeSpec.weight} to Cart</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* LIGHTBOX MODAL */}
      {lightboxImage && (
        <div 
          onClick={() => setLightboxImage(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 cursor-zoom-out"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-3xl max-h-[85vh] bg-black rounded-xl overflow-hidden shadow-2xl flex flex-col"
          >
            <button
              onClick={() => setLightboxImage(null)}
              className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center"
            >
              <X className="w-4 h-4" />
            </button>
            <img
              src={lightboxImage.url}
              alt={lightboxImage.title}
              className="max-h-[75vh] w-auto object-contain"
            />
            <div className="p-3 bg-neutral-900 text-white text-xs">
              <p className="font-bold">{lightboxImage.title}</p>
              <p className="text-gray-400">{lightboxImage.caption}</p>
            </div>
          </div>
        </div>
      )}

      {/* STICKY BOTTOM CHECKOUT ACTION BAR */}
      <div className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-gray-200 py-3 px-4 shadow-md">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
          <button
            onClick={onBack}
            className="px-3.5 py-2 rounded-lg text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 flex items-center gap-1.5 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Main Menu</span>
          </button>

          <button
            onClick={onCheckout}
            className="px-5 py-2 rounded-lg bg-[#8B5E34] hover:bg-[#724a25] text-white font-bold text-xs shadow-sm flex items-center gap-2 cursor-pointer"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Go to Checkout ({totalChinChinCount} items • ${totalChinChinCost.toFixed(2)})</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChinChinSubpage;
