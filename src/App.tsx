import React, { useState, useEffect, useMemo } from 'react';
import { 
  Filter, 
  SlidersHorizontal, 
  Sparkles, 
  Store, 
  Truck, 
  ShieldCheck, 
  ArrowUpDown, 
  Search, 
  ChevronRight,
  Layers,
  Database,
  Code2,
  CheckCircle2,
  MessageCircle,
  PhoneCall,
  RotateCcw,
  AlertCircle,
  AlertTriangle,
  Info,
  X,
  Tag,
  ShoppingBag
} from 'lucide-react';
import { CartItem, Order, Product, ProductVariant, AppSettings, DeliveryType } from './types';
import { StorageService } from './services/storage';
import { SupabaseService } from './services/supabaseService';
import { BRANDS, CATEGORIES } from './data/mockProducts';
import { SHOWROOM_INFO, SENEGAL_DELIVERY_ZONES, DISTANCE_DELIVERY_ZONES } from './data/senegalLocations';
import { formatFCFA } from './utils/formatters';

import { Header } from './components/Header';
import { HeroBanner } from './components/HeroBanner';
import { ProductCard } from './components/ProductCard';
import { ProductDetailModal } from './components/ProductDetailModal';
import { CartDrawer } from './components/CartDrawer';
import { CheckoutModal } from './components/CheckoutModal';
import { OrderSuccessModal } from './components/OrderSuccessModal';
import { OrderTrackingModal } from './components/OrderTrackingModal';
import { AdminDashboard } from './components/AdminDashboard';
import { ArchitectureModal } from './components/ArchitectureModal';
import { FilterModal, FilterState } from './components/FilterModal';
import { Footer } from './components/Footer';
import { MobileBottomNav } from './components/MobileBottomNav';

interface ToastState {
  id: number;
  message: string;
  type: 'success' | 'warning' | 'error' | 'info';
}

