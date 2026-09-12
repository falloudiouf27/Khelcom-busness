import React, { useState, useEffect } from 'react';
import { 
  X, 
  ShoppingBag, 
  MessageCircle, 
  ShieldCheck, 
  Truck, 
  Store, 
  Check, 
  Info, 
  ChevronRight, 
  Layers, 
  Sparkles, 
  Plus, 
  Minus, 
  AlertTriangle, 
  AlertCircle,
  Star,
  Lock
} from 'lucide-react';
import { Product, ProductVariant, CartItem } from '../types';
import { formatFCFA } from '../utils/formatters';
import { SHOWROOM_INFO } from '../data/senegalLocations';
import { getColorHex } from '../utils/colors';
import { ProductReviewsSection } from './ProductReviewsSection';

interface ProductDetailModalProps {
  product: Product | null;
  onClose: () => void;
  onAddToCart: (product: Product, variant: ProductVariant, quantity: number) => void;
  onDirectBuy?: (product: Product, variant: ProductVariant, quantity: number) => void;
  cart?: CartItem[];
  onProductUpdated?: (updatedProduct: Product) => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  onClose,
  onAddToCart,
  onDirectBuy,
  cart = [],
  onProductUpdated,
}) => {
  // Selected variant state - prefer variant with available stock > 0
  const defaultVar = 
    product?.variants.find((v) => (Number(v.stockQuantity) || 0) > 0) || 
    product?.variants.find((v) => v.isDefault) || 
    product?.variants[0];

  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | undefined>(defaultVar);
  const [activeImage, setActiveImage] = useState<string>(
    defaultVar?.imageUrl || product?.imageUrl || ''
  );
  const [quantity, setQuantity] = useState<number>(1);
  const [addedAnimation, setAddedAnimation] = useState<boolean>(false);

  // Sync state if product changes
  useEffect(() => {
    if (!product) return;
    const initialVar = 
      product.variants.find((v) => (Number(v.stockQuantity) || 0) > 0) || 
      product.variants.find((v) => v.isDefault) || 
      product.variants[0];
    setSelectedVariant(initialVar);
    setActiveImage(initialVar?.imageUrl || product.imageUrl);
    setQuantity(1);
  }, [product]);

  if (!product || !selectedVariant) return null;

  const variantStock = Number(selectedVariant?.stockQuantity) || 0;
  const isOutOfStock = !product.inStock || variantStock <= 0;
  const isLowStock = !isOutOfStock && variantStock <= 3;

  // How many already in cart for this specific variant
  const cartItem = cart.find(
    (item) => item.product.id === product.id && item.selectedVariant.id === selectedVariant?.id
  );
  const qtyInCart = cartItem ? cartItem.quantity : 0;
  const remainingStockForUser = Math.max(0, variantStock - qtyInCart);
  const isMaxInCart = variantStock > 0 && qtyInCart >= variantStock;

  const handleVariantChange = (variant: ProductVariant) => {
    const newVariantStock = Number(variant.stockQuantity) || 0;
    if (newVariantStock <= 0) return; // Guard: Cannot select out-of-stock variant

    setSelectedVariant(variant);
    if (variant.imageUrl) {
      setActiveImage(variant.imageUrl);
    }
    if (quantity > newVariantStock) {
      setQuantity(newVariantStock);
    }
  };

  const handleAddToCart = () => {
    if (isOutOfStock || isMaxInCart || variantStock <= 0) return;
    const qtyToAdd = Math.min(quantity, Math.max(1, remainingStockForUser));
    onAddToCart(product, selectedVariant, qtyToAdd);
    setAddedAnimation(true);
    setTimeout(() => setAddedAnimation(false), 2000);
  };

  const handleDirectBuyClick = () => {
    if (isOutOfStock || variantStock <= 0) return;
    const qtyToBuy = Math.min(quantity, Math.max(1, variantStock));
    if (typeof onDirectBuy === 'function') {
      onDirectBuy(product, selectedVariant, qtyToBuy);
    } else {
      onAddToCart(product, selectedVariant, qtyToBuy);
    }
    onClose();
  };

  const handleWhatsAppOrder = () => {
    const text = isOutOfStock
      ? `Bonjour Khelcom Business, je constate que le produit suivant est en rupture de stock :\n\n• Produit : ${product.name}\n• Marque : ${product.brand}\n• Variante : ${selectedVariant.title}\n\nPouvez-vous me prévenir dès réapprovisionnement ou proposer un modèle équivalent ?`
      : `Bonjour Khelcom Business, je souhaite commander :\n\n• Produit : ${product.name}\n• Marque : ${product.brand}\n• Variante choisie : ${selectedVariant.title}\n• Quantité : ${quantity}\n• Prix Total : ${formatFCFA(selectedVariant.price * quantity)}\n\nEst-ce disponible au Showroom (Nianing) ou pour livraison ?`;
    const encoded = encodeURIComponent(text);
    window.open(`https://wa.me/${SHOWROOM_INFO.whatsappRaw}?text=${encoded}`, '_blank');
  };

  const gallery = product.galleryUrls.length > 0 ? product.galleryUrls : [product.imageUrl];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto">
      <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-0 sm:my-auto border border-slate-200">
        
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-purple-900/40 bg-[#1e0a3c] text-white">
          <div className="flex items-center gap-2 text-xs font-semibold text-purple-200">
            <span>{product.brand}</span>
            <ChevronRight className="w-3.5 h-3.5 text-orange-400" />
            <span className="text-orange-400 font-bold">{product.categoryLabel}</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-purple-300 hover:text-white hover:bg-purple-900/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-7">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 sm:gap-8">
            
            {/* Left Column: Image Gallery */}
            <div className="md:col-span-6 space-y-4">
              <div className="relative aspect-square rounded-2xl bg-slate-50 border border-slate-100 overflow-hidden shadow-inner">
                <img
                  src={activeImage}
                  alt={product.name}
                  className={`w-full h-full object-cover object-center transition-all duration-300 ${
                    isOutOfStock ? 'grayscale-30' : ''
                  }`}
                />
                <span className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-slate-900/90 text-white text-xs font-bold shadow-md">
                  {product.brand}
                </span>

                {/* Stock Status Badge */}
                {isOutOfStock ? (
                  <span className="absolute bottom-3 right-3 px-2.5 py-1 rounded-lg bg-rose-600 text-white text-[11px] font-bold shadow-md flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" /> Rupture temporaire
                  </span>
                ) : isLowStock ? (
                  <span className="absolute bottom-3 right-3 px-2.5 py-1 rounded-lg bg-amber-500 text-slate-950 text-[11px] font-black shadow-md flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" /> Plus que {variantStock} en stock !
                  </span>
                ) : (
                  <span className="absolute bottom-3 right-3 px-2.5 py-1 rounded-lg bg-emerald-600 text-white text-[11px] font-bold shadow-md flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" /> En stock ({variantStock} unités)
                  </span>
                )}
              </div>

              {/* Thumbnails */}
              {gallery.length > 1 && (
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {gallery.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveImage(img)}
                      className={`w-16 h-16 rounded-xl overflow-hidden border-2 transition-all shrink-0 cursor-pointer ${
                        activeImage === img ? 'border-amber-500 scale-95' : 'border-slate-200 opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img src={img} alt={`Aperçu ${idx}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}

              {/* Guarantees Box */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-2.5 text-xs text-slate-600">
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span><strong>100% Neuf Authentique :</strong> Garantie constructeur officielle.</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <Store className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <span><strong>Retrait direct en magasin :</strong> Venez récupérer et tester votre appareil directement dans notre boutique à Nianing (Mbour).</span>
                    <a
                      href={SHOWROOM_INFO.googleMapsUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] text-orange-600 hover:text-orange-700 font-bold underline mt-0.5"
                    >
                      📍 Voir l'emplacement sur Google Maps
                    </a>
                  </div>
                </div>
                <div className="flex items-center gap-2.5">
                  <Truck className="w-4 h-4 text-purple-600 shrink-0" />
                  <span><strong>Livraison :</strong> De main à main à Nianing ou à distance partout au Sénégal.</span>
                </div>
              </div>
            </div>

            {/* Right Column: Product details & Variant selector */}
            <div className="md:col-span-6 flex flex-col justify-between space-y-5">
              <div className="space-y-4">
                
                {/* Title & Brand / Category */}
                <div>
                  <div className="flex items-center justify-between text-xs text-purple-700 font-bold mb-1">
                    <span className="bg-purple-100/90 text-purple-900 px-2.5 py-0.5 rounded-full font-black uppercase text-[11px]">{product.brand}</span>
                    <span className="text-slate-400 font-mono text-[11px]">SKU: {selectedVariant.sku || product.sku}</span>
                  </div>
                  <h1 className="text-lg sm:text-xl font-black text-slate-900 leading-snug">
                    {product.name}
                  </h1>

                  {/* Rating Header: ONLY DISPLAYED IF RATINGS EXIST */}
                  {Boolean(product.rating && product.reviewCount && product.reviewCount > 0) ? (
                    <button
                      type="button"
                      onClick={() => {
                        const el = document.getElementById('product-reviews-section');
                        if (el) el.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className="flex items-center gap-1.5 mt-1.5 hover:opacity-80 transition-opacity cursor-pointer text-left"
                      title="Voir les avis clients"
                    >
                      <div className="flex items-center text-amber-400">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            className={`w-3.5 h-3.5 ${
                              s <= Math.round(product.rating || 0)
                                ? 'fill-amber-400 text-amber-400'
                                : 'text-slate-300 fill-slate-100'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-xs font-black text-slate-900">
                        {product.rating} / 5
                      </span>
                      <span className="text-xs text-slate-500 font-medium underline underline-offset-2">
                        ({product.reviewCount} avis client{product.reviewCount! > 1 ? 's' : ''})
                      </span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        const el = document.getElementById('product-reviews-section');
                        if (el) el.scrollIntoView({ behavior: 'smooth' });
                        const btn = document.getElementById('open-rating-form-btn');
                        if (btn) btn.click();
                      }}
                      className="inline-flex items-center gap-1 mt-1 text-xs font-semibold text-purple-700 hover:text-orange-600 transition-colors cursor-pointer"
                    >
                      <Star className="w-3 h-3 text-amber-500 fill-amber-400" />
                      <span>Soyez le premier à donner votre avis</span>
                    </button>
                  )}
                </div>

                {/* Pricing Block */}
                <div className="bg-purple-50/50 rounded-2xl p-3.5 sm:p-4 border border-purple-100 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] text-slate-500 font-medium block">Prix Khelcom Business (Net sans TVA)</span>
                    <div className="flex items-baseline gap-2">
                      <span className="text-xl sm:text-2xl font-black text-slate-950">
                        {formatFCFA(selectedVariant.price)}
                      </span>
                      {selectedVariant.originalPrice && selectedVariant.originalPrice > selectedVariant.price && (
                        <span className="text-xs sm:text-sm text-slate-400 line-through">
                          {formatFCFA(selectedVariant.originalPrice)}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-right">
                    {isOutOfStock ? (
                      <span className="inline-block px-2.5 py-1 rounded-lg bg-rose-100 text-rose-800 text-xs font-black border border-rose-200">
                        Rupture de stock
                      </span>
                    ) : isLowStock ? (
                      <span className="inline-block px-2.5 py-1 rounded-lg bg-amber-100 text-amber-900 text-xs font-black border border-amber-200">
                        ⚡ {variantStock} unités restantes
                      </span>
                    ) : (
                      <span className="inline-block px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 text-xs font-black border border-emerald-200">
                        ✓ En stock ({variantStock})
                      </span>
                    )}
                  </div>
                </div>

                {/* Short Description */}
                <p className="text-xs text-slate-600 leading-relaxed">
                  {product.description || product.shortDescription}
                </p>

                {/* VARIANTS SELECTOR */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-orange-500" />
                      <span>Options & Variantes ({product.variants.length}) :</span>
                    </label>
                    <span className="text-xs font-bold text-orange-600">
                      {selectedVariant.title}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 gap-2 max-h-52 overflow-y-auto pr-1">
                    {product.variants.map((v) => {
                      const isSelected = selectedVariant.id === v.id;
                      const resolvedColor = getColorHex(v.colorHex, v.colorName);
                      const vStock = Number(v.stockQuantity) || 0;
                      const vOutOfStock = vStock <= 0;

                      return (
                        <button
                          key={v.id}
                          type="button"
                          disabled={vOutOfStock}
                          onClick={() => !vOutOfStock && handleVariantChange(v)}
                          className={`w-full p-2.5 rounded-xl border text-left transition-all flex items-center justify-between ${
                            vOutOfStock
                              ? 'border-slate-200 bg-slate-100/80 opacity-50 cursor-not-allowed select-none'
                              : isSelected
                              ? 'border-orange-500 bg-orange-50/60 shadow-xs ring-1 ring-orange-500 cursor-pointer'
                              : 'border-slate-200 hover:border-purple-300 bg-white hover:bg-purple-50/30 cursor-pointer'
                          }`}
                          title={vOutOfStock ? 'Variante épuisée (Stock 0) — Sélection et commande verrouillées' : `Stock disponible : ${vStock}`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            {/* Color preview circle if available */}
                            {resolvedColor && (
                              <span
                                className={`w-5 h-5 rounded-full border border-slate-300 shrink-0 shadow-inner flex items-center justify-center ${
                                  vOutOfStock ? 'grayscale opacity-40' : ''
                                }`}
                                style={{ backgroundColor: resolvedColor }}
                                title={v.colorName || 'Couleur'}
                              >
                                {isSelected && !vOutOfStock && (
                                  <span className="w-1.5 h-1.5 rounded-full bg-white shadow-xs" />
                                )}
                              </span>
                            )}
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className={`text-xs font-bold ${
                                  vOutOfStock
                                    ? 'text-slate-400 line-through'
                                    : isSelected
                                    ? 'text-orange-950'
                                    : 'text-slate-800'
                                }`}>
                                  {v.title}
                                </span>
                                {v.colorName && (
                                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                                    vOutOfStock 
                                      ? 'bg-slate-200 text-slate-400 border border-slate-300 line-through' 
                                      : 'bg-purple-100/80 text-purple-900 border border-purple-200/80'
                                  }`}>
                                    {v.colorName}
                                  </span>
                                )}
                              </div>
                              {v.sizeDimensions && (
                                <div className="text-[11px] text-slate-500 mt-0.5">
                                  Dim: {v.sizeDimensions} {v.height ? `• H: ${v.height}` : ''}
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="text-right shrink-0 ml-2">
                            <span className={`text-xs font-black block ${vOutOfStock ? 'text-slate-400 line-through' : 'text-slate-900'}`}>
                              {formatFCFA(v.price)}
                            </span>
                            {vOutOfStock ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                                <Lock className="w-2.5 h-2.5 text-rose-500" /> Épuisé (Stock 0)
                              </span>
                            ) : (
                              <span className={`text-[10px] font-bold ${vStock <= 3 ? 'text-amber-600' : 'text-emerald-700'}`}>
                                {vStock} en stock
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Technical Specs Table */}
                {product.specs && Object.keys(product.specs).length > 0 && (
                  <div className="pt-2">
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-orange-500" />
                      <span>Caractéristiques & Garanties</span>
                    </h4>
                    <div className="rounded-2xl border border-slate-200/80 overflow-hidden text-xs divide-y divide-slate-100 bg-slate-50/50">
                      {Object.entries(product.specs).map(([key, val], i) => (
                        <div
                          key={key}
                          className={`flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-4 p-2.5 sm:p-3 ${
                            i % 2 === 0 ? 'bg-slate-50/90' : 'bg-white'
                          }`}
                        >
                          <span className="text-slate-500 font-semibold text-[11px] sm:text-xs shrink-0">
                            {key}
                          </span>
                          <span className="text-slate-900 font-bold text-xs sm:text-right break-words">
                            {val}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* PRODUCT REVIEWS & RATING SECTION */}
                <ProductReviewsSection
                  product={product}
                  onProductUpdated={onProductUpdated}
                />

              </div>

              {/* Quantity and Actions Bar (Desktop) */}
              <div className="hidden sm:block pt-4 border-t border-slate-100 space-y-3">
                
                {/* Cart info alert if any */}
                {qtyInCart > 0 && (
                  <div className="p-2.5 rounded-xl bg-purple-50 border border-purple-200 text-xs text-purple-900 flex items-center justify-between">
                    <span>
                      Vous avez déjà <strong>{qtyInCart}</strong> unité(s) dans votre panier.
                    </span>
                    <span className="font-bold text-orange-700">
                      Stock restant dispo : {remainingStockForUser}
                    </span>
                  </div>
                )}

                <div className="flex items-center gap-3">
                  {/* Quantity selector */}
                  <div className="flex items-center border border-slate-200 rounded-xl p-1 bg-slate-50">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      disabled={isOutOfStock || quantity <= 1}
                      className="w-8 h-8 rounded-lg bg-white text-slate-700 font-bold hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center shadow-xs cursor-pointer"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-10 text-center font-black text-sm text-slate-900">
                      {quantity}
                    </span>
                    <button
                      onClick={() => setQuantity(quantity + 1)}
                      disabled={isOutOfStock || quantity >= variantStock}
                      className="w-8 h-8 rounded-lg bg-white text-slate-700 font-bold hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center shadow-xs cursor-pointer"
                      title={quantity >= variantStock ? 'Stock maximum atteint' : 'Augmenter la quantité'}
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Add to cart */}
                  <button
                    id="modal-add-to-cart-btn"
                    onClick={handleAddToCart}
                    disabled={isOutOfStock || isMaxInCart}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-sm transition-all shadow-md active:scale-98 cursor-pointer ${
                      isOutOfStock || isMaxInCart
                        ? 'bg-slate-200 text-slate-500 cursor-not-allowed shadow-none'
                        : 'bg-orange-500 hover:bg-orange-400 text-white hover:shadow-orange-500/20'
                    }`}
                  >
                    <ShoppingBag className="w-4 h-4" />
                    <span>
                      {isOutOfStock
                        ? 'En Rupture de Stock'
                        : isMaxInCart
                        ? 'Stock max déjà dans le panier'
                        : addedAnimation
                        ? 'Ajouté au panier !'
                        : 'Ajouter au Panier'}
                    </span>
                  </button>
                </div>

                {/* Direct WhatsApp Order Fast Action */}
                <button
                  id="modal-whatsapp-order-btn"
                  onClick={handleWhatsAppOrder}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all shadow-md active:scale-98 cursor-pointer"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>
                    {isOutOfStock
                      ? 'Demander le réapprovisionnement sur WhatsApp'
                      : 'Commander instantanément sur WhatsApp'}
                  </span>
                </button>

                {/* Direct Checkout button */}
                {!isOutOfStock && (
                  <button
                    onClick={handleDirectBuyClick}
                    className="w-full py-2.5 px-4 rounded-xl bg-[#1b0633] hover:bg-[#280a4c] text-white font-semibold text-xs transition-colors cursor-pointer"
                  >
                    Passer directement à la commande (Sans Compte)
                  </button>
                )}

              </div>

            </div>

          </div>
        </div>

        {/* STICKY BOTTOM ACTION BAR ON MOBILE (Mobile First) */}
        <div className="sm:hidden sticky bottom-0 z-30 bg-white border-t border-slate-200 p-3 shadow-xl space-y-2">
          {qtyInCart > 0 && (
            <div className="text-[11px] text-purple-900 font-semibold text-center bg-purple-50 p-1 rounded-lg">
              Déjà {qtyInCart} dans votre panier (Stock total: {variantStock})
            </div>
          )}

          <div className="flex items-center gap-2">
            {/* Quantity */}
            <div className="flex items-center border border-slate-200 rounded-xl p-0.5 bg-slate-50 shrink-0">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                disabled={isOutOfStock || quantity <= 1}
                className="w-7 h-7 rounded-lg bg-white text-slate-700 font-bold flex items-center justify-center shadow-xs disabled:opacity-40"
              >
                <Minus className="w-3 h-3" />
              </button>
              <span className="w-7 text-center font-bold text-xs text-slate-900">
                {quantity}
              </span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                disabled={isOutOfStock || quantity >= variantStock}
                className="w-7 h-7 rounded-lg bg-white text-slate-700 font-bold flex items-center justify-center shadow-xs disabled:opacity-40"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>

            {/* Fast Add To Cart */}
            <button
              onClick={handleAddToCart}
              disabled={isOutOfStock || isMaxInCart}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl font-bold text-xs shadow-md transition-all cursor-pointer ${
                isOutOfStock || isMaxInCart
                  ? 'bg-slate-200 text-slate-500 cursor-not-allowed shadow-none'
                  : 'bg-orange-500 active:bg-orange-600 text-white'
              }`}
            >
              <ShoppingBag className="w-4 h-4" />
              <span>
                {isOutOfStock
                  ? 'Rupture'
                  : isMaxInCart
                  ? 'Stock max atteint'
                  : addedAnimation
                  ? 'Ajouté !'
                  : `Ajouter • ${formatFCFA(selectedVariant.price * quantity)}`}
              </span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleWhatsAppOrder}
              className="flex-1 flex items-center justify-center gap-1 py-2 px-2 rounded-xl bg-emerald-600 active:bg-emerald-700 text-white font-bold text-[11px] shadow-sm cursor-pointer"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>{isOutOfStock ? 'WhatsApp Réappro' : 'WhatsApp'}</span>
            </button>

            {!isOutOfStock && (
              <button
                onClick={handleDirectBuyClick}
                className="flex-1 py-2 px-2 rounded-xl bg-[#1b0633] text-white font-bold text-[11px] text-center cursor-pointer truncate"
              >
                Commander direct
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
