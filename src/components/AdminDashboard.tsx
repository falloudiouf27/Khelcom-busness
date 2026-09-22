import React, { useState, useEffect } from 'react';
import { 
  Lock, 
  Package, 
  ShoppingBag, 
  Settings, 
  BarChart3, 
  Plus, 
  Search, 
  Check, 
  X, 
  Download, 
  Eye, 
  EyeOff,
  Trash2, 
  Copy, 
  Edit, 
  FileEdit,
  Globe, 
  Store, 
  Truck, 
  Send,
  ArrowLeft,
  RefreshCw,
  LogOut,
  SlidersHorizontal,
  ChevronRight,
  User,
  Phone,
  Mail,
  MapPin,
  Clock,
  Save,
  FileText,
  AlertTriangle,
  Calendar,
  CreditCard,
  Star,
  Tag
} from 'lucide-react';
import { AppSettings, Order, OrderStatus, Product, ProductVariant } from '../types';
import { StorageService } from '../services/storage';
import { SupabaseService } from '../services/supabaseService';
import { BRANDS, CATEGORIES } from '../data/mockProducts';
import { formatFCFA, formatDate } from '../utils/formatters';
import { generateOrderInvoicePDF } from '../services/pdfGenerator';
import { AdminProductModal } from './AdminProductModal';
import { AdminOrderDetailsModal } from './AdminOrderDetailsModal';
import { AdminSettingsTab } from './AdminSettingsTab';
import { AdminRatingsTab } from './AdminRatingsTab';
import { AdminStatsTab } from './AdminStatsTab';
import { AdminBrandsTab } from './AdminBrandsTab';
import { Logo } from './Logo';

interface AdminDashboardProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onProductsUpdated: (products: Product[]) => void;
  orders: Order[];
  onOrdersUpdated: (orders: Order[]) => void;
  brands?: string[];
  onBrandsUpdated?: (brands: string[]) => void;
  settings?: AppSettings;
  onSettingsUpdated?: (settings: AppSettings) => void;
}