export default function App() {
  // App state
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [availableBrands, setAvailableBrands] = useState<string[]>(() => StorageService.getBrands());
  const [settings, setSettings] = useState<AppSettings>(StorageService.getSettings());
  const [toast, setToast] = useState<ToastState | null>(null);

  // Modals & Views
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState<boolean>(false);
  const [isAdminOpen, setIsAdminOpen] = useState<boolean>(false);
  const [isArchitectureOpen, setIsArchitectureOpen] = useState<boolean>(false);
  const [isTrackingOpen, setIsTrackingOpen] = useState<boolean>(false);
  const [isFilterOpen, setIsFilterOpen] = useState<boolean>(false);
  const [trackingQuery, setTrackingQuery] = useState<string>('');
  const [lastPlacedOrder, setLastPlacedOrder] = useState<Order | null>(null);

  // Filters
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedBrand, setSelectedBrand] = useState<string>('all');
  const [selectedColor, setSelectedColor] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'featured' | 'price_asc' | 'price_desc' | 'newest'>('featured');
  const [inStockOnly, setInStockOnly] = useState<boolean>(false);
  const [priceRange, setPriceRange] = useState<'all' | 'under100k' | '100k-300k' | '300k-600k' | 'above600k'>('all');

  // Dynamic delivery preferences synchronized between Cart and Checkout
  const [cartDeliveryType, setCartDeliveryType] = useState<DeliveryType>('showroom');
  const [cartZoneId, setCartZoneId] = useState<string>(SENEGAL_DELIVERY_ZONES[0].id);
  const [cartDistanceZoneId, setCartDistanceZoneId] = useState<string>(DISTANCE_DELIVERY_ZONES[0].id);

  const handleProceedToCheckout = (preferences?: { 
    deliveryType: DeliveryType; 
    zoneId: string; 
    distanceZoneId: string;
  }) => {
    if (preferences) {
      setCartDeliveryType(preferences.deliveryType);
      setCartZoneId(preferences.zoneId);
      setCartDistanceZoneId(preferences.distanceZoneId);
    }
    setIsCheckoutOpen(true);
  };

  // Initialize storage & Route detection
  useEffect(() => {
    setProducts(StorageService.getProducts());
    setOrders(StorageService.getOrders());
    setCart(StorageService.getCart());
    setSettings(StorageService.getSettings());

    // Sync with Supabase on startup
    StorageService.syncWithSupabase().then((res) => {
      if (res.products && res.products.length > 0) setProducts(res.products);
      if (res.orders && res.orders.length > 0) setOrders(res.orders);
      if (res.settings) setSettings(res.settings);
      if (res.brands && res.brands.length > 0) setAvailableBrands(res.brands);
    });

    // Realtime Supabase Subscriptions
    const unsubProducts = SupabaseService.subscribeToProducts((liveProducts) => {
      setProducts(liveProducts);
      localStorage.setItem('khelcom_products_v4', JSON.stringify(liveProducts));
    });

    const unsubOrders = SupabaseService.subscribeToOrders((liveOrders) => {
      setOrders(liveOrders);
      localStorage.setItem('khelcom_orders_v4', JSON.stringify(liveOrders));
    });

    // Secret Admin Route Detector (/khelcom_business/admin, /#admin, ?admin=1)
    const checkAdminRoute = () => {
      const hash = window.location.hash.toLowerCase();
      const path = window.location.pathname.toLowerCase();
      const search = window.location.search.toLowerCase();
      if (
        hash === '#admin' ||
        hash === '#/admin' ||
        hash.includes('khelcom_business/admin') ||
        path.includes('/khelcom_business/admin') ||
        path.endsWith('/admin') ||
        search.includes('admin=1') ||
        search.includes('admin=true')
      ) {
        setIsAdminOpen(true);
      }
    };

    checkAdminRoute();
    window.addEventListener('hashchange', checkAdminRoute);
    window.addEventListener('popstate', checkAdminRoute);
    return () => {
      window.removeEventListener('hashchange', checkAdminRoute);
      window.removeEventListener('popstate', checkAdminRoute);
      unsubProducts();
      unsubOrders();
    };
  }, []);

  const handleOpenAdmin = () => {
    setIsAdminOpen(true);
    if (window.location.hash !== '#admin') {
      window.location.hash = '#admin';
    }
  };

  const handleCloseAdmin = () => {
    setIsAdminOpen(false);
    if (window.location.hash === '#admin' || window.location.hash.includes('admin')) {
      window.history.replaceState(null, '', window.location.pathname);
    }
    setProducts(StorageService.getProducts());
    setOrders(StorageService.getOrders());
  };

  const showToast = (message: string, type: 'success' | 'warning' | 'error' | 'info' = 'info') => {
    const id = Date.now();
    setToast({ id, message, type });
    setTimeout(() => {
      setToast((current) => (current?.id === id ? null : current));
    }, 4000);
  };

  // Save cart changes
  const updateCart = (newCart: CartItem[]) => {
    setCart(newCart);
    StorageService.saveCart(newCart);
  };

  // Stock-Aware Add to Cart
  const handleAddToCart = (product: Product, variant: ProductVariant, quantity = 1) => {
    const liveStock = StorageService.getVariantLiveStock(product.id, variant.id);
    
    if (liveStock <= 0 || !product.inStock) {
      showToast(`Rupture : "${product.name}" (${variant.title}) n'est plus en stock.`, 'error');
      return;
    }

    const existingIndex = cart.findIndex(
      (item) => item.product.id === product.id && item.selectedVariant.id === variant.id
    );

    if (existingIndex > -1) {
      const currentQty = cart[existingIndex].quantity;
      const targetQty = currentQty + quantity;

      if (targetQty > liveStock) {
        if (currentQty >= liveStock) {
          showToast(`Stock maximal déjà dans votre panier (${liveStock} unité(s) dispo).`, 'warning');
          return;
        }
        const updated = [...cart];
        updated[existingIndex].quantity = liveStock;
        updateCart(updated);
        showToast(`Quantité ajustée au stock disponible (${liveStock} unité(s)).`, 'warning');
      } else {
        const updated = [...cart];
        updated[existingIndex].quantity = targetQty;
        updateCart(updated);
        showToast(`Ajouté au panier (${targetQty} unité(s)).`, 'success');
      }
    } else {
      const qtyToAdd = Math.min(quantity, liveStock);
      updateCart([...cart, { product, selectedVariant: variant, quantity: qtyToAdd }]);
      if (qtyToAdd < quantity) {
        showToast(`Quantité ajustée au stock disponible (${qtyToAdd} unité(s)).`, 'warning');
      } else {
        showToast(`"${product.name}" ajouté à votre panier (${qtyToAdd} unité(s)).`, 'success');
      }
    }
  };

  const handleDirectBuy = (product: Product, variant: ProductVariant, quantity = 1) => {
    handleAddToCart(product, variant, quantity);
    setSelectedProduct(null);
    setIsCheckoutOpen(true);
  };

  const handleUpdateCartQuantity = (index: number, newQty: number) => {
    if (newQty <= 0) {
      handleRemoveCartItem(index);
      return;
    }
    const item = cart[index];
    if (!item) return;

    const liveStock = StorageService.getVariantLiveStock(item.product.id, item.selectedVariant.id);
    if (newQty > liveStock) {
      showToast(`Stock maximum atteint (${liveStock} unité(s) disponibles).`, 'warning');
      const updated = [...cart];
      updated[index].quantity = liveStock;
      updateCart(updated);
    } else {
      const updated = [...cart];
      updated[index].quantity = newQty;
      updateCart(updated);
    }
  };

  const handleRemoveCartItem = (index: number) => {
    const updated = cart.filter((_, i) => i !== index);
    updateCart(updated);
    showToast('Article retiré du panier.', 'info');
  };

  const handleClearCart = () => {
    updateCart([]);
    showToast('Le panier a été vidé.', 'info');
  };

  const handleProductUpdated = (updatedProduct: Product) => {
    setProducts((prev) => prev.map((p) => (p.id === updatedProduct.id ? updatedProduct : p)));
    setSelectedProduct(updatedProduct);
    showToast('Votre avis a été publié avec succès !', 'success');
  };

  // 1-Click Auto Adjust Cart to Available Stock
  const handleAutoAdjustCart = () => {
    const adjustedCart: CartItem[] = [];
    let modified = false;

    cart.forEach((item) => {
      const liveStock = StorageService.getVariantLiveStock(item.product.id, item.selectedVariant.id);
      if (liveStock > 0) {
        const clampedQty = Math.min(item.quantity, liveStock);
        if (clampedQty !== item.quantity) {
          modified = true;
        }
        adjustedCart.push({
          ...item,
          quantity: clampedQty,
        });
      } else {
        modified = true;
      }
    });

    updateCart(adjustedCart);
    if (modified) {
      showToast('Panier réajusté aux stocks exacts disponibles.', 'success');
    }
  };

  // Order Success & Inventory Sync
  const handleOrderSuccess = (order: Order) => {
    setLastPlacedOrder(order);
    const updatedOrders = StorageService.getOrders();
    const updatedProducts = StorageService.getProducts();
    setOrders(updatedOrders);
    setProducts(updatedProducts);
    setIsCheckoutOpen(false);
    updateCart([]);
    showToast(`Commande ${order.orderNumber} enregistrée avec succès !`, 'success');
  };

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      // 1. Only online and non-hidden products appear on catalog and homepage
      if (product.isOnline === false || product.isHidden === true) return false;

      // 2. Category filter
      if (selectedCategory !== 'all' && product.category !== selectedCategory) {
        return false;
      }

      // 3. Brand filter
      if (selectedBrand !== 'all' && product.brand.toLowerCase() !== selectedBrand.toLowerCase()) {
        return false;
      }

      // 3.5 Color / Palette filter (connected to variant colorName, colorHex, and title)
      if (selectedColor !== 'all') {
        const targetColor = selectedColor.toLowerCase();
        const matchesColor = product.variants.some((v) => {
          const vName = (v.colorName || '').toLowerCase();
          const vHex = (v.colorHex || '').toLowerCase();
          const vTitle = (v.title || '').toLowerCase();
          return (
            vName.includes(targetColor) ||
            targetColor.includes(vName) ||
            vTitle.includes(targetColor) ||
            vHex === targetColor
          );
        }) || (product.name && product.name.toLowerCase().includes(targetColor));

        if (!matchesColor) return false;
      }

      // 4. In stock only
      if (inStockOnly && !product.inStock) {
        return false;
      }

      // 5. Price range filter
      if (priceRange !== 'all') {
        const price = product.basePrice;
        if (priceRange === 'under100k' && price >= 100000) return false;
        if (priceRange === '100k-300k' && (price < 100000 || price > 300000)) return false;
        if (priceRange === '300k-600k' && (price < 300000 || price > 600000)) return false;
        if (priceRange === 'above600k' && price <= 600000) return false;
      }

      // 6. Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesName = product.name.toLowerCase().includes(query);
        const matchesBrand = product.brand.toLowerCase().includes(query);
        const matchesSku = product.sku.toLowerCase().includes(query);
        const matchesDesc = product.shortDescription?.toLowerCase().includes(query);
        const matchesVariants = product.variants.some((v) =>
          v.title.toLowerCase().includes(query) || 
          (v.capacity && v.capacity.toLowerCase().includes(query)) ||
          (v.colorName && v.colorName.toLowerCase().includes(query))
        );

        if (!matchesName && !matchesBrand && !matchesSku && !matchesDesc && !matchesVariants) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'price_asc') return a.basePrice - b.basePrice;
      if (sortBy === 'price_desc') return b.basePrice - a.basePrice;
      if (sortBy === 'newest') {
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      }
      // 'featured' default: featured first
      if (a.isFeatured && !b.isFeatured) return -1;
      if (!a.isFeatured && b.isFeatured) return 1;
      return 0;
    });
  }, [products, selectedCategory, selectedBrand, selectedColor, inStockOnly, priceRange, searchQuery, sortBy]);

  // Count active filters
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (selectedCategory !== 'all') count++;
    if (selectedBrand !== 'all') count++;
    if (selectedColor !== 'all') count++;
    if (inStockOnly) count++;
    if (priceRange !== 'all') count++;
    if (sortBy !== 'featured') count++;
    if (searchQuery.trim()) count++;
    return count;
  }, [selectedCategory, selectedBrand, selectedColor, inStockOnly, priceRange, sortBy, searchQuery]);

  const currentFilters: FilterState = {
    category: selectedCategory,
    brand: selectedBrand,
    selectedColor,
    inStockOnly,
    priceRange,
    sortBy,
  };

  const handleUpdateFilter = <K extends keyof FilterState>(key: K, value: FilterState[K]) => {
    if (key === 'category') setSelectedCategory(value as string);
    if (key === 'brand') setSelectedBrand(value as string);
    if (key === 'selectedColor') setSelectedColor((value as string) || 'all');
    if (key === 'inStockOnly') setInStockOnly(value as boolean);
    if (key === 'priceRange') setPriceRange(value as any);
    if (key === 'sortBy') setSortBy(value as any);
  };

  const handleResetFilters = () => {
    setSelectedCategory('all');
    setSelectedBrand('all');
    setSelectedColor('all');
    setInStockOnly(false);
    setPriceRange('all');
    setSortBy('featured');
    setSearchQuery('');
  };

  const totalCartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // 0. DEDICATED FULL PAGE FOR ADMIN DASHBOARD
  if (isAdminOpen) {
    return (
      <AdminDashboard
        isOpen={true}
        onClose={handleCloseAdmin}
        products={products}
        onProductsUpdated={(newProds) => {
          setProducts(newProds);
          StorageService.saveProducts(newProds);
        }}
        orders={orders}
        onOrdersUpdated={(newOrders) => {
          setOrders(newOrders);
          setProducts(StorageService.getProducts());
        }}
        brands={availableBrands}
        onBrandsUpdated={(newBrands) => {
          setAvailableBrands(newBrands);
        }}
        settings={settings}
        onSettingsUpdated={(newSettings) => {
          setSettings(newSettings);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950">
      
      {/* Dynamic Toast Feedback */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-2 duration-200">
          <div
            className={`flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-xl border text-xs font-bold ${
              toast.type === 'success'
                ? 'bg-emerald-950 text-emerald-100 border-emerald-700'
                : toast.type === 'warning'
                ? 'bg-amber-950 text-amber-100 border-amber-700'
                : toast.type === 'error'
                ? 'bg-rose-950 text-rose-100 border-rose-700'
                : 'bg-purple-950 text-purple-100 border-purple-700'
            }`}
          >
            {toast.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
            {toast.type === 'warning' && <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />}
            {toast.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />}
            {toast.type === 'info' && <Info className="w-4 h-4 text-purple-400 shrink-0" />}
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* Top Header with Master Filter trigger */}
      <Header
        cartCount={totalCartCount}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenAdmin={() => setIsAdminOpen(true)}
        onOpenArchitecture={() => setIsArchitectureOpen(true)}
        onOpenTracking={() => {
          setTrackingQuery('');
          setIsTrackingOpen(true);
        }}
        onOpenFilters={() => setIsFilterOpen(true)}
        activeFiltersCount={activeFiltersCount}
        selectedCategory={selectedCategory}
        onSelectCategory={(catId) => {
          setSelectedCategory(catId);
          window.scrollTo({ top: 350, behavior: 'smooth' });
        }}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {/* Architecture & SQL Banner Callout */}
      <div className="bg-[#240845] text-purple-100 border-b border-purple-900/60 px-3 sm:px-4 py-1.5 sm:py-2 text-[11px] sm:text-xs font-semibold shadow-xs">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1.5 sm:gap-2">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <span className="px-1.5 sm:px-2 py-0.5 rounded-full bg-orange-500 text-white text-[9px] sm:text-[10px] font-black uppercase shrink-0">
              Phase 1 Prête
            </span>
            <span className="text-purple-200 truncate">
              Gestion de stock temps réel, Guest Checkout & Schéma SQL Supabase configurés.
            </span>
          </div>

          <button
            type="button"
            onClick={() => setIsArchitectureOpen(true)}
            className="flex items-center gap-1 px-2.5 sm:px-3 py-1 rounded-lg bg-[#380e6b] text-orange-400 hover:bg-[#48138a] border border-orange-500/30 text-[11px] sm:text-xs font-bold transition-all active:scale-95 shadow-xs cursor-pointer shrink-0"
          >
            <Database className="w-3 sm:w-3.5 h-3 sm:h-3.5" />
            <span>Voir Schéma SQL & Next.js</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Hero Showcase Banner */}
      <HeroBanner
        brands={availableBrands}
        onSelectBrand={(brand) => {
          setSelectedBrand(brand);
          const el = document.getElementById('catalog-section');
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }}
        onExploreCatalog={() => {
          const el = document.getElementById('catalog-section');
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }}
        onOpenShowroom={() => {
          const el = document.getElementById('catalog-section');
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }}
      />

      {/* Main Catalog Container */}
      <main id="catalog-section" className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-10">
        
        {/* Section Header & Filters Bar */}
        <div className="space-y-3.5 sm:space-y-4 mb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-orange-600 uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Catalogue Électroménager & High-Tech • Nianing</span>
              </div>
              <h2 className="text-xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1">
                {selectedCategory === 'all'
                  ? 'Nos Appareils Disponibles'
                  : CATEGORIES.find((c) => c.id === selectedCategory)?.label}
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                {filteredProducts.length} référence{filteredProducts.length > 1 ? 's' : ''} avec suivi des stocks en temps réel
              </p>
            </div>

            {/* Prominent All Filters Button + Quick Brand Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full scrollbar-none">
              <button
                type="button"
                onClick={() => setIsFilterOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs transition-all shadow-xs shadow-orange-500/20 active:scale-95 cursor-pointer shrink-0"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>Tous les filtres</span>
                {activeFiltersCount > 0 && (
                  <span className="w-4 h-4 rounded-full bg-white text-orange-600 text-[10px] font-black flex items-center justify-center">
                    {activeFiltersCount}
                  </span>
                )}
              </button>

              <div className="h-4 w-px bg-slate-300 shrink-0" />

              <span className="text-xs font-bold text-slate-500 shrink-0">Marque :</span>
              <button
                type="button"
                onClick={() => setSelectedBrand('all')}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  selectedBrand === 'all'
                    ? 'bg-[#1b0633] text-white shadow-xs'
                    : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                Toutes
              </button>
              {availableBrands.slice(0, 8).map((b) => (
                <button
                  key={b}
                  type="button"
                  onClick={() => setSelectedBrand(b)}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer ${
                    selectedBrand === b
                      ? 'bg-orange-500 text-white shadow-xs'
                      : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  {b}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Filter Control Row */}
          <div className="flex flex-wrap items-center justify-between gap-2.5 bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              
              {/* Sort selector */}
              <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5">
                <ArrowUpDown className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-transparent text-slate-800 font-semibold focus:outline-none text-xs cursor-pointer"
                >
                  <option value="featured">Populaires & Vedettes</option>
                  <option value="price_asc">Prix croissant (Moins cher)</option>
                  <option value="price_desc">Prix décroissant (Haut de gamme)</option>
                  <option value="newest">Nouveautés récentes</option>
                </select>
              </div>

              {/* In stock toggle pill */}
              <button
                type="button"
                onClick={() => setInStockOnly(!inStockOnly)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  inStockOnly
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <div className={`w-2 h-2 rounded-full ${inStockOnly ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
                <span>En stock Nianing</span>
              </button>

              {/* Active filters reset */}
              {activeFiltersCount > 0 && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="flex items-center gap-1 text-orange-600 hover:text-orange-700 hover:bg-orange-50 text-xs font-bold px-2.5 py-1.5 rounded-lg border border-orange-200 transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Réinitialiser les filtres ({activeFiltersCount})</span>
                </button>
              )}
            </div>

            {/* Results count badge */}
            <div className="text-xs text-slate-500 font-medium">
              <strong className="text-slate-900 font-bold">{filteredProducts.length}</strong> appareil{filteredProducts.length > 1 ? 's' : ''} trouvé{filteredProducts.length > 1 ? 's' : ''}
            </div>
          </div>

          {/* Removable Active Filter Chips Bar (Visible whenever filters are active) */}
          {activeFiltersCount > 0 && (
            <div className="flex flex-wrap items-center gap-2 pt-1 pb-1">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <Filter className="w-3 h-3 text-orange-500" />
                <span>Filtres actifs :</span>
              </span>

              {searchQuery.trim() && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-orange-100/90 text-orange-950 font-bold text-xs border border-orange-200 shadow-2xs">
                  <span>Recherche : &ldquo;{searchQuery}&rdquo;</span>
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="p-0.5 rounded-full hover:bg-orange-200 text-orange-800 transition-colors cursor-pointer"
                    title="Supprimer la recherche"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {selectedCategory !== 'all' && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-purple-100/90 text-purple-950 font-bold text-xs border border-purple-200 shadow-2xs">
                  <span>Rayon : {CATEGORIES.find((c) => c.id === selectedCategory)?.label || selectedCategory}</span>
                  <button
                    type="button"
                    onClick={() => setSelectedCategory('all')}
                    className="p-0.5 rounded-full hover:bg-purple-200 text-purple-800 transition-colors cursor-pointer"
                    title="Afficher tous les rayons"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {selectedBrand !== 'all' && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-200 text-slate-900 font-bold text-xs border border-slate-300 shadow-2xs">
                  <span>Marque : {selectedBrand}</span>
                  <button
                    type="button"
                    onClick={() => setSelectedBrand('all')}
                    className="p-0.5 rounded-full hover:bg-slate-300 text-slate-800 transition-colors cursor-pointer"
                    title="Afficher toutes les marques"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {selectedColor !== 'all' && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-pink-100 text-pink-950 font-bold text-xs border border-pink-200 shadow-2xs">
                  <span>Couleur : {selectedColor}</span>
                  <button
                    type="button"
                    onClick={() => setSelectedColor('all')}
                    className="p-0.5 rounded-full hover:bg-pink-200 text-pink-800 transition-colors cursor-pointer"
                    title="Afficher toutes les couleurs"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {inStockOnly && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-100 text-emerald-950 font-bold text-xs border border-emerald-200 shadow-2xs">
                  <span>En stock uniquement</span>
                  <button
                    type="button"
                    onClick={() => setInStockOnly(false)}
                    className="p-0.5 rounded-full hover:bg-emerald-200 text-emerald-800 transition-colors cursor-pointer"
                    title="Désactiver le filtre de stock"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {priceRange !== 'all' && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-100 text-amber-950 font-bold text-xs border border-amber-200 shadow-2xs">
                  <span>Budget filtré</span>
                  <button
                    type="button"
                    onClick={() => setPriceRange('all')}
                    className="p-0.5 rounded-full hover:bg-amber-200 text-amber-800 transition-colors cursor-pointer"
                    title="Effacer le filtre de prix"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              <button
                type="button"
                onClick={handleResetFilters}
                className="text-[11px] font-bold text-orange-600 hover:text-orange-800 underline ml-1 cursor-pointer"
              >
                Tout réinitialiser
              </button>
            </div>
          )}
        </div>

        {/* Product Grid */}
        {products.length === 0 ? (
          <div className="bg-white rounded-3xl border-2 border-orange-200 p-6 sm:p-10 text-center max-w-2xl mx-auto shadow-lg space-y-6 my-6 animate-in fade-in duration-200">
            <div className="w-16 h-16 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center mx-auto border border-orange-300 shadow-inner">
              <ShoppingBag className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h3 className="text-lg sm:text-2xl font-black text-slate-900">
                Le catalogue est actuellement vide
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-lg mx-auto">
                Tous les produits ont été réinitialisés. Vous pouvez ajouter de nouveaux produits depuis le panneau d'administration ou contacter directement notre showroom.
              </p>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setIsAdminOpen(true)}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
              >
                <span>Accéder à l'Administration</span>
              </button>
              <a
                href={`https://wa.me/${(settings.whatsapp || settings.phone1 || '').replace(/\D/g, '')}?text=${encodeURIComponent('Bonjour Khelcom Business, je souhaite des renseignements sur vos produits disponibles.')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Contacter par WhatsApp</span>
              </a>
            </div>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="bg-white rounded-3xl border-2 border-orange-200 p-6 sm:p-9 text-center max-w-2xl mx-auto shadow-lg space-y-6 my-6 animate-in fade-in duration-200">
            <div className="w-16 h-16 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center mx-auto border border-orange-300 shadow-inner">
              <Search className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h3 className="text-lg sm:text-xl font-black text-slate-900">
                Aucun appareil ne correspond à ces critères
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-lg mx-auto">
                La combinaison de filtres sélectionnée est trop restrictive et ne renvoie aucun résultat dans notre catalogue actuel.
              </p>
            </div>

            {/* Diagnostic Box explaining exactly why */}
            <div className="bg-amber-50/90 rounded-2xl p-4 border border-amber-200/90 text-left space-y-3">
              <div className="flex items-center gap-2 text-xs font-black text-amber-950 uppercase tracking-wider">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Pourquoi aucun produit n'apparaît ?</span>
              </div>

              <div className="text-xs text-amber-900 leading-relaxed space-y-1.5">
                {selectedCategory !== 'all' && selectedBrand !== 'all' && (
                  <p>
                    • Vous associez le rayon <strong className="text-amber-950 font-bold underline">{CATEGORIES.find((c) => c.id === selectedCategory)?.label || selectedCategory}</strong> avec la marque <strong className="text-amber-950 font-bold underline">{selectedBrand}</strong>. Khelcom Business ne propose pas d'articles de cette marque dans ce rayon spécifique.
                  </p>
                )}
                {searchQuery.trim() && (
                  <p>
                    • Aucun produit ne contient le terme <strong className="text-amber-950 font-bold">&ldquo;{searchQuery}&rdquo;</strong> avec les filtres sélectionnés.
                  </p>
                )}
                {inStockOnly && (
                  <p>
                    • L'option <strong className="text-amber-950 font-bold">« En stock Showroom uniquement »</strong> exclut les appareils disponibles sur commande directe.
                  </p>
                )}
                {priceRange !== 'all' && (
                  <p>
                    • La <strong className="text-amber-950 font-bold">tranche de prix active</strong> ne contient aucun article avec vos autres critères.
                  </p>
                )}
              </div>

              {/* Active Removable Chips inside Diagnostic */}
              <div className="pt-2 border-t border-amber-200/70">
                <div className="text-[11px] font-bold text-amber-900 mb-1.5">
                  Cliquez sur une croix pour retirer un critère bloquant :
                </div>
                <div className="flex flex-wrap gap-1.5 text-xs">
                  {searchQuery.trim() && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white text-orange-950 font-bold border border-orange-300 hover:bg-orange-100 transition-colors cursor-pointer shadow-2xs"
                    >
                      <span>Recherche : &ldquo;{searchQuery}&rdquo;</span>
                      <X className="w-3.5 h-3.5 text-orange-600" />
                    </button>
                  )}
                  {selectedCategory !== 'all' && (
                    <button
                      type="button"
                      onClick={() => setSelectedCategory('all')}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white text-purple-950 font-bold border border-purple-300 hover:bg-purple-100 transition-colors cursor-pointer shadow-2xs"
                    >
                      <span>Rayon : {CATEGORIES.find((c) => c.id === selectedCategory)?.label || selectedCategory}</span>
                      <X className="w-3.5 h-3.5 text-purple-600" />
                    </button>
                  )}
                  {selectedBrand !== 'all' && (
                    <button
                      type="button"
                      onClick={() => setSelectedBrand('all')}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white text-slate-900 font-bold border border-slate-300 hover:bg-slate-100 transition-colors cursor-pointer shadow-2xs"
                    >
                      <span>Marque : {selectedBrand}</span>
                      <X className="w-3.5 h-3.5 text-slate-600" />
                    </button>
                  )}
                  {inStockOnly && (
                    <button
                      type="button"
                      onClick={() => setInStockOnly(false)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white text-emerald-950 font-bold border border-emerald-300 hover:bg-emerald-100 transition-colors cursor-pointer shadow-2xs"
                    >
                      <span>En stock uniquement</span>
                      <X className="w-3.5 h-3.5 text-emerald-600" />
                    </button>
                  )}
                  {priceRange !== 'all' && (
                    <button
                      type="button"
                      onClick={() => setPriceRange('all')}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white text-amber-950 font-bold border border-amber-300 hover:bg-amber-100 transition-colors cursor-pointer shadow-2xs"
                    >
                      <span>Tranche de prix</span>
                      <X className="w-3.5 h-3.5 text-amber-600" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Primary Action Buttons */}
            <div className="pt-1 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                type="button"
                id="reset-empty-filters-btn"
                onClick={handleResetFilters}
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-black text-sm shadow-md shadow-orange-500/25 transition-all flex items-center justify-center gap-2 active:scale-95 cursor-pointer ring-2 ring-orange-400 ring-offset-2"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Réinitialiser tous les filtres</span>
              </button>

              {selectedBrand !== 'all' && (
                <button
                  type="button"
                  onClick={() => setSelectedCategory('all')}
                  className="w-full sm:w-auto px-4 py-3 rounded-xl bg-purple-900 hover:bg-purple-800 text-white font-bold text-xs sm:text-sm transition-colors cursor-pointer"
                >
                  Voir tous les appareils {selectedBrand}
                </button>
              )}

              {selectedCategory !== 'all' && (
                <button
                  type="button"
                  onClick={() => setSelectedBrand('all')}
                  className="w-full sm:w-auto px-4 py-3 rounded-xl bg-[#1b0633] hover:bg-[#2a0b4d] text-white font-bold text-xs sm:text-sm transition-colors cursor-pointer"
                >
                  Voir tout le rayon {CATEGORIES.find((c) => c.id === selectedCategory)?.label || selectedCategory}
                </button>
              )}
            </div>

            {/* Quick Explore Category Buttons */}
            <div className="pt-3 border-t border-slate-200 text-center">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Ou découvrez nos catégories principales :
              </p>
              <div className="flex flex-wrap justify-center gap-1.5">
                {CATEGORIES.filter((c) => c.id !== 'all').slice(0, 5).map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      handleResetFilters();
                      setSelectedCategory(cat.id);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-orange-100 hover:text-orange-950 text-slate-700 font-semibold text-xs transition-colors cursor-pointer border border-slate-200"
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-5">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onSelectProduct={setSelectedProduct}
                onQuickAddToCart={handleAddToCart}
              />
            ))}
          </div>
        )}

      </main>

      {/* Footer with Nianing Showroom details & Admin trigger on Footer Logo */}
      <Footer
        onOpenArchitecture={() => setIsArchitectureOpen(true)}
        onOpenAdmin={handleOpenAdmin}
        onOpenTracking={() => {
          setTrackingQuery('');
          setIsTrackingOpen(true);
        }}
      />

      {/* MODALS & DRAWERS */}

      {/* 1. All Filters Drawer */}
      <FilterModal
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        filters={currentFilters}
        onUpdateFilter={handleUpdateFilter}
        onResetFilters={handleResetFilters}
        totalResultsCount={filteredProducts.length}
        brands={availableBrands}
      />

      {/* 2. Product Detail Modal */}
      {selectedProduct && (
        <ProductDetailModal
          product={selectedProduct}
          cart={cart}
          onClose={() => setSelectedProduct(null)}
          onAddToCart={handleAddToCart}
          onDirectBuy={handleDirectBuy}
          onProductUpdated={handleProductUpdated}
        />
      )}

      {/* 3. Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cart}
        onUpdateQuantity={handleUpdateCartQuantity}
        onRemoveItem={handleRemoveCartItem}
        onClearCart={handleClearCart}
        onProceedToCheckout={handleProceedToCheckout}
        onAutoAdjustCart={handleAutoAdjustCart}
        settings={settings}
        initialDeliveryType={cartDeliveryType}
        initialZoneId={cartZoneId}
        initialDistanceZoneId={cartDistanceZoneId}
      />

      {/* 4. Checkout Modal (Guest Checkout) */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        items={cart}
        onOrderSuccess={handleOrderSuccess}
        settings={settings}
        onAutoAdjustCart={handleAutoAdjustCart}
        initialDeliveryType={cartDeliveryType}
        initialZoneId={cartZoneId}
        initialDistanceZoneId={cartDistanceZoneId}
      />

      {/* 5. Order Success Modal */}
      <OrderSuccessModal
        order={lastPlacedOrder}
        onClose={() => setLastPlacedOrder(null)}
        onTrackOrder={(orderNumber) => {
          setTrackingQuery(orderNumber);
          setIsTrackingOpen(true);
        }}
      />

      {/* 6. Order Tracking Modal */}
      <OrderTrackingModal
        isOpen={isTrackingOpen}
        onClose={() => setIsTrackingOpen(false)}
        initialQuery={trackingQuery}
      />

      {/* 7. Architecture & Supabase SQL Script Modal */}
      <ArchitectureModal
        isOpen={isArchitectureOpen}
        onClose={() => setIsArchitectureOpen(false)}
      />

      {/* Mobile Sticky Bottom Navigation (Mobile-First) */}
      <MobileBottomNav
        cartCount={totalCartCount}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenTracking={() => {
          setTrackingQuery('');
          setIsTrackingOpen(true);
        }}
        onScrollToCatalog={() => {
          const el = document.getElementById('catalog-section');
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }}
        activeCategory={selectedCategory}
      />

    </div>
  );
}
