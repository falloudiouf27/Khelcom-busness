import React, { useState, useMemo } from 'react';
import { 
  Star, 
  MessageSquare, 
  Check, 
  Trash2, 
  Search, 
  Plus, 
  Sparkles, 
  User, 
  CornerDownRight, 
  Send, 
  CheckCircle2, 
  ShieldCheck, 
  Filter, 
  MapPin, 
  Eye, 
  X, 
  ThumbsUp, 
  Award,
  AlertCircle,
  ExternalLink,
  MessageCircle
} from 'lucide-react';
import { Product, ProductReview } from '../types';
import { StorageService } from '../services/storage';
import { formatDate } from '../utils/formatters';

interface AdminRatingsTabProps {
  products: Product[];
  onProductsUpdated: (products: Product[]) => void;
}

export const AdminRatingsTab: React.FC<AdminRatingsTabProps> = ({
  products,
  onProductsUpdated,
}) => {
  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStarFilter, setSelectedStarFilter] = useState<number | 'all'>('all');
  const [selectedProductFilter, setSelectedProductFilter] = useState<string>('all');
  const [replyingReviewId, setReplyingReviewId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState<string>('');
  
  // Add Review Modal
  const [isAddReviewModalOpen, setIsAddReviewModalOpen] = useState(false);
  const [newReviewForm, setNewReviewForm] = useState({
    productId: products[0]?.id || '',
    userName: '',
    userCity: 'Nianing',
    rating: 5,
    comment: '',
    verifiedPurchase: true,
  });

  // Success / Action notification
  const [notification, setNotification] = useState<{ message: string; type?: 'success' | 'info' } | null>(null);

  const showToast = (message: string, type: 'success' | 'info' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3500);
  };

  // Compile all reviews with associated product metadata
  const allReviewsWithProduct = useMemo(() => {
    const list: {
      review: ProductReview;
      productId: string;
      productName: string;
      productBrand: string;
      productCategory: string;
      productSku: string;
      productImage: string;
    }[] = [];

    products.forEach((p) => {
      if (Array.isArray(p.reviews) && p.reviews.length > 0) {
        p.reviews.forEach((r) => {
          list.push({
            review: r,
            productId: p.id,
            productName: p.name,
            productBrand: p.brand,
            productCategory: p.categoryLabel || p.category,
            productSku: p.sku,
            productImage: p.imageUrl,
          });
        });
      }
    });

    return list.sort((a, b) => new Date(b.review.createdAt).getTime() - new Date(a.review.createdAt).getTime());
  }, [products]);

  // Global KPIs calculation
  const totalReviewsCount = allReviewsWithProduct.length;
  const averageGlobalRating = totalReviewsCount > 0
    ? (allReviewsWithProduct.reduce((acc, item) => acc + item.review.rating, 0) / totalReviewsCount).toFixed(1)
    : '5.0';

  const fiveStarCount = allReviewsWithProduct.filter((i) => Math.round(i.review.rating) === 5).length;
  const fourStarCount = allReviewsWithProduct.filter((i) => Math.round(i.review.rating) === 4).length;
  const threeStarCount = allReviewsWithProduct.filter((i) => Math.round(i.review.rating) === 3).length;
  const twoStarCount = allReviewsWithProduct.filter((i) => Math.round(i.review.rating) === 2).length;
  const oneStarCount = allReviewsWithProduct.filter((i) => Math.round(i.review.rating) === 1).length;

  const satisfiedCount = fiveStarCount + fourStarCount;
  const satisfactionRate = totalReviewsCount > 0
    ? Math.round((satisfiedCount / totalReviewsCount) * 100)
    : 100;

  // Filtered reviews
  const filteredReviews = useMemo(() => {
    return allReviewsWithProduct.filter((item) => {
      // Star filter
      if (selectedStarFilter !== 'all' && Math.round(item.review.rating) !== selectedStarFilter) {
        return false;
      }
      // Product filter
      if (selectedProductFilter !== 'all' && item.productId !== selectedProductFilter) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchUser = item.review.userName.toLowerCase().includes(q);
        const matchComment = (item.review.comment || '').toLowerCase().includes(q);
        const matchProduct = item.productName.toLowerCase().includes(q);
        const matchCity = (item.review.userCity || '').toLowerCase().includes(q);
        if (!matchUser && !matchComment && !matchProduct && !matchCity) {
          return false;
        }
      }
      return true;
    });
  }, [allReviewsWithProduct, selectedStarFilter, selectedProductFilter, searchQuery]);

  // Product rating leaderboard
  const productsWithReviews = useMemo(() => {
    return products
      .filter((p) => (p.reviewCount || 0) > 0)
      .sort((a, b) => (b.rating || 0) - (a.rating || 0));
  }, [products]);

  // Handlers
  const handleDeleteReview = (productId: string, reviewId: string, authorName: string) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer l'avis de ${authorName} ?`)) {
      const res = StorageService.deleteProductReview(productId, reviewId);
      if (res.success && res.products) {
        onProductsUpdated(res.products);
        showToast(`L'avis de "${authorName}" a été supprimé.`, 'info');
      }
    }
  };

  const handleToggleFeature = (productId: string, reviewId: string) => {
    const res = StorageService.toggleFeatureReview(productId, reviewId);
    if (res.success && res.products) {
      onProductsUpdated(res.products);
      showToast('Statut de mise en avant mis à jour !', 'success');
    }
  };

  const handleSaveReply = (productId: string, reviewId: string) => {
    if (!replyText.trim()) return;
    const res = StorageService.replyToProductReview(productId, reviewId, replyText.trim(), 'Direction Khelcom');
    if (res.success && res.products) {
      onProductsUpdated(res.products);
      setReplyingReviewId(null);
      setReplyText('');
      showToast('Réponse officielle publiée avec succès !', 'success');
    }
  };

  const handleAddManualReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReviewForm.productId || !newReviewForm.userName.trim()) return;

    const res = StorageService.addProductReview(newReviewForm.productId, {
      userName: newReviewForm.userName.trim(),
      rating: Number(newReviewForm.rating),
      comment: newReviewForm.comment.trim(),
      ...(newReviewForm.userCity ? { userCity: newReviewForm.userCity.trim() } : {}),
      verifiedPurchase: newReviewForm.verifiedPurchase,
    } as any);

    if (res.success) {
      const updatedProducts = StorageService.getProducts();
      onProductsUpdated(updatedProducts);
      setIsAddReviewModalOpen(false);
      setNewReviewForm({
        productId: products[0]?.id || '',
        userName: '',
        userCity: 'Nianing',
        rating: 5,
        comment: '',
        verifiedPurchase: true,
      });
      showToast('Nouvel avis client enregistré dans la boutique !', 'success');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Toast Notification */}
      {notification && (
        <div className={`p-3.5 rounded-2xl flex items-center gap-3 text-xs font-bold shadow-lg transition-all ${
          notification.type === 'info' 
            ? 'bg-purple-900 border border-purple-700 text-purple-200' 
            : 'bg-emerald-950/90 border border-emerald-700 text-emerald-200'
        }`}>
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{notification.message}</span>
        </div>
      )}

      {/* Top Banner & Action */}
      <div className="bg-[#180630] border border-purple-800/80 rounded-3xl p-5 sm:p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-orange-500/20 text-orange-400 border border-orange-500/30">
              <Star className="w-5 h-5 fill-orange-400" />
            </div>
            <h2 className="text-base sm:text-lg font-black text-white">
              Système de Gestion des Notes & Avis Clients
            </h2>
          </div>
          <p className="text-xs text-purple-300/80 max-w-2xl">
            Modérez les retours d'expérience, répondez directement aux acheteurs au nom de la direction de Khelcom Business, et valorisez la satisfaction client sur vos fiches produits.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsAddReviewModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-white font-extrabold text-xs shadow-lg shadow-orange-500/20 active:scale-95 transition-all cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Ajouter un Avis Vérifié</span>
        </button>
      </div>

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-[#180630] border border-purple-800/80 rounded-2xl p-4 sm:p-5 space-y-1.5 shadow-md">
          <span className="text-[11px] font-bold text-purple-300 uppercase tracking-wider block">
            Note Moyenne Globale
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-orange-400">{averageGlobalRating}</span>
            <span className="text-xs text-purple-300">/ 5.0</span>
          </div>
          <div className="flex items-center gap-1 text-amber-400 pt-0.5">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star key={s} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            ))}
          </div>
        </div>

        <div className="bg-[#180630] border border-purple-800/80 rounded-2xl p-4 sm:p-5 space-y-1.5 shadow-md">
          <span className="text-[11px] font-bold text-purple-300 uppercase tracking-wider block">
            Total des Évaluations
          </span>
          <div className="text-2xl sm:text-3xl font-black text-white">
            {totalReviewsCount}
          </div>
          <p className="text-[11px] text-purple-300/80">
            Sur {productsWithReviews.length} produit(s) évalué(s)
          </p>
        </div>

        <div className="bg-[#180630] border border-purple-800/80 rounded-2xl p-4 sm:p-5 space-y-1.5 shadow-md">
          <span className="text-[11px] font-bold text-purple-300 uppercase tracking-wider block">
            Taux de Satisfaction
          </span>
          <div className="text-2xl sm:text-3xl font-black text-emerald-400">
            {satisfactionRate}%
          </div>
          <p className="text-[11px] text-emerald-300/80">
            Notes positives (4★ & 5★)
          </p>
        </div>

        <div className="bg-[#180630] border border-purple-800/80 rounded-2xl p-4 sm:p-5 space-y-1.5 shadow-md">
          <span className="text-[11px] font-bold text-purple-300 uppercase tracking-wider block">
            Avis Mis en Avant
          </span>
          <div className="text-2xl sm:text-3xl font-black text-amber-300">
            {allReviewsWithProduct.filter((i) => i.review.isFeatured).length}
          </div>
          <p className="text-[11px] text-purple-300/80">
            Épinglés en tête des avis
          </p>
        </div>
      </div>

      {/* Star Distribution Breakdown & Leaderboard */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        
        {/* Left: Star Progress Distribution */}
        <div className="bg-[#180630] border border-purple-800/80 rounded-3xl p-5 sm:p-6 space-y-4 shadow-md">
          <h3 className="text-sm font-bold text-white flex items-center justify-between">
            <span>Répartition des Notes</span>
            <span className="text-xs text-purple-400 font-normal">{totalReviewsCount} avis</span>
          </h3>

          <div className="space-y-2.5">
            {[
              { star: 5, count: fiveStarCount, color: 'bg-amber-400' },
              { star: 4, count: fourStarCount, color: 'bg-amber-500' },
              { star: 3, count: threeStarCount, color: 'bg-yellow-500' },
              { star: 2, count: twoStarCount, color: 'bg-orange-500' },
              { star: 1, count: oneStarCount, color: 'bg-rose-500' },
            ].map((item) => {
              const pct = totalReviewsCount > 0 ? Math.round((item.count / totalReviewsCount) * 100) : 0;
              return (
                <div key={item.star} className="flex items-center gap-3 text-xs">
                  <button
                    type="button"
                    onClick={() => setSelectedStarFilter(selectedStarFilter === item.star ? 'all' : item.star)}
                    className="w-12 font-bold text-purple-200 flex items-center gap-1 hover:text-orange-400 transition-colors cursor-pointer"
                  >
                    <span>{item.star}</span>
                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                  </button>

                  <div className="flex-1 h-3 bg-[#100220] rounded-full overflow-hidden border border-purple-900/60 p-0.5">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${item.color}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>

                  <div className="w-16 text-right font-mono text-purple-300 text-[11px]">
                    <span className="font-bold text-white">{item.count}</span>{' '}
                    <span className="text-purple-400 text-[10px]">({pct}%)</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-2 border-t border-purple-900/60 text-[11px] text-purple-300/80 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Tous les avis clients sont authentifiés et vérifiables.</span>
          </div>
        </div>

        {/* Right: Products Rating Leaderboard */}
        <div className="lg:col-span-2 bg-[#180630] border border-purple-800/80 rounded-3xl p-5 sm:p-6 space-y-4 shadow-md flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center justify-between mb-3">
              <span>Top Produits par Satisfaction Client</span>
              <span className="text-xs text-orange-400 font-semibold">Classement Catalogue</span>
            </h3>

            <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
              {productsWithReviews.length === 0 ? (
                <p className="text-xs text-purple-400 py-6 text-center">Aucun produit n'a encore reçu d'avis.</p>
              ) : (
                productsWithReviews.map((prod, idx) => (
                  <div
                    key={prod.id}
                    className="p-3 rounded-2xl bg-[#100220] border border-purple-800/60 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="w-6 h-6 rounded-lg bg-purple-900/80 border border-purple-700 text-orange-400 font-bold flex items-center justify-center text-xs shrink-0">
                        #{idx + 1}
                      </span>
                      <img
                        src={prod.imageUrl}
                        alt={prod.name}
                        className="w-10 h-10 rounded-xl object-cover bg-purple-950 border border-purple-800 shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="font-bold text-white truncate max-w-[200px] sm:max-w-xs">{prod.name}</p>
                        <p className="text-[11px] text-purple-400">{prod.brand} • {prod.categoryLabel}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <div className="flex items-center gap-1 font-bold text-orange-400">
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                          <span>{prod.rating || '5.0'}</span>
                        </div>
                        <span className="text-[10px] text-purple-400 font-medium">
                          {prod.reviewCount} avis
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setSelectedProductFilter(prod.id);
                          setSearchQuery('');
                        }}
                        className="p-1.5 rounded-xl bg-purple-900/60 hover:bg-purple-800 text-purple-200 transition-colors cursor-pointer"
                        title="Filtrer les avis de ce produit"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-2 border-t border-purple-900/60 flex items-center justify-between text-xs text-purple-300">
            <span>{products.length - productsWithReviews.length} produit(s) sans avis pour le moment.</span>
            {selectedProductFilter !== 'all' && (
              <button
                type="button"
                onClick={() => setSelectedProductFilter('all')}
                className="text-orange-400 hover:underline font-bold text-[11px] cursor-pointer"
              >
                Réinitialiser le filtre produit
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Reviews Feed Section */}
      <div className="bg-[#180630] border border-purple-800/80 rounded-3xl p-5 sm:p-6 space-y-4 shadow-xl">
        
        {/* Search & Filter Bar */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 border-b border-purple-900/60 pb-4">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-purple-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher par client, commentaire, ville ou produit..."
              className="w-full bg-[#100220] border border-purple-800 text-white rounded-2xl pl-10 pr-4 py-2.5 text-xs focus:outline-none focus:border-orange-500 placeholder-purple-500"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-purple-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Stars filter pills */}
            <div className="flex items-center gap-1 bg-[#100220] p-1 rounded-2xl border border-purple-800/80">
              <button
                type="button"
                onClick={() => setSelectedStarFilter('all')}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  selectedStarFilter === 'all' ? 'bg-orange-500 text-white' : 'text-purple-300 hover:text-white'
                }`}
              >
                Toutes
              </button>
              {[5, 4, 3, 2, 1].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSelectedStarFilter(s)}
                  className={`px-2 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
                    selectedStarFilter === s ? 'bg-orange-500 text-white' : 'text-purple-300 hover:text-white'
                  }`}
                >
                  <span>{s}</span>
                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                </button>
              ))}
            </div>

            {/* Product filter dropdown */}
            <select
              value={selectedProductFilter}
              onChange={(e) => setSelectedProductFilter(e.target.value)}
              className="bg-[#100220] border border-purple-800 text-white rounded-2xl px-3 py-2 text-xs focus:outline-none focus:border-orange-500 max-w-[200px]"
            >
              <option value="all">Tous les produits ({products.length})</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name.length > 30 ? p.name.substring(0, 30) + '...' : p.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Reviews List */}
        <div className="space-y-4 pt-2">
          {filteredReviews.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-purple-900/40 border border-purple-800 text-purple-400 mx-auto flex items-center justify-center">
                <MessageSquare className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-white">Aucun avis ne correspond aux filtres sélectionnés.</p>
              <p className="text-xs text-purple-400 max-w-sm mx-auto">
                Modifiez vos critères de recherche ou ajoutez manuellement une nouvelle note client.
              </p>
            </div>
          ) : (
            filteredReviews.map((item) => {
              const isReplying = replyingReviewId === item.review.id;

              return (
                <div
                  key={item.review.id}
                  className={`p-4 sm:p-5 rounded-3xl border transition-all ${
                    item.review.isFeatured
                      ? 'bg-[#1a0536] border-orange-500/80 shadow-md ring-1 ring-orange-500/30'
                      : 'bg-[#100220] border-purple-800/70 hover:border-purple-600'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    
                    {/* Author & Product Info */}
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-800 to-indigo-900 border border-purple-700 flex items-center justify-center text-white font-black text-sm shrink-0 shadow-inner">
                        {item.review.userName.charAt(0).toUpperCase()}
                      </div>

                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="font-extrabold text-white text-sm">
                            {item.review.userName}
                          </h4>
                          {item.review.userCity && (
                            <span className="flex items-center gap-1 text-[11px] text-purple-300 font-medium">
                              <MapPin className="w-3 h-3 text-orange-400" />
                              <span>{item.review.userCity}</span>
                            </span>
                          )}
                          {item.review.verifiedPurchase !== false && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-700 text-[10px] font-bold">
                              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                              <span>Achat Vérifié Khelcom</span>
                            </span>
                          )}
                          {item.review.isFeatured && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-black">
                              <Sparkles className="w-3 h-3 text-amber-400" />
                              <span>Mis en Avant</span>
                            </span>
                          )}
                        </div>

                        {/* Star Rating Display */}
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-0.5">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`w-3.5 h-3.5 ${
                                  star <= Math.round(item.review.rating)
                                    ? 'fill-amber-400 text-amber-400'
                                    : 'text-purple-700'
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-xs font-bold text-orange-400">
                            {item.review.rating}/5
                          </span>
                          <span className="text-[11px] text-purple-400 font-mono">
                            • {formatDate(item.review.createdAt)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Product Card Pill */}
                    <div className="p-2 sm:p-2.5 rounded-2xl bg-[#180630] border border-purple-800/80 flex items-center gap-2.5 shrink-0 max-w-xs">
                      <img
                        src={item.productImage}
                        alt={item.productName}
                        className="w-9 h-9 rounded-xl object-cover bg-purple-950 border border-purple-800 shrink-0"
                      />
                      <div className="min-w-0">
                        <span className="text-[10px] text-orange-400 font-bold uppercase tracking-wider block">
                          Produit concerné
                        </span>
                        <p className="text-xs font-bold text-white truncate max-w-[170px]">
                          {item.productName}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Review Text */}
                  {item.review.comment && (
                    <div className="mt-3 text-xs sm:text-sm text-purple-100/90 leading-relaxed bg-[#140329] p-3.5 rounded-2xl border border-purple-900/60 font-medium">
                      "{item.review.comment}"
                    </div>
                  )}

                  {/* Official Store Manager Reply (if exists) */}
                  {item.review.adminReply && (
                    <div className="mt-3 pl-3 sm:pl-4 border-l-2 border-orange-500 space-y-1 bg-orange-950/20 p-3 rounded-2xl border border-orange-500/30">
                      <div className="flex items-center justify-between text-xs font-bold text-orange-400">
                        <div className="flex items-center gap-1.5">
                          <CornerDownRight className="w-3.5 h-3.5" />
                          <span>{item.review.adminReply.repliedBy || 'Direction Khelcom'}</span>
                        </div>
                        <span className="text-[10px] text-purple-400 font-mono font-normal">
                          {formatDate(item.review.adminReply.repliedAt)}
                        </span>
                      </div>
                      <p className="text-xs text-purple-200">
                        {item.review.adminReply.text}
                      </p>
                    </div>
                  )}

                  {/* Inline Reply Form */}
                  {isReplying && (
                    <div className="mt-3 p-3.5 rounded-2xl bg-[#180630] border border-orange-500/80 space-y-2.5 animate-in fade-in">
                      <div className="flex items-center justify-between text-xs font-bold text-white">
                        <span>Répondre à {item.review.userName} (Réponse publique)</span>
                        <button
                          type="button"
                          onClick={() => setReplyingReviewId(null)}
                          className="text-purple-400 hover:text-white"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <textarea
                        rows={2}
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Ex: Merci pour votre confiance ! Nous sommes ravis que le produit vous convienne. Au plaisir de vous revoir à notre showroom de Nianing !"
                        className="w-full bg-[#100220] border border-purple-700 text-white rounded-xl p-2.5 text-xs focus:outline-none focus:border-orange-500 placeholder-purple-500"
                        autoFocus
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setReplyingReviewId(null)}
                          className="px-3 py-1.5 rounded-xl bg-purple-950 text-purple-300 text-xs font-bold hover:bg-purple-900"
                        >
                          Annuler
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSaveReply(item.productId, item.review.id)}
                          className="px-3.5 py-1.5 rounded-xl bg-orange-500 hover:bg-orange-400 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md shadow-orange-500/20"
                        >
                          <Send className="w-3 h-3" />
                          <span>Publier la réponse</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Actions Toolbar */}
                  <div className="mt-3 pt-3 border-t border-purple-900/60 flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2">
                      {!isReplying && (
                        <button
                          type="button"
                          onClick={() => {
                            setReplyingReviewId(item.review.id);
                            setReplyText(item.review.adminReply?.text || '');
                          }}
                          className="px-3 py-1.5 rounded-xl bg-purple-900/70 hover:bg-purple-800 text-purple-200 hover:text-white font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
                        >
                          <MessageCircle className="w-3.5 h-3.5 text-orange-400" />
                          <span>{item.review.adminReply ? 'Modifier la réponse' : 'Répondre'}</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => handleToggleFeature(item.productId, item.review.id)}
                        className={`px-3 py-1.5 rounded-xl font-semibold transition-colors flex items-center gap-1.5 cursor-pointer ${
                          item.review.isFeatured
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30'
                            : 'bg-purple-900/50 text-purple-300 hover:bg-purple-800 hover:text-white'
                        }`}
                      >
                        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                        <span>{item.review.isFeatured ? 'Détacher (En avant)' : 'Mettre en avant'}</span>
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteReview(item.productId, item.review.id, item.review.userName)}
                      className="px-2.5 py-1.5 rounded-xl text-rose-400 hover:text-white hover:bg-rose-950/80 border border-rose-900/50 transition-colors flex items-center gap-1 cursor-pointer"
                      title="Supprimer cet avis"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Supprimer</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Modal: Add Manual / Verified Review */}
      {isAddReviewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs animate-in fade-in">
          <div className="bg-[#180630] border border-purple-700 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden">
            
            {/* Modal Header */}
            <div className="p-4 sm:p-5 bg-[#120324] border-b border-purple-900/80 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-orange-500/20 border border-orange-500/30 text-orange-400 flex items-center justify-center">
                  <Star className="w-5 h-5 fill-orange-400" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-black text-white">Ajouter un Avis Client Vérifié</h3>
                  <p className="text-[11px] text-purple-300/80">Enregistrement d'un retour client reçu au showroom ou sur WhatsApp</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddReviewModalOpen(false)}
                className="p-1.5 rounded-xl text-purple-300 hover:text-white hover:bg-purple-900/60"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleAddManualReview} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-purple-200 mb-1">
                  Produit concerné *
                </label>
                <select
                  required
                  value={newReviewForm.productId}
                  onChange={(e) => setNewReviewForm({ ...newReviewForm, productId: e.target.value })}
                  className="w-full bg-[#100220] border border-purple-700 text-white rounded-xl px-3 py-2.5 focus:outline-none focus:border-orange-500"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.brand} - {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-purple-200 mb-1">
                    Nom du client *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Modou Sène"
                    value={newReviewForm.userName}
                    onChange={(e) => setNewReviewForm({ ...newReviewForm, userName: e.target.value })}
                    className="w-full bg-[#100220] border border-purple-700 text-white rounded-xl px-3 py-2.5 focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-purple-200 mb-1">
                    Ville ou Localité
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Nianing / Mbour"
                    value={newReviewForm.userCity}
                    onChange={(e) => setNewReviewForm({ ...newReviewForm, userCity: e.target.value })}
                    className="w-full bg-[#100220] border border-purple-700 text-white rounded-xl px-3 py-2.5 focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-purple-200 mb-1">
                  Note attribuée * (1 à 5 étoiles)
                </label>
                <div className="flex items-center gap-2 bg-[#100220] p-2.5 rounded-xl border border-purple-700">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setNewReviewForm({ ...newReviewForm, rating: s })}
                      className="p-1 cursor-pointer transition-transform hover:scale-110"
                    >
                      <Star
                        className={`w-6 h-6 ${
                          s <= newReviewForm.rating
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-purple-800'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="ml-2 font-bold text-orange-400 text-sm">{newReviewForm.rating} / 5 étoiles</span>
                </div>
              </div>

              <div>
                <label className="block font-bold text-purple-200 mb-1">
                  Commentaire / Retour d'expérience
                </label>
                <textarea
                  rows={3}
                  placeholder="Ex: Produit de très haute qualité, acheté au magasin de Nianing. Équipe très accueillante !"
                  value={newReviewForm.comment}
                  onChange={(e) => setNewReviewForm({ ...newReviewForm, comment: e.target.value })}
                  className="w-full bg-[#100220] border border-purple-700 text-white rounded-xl p-3 focus:outline-none focus:border-orange-500 placeholder-purple-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="verified-check"
                  checked={newReviewForm.verifiedPurchase}
                  onChange={(e) => setNewReviewForm({ ...newReviewForm, verifiedPurchase: e.target.checked })}
                  className="accent-orange-500 cursor-pointer"
                />
                <label htmlFor="verified-check" className="text-purple-200 cursor-pointer select-none">
                  Marquer comme <strong>Achat vérifié</strong> (Badge de confiance)
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-purple-900/60">
                <button
                  type="button"
                  onClick={() => setIsAddReviewModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-purple-950 text-purple-300 font-bold hover:bg-purple-900"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-white font-black shadow-md shadow-orange-500/20 active:scale-95 transition-all cursor-pointer"
                >
                  Enregistrer l'avis
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
