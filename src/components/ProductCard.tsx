import React from 'react';
import { ShoppingBag, Eye, ShieldCheck, Check, Layers, Plus, AlertCircle, AlertTriangle, Star } from 'lucide-react';
import { Product, ProductVariant } from '../types';
import { formatFCFA } from '../utils/formatters';
import { getColorHex } from '../utils/colors';

interface ProductCardProps {
  product: Product;
  onSelectProduct: (product: Product) => void;
  onQuickAddToCart: (product: Product, variant: ProductVariant) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onSelectProduct,
  onQuickAddToCart,
}) => {
  // Prefer first in-stock variant, otherwise default/first variant
  const defaultVariant = 
    product.variants.find((v) => (Number(v.stockQuantity) || 0) > 0) || 
    product.variants.find((v) => v.isDefault) || 
    product.variants[0];
  const variantCount = product.variants.length;

  const totalStock = product.variants.reduce(
    (sum, v) => sum + (Number(v.stockQuantity) || 0),
    0
  );
  const isOutOfStock = !product.inStock || totalStock <= 0;
  const isLowStock = !isOutOfStock && totalStock <= 3;

  return (
    <div className={`group bg-white rounded-xl sm:rounded-2xl border transition-all duration-200 flex flex-col overflow-hidden relative ${
      isOutOfStock 
        ? 'border-rose-200/80 opacity-90 shadow-xs' 
        : 'border-slate-200 hover:border-orange-500 shadow-xs hover:shadow-lg'
    }`}>
      
      {/* Badges container */}
      <div className="absolute top-2 left-2 sm:top-3 sm:left-3 z-10 flex flex-col gap-1 items-start max-w-[70%]">
        {isOutOfStock ? (
          <span className="px-2 py-0.5 rounded-md sm:rounded-full bg-rose-600 text-white text-[9px] sm:text-[10px] font-black uppercase tracking-wider shadow-xs">
            Rupture
          </span>
        ) : isLowStock ? (
          <span className="px-2 py-0.5 rounded-md sm:rounded-full bg-amber-500 text-slate-950 text-[9px] sm:text-[10px] font-black tracking-tight shadow-xs flex items-center gap-1">
            <AlertTriangle className="w-2.5 h-2.5" />
            <span>Plus que {totalStock} dispo</span>
          </span>
        ) : product.isFeatured ? (
          <span className="px-2 py-0.5 rounded-md sm:rounded-full bg-[#1b0633] text-orange-400 border border-purple-800 text-[9px] sm:text-[10px] font-black uppercase tracking-wider shadow-xs">
            Vedette
          </span>
        ) : null}

        {variantCount > 1 && (
          <span className="px-1.5 py-0.5 rounded-md sm:rounded-full bg-purple-100/90 text-purple-900 border border-purple-200 text-[9px] sm:text-[10px] font-bold flex items-center gap-1">
            <Layers className="w-2.5 h-2.5" />
            <span className="hidden sm:inline">{variantCount}</span> variantes
          </span>
        )}
      </div>

      {/* Brand badge on top right */}
      <div className="absolute top-2 right-2 sm:top-3 sm:right-3 z-10">
        <span className="px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md sm:rounded-lg bg-white/95 backdrop-blur-xs text-slate-900 text-[10px] sm:text-[11px] font-black shadow-xs border border-slate-200">
          {product.brand}
        </span>
      </div>

      {/* Image Container */}
      <div 
        onClick={() => onSelectProduct(product)}
        className="relative pt-[85%] sm:pt-[75%] bg-slate-50 overflow-hidden cursor-pointer"
      >
        <img
          src={product.imageUrl}
          alt={product.name}
          className={`absolute inset-0 w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300 ${
            isOutOfStock ? 'grayscale-30' : ''
          }`}
          loading="lazy"
        />
        <div className="hidden sm:flex absolute inset-0 bg-gradient-to-t from-[#1b0633]/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity items-end justify-center p-3">
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-[#260b4c]/95 border border-purple-700/80 px-3 py-1.5 rounded-xl backdrop-blur-sm shadow-md">
            <Eye className="w-3.5 h-3.5 text-orange-400" /> Voir détails
          </span>
        </div>
      </div>

      {/* Content Container */}
      <div className="p-2.5 sm:p-4 flex-1 flex flex-col justify-between space-y-2 sm:space-y-3">
        <div>
          <div className="flex items-center justify-between gap-1 mb-0.5">
            <p className="text-[10px] sm:text-[11px] text-orange-600 font-bold uppercase tracking-wider truncate">
              {product.categoryLabel}
            </p>
            {isOutOfStock ? (
              <span className="text-[10px] font-bold text-rose-600">Épuisé</span>
            ) : (
              <span className="text-[10px] font-semibold text-emerald-700">
                {totalStock} en stock
              </span>
            )}
          </div>

          <h3 
            onClick={() => onSelectProduct(product)}
            className="font-bold text-slate-900 text-xs sm:text-sm line-clamp-2 hover:text-orange-600 transition-colors cursor-pointer leading-snug"
            title={product.name}
          >
            {product.name}
          </h3>

          {/* Rating only displayed if reviews exist */}
          {Boolean(product.rating && product.reviewCount && product.reviewCount > 0) && (
            <div className="flex items-center gap-1.5 mt-1">
              <div className="flex items-center text-amber-500">
                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
              </div>
              <span className="text-[11px] font-bold text-slate-800">
                {product.rating}
              </span>
              <span className="text-[10px] text-slate-400 font-medium">
                ({product.reviewCount} {product.reviewCount! > 1 ? 'avis' : 'avis'})
              </span>
            </div>
          )}

          <p className="hidden sm:block text-xs text-slate-500 line-clamp-2 mt-1 leading-relaxed">
            {product.shortDescription}
          </p>
        </div>

        {/* Variant summary pill */}
        {defaultVariant && (
          <div className="bg-purple-50/70 rounded-md sm:rounded-lg p-1.5 sm:p-2 text-[10px] sm:text-xs border border-purple-100/80 flex items-center justify-between">
            <span className="text-purple-950 font-semibold truncate">
              {defaultVariant.capacity || defaultVariant.title}
            </span>
            {defaultVariant.colorName && (
              <span className="text-[10px] text-purple-700 shrink-0 ml-1 font-bold flex items-center gap-1">
                {getColorHex(defaultVariant.colorHex, defaultVariant.colorName) && (
                  <span
                    className="w-2.5 h-2.5 rounded-full border border-slate-300 shadow-2xs shrink-0 inline-block"
                    style={{ backgroundColor: getColorHex(defaultVariant.colorHex, defaultVariant.colorName) }}
                  />
                )}
                <span>{defaultVariant.colorName}</span>
              </span>
            )}
          </div>
        )}

        {/* Pricing & Actions */}
        <div className="pt-1.5 sm:pt-2 border-t border-slate-100 flex items-end sm:items-center justify-between gap-1.5">
          <div className="min-w-0 flex-1">
            <div className="text-[10px] sm:text-xs text-slate-400 font-medium leading-none mb-0.5">À partir de</div>
            <div className="text-xs sm:text-base font-black text-slate-900 tracking-tight truncate">
              {formatFCFA(defaultVariant ? defaultVariant.price : product.basePrice)}
            </div>
            {defaultVariant?.originalPrice && (
              <div className="text-[9px] sm:text-[11px] text-slate-400 line-through truncate leading-none">
                {formatFCFA(defaultVariant.originalPrice)}
              </div>
            )}
          </div>

          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
            <button
              onClick={() => onSelectProduct(product)}
              className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl text-purple-900 bg-purple-100/80 hover:bg-purple-200 transition-colors cursor-pointer"
              title="Voir la fiche détaillée"
            >
              <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>

            {isOutOfStock ? (
              <button
                onClick={() => onSelectProduct(product)}
                className="flex items-center justify-center p-1.5 sm:px-3 sm:py-2 rounded-lg sm:rounded-xl bg-slate-200 text-slate-600 font-bold text-xs cursor-pointer hover:bg-slate-300 transition-colors min-w-[32px] sm:min-w-auto"
                title="Produit en rupture de stock - Cliquez pour voir les détails ou demander réapprovisionnement"
              >
                <AlertCircle className="w-3.5 h-3.5 sm:mr-1 text-rose-500" />
                <span className="hidden sm:inline">Rupture</span>
              </button>
            ) : (
              <button
                onClick={() => onQuickAddToCart(product, defaultVariant)}
                className="flex items-center justify-center p-1.5 sm:px-3 sm:py-2 rounded-lg sm:rounded-xl bg-orange-500 hover:bg-orange-400 text-white font-bold text-xs transition-all shadow-xs active:scale-95 cursor-pointer min-w-[32px] sm:min-w-auto"
                title="Ajouter au panier"
              >
                <Plus className="w-4 h-4 sm:hidden" />
                <ShoppingBag className="hidden sm:inline w-3.5 h-3.5 mr-1" />
                <span className="hidden sm:inline">Ajouter</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

