import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowLeft, 
  ShoppingBag, 
  Plus, 
  Minus, 
  Upload, 
  Image as ImageIcon, 
  Sparkles, 
  Package, 
  Users, 
  Check, 
  Trash2, 
  Maximize2, 
  X,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Heart
} from 'lucide-react';
import { MenuItem, CartItem } from '../types';
import { CHIN_CHIN_SIZES_DATA, ChinChinSizeSpecification, ChinChinPictureItem } from '../data';

interface ChinChinSubpageProps {
  cart: CartItem[];
  onAddToCart: (item: MenuItem) => void;
  onRemoveFromCart: (itemId: string) => void;
  onBack: () => void;
}

const LOCAL_STORAGE_KEY = 'isaiah60_chinchin_user_pictures_v2';

export const ChinChinSubpage: React.FC<ChinChinSubpageProps> = ({
  cart,
  onAddToCart,
  onRemoveFromCart,
  onBack
}) => {
  // Store custom pictures added by user per size ('300g' | '700g' | '1500g')
  const [customPictures, setCustomPictures] = useState<Record<string, ChinChinPictureItem[]>>({
    '300g': [],
    '700g': [],
    '1500g': []
  });

  // Active size being scrolled or highlighted
  const [activeSizeId, setActiveSizeId] = useState<'300g' | '700g' | '1500g'>('300g');

  // Modal state for adding a new picture
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [targetSizeForNewPic, setTargetSizeForNewPic] = useState<'300g' | '700g' | '1500g'>('300g');
  const [newPicUrl, setNewPicUrl] = useState('');
  const [newPicTitle, setNewPicTitle] = useState('');
  const [newPicCaption, setNewPicCaption] = useState('');
  const [fileError, setFileError] = useState('');
  
  // File upload input ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Lightbox enlarged image view
  const [lightboxImage, setLightboxImage] = useState<ChinChinPictureItem | null>(null);

  // Added notification feedback state
  const [addedToast, setAddedToast] = useState<{ sizeId: string; title: string } | null>(null);

  // Load persisted user-added pictures from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setCustomPictures(prev => ({
          '300g': Array.isArray(parsed['300g']) ? parsed['300g'] : [],
          '700g': Array.isArray(parsed['700g']) ? parsed['700g'] : [],
          '1500g': Array.isArray(parsed['1500g']) ? parsed['1500g'] : []
        }));
      }
    } catch (e) {
      console.warn('Failed to parse saved chin chin pictures from localStorage', e);
    }
  }, []);

  // Save to localStorage when customPictures updates
  const saveCustomPictures = (updated: Record<string, ChinChinPictureItem[]>) => {
    setCustomPictures(updated);
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn('Failed to save chin chin pictures to localStorage', e);
    }
  };

  // Convert size spec into MenuItem object to integrate directly with cart
  const createMenuItemForSize = (size: ChinChinSizeSpecification): MenuItem => {
    return {
      id: `chops-chin-chin-${size.id}`,
      name: `Chin Chin (${size.weight})`,
      category: 'Small chops',
      unit: size.packaging,
      price: size.price,
      description: `${size.header} — ${size.servings}. ${size.packaging}.`,
      imageUrl: size.defaultPictures[0]?.url
    };
  };

  // Get total quantity of a specific size currently in cart
  const getQuantityInCart = (sizeId: string): number => {
    const targetId = `chops-chin-chin-${sizeId}`;
    return cart.find(item => item.menuItem.id === targetId)?.quantity || 0;
  };

  // Handle adding item
  const handleAdd = (size: ChinChinSizeSpecification) => {
    const menuItem = createMenuItemForSize(size);
    onAddToCart(menuItem);
    setAddedToast({ sizeId: size.id, title: size.header });
    setTimeout(() => {
      setAddedToast(null);
    }, 2500);
  };

  // Handle removing item
  const handleRemove = (sizeId: string) => {
    onRemoveFromCart(`chops-chin-chin-${sizeId}`);
  };

  // Scroll smoothly to a size section
  const scrollToSize = (sizeId: '300g' | '700g' | '1500g') => {
    setActiveSizeId(sizeId);
    const element = document.getElementById(`section-chin-chin-${sizeId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Open Add Picture Modal
  const openAddPictureModal = (sizeId: '300g' | '700g' | '1500g') => {
    setTargetSizeForNewPic(sizeId);
    setNewPicUrl('');
    setNewPicTitle('');
    setNewPicCaption('');
    setFileError('');
    setIsAddModalOpen(true);
  };

  // Handle multiple file upload from local device
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setFileError('');
    const newItems: ChinChinPictureItem[] = [];
    let completed = 0;

    Array.from(files).forEach((file: File, index: number) => {
      // Check file size (max 8MB per picture)
      if (file.size > 8 * 1024 * 1024) {
        setFileError(`File ${file.name} is larger than 8MB limit.`);
        return;
      }

      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        const resultUrl = uploadEvent.target?.result as string;
        if (resultUrl) {
          newItems.push({
            id: `user-pic-${Date.now()}-${index}`,
            url: resultUrl,
            title: file.name.replace(/\.[^/.]+$/, ''),
            caption: `Photo of ${targetSizeForNewPic} Chin Chin added on ${new Date().toLocaleDateString()}`,
            isUserAdded: true,
            dateAdded: new Date().toISOString()
          });
        }
        completed++;
        if (completed === files.length && newItems.length > 0) {
          const updated = {
            ...customPictures,
            [targetSizeForNewPic]: [...customPictures[targetSizeForNewPic], ...newItems]
          };
          saveCustomPictures(updated);
          setIsAddModalOpen(false);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  // Handle adding image via URL
  const handleAddUrlPicture = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPicUrl.trim()) {
      setFileError('Please enter a valid image URL');
      return;
    }

    const newPicture: ChinChinPictureItem = {
      id: `user-url-pic-${Date.now()}`,
      url: newPicUrl.trim(),
      title: newPicTitle.trim() || `${targetSizeForNewPic} Chin Chin Photo`,
      caption: newPicCaption.trim() || `Photo of ${targetSizeForNewPic} size package`,
      isUserAdded: true,
      dateAdded: new Date().toISOString()
    };

    const updated = {
      ...customPictures,
      [targetSizeForNewPic]: [...customPictures[targetSizeForNewPic], newPicture]
    };
    saveCustomPictures(updated);
    setIsAddModalOpen(false);
  };

  // Remove a custom picture
  const handleDeletePicture = (sizeId: string, pictureId: string) => {
    const updated = {
      ...customPictures,
      [sizeId]: customPictures[sizeId].filter(pic => pic.id !== pictureId)
    };
    saveCustomPictures(updated);
    if (lightboxImage?.id === pictureId) {
      setLightboxImage(null);
    }
  };

  // Total Chin Chin items in cart
  const totalChinChinCount = cart
    .filter(item => item.menuItem.id.startsWith('chops-chin-chin'))
    .reduce((sum, item) => sum + item.quantity, 0);

  const totalChinChinCost = cart
    .filter(item => item.menuItem.id.startsWith('chops-chin-chin'))
    .reduce((sum, item) => sum + (item.menuItem.price * item.quantity), 0);

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#1F2937] font-sans pb-28">
      {/* TOAST NOTIFICATION */}
      {addedToast && (
        <div className="fixed top-5 right-5 z-50 bg-[#8B5E34] text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-3 animate-bounce">
          <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center">
            <Check className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-xs font-semibold">Added to Catering Cart</p>
            <p className="text-[11px] text-white/90">{addedToast.title}</p>
          </div>
        </div>
      )}

      {/* TOP NAVIGATION BAR */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-200/80 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Catering Menu</span>
            </button>
            <div className="hidden sm:flex items-center text-xs text-gray-400 gap-1.5 font-medium">
              <span>Menu</span>
              <ChevronRight className="w-3.5 h-3.5" />
              <span>Small Chops</span>
              <ChevronRight className="w-3.5 h-3.5" />
              <span className="text-[#8B5E34] font-semibold">Chin Chin Showcase</span>
            </div>
          </div>

          {/* Cart Status Pill */}
          <div className="flex items-center gap-3">
            <button 
              onClick={onBack}
              className="flex items-center gap-2 bg-[#8B5E34] hover:bg-[#724a25] text-white px-4 py-1.5 rounded-full text-xs font-semibold shadow-xs transition-all cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Catering Cart</span>
              {totalChinChinCount > 0 && (
                <span className="bg-white text-[#8B5E34] px-1.5 py-0.2 rounded-full text-[10px] font-bold">
                  {totalChinChinCount} items (${totalChinChinCost.toFixed(2)})
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* HERO BANNER */}
      <div className="relative bg-gradient-to-b from-[#2B1B12] via-[#3D2619] to-[#2B1B12] text-white overflow-hidden py-12 px-4 sm:px-6 lg:px-8 border-b border-[#8B5E34]/30">
        <div className="absolute inset-0 opacity-15 pointer-events-none bg-[radial-gradient(#d4a373_1px,transparent_1px)] [background-size:16px_16px]"></div>
        <div className="max-w-4xl mx-auto text-center relative z-10 space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs text-amber-200 font-medium">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Signature Small Chops Collection</span>
          </div>

          <h1 className="font-display font-extrabold text-3xl sm:text-4xl md:text-5xl text-white tracking-tight">
            Isaiah Sixty Handcrafted <span className="text-amber-300 underline decoration-amber-400/50 underline-offset-8">Chin Chin</span>
          </h1>

          <p className="text-sm sm:text-base text-gray-200 max-w-2xl mx-auto leading-relaxed">
            Delicately infused with authentic aromatic nutmeg, whole cream milk, and pure vanilla. Fried to golden perfection with an addictive crunch. Explore photo galleries and order in our three official sizes: <strong className="text-amber-300 font-bold">300g</strong>, <strong className="text-amber-300 font-bold">700g</strong>, and <strong className="text-amber-300 font-bold">1500g</strong>.
          </p>

          {/* Quick jump size buttons */}
          <div className="pt-4 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => scrollToSize('300g')}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-white/15 hover:bg-white/25 border border-white/20 transition-all flex items-center gap-2 cursor-pointer"
            >
              <Package className="w-3.5 h-3.5 text-amber-300" />
              <span>300g Snack Pouch ($12.00)</span>
            </button>
            <button
              onClick={() => scrollToSize('700g')}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-white/15 hover:bg-white/25 border border-white/20 transition-all flex items-center gap-2 cursor-pointer"
            >
              <Package className="w-3.5 h-3.5 text-amber-300" />
              <span>700g Family Canister ($22.00)</span>
            </button>
            <button
              onClick={() => scrollToSize('1500g')}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-white/15 hover:bg-white/25 border border-white/20 transition-all flex items-center gap-2 cursor-pointer"
            >
              <Package className="w-3.5 h-3.5 text-amber-300" />
              <span>1500g Party Bucket ($40.00)</span>
            </button>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT: SIZES WITH DEDICATED HEADERS & MULTI-PICTURE GALLERIES */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-10 space-y-16">
        {CHIN_CHIN_SIZES_DATA.map((sizeSpec, index) => {
          const qtyInCart = getQuantityInCart(sizeSpec.id);
          const allPictures = [
            ...sizeSpec.defaultPictures,
            ...(customPictures[sizeSpec.id] || [])
          ];

          return (
            <section
              key={sizeSpec.id}
              id={`section-chin-chin-${sizeSpec.id}`}
              className="bg-white rounded-3xl border border-gray-200/80 shadow-md overflow-hidden transition-all duration-300 hover:shadow-lg scroll-mt-24"
            >
              {/* SIZE SECTION HEADER */}
              <div className="bg-gradient-to-r from-[#FAF5EE] via-white to-[#F6EDE0] p-6 sm:p-8 border-b border-gray-200/70">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                  {/* Left: Size Header details */}
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#8B5E34] text-white shadow-xs">
                        {sizeSpec.weight} Net Weight
                      </span>
                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-900 border border-amber-200">
                        {sizeSpec.badge}
                      </span>
                    </div>

                    <h2 className="font-display font-black text-2xl sm:text-3xl text-gray-900">
                      {sizeSpec.header}
                    </h2>

                    <p className="text-xs sm:text-sm text-gray-600 font-medium max-w-xl">
                      {sizeSpec.subHeader} • <span className="text-gray-500">{sizeSpec.description}</span>
                    </p>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 pt-1">
                      <div className="flex items-center gap-1.5 font-medium">
                        <Users className="w-3.5 h-3.5 text-[#8B5E34]" />
                        <span>Serves: <strong className="text-gray-800">{sizeSpec.servings}</strong></span>
                      </div>
                      <div className="flex items-center gap-1.5 font-medium">
                        <Package className="w-3.5 h-3.5 text-[#8B5E34]" />
                        <span>Package: <strong className="text-gray-800">{sizeSpec.packaging}</strong></span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Pricing & Cart controls */}
                  <div className="shrink-0 bg-white p-5 rounded-2xl border border-gray-200/90 shadow-sm flex flex-col items-start md:items-end gap-3 min-w-[240px]">
                    <div className="flex flex-col items-start md:items-end">
                      <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Unit Price</span>
                      <div className="font-mono font-black text-3xl text-gray-900">
                        ${sizeSpec.price.toFixed(2)} <span className="text-xs text-gray-500 font-normal">CAD</span>
                      </div>
                    </div>

                    {qtyInCart > 0 ? (
                      <div className="w-full flex items-center justify-between bg-[#FDFBF7] border border-[#F5EFEB] rounded-xl p-1 gap-3">
                        <button
                          onClick={() => handleRemove(sizeSpec.id)}
                          className="w-9 h-9 rounded-lg bg-white border border-gray-200 text-[#8B5E34] hover:bg-gray-100 flex items-center justify-center font-bold text-sm transition-colors cursor-pointer"
                          title="Remove one"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <div className="text-center font-mono font-bold text-sm text-[#8B5E34]">
                          {qtyInCart} in Cart
                        </div>
                        <button
                          onClick={() => handleAdd(sizeSpec)}
                          className="w-9 h-9 rounded-lg bg-[#8B5E34] text-white hover:bg-[#724a25] flex items-center justify-center font-bold text-sm transition-colors cursor-pointer"
                          title="Add another"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleAdd(sizeSpec)}
                        className="w-full py-2.5 px-4 rounded-xl bg-[#8B5E34] hover:bg-[#724a25] text-white font-semibold text-xs transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Add {sizeSpec.weight} to Cart</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* MULTI-PICTURES SECTION WITH HEADER */}
              <div className="p-6 sm:p-8 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-gray-100 pb-4">
                  <div>
                    <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                      <ImageIcon className="w-4 h-4 text-[#8B5E34]" />
                      <span>{sizeSpec.weight} Photo Gallery ({allPictures.length} Pictures)</span>
                    </h3>
                    <p className="text-xs text-gray-500">
                      Visual showcase and packaging views for {sizeSpec.header}.
                    </p>
                  </div>

                  {/* Button to Include New Picture for this size */}
                  <button
                    onClick={() => openAddPictureModal(sizeSpec.id)}
                    className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-[#FAF5EE] text-[#8B5E34] hover:bg-[#F2E8DA] border border-[#E8DAC6] transition-colors cursor-pointer self-start sm:self-auto"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Include Picture for {sizeSpec.weight}</span>
                  </button>
                </div>

                {/* PICTURES GRID */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {allPictures.map((pic) => (
                    <div
                      key={pic.id}
                      className="group relative rounded-2xl overflow-hidden bg-gray-50 border border-gray-200/70 hover:border-[#8B5E34]/50 shadow-xs hover:shadow-md transition-all duration-300 flex flex-col justify-between"
                    >
                      {/* Image viewport */}
                      <div className="relative aspect-4/3 w-full overflow-hidden bg-gray-100">
                        <img
                          src={pic.url}
                          alt={pic.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          referrerPolicy="no-referrer"
                        />

                        {/* Top Overlay Badge */}
                        <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-black/60 text-white backdrop-blur-md">
                            {sizeSpec.weight}
                          </span>
                          {pic.isUserAdded && (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-600 text-white shadow-xs">
                              Added Picture
                            </span>
                          )}
                        </div>

                        {/* Expand button */}
                        <button
                          onClick={() => setLightboxImage(pic)}
                          className="absolute bottom-2.5 right-2.5 w-8 h-8 rounded-lg bg-black/60 hover:bg-black/80 text-white backdrop-blur-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                          title="Enlarge picture"
                        >
                          <Maximize2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Picture Caption & Footer */}
                      <div className="p-3.5 bg-white border-t border-gray-100 flex items-start justify-between gap-2">
                        <div className="space-y-0.5">
                          <h4 className="text-xs font-bold text-gray-900 line-clamp-1">{pic.title}</h4>
                          <p className="text-[11px] text-gray-500 line-clamp-2 leading-relaxed">{pic.caption}</p>
                        </div>

                        {pic.isUserAdded && (
                          <button
                            onClick={() => handleDeletePicture(sizeSpec.id, pic.id)}
                            className="p-1.5 text-gray-400 hover:text-red-500 rounded-md hover:bg-red-50 transition-colors shrink-0"
                            title="Remove picture"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* SIZE HIGHLIGHTS BULLETS */}
                <div className="mt-4 p-4 rounded-2xl bg-gray-50/70 border border-gray-100">
                  <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                    Why choose the {sizeSpec.weight} format:
                  </h4>
                  <ul className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs text-gray-600">
                    {sizeSpec.highlights.map((item, hIdx) => (
                      <li key={hIdx} className="flex items-start gap-2">
                        <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </section>
          );
        })}
      </main>

      {/* INCLUDE PICTURE MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 animate-in fade-in duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div>
                <h3 className="font-display font-bold text-lg text-gray-900">
                  Include Picture for {targetSizeForNewPic} Chin Chin
                </h3>
                <p className="text-xs text-gray-500">
                  Upload an image from your device or paste a web image link.
                </p>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="py-4 space-y-5">
              {/* Option A: Upload from local files */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Option 1: Upload from Device (Multiple Allowed)
                </label>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  multiple
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-4 border-2 border-dashed border-[#8B5E34]/40 hover:border-[#8B5E34] bg-[#FAF5EE]/50 hover:bg-[#FAF5EE] rounded-2xl flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer group"
                >
                  <Upload className="w-6 h-6 text-[#8B5E34] group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-semibold text-[#8B5E34]">Choose Image Files</span>
                  <span className="text-[10px] text-gray-500">PNG, JPG, JPEG, WebP up to 8MB</span>
                </button>
              </div>

              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-gray-200"></div>
                <span className="shrink mx-3 text-[11px] font-semibold text-gray-400 uppercase">OR</span>
                <div className="flex-grow border-t border-gray-200"></div>
              </div>

              {/* Option B: Enter Web Image URL */}
              <form onSubmit={handleAddUrlPicture} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Option 2: Image URL
                  </label>
                  <input
                    type="url"
                    placeholder="https://example.com/chin-chin-photo.jpg"
                    value={newPicUrl}
                    onChange={(e) => setNewPicUrl(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8B5E34]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Header / Title
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., Packaging Display"
                      value={newPicTitle}
                      onChange={(e) => setNewPicTitle(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8B5E34]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Caption
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., Gold airtight lid view"
                      value={newPicCaption}
                      onChange={(e) => setNewPicCaption(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8B5E34]"
                    />
                  </div>
                </div>

                {fileError && (
                  <p className="text-xs text-red-600 font-medium">{fileError}</p>
                )}

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl text-xs font-semibold bg-[#8B5E34] hover:bg-[#724a25] text-white shadow-sm"
                  >
                    Add Picture to {targetSizeForNewPic}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* LIGHTBOX MODAL */}
      {lightboxImage && (
        <div 
          onClick={() => setLightboxImage(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm cursor-zoom-out"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-4xl max-h-[90vh] bg-neutral-900 rounded-2xl overflow-hidden shadow-2xl flex flex-col"
          >
            <button
              onClick={() => setLightboxImage(null)}
              className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex-1 overflow-hidden flex items-center justify-center p-2">
              <img
                src={lightboxImage.url}
                alt={lightboxImage.title}
                className="max-h-[75vh] w-auto object-contain rounded-lg"
              />
            </div>
            <div className="p-4 bg-neutral-950 text-white border-t border-neutral-800">
              <h4 className="font-bold text-sm">{lightboxImage.title}</h4>
              <p className="text-xs text-neutral-400 mt-0.5">{lightboxImage.caption}</p>
            </div>
          </div>
        </div>
      )}

      {/* STICKY BOTTOM CHECKOUT ACTION BAR */}
      <div className="fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-gray-200 py-3.5 px-4 shadow-lg">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Catering Menu</span>
            </button>
            <div className="hidden sm:block text-xs text-gray-500">
              {totalChinChinCount > 0 ? (
                <span>You have <strong>{totalChinChinCount} Chin Chin item(s)</strong> ready in cart</span>
              ) : (
                <span>Select 300g, 700g, or 1500g above to add to your order</span>
              )}
            </div>
          </div>

          <button
            onClick={onBack}
            className="px-6 py-2.5 rounded-xl bg-[#8B5E34] hover:bg-[#724a25] text-white font-bold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Proceed to Checkout ({totalChinChinCount} items • ${totalChinChinCost.toFixed(2)})</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChinChinSubpage;