const getStatusBadge = (status: OrderStatus) => {
  switch (status) {
    case 'pending_payment':
      return { 
        label: 'En attente de paiement', 
        bg: 'bg-amber-500/15', 
        text: 'text-amber-300', 
        border: 'border-amber-500/40',
        dot: 'bg-amber-400 animate-pulse'
      };
    case 'paid':
      return { 
        label: 'Paiement Validé', 
        bg: 'bg-emerald-500/15', 
        text: 'text-emerald-300', 
        border: 'border-emerald-500/40',
        dot: 'bg-emerald-400'
      };
    case 'preparing':
      return { 
        label: 'En préparation', 
        bg: 'bg-blue-500/15', 
        text: 'text-blue-300', 
        border: 'border-blue-500/40',
        dot: 'bg-blue-400 animate-pulse'
      };
    case 'delivered':
      return { 
        label: 'Livré & Encaissé', 
        bg: 'bg-purple-500/15', 
        text: 'text-purple-200', 
        border: 'border-purple-500/40',
        dot: 'bg-purple-300'
      };
    case 'cancelled':
      return { 
        label: 'Annulé', 
        bg: 'bg-rose-500/15', 
        text: 'text-rose-300', 
        border: 'border-rose-500/40',
        dot: 'bg-rose-400'
      };
    default:
      return { 
        label: status, 
        bg: 'bg-slate-500/15', 
        text: 'text-slate-300', 
        border: 'border-slate-500/40',
        dot: 'bg-slate-400'
      };
  }
};

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  isOpen,
  onClose,
  products,
  onProductsUpdated,
  orders,
  onOrdersUpdated,
  brands: propBrands,
  onBrandsUpdated,
  settings = StorageService.getSettings(),
  onSettingsUpdated = () => {},
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState(StorageService.isAdminAuthenticated());
  const [passwordInput, setPasswordInput] = useState('');
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [loginBlocked, setLoginBlocked] = useState(false);
  const [blockTimer, setBlockTimer] = useState(0);
  const [authError, setAuthError] = useState('');

  // Dashboard Tabs: 'orders' | 'products' | 'brands' | 'ratings' | 'stats' | 'settings'
  const [activeTab, setActiveTab] = useState<'orders' | 'products' | 'brands' | 'ratings' | 'stats' | 'settings'>('orders');
  
  // Brands state
  const [internalBrands, setInternalBrands] = useState<string[]>(() => propBrands || StorageService.getBrands());

  useEffect(() => {
    if (propBrands) {
      setInternalBrands(propBrands);
    }
  }, [propBrands]);

  const handleBrandsUpdated = (newBrands: string[]) => {
    setInternalBrands(newBrands);
    if (onBrandsUpdated) {
      onBrandsUpdated(newBrands);
    }
  };

  // Orders Tab Filter & Search
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('all');
  const [searchOrderQuery, setSearchOrderQuery] = useState<string>('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [viewingOrderDetails, setViewingOrderDetails] = useState<Order | null>(null);
  const [orderEditForm, setOrderEditForm] = useState<Order | null>(null);
  const [orderToDelete, setOrderToDelete] = useState<Order | null>(null);

  // Sync orderEditForm whenever selectedOrder changes
  useEffect(() => {
    if (selectedOrder) {
      setOrderEditForm({ ...selectedOrder });
    } else {
      setOrderEditForm(null);
    }
  }, [selectedOrder]);

  // Products Tab Filter & Search
  const [productCategoryFilter, setProductCategoryFilter] = useState<string>('all');
  const [productBrandFilter, setProductBrandFilter] = useState<string>('all');
  const [productStatusFilter, setProductStatusFilter] = useState<'all' | 'visible' | 'hidden' | 'online' | 'offline' | 'instock' | 'outstock'>('all');
  const [searchProductQuery, setSearchProductQuery] = useState<string>('');

  // Product Modal State
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [actionToast, setActionToast] = useState<{ message: string; type?: 'success' | 'info' } | null>(null);

  if (!isOpen) return null;

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginBlocked) return;

    const storedPin = StorageService.getAdminPin();
    const envAdminPassword = import.meta.env.VITE_ADMIN_PASSWORD;
    const inputTrimmed = passwordInput.trim();

    // Only compare against stored PIN and env variable — no hardcoded fallback in code
    const validPasswords: string[] = [
      storedPin,
      ...(envAdminPassword ? [envAdminPassword] : [])
    ].filter(Boolean);

    if (validPasswords.length === 0) {
      setAuthError('Configuration requise : définissez VITE_ADMIN_PASSWORD dans votre fichier .env');
      return;
    }

    if (validPasswords.includes(inputTrimmed)) {
      StorageService.setAdminAuthenticated(true);
      setIsAuthenticated(true);
      setAuthError('');
      setLoginAttempts(0);
    } else {
      const newAttempts = loginAttempts + 1;
      setLoginAttempts(newAttempts);
      if (newAttempts >= 5) {
        setLoginBlocked(true);
        let remaining = 30;
        setBlockTimer(remaining);
        setAuthError(`Trop de tentatives. Accès bloqué 30 secondes.`);
        const interval = setInterval(() => {
          remaining -= 1;
          setBlockTimer(remaining);
          if (remaining <= 0) {
            clearInterval(interval);
            setLoginBlocked(false);
            setLoginAttempts(0);
            setAuthError('');
          }
        }, 1000);
      } else {
        setAuthError(`Mot de passe incorrect. Tentative ${newAttempts}/5.`);
      }
    }
  };

  const handleLogout = () => {
    StorageService.setAdminAuthenticated(false);
    setIsAuthenticated(false);
    setPasswordInput('');
  };

  // Order Validation & Edit & Delete
  const handleValidatePayment = (orderId: string) => {
    const updated = StorageService.updateOrderStatus(orderId, 'paid', {
      paymentValidated: true,
      validatedBy: `${settings.gerant} (Direction Khelcom)`,
      adminNotes: 'Paiement encaissé et vérifié manuellement par la Direction.',
    });
    if (updated) {
      const refreshed = StorageService.getOrders();
      onOrdersUpdated(refreshed);
      if (selectedOrder?.id === orderId) {
        setSelectedOrder(updated);
      }
      if (viewingOrderDetails?.id === orderId) {
        setViewingOrderDetails(updated);
      }
      setActionToast({
        message: `Paiement de la commande ${updated.orderNumber} validé avec succès.`,
        type: 'success',
      });
      setTimeout(() => setActionToast(null), 3000);
    }
  };

  const handleUpdateStatus = (orderId: string, newStatus: OrderStatus) => {
    const updated = StorageService.updateOrderStatus(orderId, newStatus);
    if (updated) {
      const refreshed = StorageService.getOrders();
      onOrdersUpdated(refreshed);
      if (selectedOrder?.id === orderId) {
        setSelectedOrder(updated);
      }
      if (viewingOrderDetails?.id === orderId) {
        setViewingOrderDetails(updated);
      }
      setActionToast({
        message: `Statut mis à jour : ${getStatusBadge(newStatus).label}`,
        type: 'info',
      });
      setTimeout(() => setActionToast(null), 3000);
    }
  };

  const handleSaveOrderEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderEditForm) return;

    const subtotal = orderEditForm.items.reduce((sum, it) => sum + it.totalPrice, 0);
    const fee = Number(orderEditForm.deliveryFee) || 0;
    const totalAmount = subtotal + fee;

    const orderToSave: Order = {
      ...orderEditForm,
      deliveryFee: fee,
      subtotal,
      totalAmount,
      updatedAt: new Date().toISOString(),
    };

    const updatedList = StorageService.saveOrder(orderToSave);
    onOrdersUpdated(updatedList);
    setSelectedOrder(orderToSave);
    if (viewingOrderDetails?.id === orderToSave.id) {
      setViewingOrderDetails(orderToSave);
    }
    setActionToast({
      message: `Commande ${orderToSave.orderNumber} modifiée et enregistrée avec succès !`,
      type: 'success',
    });
    setTimeout(() => setActionToast(null), 3500);
  };

  const handleConfirmDeleteOrder = () => {
    if (!orderToDelete) return;
    const deletedNumber = orderToDelete.orderNumber;
    const updated = StorageService.deleteOrder(orderToDelete.id);
    onOrdersUpdated(updated);
    if (selectedOrder?.id === orderToDelete.id) {
      setSelectedOrder(null);
    }
    if (viewingOrderDetails?.id === orderToDelete.id) {
      setViewingOrderDetails(null);
    }
    setOrderToDelete(null);
    setActionToast({
      message: `La commande "${deletedNumber}" a été définitivement supprimée.`,
      type: 'success',
    });
    setTimeout(() => setActionToast(null), 4000);
  };

  // Product Actions
  const handleOpenAddProduct = () => {
    setProductToEdit(null);
    setIsProductModalOpen(true);
  };

  const handleOpenEditProduct = (product: Product) => {
    setProductToEdit(product);
    setIsProductModalOpen(true);
  };

  const handleDuplicateProduct = (product: Product) => {
    const duplicated: Product = {
      ...product,
      id: `prod-${Date.now()}`,
      name: `${product.name} (Copie)`,
      sku: `KB-CPY-${Math.floor(1000 + Math.random() * 9000)}`,
      createdAt: new Date().toISOString(),
      isOnline: false,
      variants: product.variants.map((v, i) => ({
        ...v,
        id: `var-${Date.now()}-${i + 1}`,
        productId: `prod-${Date.now()}`,
      })),
    };
    const updated = StorageService.upsertProduct(duplicated);
    onProductsUpdated(updated);
  };

  const handleToggleOnline = (productId: string) => {
    const updated = StorageService.toggleProductOnline(productId);
    onProductsUpdated(updated);
  };

  const handleToggleHideProduct = (product: Product) => {
    const isNowHidden = product.isHidden !== true;
    const updated = StorageService.toggleProductHidden(product.id);
    onProductsUpdated(updated);
    setActionToast({
      message: isNowHidden
        ? `Le produit "${product.name}" est désormais MASQUÉ du catalogue et de la page d'accueil.`
        : `Le produit "${product.name}" est désormais VISIBLE sur le catalogue public.`,
      type: isNowHidden ? 'info' : 'success',
    });
    setTimeout(() => {
      setActionToast(null);
    }, 4000);
  };

  const handleToggleStock = (product: Product) => {
    const updatedProduct = {
      ...product,
      inStock: !product.inStock,
    };
    const updated = StorageService.upsertProduct(updatedProduct);
    onProductsUpdated(updated);
  };

  const handleDeleteProduct = (product: Product) => {
    setProductToDelete(product);
  };

  const handleConfirmDelete = () => {
    if (!productToDelete) return;
    const deletedName = productToDelete.name;
    const updated = StorageService.deleteProduct(productToDelete.id);
    onProductsUpdated(updated);
    setProductToDelete(null);
    setActionToast({
      message: `Le produit "${deletedName}" a été retiré du catalogue avec succès.`,
      type: 'success',
    });
    setTimeout(() => {
      setActionToast(null);
    }, 4000);
  };

  const handleSaveProduct = (product: Product) => {
    const updated = StorageService.upsertProduct(product);
    onProductsUpdated(updated);
  };

  // Calculations for KPIs
  const totalRevenue = orders
    .filter((o) => o.status === 'paid' || o.status === 'delivered')
    .reduce((sum, o) => sum + o.totalAmount, 0);

  const pendingCount = orders.filter((o) => o.status === 'pending_payment').length;
  const paidCount = orders.filter((o) => o.status === 'paid' || o.status === 'delivered').length;
  const visibleProductsCount = products.filter((p) => p.isOnline !== false && p.isHidden !== true).length;
  const hiddenProductsCount = products.filter((p) => p.isHidden === true || p.isOnline === false).length;
  const inStockProductsCount = products.filter((p) => p.inStock).length;
  const totalReviewsCount = products.reduce(
    (acc, p) => acc + (p.reviewCount || (p.reviews ? p.reviews.length : 0)),
    0
  );

  const allBrands = Array.from(
    new Set([...internalBrands, ...products.map((p) => p.brand)])
  ).filter(Boolean).sort((a, b) => a.localeCompare(b, 'fr', { sensitivity: 'base' }));

  // Filter orders
  const filteredOrders = orders.filter((o) => {
    const matchesStatus = orderStatusFilter === 'all' || o.status === orderStatusFilter;
    const matchesSearch =
      !searchOrderQuery ||
      o.orderNumber.toLowerCase().includes(searchOrderQuery.toLowerCase()) ||
      o.customerName.toLowerCase().includes(searchOrderQuery.toLowerCase()) ||
      o.customerPhone.includes(searchOrderQuery);
    return matchesStatus && matchesSearch;
  });

  // Filter products
  const filteredProducts = products.filter((p) => {
    if (productCategoryFilter !== 'all' && p.category !== productCategoryFilter) {
      return false;
    }
    if (productBrandFilter !== 'all' && p.brand !== productBrandFilter) {
      return false;
    }
    if (productStatusFilter === 'visible' && (p.isOnline === false || p.isHidden === true)) return false;
    if (productStatusFilter === 'hidden' && (p.isOnline !== false && p.isHidden !== true)) return false;
    if (productStatusFilter === 'online' && p.isOnline === false) return false;
    if (productStatusFilter === 'offline' && p.isOnline !== false) return false;
    if (productStatusFilter === 'instock' && !p.inStock) return false;
    if (productStatusFilter === 'outstock' && p.inStock) return false;

    if (searchProductQuery.trim()) {
      const q = searchProductQuery.toLowerCase();
      const matchName = p.name.toLowerCase().includes(q);
      const matchBrand = p.brand.toLowerCase().includes(q);
      const matchSku = p.sku.toLowerCase().includes(q);
      const matchVariants = p.variants.some((v) => v.title.toLowerCase().includes(q));
      if (!matchName && !matchBrand && !matchSku && !matchVariants) {
        return false;
      }
    }
    return true;
  });

  return (
    <div className="min-h-screen w-full bg-[#110323] text-purple-100 flex flex-col antialiased">
      
      {/* 1. Dedicated Full-Page Top Navigation Bar */}
      <header className="sticky top-0 z-30 bg-[#180630] border-b border-purple-900/80 shadow-xl px-3 sm:px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          
          {/* Left: Return to shop button + Logo */}
          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
            <button
              type="button"
              onClick={onClose}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-orange-500 hover:bg-orange-400 text-white font-bold text-xs sm:text-sm shadow-md shadow-orange-500/20 active:scale-95 transition-all cursor-pointer shrink-0"
              title="Retourner à la boutique client"
            >
              <ArrowLeft className="w-4 h-4 shrink-0" />
              <span className="hidden xs:inline">Boutique</span>
            </button>

            <div className="h-6 w-px bg-purple-800/80 hidden sm:block"></div>

            <div className="flex items-center gap-2.5 min-w-0">
              <Logo size="sm" showText={false} />
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h1 className="text-xs sm:text-sm font-black text-white truncate tracking-tight">
                    Administration Khelcom
                  </h1>
                  <span className="hidden md:inline px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 font-bold text-[10px] border border-orange-500/30">
                    Nianing (Mbour)
                  </span>
                </div>
                <p className="text-[10px] sm:text-[11px] text-purple-300/80 truncate">
                  Direction Khelcom Business • Back-Office Gestion
                </p>
              </div>
            </div>
          </div>

          {/* Right: Actions (Logout / Shop switch) */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Supabase status indicator badge */}
            {SupabaseService.isAvailable() ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[11px] font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Supabase Cloud</span>
              </span>
            ) : (
              <span 
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[11px] font-bold"
                title="Supabase non connecté. Les annonces et produits restent enregistrés dans ce navigateur. Ajoutez les clés dans Vercel et redéployez pour publier en ligne."
              >
                <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                <span>Mode Local (Hors-Ligne)</span>
              </span>
            )}

            {isAuthenticated && (
              <button
                type="button"
                onClick={handleLogout}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-950 hover:bg-purple-900 text-purple-200 text-xs font-semibold border border-purple-800 transition-colors cursor-pointer"
                title="Verrouiller la session admin"
              >
                <LogOut className="w-3.5 h-3.5 text-purple-400" />
                <span className="hidden sm:inline">Déconnexion</span>
              </button>
            )}
            
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-purple-300 hover:text-white hover:bg-purple-900/60 transition-colors cursor-pointer"
              title="Fermer l'administration"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* 2. AUTHENTICATION VIEW (IF LOCKED) */}
      {!isAuthenticated ? (
        <main className="flex-1 flex items-center justify-center p-4 sm:p-8 bg-[#110323]">
          <div className="w-full max-w-md bg-[#190633] border border-purple-800/80 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl text-center">
            <div className="w-16 h-16 rounded-2xl bg-orange-500/10 border border-orange-500/30 text-orange-400 mx-auto flex items-center justify-center shadow-inner">
              <Lock className="w-8 h-8" />
            </div>

            <div>
              <h2 className="text-xl font-black text-white">Accès Espace Direction</h2>
              <p className="text-xs sm:text-sm text-purple-300/80 mt-1.5 leading-relaxed">
                Veuillez renseigner le mot de passe administrateur pour accéder à la gestion des commandes, des produits et des factures.
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4 text-left">
              <div>
                <label className="block text-xs font-bold text-purple-200 mb-1.5">
                  Mot de passe / Code d'accès
                </label>
                <input
                  type="password"
                  required
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#100220] border border-purple-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                  autoFocus
                />
                {authError && (
                  <p className="text-xs text-rose-400 mt-2 font-bold flex items-center gap-1">
                    <X className="w-3.5 h-3.5 shrink-0" />
                    <span>{authError}</span>
                  </p>
                )}
                <p className="text-[11px] text-purple-400/80 mt-2">
                  Accès réservé à la Direction Khelcom Business (Showroom Nianing / Mbour).
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-3 px-4 rounded-xl bg-purple-950 hover:bg-purple-900 text-purple-200 font-bold text-xs transition-all cursor-pointer text-center"
                >
                  Retour Boutique
                </button>
                <button
                  type="submit"
                  disabled={loginBlocked}
                  className={`flex-1 py-3 px-4 rounded-xl font-black text-xs transition-all shadow-md active:scale-95 text-center ${
                    loginBlocked
                      ? 'bg-gray-700 text-gray-400 cursor-not-allowed shadow-none'
                      : 'bg-orange-500 hover:bg-orange-400 text-white shadow-orange-500/20 cursor-pointer'
                  }`}
                >
                  {loginBlocked ? `Bloqué (${blockTimer}s)` : 'Déverrouiller'}
                </button>
              </div>
            </form>
          </div>
        </main>
      ) : (
        /* 3. AUTHENTICATED DASHBOARD CONTENT */
        <main className="flex-1 max-w-7xl w-full mx-auto p-2.5 sm:p-6 space-y-3.5 sm:space-y-6 flex flex-col">
          
          {/* Cloud Sync Warning if Local Mode */}
          {!SupabaseService.isAvailable() && (
            <div className="p-3.5 sm:p-4 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-200 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-amber-300">
                    Mode Local Actif (Hors Ligne Cloud)
                  </p>
                  <p className="text-amber-200/80 text-[11px] mt-0.5">
                    Vos annonces et produits sont enregistrés sur cet appareil uniquement. Pour les publier en ligne pour tous les visiteurs, assurez-vous que les clés <code className="bg-amber-950/60 px-1 py-0.5 rounded text-amber-300 font-mono">VITE_SUPABASE_URL</code> et <code className="bg-amber-950/60 px-1 py-0.5 rounded text-amber-300 font-mono">VITE_SUPABASE_ANON_KEY</code> sont ajoutées sur Vercel et cliquez sur <strong>Redeploy</strong>.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* KPI Stat Cards */}
          <section aria-label="Indicateurs clés" className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
            <div className="bg-[#190633] border border-purple-800/80 rounded-2xl p-3 sm:p-4.5 space-y-1 shadow-lg min-w-0">
              <span className="text-[9.5px] sm:text-[11px] font-bold text-purple-300/80 uppercase tracking-wider block truncate">
                CA Encaissé
              </span>
              <div className="text-sm xs:text-base sm:text-2xl font-black text-orange-400 truncate">
                {formatFCFA(totalRevenue)}
              </div>
              <span className="text-[9.5px] sm:text-[11px] text-emerald-400 font-semibold block truncate">
                {paidCount === 0 ? '0 validée (Lancement)' : `✓ ${paidCount} validée${paidCount > 1 ? 's' : ''}`}
              </span>
            </div>

            <div className="bg-[#190633] border border-purple-800/80 rounded-2xl p-3 sm:p-4.5 space-y-1 shadow-lg min-w-0">
              <span className="text-[9.5px] sm:text-[11px] font-bold text-purple-300/80 uppercase tracking-wider block truncate">
                En Attente
              </span>
              <div className="text-sm xs:text-base sm:text-2xl font-black text-amber-300">
                {pendingCount}
              </div>
              <span className="text-[9.5px] sm:text-[11px] text-orange-300 font-semibold block truncate">
                {pendingCount === 0 ? '0 à encaisser' : 'À encaisser'}
              </span>
            </div>

            <div className="bg-[#190633] border border-purple-800/80 rounded-2xl p-3 sm:p-4.5 space-y-1 shadow-lg min-w-0">
              <span className="text-[9.5px] sm:text-[11px] font-bold text-purple-300/80 uppercase tracking-wider block truncate">
                Catalogue Public
              </span>
              <div className="text-sm xs:text-base sm:text-2xl font-black text-white truncate">
                {visibleProductsCount} <span className="text-[10px] sm:text-xs text-purple-400 font-normal">/ {products.length}</span>
              </div>
              <span className={`text-[9.5px] sm:text-[11px] font-semibold block truncate ${hiddenProductsCount > 0 ? 'text-amber-300' : 'text-emerald-400'}`}>
                {products.length === 0 ? 'Catalogue vierge' : hiddenProductsCount > 0 ? `🙈 ${hiddenProductsCount} masqué(s)` : `✓ ${inStockProductsCount} en stock`}
              </span>
            </div>

            <div className="bg-[#190633] border border-purple-800/80 rounded-2xl p-3 sm:p-4.5 space-y-1 shadow-lg min-w-0">
              <span className="text-[9.5px] sm:text-[11px] font-bold text-purple-300/80 uppercase tracking-wider block truncate">
                Variantes & Tailles
              </span>
              <div className="text-sm xs:text-base sm:text-2xl font-black text-white">
                {products.reduce((acc, p) => acc + p.variants.length, 0)}
              </div>
              <span className="text-[9.5px] sm:text-[11px] text-purple-300 font-semibold block truncate">
                Capacités actives
              </span>
            </div>
          </section>

          {/* Navigation Tabs Header */}
          <div className="bg-[#180630] border border-purple-800/80 rounded-2xl p-1.5 sm:p-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 shadow-lg">
            
            {/* Tabs List */}
            <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto scrollbar-none pb-0.5 sm:pb-0 touch-pan-x">
              <button
                id="tab-orders"
                type="button"
                onClick={() => setActiveTab('orders')}
                className={`px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-1.5 sm:gap-2 shrink-0 ${
                  activeTab === 'orders'
                    ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                    : 'text-purple-200 hover:bg-purple-900/60 hover:text-white'
                }`}
              >
                <ShoppingBag className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                <span>Commandes</span>
                <span className={`px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] font-black ${
                  activeTab === 'orders' ? 'bg-[#180630] text-orange-400' : 'bg-purple-950 text-purple-300'
                }`}>
                  {orders.length}
                </span>
              </button>

              <button
                id="tab-products"
                type="button"
                onClick={() => setActiveTab('products')}
                className={`px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-1.5 sm:gap-2 shrink-0 ${
                  activeTab === 'products'
                    ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                    : 'text-purple-200 hover:bg-purple-900/60 hover:text-white'
                }`}
              >
                <Package className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                <span>Catalogue & Produits</span>
                <span className={`px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] font-black ${
                  activeTab === 'products' ? 'bg-[#180630] text-orange-400' : 'bg-purple-950 text-purple-300'
                }`}>
                  {products.length}
                </span>
              </button>

              <button
                id="tab-brands"
                type="button"
                onClick={() => setActiveTab('brands')}
                className={`px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-1.5 sm:gap-2 shrink-0 ${
                  activeTab === 'brands'
                    ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                    : 'text-purple-200 hover:bg-purple-900/60 hover:text-white'
                }`}
              >
                <Tag className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 text-orange-400" />
                <span>Marques</span>
                <span className={`px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] font-black ${
                  activeTab === 'brands' ? 'bg-[#180630] text-orange-400' : 'bg-purple-950 text-purple-300'
                }`}>
                  {internalBrands.length}
                </span>
              </button>

              <button
                id="tab-ratings"
                type="button"
                onClick={() => setActiveTab('ratings')}
                className={`px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-1.5 sm:gap-2 shrink-0 ${
                  activeTab === 'ratings'
                    ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                    : 'text-purple-200 hover:bg-purple-900/60 hover:text-white'
                }`}
              >
                <Star className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 text-amber-400" />
                <span>Avis & Notes</span>
                <span className={`px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] font-black ${
                  activeTab === 'ratings' ? 'bg-[#180630] text-amber-400' : 'bg-purple-950 text-purple-300'
                }`}>
                  {totalReviewsCount}
                </span>
              </button>

              <button
                id="tab-stats"
                type="button"
                onClick={() => setActiveTab('stats')}
                className={`px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-1.5 sm:gap-2 shrink-0 ${
                  activeTab === 'stats'
                    ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                    : 'text-purple-200 hover:bg-purple-900/60 hover:text-white'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                <span>Statistiques</span>
              </button>

              <button
                id="tab-settings"
                type="button"
                onClick={() => setActiveTab('settings')}
                className={`px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-1.5 sm:gap-2 shrink-0 ${
                  activeTab === 'settings'
                    ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                    : 'text-purple-200 hover:bg-purple-900/60 hover:text-white'
                }`}
              >
                <Settings className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                <span>Paramètres</span>
              </button>
            </div>

            {/* Quick Action Button in Tabs Bar */}
            {activeTab === 'products' && (
              <button
                id="admin-btn-add-product"
                type="button"
                onClick={handleOpenAddProduct}
                className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-white font-extrabold text-xs transition-all shadow-md shadow-orange-500/20 flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4 shrink-0" />
                <span>Ajouter un Produit</span>
              </button>
            )}
          </div>

          {/* TAB 1: ORDERS MANAGEMENT */}
          {activeTab === 'orders' && (
            <div className="space-y-4">
              
              {/* Filter controls */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 bg-[#180630] p-3 rounded-2xl border border-purple-800/80 shadow-md">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={searchOrderQuery}
                    onChange={(e) => setSearchOrderQuery(e.target.value)}
                    placeholder="Rechercher par nom, téléphone, N° KB-..."
                    className="w-full bg-[#100220] border border-purple-700 text-white rounded-xl pl-9 pr-4 py-2 text-xs focus:outline-none focus:border-orange-500"
                  />
                  <Search className="w-4 h-4 text-purple-400 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>

                <select
                  value={orderStatusFilter}
                  onChange={(e) => setOrderStatusFilter(e.target.value)}
                  className="bg-[#100220] border border-purple-700 text-purple-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-orange-500 cursor-pointer"
                >
                  <option value="all">Tous les statuts</option>
                  <option value="pending_payment">En attente de paiement</option>
                  <option value="paid">Paiement Validé</option>
                  <option value="preparing">En préparation</option>
                  <option value="delivered">Livré</option>
                  <option value="cancelled">Annulé</option>
                </select>
              </div>

              {/* Mobile Orders Cards & Desktop Table */}
              <div className="bg-[#180630] border border-purple-800/80 rounded-2xl overflow-hidden shadow-lg">
                
                {/* Desktop & Tablet Table View */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full min-w-[760px] text-left text-xs border-collapse">
                    <thead className="bg-[#120324] text-purple-300 uppercase font-mono text-[11px] border-b border-purple-900/60">
                      <tr>
                        <th className="px-4 py-3.5 whitespace-nowrap min-w-[130px]">Réf & Date</th>
                        <th className="px-4 py-3.5 whitespace-nowrap min-w-[180px]">Client & Contact</th>
                        <th className="px-4 py-3.5 whitespace-nowrap min-w-[150px]">Mode & Lieu</th>
                        <th className="px-4 py-3.5 whitespace-nowrap min-w-[120px]">Montant Net</th>
                        <th className="px-4 py-3.5 whitespace-nowrap min-w-[160px]">Statut Commande</th>
                        <th className="px-4 py-3.5 whitespace-nowrap min-w-[160px] text-right">Actions Facturation</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-purple-900/40 text-purple-100">
                      {filteredOrders.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="text-center py-12 text-purple-400">
                            Aucune commande ne correspond aux filtres.
                          </td>
                        </tr>
                      ) : (
                        filteredOrders.map((order) => {
                          const badge = getStatusBadge(order.status);
                          const isPaid = order.status === 'paid' || order.status === 'delivered';
                          return (
                            <tr key={order.id} className="hover:bg-purple-950/40 transition-colors">
                              <td className="px-4 py-3.5 font-mono whitespace-nowrap">
                                <button
                                  type="button"
                                  onClick={() => setViewingOrderDetails(order)}
                                  className="font-bold text-orange-400 hover:text-orange-300 hover:underline cursor-pointer text-left block"
                                  title="Cliquer pour afficher le bon de commande"
                                >
                                  {order.orderNumber}
                                </button>
                                <div className="text-[10px] text-purple-400/80">{formatDate(order.createdAt)}</div>
                              </td>

                              <td className="px-4 py-3.5">
                                <button
                                  type="button"
                                  onClick={() => setViewingOrderDetails(order)}
                                  className="font-bold text-white hover:text-orange-300 hover:underline cursor-pointer text-left block whitespace-nowrap"
                                  title="Cliquer pour voir les détails"
                                >
                                  {order.customerName}
                                </button>
                                <div className="text-[11px] text-purple-300 font-mono whitespace-nowrap">{order.customerPhone}</div>
                              </td>

                              <td className="px-4 py-3.5 whitespace-nowrap">
                                {order.deliveryType === 'showroom' ? (
                                  <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-orange-300">
                                    <Store className="w-3.5 h-3.5 shrink-0" /> Showroom Nianing
                                  </span>
                                ) : order.deliveryType === 'distance_delivery' ? (
                                  <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-blue-300 truncate max-w-[170px]" title={order.deliveryCity}>
                                    <Send className="w-3.5 h-3.5 shrink-0 text-blue-400" /> {order.deliveryCity || 'Livraison Distance'}
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-purple-300 truncate max-w-[170px]" title={order.deliveryCity}>
                                    <Truck className="w-3.5 h-3.5 shrink-0 text-purple-400" /> {order.deliveryCity || 'Nianing (Main à main)'}
                                  </span>
                                )}
                              </td>

                              <td className="px-4 py-3.5 font-black text-white whitespace-nowrap">
                                {formatFCFA(order.totalAmount)}
                              </td>

                              <td className="px-4 py-3.5 whitespace-nowrap align-middle">
                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold tracking-tight border whitespace-nowrap ${badge.bg} ${badge.text} ${badge.border} shadow-xs`}>
                                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${badge.dot}`} />
                                  <span>{badge.label}</span>
                                </span>
                              </td>

                              <td className="px-4 py-3.5 text-right whitespace-nowrap">
                                <div className="flex items-center justify-end gap-1.5">
                                  {/* BOUTON VOIR LE BON DE COMMANDE & DETAILS CLIENT */}
                                  <button
                                    id={`view-order-details-${order.id}`}
                                    type="button"
                                    onClick={() => setViewingOrderDetails(order)}
                                    className="p-1.5 px-2 rounded-lg bg-blue-950/80 hover:bg-blue-900 text-blue-300 hover:text-white border border-blue-800/80 transition-all cursor-pointer flex items-center gap-1 shadow-xs active:scale-95"
                                    title="Voir le Bon de Commande & Spécifications complètes du client"
                                  >
                                    <Eye className="w-3.5 h-3.5 text-blue-400" />
                                    <span className="text-[11px] font-bold hidden xl:inline">Bon de Commande</span>
                                    <span className="text-[11px] font-bold xl:hidden">Détails</span>
                                  </button>

                                  {!isPaid && order.status !== 'cancelled' && (
                                    <button
                                      id={`validate-payment-${order.id}`}
                                      type="button"
                                      onClick={() => handleValidatePayment(order.id)}
                                      className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] transition-colors flex items-center gap-1 shadow-xs cursor-pointer active:scale-95 whitespace-nowrap"
                                      title="Valider le paiement manuellement"
                                    >
                                      <Check className="w-3 h-3" />
                                      <span>Valider</span>
                                    </button>
                                  )}

                                  <button
                                    id={`pdf-order-${order.id}`}
                                    type="button"
                                    onClick={() => generateOrderInvoicePDF(order)}
                                    className="p-1.5 rounded-lg bg-purple-950 hover:bg-purple-900 text-orange-400 transition-colors border border-purple-800 cursor-pointer"
                                    title="Télécharger la Facture PDF"
                                  >
                                    <Download className="w-3.5 h-3.5" />
                                  </button>

                                  <button
                                    id={`edit-order-${order.id}`}
                                    type="button"
                                    onClick={() => setSelectedOrder(order)}
                                    className="p-1.5 rounded-lg bg-purple-950 hover:bg-purple-900 text-purple-200 hover:text-white border border-purple-800 transition-colors cursor-pointer flex items-center gap-1"
                                    title="Modifier et suivre la commande"
                                  >
                                    <FileEdit className="w-3.5 h-3.5 text-amber-400" />
                                    <span className="text-[11px] font-semibold hidden xl:inline">Modifier</span>
                                  </button>

                                  <button
                                    id={`delete-order-${order.id}`}
                                    type="button"
                                    onClick={() => setOrderToDelete(order)}
                                    className="p-1.5 rounded-lg bg-rose-950/50 hover:bg-rose-900 text-rose-400 hover:text-white border border-rose-800/60 transition-colors cursor-pointer"
                                    title="Supprimer la commande"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Cards View (Visible on Phones) */}
                <div className="md:hidden p-2.5 sm:p-4 space-y-3">
                  {filteredOrders.length === 0 ? (
                    <div className="text-center py-8 text-purple-400 text-xs">
                      Aucune commande ne correspond aux critères.
                    </div>
                  ) : (
                    filteredOrders.map((order) => {
                      const badge = getStatusBadge(order.status);
                      const isPaid = order.status === 'paid' || order.status === 'delivered';
                      return (
                        <div key={order.id} className="bg-[#120324] p-3.5 sm:p-4 rounded-2xl space-y-3 border border-purple-800/90 shadow-md">
                          {/* Card Header */}
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0 flex-1 space-y-0.5">
                              <button
                                type="button"
                                onClick={() => setViewingOrderDetails(order)}
                                className="font-mono text-xs font-black text-orange-400 hover:underline block text-left truncate tracking-tight"
                              >
                                {order.orderNumber}
                              </button>
                              <h4 className="font-bold text-white text-sm sm:text-base truncate" title={order.customerName}>
                                {order.customerName}
                              </h4>
                              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-purple-300">
                                <span className="font-mono font-medium">{order.customerPhone}</span>
                                <span className="text-[10px] text-purple-400/90">• {formatDate(order.createdAt)}</span>
                              </div>
                            </div>
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10.5px] font-bold border whitespace-nowrap shrink-0 shadow-xs ${badge.bg} ${badge.text} ${badge.border}`}>
                              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${badge.dot}`} />
                              <span>{badge.label}</span>
                            </span>
                          </div>

                          {/* Delivery & Total Row */}
                          <div className="flex items-center justify-between text-xs py-2 px-3 rounded-xl bg-[#0e021a] border border-purple-900/60 gap-2">
                            <div className="text-purple-300 text-xs flex items-center gap-1.5 min-w-0 flex-1">
                              {order.deliveryType === 'showroom' ? (
                                <>
                                  <Store className="w-3.5 h-3.5 text-orange-400 shrink-0" />
                                  <span className="truncate font-medium">Showroom Nianing</span>
                                </>
                              ) : order.deliveryType === 'distance_delivery' ? (
                                <>
                                  <Send className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                                  <span className="truncate font-medium" title={order.deliveryCity}>{order.deliveryCity || 'Livraison Distance'}</span>
                                </>
                              ) : (
                                <>
                                  <Truck className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                                  <span className="truncate font-medium" title={order.deliveryCity}>{order.deliveryCity || 'Nianing (Main à main)'}</span>
                                </>
                              )}
                            </div>
                            <div className="text-right shrink-0">
                              <span className="text-[10px] text-purple-400 block leading-none mb-0.5 font-medium">Total</span>
                              <span className="font-black text-sm sm:text-base text-white font-mono">{formatFCFA(order.totalAmount)}</span>
                            </div>
                          </div>

                          {/* Action Buttons Section - Optimized for Ergonomic Touch on Mobile */}
                          <div className="pt-1 space-y-2">
                            {/* Primary Actions Grid */}
                            <div className="grid grid-cols-2 gap-2">
                              {/* BOUTON DETAILS BON DE COMMANDE MOBILE */}
                              <button
                                id={`mobile-view-order-${order.id}`}
                                type="button"
                                onClick={() => setViewingOrderDetails(order)}
                                className="py-2.5 px-2.5 rounded-xl bg-blue-950/90 hover:bg-blue-900 text-blue-200 border border-blue-800/80 cursor-pointer transition-all flex items-center justify-center gap-1.5 shadow-xs active:scale-95 text-xs font-bold"
                                title="Voir le bon de commande et spécifications complètes"
                              >
                                <Eye className="w-4 h-4 text-blue-400 shrink-0" />
                                <span className="truncate">Bon de Commande</span>
                              </button>

                              {!isPaid && order.status !== 'cancelled' ? (
                                <button
                                  type="button"
                                  onClick={() => handleValidatePayment(order.id)}
                                  className="py-2.5 px-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer shadow-xs transition-all"
                                  title="Valider l'encaissement du paiement"
                                >
                                  <Check className="w-4 h-4 shrink-0" />
                                  <span className="truncate">Valider Paiement</span>
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => setSelectedOrder(order)}
                                  className="py-2.5 px-2.5 rounded-xl bg-purple-900/80 hover:bg-purple-800 text-purple-200 border border-purple-700/80 cursor-pointer transition-all flex items-center justify-center gap-1.5 text-xs font-bold shadow-xs active:scale-95"
                                  title="Gérer et modifier le statut de la commande"
                                >
                                  <FileEdit className="w-4 h-4 text-amber-400 shrink-0" />
                                  <span className="truncate">Suivi & Modifier</span>
                                </button>
                              )}
                            </div>

                            {/* Secondary Utilities Row */}
                            <div className="flex items-center gap-2">
                              {!isPaid && order.status !== 'cancelled' && (
                                <button
                                  type="button"
                                  onClick={() => setSelectedOrder(order)}
                                  className="flex-1 py-2 px-2 rounded-xl bg-[#180730] hover:bg-purple-900/80 text-purple-200 border border-purple-800/80 cursor-pointer transition-all flex items-center justify-center gap-1.5 text-xs font-medium active:scale-95"
                                  title="Modifier les informations de la commande"
                                >
                                  <FileEdit className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                                  <span className="truncate">Modifier</span>
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={() => generateOrderInvoicePDF(order)}
                                className="flex-1 py-2 px-2 rounded-xl bg-[#180730] hover:bg-purple-900/80 text-orange-300 border border-purple-800/80 cursor-pointer transition-all flex items-center justify-center gap-1.5 text-xs font-medium active:scale-95"
                                title="Télécharger la Facture PDF officielle"
                              >
                                <Download className="w-3.5 h-3.5 text-orange-400 shrink-0" />
                                <span className="truncate">Facture PDF</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => setOrderToDelete(order)}
                                className="py-2 px-3 rounded-xl bg-rose-950/40 hover:bg-rose-900/80 text-rose-400 border border-rose-800/60 cursor-pointer transition-all flex items-center justify-center shrink-0 active:scale-95"
                                title="Supprimer la commande"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

              </div>

            </div>
          )}

          {/* TAB 2: PRODUCTS MANAGEMENT */}
          {activeTab === 'products' && (
            <div className="space-y-4">
              
              {/* Multi-Filters Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 bg-[#180630] p-3 rounded-2xl border border-purple-800/80 shadow-md">
                <div className="relative">
                  <input
                    type="text"
                    value={searchProductQuery}
                    onChange={(e) => setSearchProductQuery(e.target.value)}
                    placeholder="Rechercher nom, marque..."
                    className="w-full bg-[#100220] border border-purple-700 text-white rounded-xl pl-9 pr-3 py-2 text-xs focus:outline-none focus:border-orange-500"
                  />
                  <Search className="w-4 h-4 text-purple-400 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>

                <select
                  value={productCategoryFilter}
                  onChange={(e) => setProductCategoryFilter(e.target.value)}
                  className="bg-[#100220] border border-purple-700 text-purple-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-orange-500 cursor-pointer"
                >
                  <option value="all">Tous les Rayons</option>
                  {CATEGORIES.filter((c) => c.id !== 'all').map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.label}
                    </option>
                  ))}
                </select>

                <select
                  value={productBrandFilter}
                  onChange={(e) => setProductBrandFilter(e.target.value)}
                  className="bg-[#100220] border border-purple-700 text-purple-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-orange-500 cursor-pointer"
                >
                  <option value="all">Toutes les Marques</option>
                  {allBrands.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>

                <select
                  value={productStatusFilter}
                  onChange={(e) => setProductStatusFilter(e.target.value as any)}
                  className="bg-[#100220] border border-purple-700 text-purple-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-orange-500 cursor-pointer"
                >
                  <option value="all">Tous les Statuts ({products.length})</option>
                  <option value="visible">👁️ Visibles au catalogue ({visibleProductsCount})</option>
                  <option value="hidden">🙈 Produits Masqués ({hiddenProductsCount})</option>
                  <option value="online">🟢 En Ligne</option>
                  <option value="offline">⚪ Hors Ligne / Brouillons</option>
                  <option value="instock">📦 En Stock ({inStockProductsCount})</option>
                  <option value="outstock">❌ En Rupture</option>
                </select>
              </div>

              {/* Products Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4">
                {filteredProducts.length === 0 ? (
                  <div className="col-span-1 md:col-span-2 text-center py-12 px-4 bg-[#180630] rounded-3xl border border-purple-800/80 shadow-lg space-y-3">
                    <Package className="w-12 h-12 text-purple-400 mx-auto mb-1 opacity-50" />
                    <p className="text-sm font-bold text-white">Aucun produit ne correspond à ces critères de recherche.</p>
                    <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setSearchProductQuery('');
                          setProductCategoryFilter('all');
                          setProductBrandFilter('all');
                          setProductStatusFilter('all');
                        }}
                        className="px-4 py-2.5 rounded-xl bg-purple-900 hover:bg-purple-800 text-purple-200 font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer border border-purple-700 transition-colors"
                      >
                        <RefreshCw className="w-3.5 h-3.5" /> Réinitialiser les filtres
                      </button>
                      <button
                        type="button"
                        onClick={handleOpenAddProduct}
                        className="px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer shadow-md transition-colors"
                      >
                        <Plus className="w-4 h-4" /> Mettre un nouveau produit en ligne
                      </button>
                    </div>
                  </div>
                ) : (
                  filteredProducts.map((prod) => {
                    const isProductOnline = prod.isOnline !== false;
                    const isProductHidden = prod.isHidden === true;
                    return (
                      <div
                        key={prod.id}
                        className={`bg-[#180630] border rounded-2xl p-4 flex flex-col justify-between transition-all shadow-md ${
                          isProductHidden
                            ? 'border-amber-500/50 bg-[#160529] ring-1 ring-amber-500/20'
                            : isProductOnline 
                              ? 'border-purple-800/80 hover:border-purple-600' 
                              : 'border-purple-950 bg-[#120320] opacity-80'
                        }`}
                      >
                        <div className="flex gap-3.5 items-start">
                          <div className="relative shrink-0">
                            <img
                              src={prod.imageUrl}
                              alt={prod.name}
                              className={`w-20 h-20 sm:w-24 sm:h-24 rounded-xl object-cover bg-purple-950 border ${
                                isProductHidden ? 'border-amber-500/40 opacity-75' : 'border-purple-800'
                              }`}
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1584992236310-6edddc08acff?auto=format&fit=crop&w=300&q=80';
                              }}
                            />
                            {prod.isFeatured && (
                              <span className="absolute -top-1.5 -left-1.5 px-1.5 py-0.5 rounded-md bg-amber-500 text-black text-[9px] font-black shadow-xs">
                                TOP
                              </span>
                            )}
                            {isProductHidden && (
                              <span className="absolute -bottom-1 -right-1 px-1.5 py-0.5 rounded-md bg-amber-500 text-slate-950 text-[9px] font-black shadow-xs flex items-center gap-0.5">
                                <EyeOff className="w-2.5 h-2.5" /> Masqué
                              </span>
                            )}
                          </div>

                          <div className="flex-1 min-w-0 space-y-1">
                            <div className="flex items-center justify-between gap-1">
                              <span className="text-[10px] font-bold text-orange-400 uppercase tracking-wider truncate">
                                {prod.brand} • {prod.categoryLabel}
                              </span>
                              <span className="text-xs font-mono text-purple-400 text-[10px] shrink-0">
                                {prod.sku}
                              </span>
                            </div>

                            <h4 className="text-xs sm:text-sm font-bold text-white truncate" title={prod.name}>
                              {prod.name}
                            </h4>

                            <div className="flex items-baseline gap-2">
                              <span className="text-sm sm:text-base font-black text-white">
                                {formatFCFA(prod.basePrice)}
                              </span>
                              {prod.originalPrice && prod.originalPrice > prod.basePrice && (
                                <span className="text-[11px] text-purple-400 line-through">
                                  {formatFCFA(prod.originalPrice)}
                                </span>
                              )}
                            </div>

                            {/* Visibility & Stock Badges */}
                            <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                              {isProductHidden ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-bold">
                                  <EyeOff className="w-3 h-3" /> Caché du catalogue
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold">
                                  <Eye className="w-3 h-3" /> Visible en boutique
                                </span>
                              )}

                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                                prod.inStock 
                                  ? 'bg-purple-950 text-purple-200 border-purple-800' 
                                  : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                              }`}>
                                {prod.inStock ? '✓ En Stock' : '❌ Rupture'}
                              </span>
                            </div>

                            <div className="flex flex-wrap gap-1 pt-0.5">
                              {prod.variants.slice(0, 2).map((v) => (
                                <span
                                  key={v.id}
                                  className="px-2 py-0.5 rounded-md bg-purple-950 text-[10px] text-purple-200 border border-purple-800 truncate max-w-[120px]"
                                >
                                  {v.title} ({v.stockQuantity} dispo)
                                </span>
                              ))}
                              {prod.variants.length > 2 && (
                                <span className="px-1.5 py-0.5 rounded-md bg-purple-950 text-[10px] text-purple-400 font-bold">
                                  +{prod.variants.length - 2}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Quick Controls */}
                        <div className="flex flex-wrap items-center justify-between pt-3 mt-3 border-t border-purple-900/50 text-xs gap-2">
                          <div className="flex flex-wrap items-center gap-1.5">
                            {/* Hide / Show direct toggle button */}
                            <button
                              type="button"
                              onClick={() => handleToggleHideProduct(prod)}
                              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 border transition-all cursor-pointer ${
                                isProductHidden
                                  ? 'bg-amber-500 text-slate-950 border-amber-400 hover:bg-amber-400 shadow-xs'
                                  : 'bg-purple-950 hover:bg-purple-900 text-purple-200 border-purple-800 hover:text-white'
                              }`}
                              title={isProductHidden ? 'Rendre à nouveau visible sur le catalogue' : 'Masquer ce produit du catalogue et de l\'accueil'}
                            >
                              {isProductHidden ? (
                                <>
                                  <Eye className="w-3 h-3 text-slate-950" />
                                  <span>Rendre Visible</span>
                                </>
                              ) : (
                                <>
                                  <EyeOff className="w-3 h-3 text-purple-400" />
                                  <span>Masquer</span>
                                </>
                              )}
                            </button>

                            <button
                              type="button"
                              onClick={() => handleToggleOnline(prod.id)}
                              className={`px-2 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 border transition-colors cursor-pointer ${
                                isProductOnline
                                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30'
                                  : 'bg-slate-800 text-slate-400 border-slate-700'
                              }`}
                              title={isProductOnline ? 'Visible en boutique' : 'Brouillon'}
                            >
                              <Globe className="w-3 h-3" />
                              <span>{isProductOnline ? 'En Ligne' : 'Brouillon'}</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleToggleStock(prod)}
                              className={`px-2 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 border transition-colors cursor-pointer ${
                                prod.inStock
                                  ? 'bg-purple-950 text-purple-200 border-purple-800'
                                  : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                              }`}
                              title={prod.inStock ? 'En stock' : 'En rupture'}
                            >
                              <Package className="w-3 h-3" />
                              <span>{prod.inStock ? 'Stock' : 'Rupture'}</span>
                            </button>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <button
                              id={`edit-prod-${prod.id}`}
                              type="button"
                              onClick={() => handleOpenEditProduct(prod)}
                              className="px-2.5 py-1 rounded-lg bg-purple-900/80 hover:bg-orange-500 text-purple-200 hover:text-white border border-purple-700/70 hover:border-orange-400 font-bold text-[10px] flex items-center gap-1 cursor-pointer transition-all active:scale-95 shadow-xs"
                              title={`Modifier les informations du produit ${prod.name}`}
                            >
                              <Edit className="w-3 h-3 text-orange-400 group-hover:text-white" />
                              <span>Modifier</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDuplicateProduct(prod)}
                              className="p-1.5 rounded-lg bg-purple-950 hover:bg-purple-900 text-purple-300 border border-purple-800 cursor-pointer transition-colors"
                              title="Dupliquer"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDeleteProduct(prod)}
                              className="p-1.5 rounded-lg bg-rose-950/50 hover:bg-rose-900/80 text-rose-300 border border-rose-800/60 cursor-pointer transition-colors active:scale-95"
                              title="Supprimer définitivement"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                      </div>
                    );
                  })
                )}
              </div>

            </div>
          )}

          {/* TAB 3: BRANDS MANAGEMENT */}
          {activeTab === 'brands' && (
            <AdminBrandsTab
              products={products}
              brands={internalBrands}
              onBrandsUpdated={handleBrandsUpdated}
              onProductsUpdated={onProductsUpdated}
              onNavigateToProductsWithBrand={(brandName) => {
                setProductBrandFilter(brandName);
                setActiveTab('products');
              }}
            />
          )}

          {/* TAB 4: RATINGS & REVIEWS MANAGEMENT */}
          {activeTab === 'ratings' && (
            <AdminRatingsTab
              products={products}
              onProductsUpdated={onProductsUpdated}
            />
          )}

          {/* TAB 5: ADVANCED STATS & EVOLUTION CHARTS */}
          {activeTab === 'stats' && (
            <AdminStatsTab
              orders={orders}
              products={products}
            />
          )}

          {/* TAB 6: SETTINGS TAB */}
          {activeTab === 'settings' && (
            <AdminSettingsTab
              settings={settings}
              onSettingsUpdated={onSettingsUpdated}
              products={products}
              onProductsUpdated={onProductsUpdated}
              orders={orders}
              onOrdersUpdated={onOrdersUpdated}
            />
          )}

        </main>
      )}

      {/* ORDER DETAIL & MODIFICATION & TRACKING POPUP */}
      {selectedOrder && orderEditForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-[#180630] border border-purple-700 rounded-3xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-purple-900/60 p-4 sm:p-5 shrink-0 bg-[#120324]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-900/60 border border-purple-700/80 flex items-center justify-center text-orange-400 shrink-0">
                  <FileEdit className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-orange-400 font-bold">{orderEditForm.orderNumber}</span>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadge(orderEditForm.status).bg} ${getStatusBadge(orderEditForm.status).text} ${getStatusBadge(orderEditForm.status).border}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${getStatusBadge(orderEditForm.status).dot}`} />
                      <span>{getStatusBadge(orderEditForm.status).label}</span>
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-white truncate max-w-[280px] sm:max-w-md">
                    Gérer & Modifier la Commande : {orderEditForm.customerName}
                  </h3>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setOrderToDelete(selectedOrder)}
                  className="p-2 rounded-xl text-rose-400 hover:text-white hover:bg-rose-900/60 border border-rose-800/40 transition-colors cursor-pointer"
                  title="Supprimer cette commande"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedOrder(null);
                    setOrderEditForm(null);
                  }}
                  className="p-2 rounded-xl text-purple-300 hover:text-white hover:bg-purple-900/60 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Scrollable Body */}
            <form onSubmit={handleSaveOrderEdit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
              
              {/* TRACKING / "CE QUI SE PASSE" TIMELINE */}
              <div className="bg-[#100220] p-4 rounded-2xl border border-purple-800/60 space-y-3">
                <div className="flex items-center justify-between border-b border-purple-900/40 pb-2">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-orange-400" />
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                      Suivi en Direct & Statut Actuel
                    </h4>
                  </div>
                  <span className="text-[11px] text-purple-300 font-mono">
                    Créée le {formatDate(orderEditForm.createdAt)}
                  </span>
                </div>

                {/* Status Stepper Tracker */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                  {[
                    { key: 'pending_payment', label: '1. Reçue', desc: 'En attente' },
                    { key: 'paid', label: '2. Encaissée', desc: 'Paiement validé' },
                    { key: 'preparing', label: '3. En Préparation', desc: 'Au showroom' },
                    { key: 'delivered', label: '4. Livrée', desc: 'Client satisfait' },
                  ].map((step) => {
                    const isCurrent = orderEditForm.status === step.key;
                    const isPassed = 
                      (step.key === 'pending_payment') ||
                      (step.key === 'paid' && ['paid', 'preparing', 'delivered'].includes(orderEditForm.status)) ||
                      (step.key === 'preparing' && ['preparing', 'delivered'].includes(orderEditForm.status)) ||
                      (step.key === 'delivered' && orderEditForm.status === 'delivered');
                    
                    return (
                      <button
                        key={step.key}
                        type="button"
                        onClick={() => setOrderEditForm((prev) => prev ? ({ ...prev, status: step.key as OrderStatus }) : null)}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                          isCurrent
                            ? 'bg-purple-900/80 border-orange-500 ring-1 ring-orange-500/50 shadow-md'
                            : isPassed
                            ? 'bg-[#15032a] border-purple-700/80 text-purple-200 hover:border-purple-500'
                            : 'bg-[#0d011a]/60 border-purple-900/40 text-purple-400/60 hover:border-purple-800'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className={`text-[11px] font-bold ${isCurrent ? 'text-orange-400' : isPassed ? 'text-white' : 'text-purple-400'}`}>
                            {step.label}
                          </span>
                          {isPassed && <Check className="w-3 h-3 text-emerald-400" />}
                        </div>
                        <span className="text-[10px] text-purple-400 block mt-0.5">{step.desc}</span>
                      </button>
                    );
                  })}
                </div>

                {orderEditForm.status === 'cancelled' && (
                  <div className="bg-rose-950/40 border border-rose-800/60 rounded-xl p-2.5 text-xs text-rose-300 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>Cette commande est actuellement marquée comme <strong>Annulée</strong>.</span>
                  </div>
                )}

                {/* Payment Validation Details */}
                {orderEditForm.paymentValidatedAt && (
                  <div className="bg-emerald-950/30 border border-emerald-800/40 rounded-xl p-2.5 text-xs text-emerald-300 flex items-center justify-between flex-wrap gap-1">
                    <span>
                      ✅ <strong>Paiement validé</strong> par {orderEditForm.paymentValidatedBy || 'Direction Khelcom'}
                    </span>
                    <span className="text-[10px] text-emerald-400/80 font-mono">
                      {formatDate(orderEditForm.paymentValidatedAt)}
                    </span>
                  </div>
                )}
              </div>

              {/* ORDER ITEMS LIST */}
              <div className="bg-[#100220] p-4 rounded-2xl border border-purple-800/60 space-y-3">
                <div className="flex items-center justify-between border-b border-purple-900/40 pb-2">
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-orange-400" />
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                      Articles Commandés ({orderEditForm.items.length})
                    </h4>
                  </div>
                  <span className="text-xs font-bold text-orange-400 font-mono">
                    Sous-total : {formatFCFA(orderEditForm.subtotal || orderEditForm.items.reduce((s, i) => s + i.totalPrice, 0))}
                  </span>
                </div>

                <div className="space-y-2">
                  {orderEditForm.items.map((it) => (
                    <div key={it.id} className="flex justify-between items-center text-xs p-2.5 rounded-xl bg-[#180630] border border-purple-800/60">
                      <div className="min-w-0 flex-1 pr-3">
                        <p className="font-bold text-white truncate">{it.productName}</p>
                        <p className="text-[11px] text-purple-300/80">{it.variantTitle} (x{it.quantity})</p>
                      </div>
                      <span className="font-black text-orange-400 font-mono shrink-0">{formatFCFA(it.totalPrice)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* EDITABLE FORM SECTION */}
              <div className="bg-[#100220] p-4 rounded-2xl border border-purple-800/60 space-y-4">
                <div className="flex items-center gap-2 border-b border-purple-900/40 pb-2">
                  <User className="w-4 h-4 text-orange-400" />
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                    Informations Client & Coordonnées (Modifiables)
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-purple-200 mb-1">
                      Nom complet du client
                    </label>
                    <input
                      type="text"
                      value={orderEditForm.customerName}
                      onChange={(e) => setOrderEditForm((prev) => prev ? ({ ...prev, customerName: e.target.value }) : null)}
                      className="w-full bg-[#180630] border border-purple-800 text-white rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-orange-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-purple-200 mb-1">
                      Téléphone
                    </label>
                    <input
                      type="text"
                      value={orderEditForm.customerPhone}
                      onChange={(e) => setOrderEditForm((prev) => prev ? ({ ...prev, customerPhone: e.target.value }) : null)}
                      className="w-full bg-[#180630] border border-purple-800 text-white font-mono rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-orange-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-purple-200 mb-1">
                      Email (Optionnel)
                    </label>
                    <input
                      type="email"
                      value={orderEditForm.customerEmail || ''}
                      onChange={(e) => setOrderEditForm((prev) => prev ? ({ ...prev, customerEmail: e.target.value }) : null)}
                      placeholder="client@domaine.com"
                      className="w-full bg-[#180630] border border-purple-800 text-white rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-orange-500"
                    />
                  </div>
                </div>
              </div>

              {/* DELIVERY & ADDRESS EDIT SECTION */}
              <div className="bg-[#100220] p-4 rounded-2xl border border-purple-800/60 space-y-4">
                <div className="flex items-center gap-2 border-b border-purple-900/40 pb-2">
                  <MapPin className="w-4 h-4 text-orange-400" />
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                    Mode & Détails de Livraison (Modifiables)
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-purple-200 mb-1">
                      Type de livraison
                    </label>
                    <select
                      value={orderEditForm.deliveryType}
                      onChange={(e) => setOrderEditForm((prev) => prev ? ({ ...prev, deliveryType: e.target.value as any }) : null)}
                      className="w-full bg-[#180630] border border-purple-800 text-white rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-orange-500 cursor-pointer"
                    >
                      <option value="showroom">Showroom Nianing (Mbour)</option>
                      <option value="delivery">Livraison Standard (Nianing / Mbour)</option>
                      <option value="distance_delivery">Livraison à Distance (Dakar & Régions)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-purple-200 mb-1">
                      Ville / Secteur
                    </label>
                    <input
                      type="text"
                      value={orderEditForm.deliveryCity || ''}
                      onChange={(e) => setOrderEditForm((prev) => prev ? ({ ...prev, deliveryCity: e.target.value }) : null)}
                      placeholder="Ex: Dakar, Mbour, Saly..."
                      className="w-full bg-[#180630] border border-purple-800 text-white rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-orange-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-purple-200 mb-1">
                      Frais de livraison (FCFA)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={orderEditForm.deliveryFee !== undefined ? orderEditForm.deliveryFee : 0}
                      onChange={(e) => setOrderEditForm((prev) => prev ? ({ ...prev, deliveryFee: Number(e.target.value) }) : null)}
                      className="w-full bg-[#180630] border border-purple-800 text-orange-400 font-bold font-mono rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-orange-500"
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <label className="block text-[11px] font-bold text-purple-200 mb-1">
                      Adresse complète ou repère de livraison
                    </label>
                    <input
                      type="text"
                      value={orderEditForm.deliveryAddress || ''}
                      onChange={(e) => setOrderEditForm((prev) => prev ? ({ ...prev, deliveryAddress: e.target.value }) : null)}
                      placeholder="Ex: Villa 42, en face de la station Total..."
                      className="w-full bg-[#180630] border border-purple-800 text-white rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-orange-500"
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <label className="block text-[11px] font-bold text-purple-200 mb-1">
                      Instructions client / Notes de livraison
                    </label>
                    <input
                      type="text"
                      value={orderEditForm.deliveryNotes || ''}
                      onChange={(e) => setOrderEditForm((prev) => prev ? ({ ...prev, deliveryNotes: e.target.value }) : null)}
                      placeholder="Ex: Appeler avant d'arriver, livraison samedi matin..."
                      className="w-full bg-[#180630] border border-purple-800 text-purple-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-orange-500"
                    />
                  </div>
                </div>
              </div>

              {/* ADMIN INTERNAL NOTES */}
              <div className="bg-[#100220] p-4 rounded-2xl border border-purple-800/60 space-y-2">
                <label className="block text-[11px] font-bold text-purple-200">
                  Notes Internes & Commentaires Administration
                </label>
                <textarea
                  rows={2}
                  value={orderEditForm.adminNotes || ''}
                  onChange={(e) => setOrderEditForm((prev) => prev ? ({ ...prev, adminNotes: e.target.value }) : null)}
                  placeholder="Notes privées pour l'équipe (ex: vérifié avec le client par téléphone, acompte versé...)"
                  className="w-full bg-[#180630] border border-purple-800 text-purple-200 rounded-xl p-2.5 text-xs focus:outline-none focus:border-orange-500 resize-none"
                />
              </div>

              {/* TOTAL RESUME BANNER */}
              <div className="bg-[#15032a] border border-purple-700/80 rounded-2xl p-3.5 flex items-center justify-between flex-wrap gap-2">
                <div className="text-xs">
                  <span className="text-purple-300">Total Commande Actualisé : </span>
                  <span className="font-mono text-purple-400">
                    ({formatFCFA(orderEditForm.items.reduce((s, i) => s + i.totalPrice, 0))} + {formatFCFA(orderEditForm.deliveryFee || 0)} livraison)
                  </span>
                </div>
                <div className="text-base font-black text-white font-mono">
                  {formatFCFA((orderEditForm.items.reduce((s, i) => s + i.totalPrice, 0)) + (Number(orderEditForm.deliveryFee) || 0))}
                </div>
              </div>

              {/* ACTIONS FOOTER */}
              <div className="flex flex-wrap gap-2.5 pt-3 border-t border-purple-900/60 justify-between items-center">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setOrderToDelete(selectedOrder)}
                    className="px-3.5 py-2 rounded-xl bg-rose-950/60 hover:bg-rose-900 text-rose-300 hover:text-white border border-rose-800/80 font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Supprimer</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => generateOrderInvoicePDF(orderEditForm)}
                    className="px-3.5 py-2 rounded-xl bg-purple-950 hover:bg-purple-900 text-orange-400 border border-purple-800 font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
                  >
                    <Download className="w-4 h-4" />
                    <span>Facture PDF</span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  {orderEditForm.status === 'pending_payment' && (
                    <button
                      type="button"
                      onClick={() => handleValidatePayment(orderEditForm.id)}
                      className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
                    >
                      <Check className="w-4 h-4" />
                      <span>Valider Paiement</span>
                    </button>
                  )}

                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-orange-500 hover:bg-orange-400 text-white font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer shadow-lg shadow-orange-950/50 active:scale-95"
                  >
                    <Save className="w-4 h-4" />
                    <span>Enregistrer les modifications</span>
                  </button>
                </div>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* ORDER DELETE CONFIRMATION MODAL */}
      {orderToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in">
          <div 
            className="bg-[#180630] border border-rose-500/50 rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150"
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/40 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-bold text-white">Supprimer la commande</h3>
                <p className="text-xs text-purple-300 mt-1">
                  Êtes-vous sûr de vouloir supprimer définitivement la commande <span className="font-mono text-orange-400 font-bold">{orderToDelete.orderNumber}</span> ?
                </p>
              </div>
            </div>

            <div className="bg-[#100220] p-3.5 rounded-xl border border-purple-900/60 space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-purple-400">Client :</span>
                <span className="font-bold text-white">{orderToDelete.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-purple-400">Téléphone :</span>
                <span className="font-mono text-purple-200">{orderToDelete.customerPhone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-purple-400">Montant total :</span>
                <span className="font-black text-orange-400">{formatFCFA(orderToDelete.totalAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-purple-400">Date :</span>
                <span className="text-purple-300">{formatDate(orderToDelete.createdAt)}</span>
              </div>
            </div>

            <p className="text-[11px] text-rose-300/90 bg-rose-950/40 p-2.5 rounded-lg border border-rose-900/50 leading-relaxed">
              ⚠️ Cette action supprimera définitivement cette commande ainsi que son historique de paiement des registres Khelcom Business.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setOrderToDelete(null)}
                className="px-4 py-2 rounded-xl bg-purple-950 hover:bg-purple-900 text-purple-200 border border-purple-800 text-xs font-semibold cursor-pointer transition-colors"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteOrder}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-lg shadow-rose-950/50 transition-colors active:scale-95"
              >
                <Trash2 className="w-4 h-4" />
                <span>Supprimer définitivement</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PRODUCT ADD / EDIT MODAL */}
      <AdminProductModal
        isOpen={isProductModalOpen}
        onClose={() => {
          setIsProductModalOpen(false);
          setProductToEdit(null);
        }}
        onSave={handleSaveProduct}
        productToEdit={productToEdit}
      />

      {/* ORDER DETAILS & BON DE COMMANDE MODAL */}
      <AdminOrderDetailsModal
        isOpen={!!viewingOrderDetails}
        order={viewingOrderDetails}
        onClose={() => setViewingOrderDetails(null)}
        onEditOrder={(ord) => {
          setViewingOrderDetails(null);
          setSelectedOrder(ord);
        }}
        onValidatePayment={handleValidatePayment}
        settings={settings}
      />

      {/* PRODUCT DELETE CONFIRMATION MODAL */}
      {productToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in">
          <div 
            className="bg-[#180630] border border-rose-500/50 rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150"
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/40 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-bold text-white">Confirmer la suppression</h3>
                <p className="text-xs text-purple-300 mt-1">
                  Êtes-vous sûr de vouloir supprimer définitivement ce produit du catalogue Khelcom Business ?
                </p>
              </div>
            </div>

            <div className="bg-[#100220] p-3 rounded-xl border border-purple-900/60 flex items-center gap-3">
              <img
                src={productToDelete.imageUrl}
                alt={productToDelete.name}
                className="w-12 h-12 rounded-lg object-cover bg-purple-950 border border-purple-800 shrink-0"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1584992236310-6edddc08acff?auto=format&fit=crop&w=300&q=80';
                }}
              />
              <div className="min-w-0 flex-1">
                <h4 className="text-xs font-bold text-white truncate">{productToDelete.name}</h4>
                <p className="text-[11px] text-orange-400 font-mono">{productToDelete.sku} • {productToDelete.brand}</p>
                <p className="text-xs font-black text-purple-200 mt-0.5">{formatFCFA(productToDelete.basePrice)}</p>
              </div>
            </div>

            <p className="text-[11px] text-rose-300/90 bg-rose-950/40 p-2.5 rounded-lg border border-rose-900/50 leading-relaxed">
              ⚠️ Cette action est irréversible et retirera immédiatement l'article ainsi que ses variantes du catalogue public.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setProductToDelete(null)}
                className="px-4 py-2 rounded-xl bg-purple-950 hover:bg-purple-900 text-purple-200 border border-purple-800 text-xs font-semibold cursor-pointer transition-colors"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-lg shadow-rose-950/50 transition-colors active:scale-95"
              >
                <Trash2 className="w-4 h-4" />
                <span>Supprimer définitivement</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Action Toast Notification */}
      {actionToast && (
        <div className="fixed bottom-6 right-6 z-50 max-w-sm bg-emerald-950/95 border border-emerald-500/60 text-emerald-200 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2.5 text-xs font-medium backdrop-blur-xs animate-in slide-in-from-bottom-3 duration-200">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="flex-1">{actionToast.message}</span>
        </div>
      )}

    </div>
  );
};
