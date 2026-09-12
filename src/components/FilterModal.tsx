import React from 'react';
import { 
  X, 
  SlidersHorizontal, 
  Check, 
  RotateCcw, 
  Sparkles, 
  Snowflake, 
  Wind, 
  Tv, 
  Flame, 
  Waves, 
  Coffee, 
  Smartphone, 
  Layers, 
  ArrowUpDown, 
  Store, 
  Tag,
  Palette
} from 'lucide-react';
import { CATEGORIES } from '../data/mockProducts';
import { StorageService } from '../services/storage';
import { POPULAR_COLORS } from '../utils/colors';

export interface FilterState {
  category: string;
  brand: string;
  selectedColor?: string;
  inStockOnly: boolean;
  priceRange: 'all' | 'under100k' | '100k-300k' | '300k-600k' | 'above600k';
  sortBy: 'featured' | 'price_asc' | 'price_desc' | 'newest';
}

interface FilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  filters: FilterState;
  onUpdateFilter: <K extends keyof FilterState>(key: K, value: FilterState[K]) => void;
  onResetFilters: () => void;
  totalResultsCount: number;
  brands?: string[];
}

const PRICE_RANGES = [
  { id: 'all', label: 'Tous les prix' },
  { id: 'under100k', label: 'Moins de 100 000 FCFA' },
  { id: '100k-300k', label: '100 000 - 300 000 FCFA' },
  { id: '300k-600k', label: '300 000 - 600 000 FCFA' },
  { id: 'above600k', label: 'Plus de 600 000 FCFA' },
] as const;

const SORT_OPTIONS = [
  { id: 'featured', label: 'Populaires & Vedettes' },
  { id: 'price_asc', label: 'Prix croissant (Moins cher)' },
  { id: 'price_desc', label: 'Prix décroissant (Haut de gamme)' },
  { id: 'newest', label: 'Nouveautés récentes' },
] as const;

const getCategoryIcon = (id: string) => {
  switch (id) {
    case 'all':
      return <Layers className="w-4 h-4 shrink-0" />;
    case 'refrigerateurs':
      return <Snowflake className="w-4 h-4 shrink-0" />;
    case 'climatiseurs':
      return <Wind className="w-4 h-4 shrink-0" />;
    case 'televiseurs':
      return <Tv className="w-4 h-4 shrink-0" />;
    case 'cuisinieres':
      return <Flame className="w-4 h-4 shrink-0" />;
    case 'lave-linge':
      return <Waves className="w-4 h-4 shrink-0" />;
    case 'petits-electromenager':
      return <Coffee className="w-4 h-4 shrink-0" />;
    case 'smartphones':
      return <Smartphone className="w-4 h-4 shrink-0" />;
    default:
      return <Sparkles className="w-4 h-4 shrink-0" />;
  }
};

export const FilterModal: React.FC<FilterModalProps> = ({
  isOpen,
  onClose,
  filters,
  onUpdateFilter,
  onResetFilters,
  totalResultsCount,
  brands: propBrands,
}) => {
  if (!isOpen) return null;

  const availableBrands = propBrands || StorageService.getBrands();

  const hasActiveFilters = 
    filters.category !== 'all' || 
    filters.brand !== 'all' || 
    (filters.selectedColor && filters.selectedColor !== 'all') ||
    filters.inStockOnly || 
    filters.priceRange !== 'all' || 
    filters.sortBy !== 'featured';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
      
      {/* Backdrop click */}
      <div className="fixed inset-0" onClick={onClose} />

      {/* Drawer Container */}
      <div className="relative w-full max-w-lg bg-white h-full min-h-screen shadow-2xl flex flex-col z-10 animate-in slide-in-from-right duration-200">
        
        {/* Drawer Header */}
        <div className="bg-[#190733] text-white px-5 py-4 flex items-center justify-between border-b border-purple-900 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-orange-500/20 text-orange-400 border border-orange-500/30 flex items-center justify-center">
              <SlidersHorizontal className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Filtres du Catalogue
                <span className="px-2 py-0.5 rounded-full bg-orange-500 text-white text-[10px] font-black">
                  {totalResultsCount} produit{totalResultsCount > 1 ? 's' : ''}
                </span>
              </h2>
              <p className="text-xs text-purple-200/70">Affinez votre recherche selon vos critères</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-purple-300 hover:text-white hover:bg-purple-900/60 transition-colors cursor-pointer"
            aria-label="Fermer les filtres"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Body - Scrollable */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          
          {/* 1. Rayon / Catégorie */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-orange-500" />
                <span>Rayons & Catégories</span>
              </span>
              {filters.category !== 'all' && (
                <button
                  type="button"
                  onClick={() => onUpdateFilter('category', 'all')}
                  className="text-[11px] text-orange-600 font-semibold hover:underline cursor-pointer"
                >
                  Tous les rayons
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {CATEGORIES.map((cat) => {
                const isSelected = filters.category === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => onUpdateFilter('category', cat.id)}
                    className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-medium text-left transition-all cursor-pointer border ${
                      isSelected
                        ? 'bg-orange-500 text-white font-bold border-orange-500 shadow-sm shadow-orange-500/20'
                        : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200'
                    }`}
                  >
                    <span className={isSelected ? 'text-white' : 'text-orange-500'}>
                      {getCategoryIcon(cat.id)}
                    </span>
                    <span className="truncate flex-1">{cat.label}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Marques Certifiées */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-orange-500" />
                <span>Marque Officielle</span>
              </span>
              {filters.brand !== 'all' && (
                <button
                  type="button"
                  onClick={() => onUpdateFilter('brand', 'all')}
                  className="text-[11px] text-orange-600 font-semibold hover:underline cursor-pointer"
                >
                  Toutes marques
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => onUpdateFilter('brand', 'all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer border ${
                  filters.brand === 'all'
                    ? 'bg-[#1b0633] text-white border-[#1b0633]'
                    : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200'
                }`}
              >
                Toutes les marques
              </button>
              {availableBrands.map((brand) => {
                const isSelected = filters.brand === brand;
                return (
                  <button
                    key={brand}
                    type="button"
                    onClick={() => onUpdateFilter('brand', brand)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer border ${
                      isSelected
                        ? 'bg-orange-500 text-white border-orange-500 shadow-xs'
                        : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200'
                    }`}
                  >
                    {brand}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Couleurs & Nuancier */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5 text-orange-500" />
                <span>Couleurs & Nuancier</span>
              </span>
              {filters.selectedColor && filters.selectedColor !== 'all' && (
                <button
                  type="button"
                  onClick={() => onUpdateFilter('selectedColor', 'all')}
                  className="text-[11px] text-orange-600 font-semibold hover:underline cursor-pointer"
                >
                  Toutes les couleurs
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => onUpdateFilter('selectedColor', 'all')}
                className={`flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer border ${
                  !filters.selectedColor || filters.selectedColor === 'all'
                    ? 'bg-[#1b0633] text-white border-[#1b0633]'
                    : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200'
                }`}
              >
                <span className="w-3.5 h-3.5 rounded-full bg-gradient-to-tr from-orange-400 via-purple-500 to-blue-500 border border-white/50 shrink-0" />
                <span className="truncate">Toutes</span>
              </button>

              {POPULAR_COLORS.map((c) => {
                const isSelected = filters.selectedColor?.toLowerCase() === c.name.toLowerCase();
                const isLight = ['#ffffff', '#fef3c7', '#cbd5e1', '#d97706'].includes(c.hex.toLowerCase());

                return (
                  <button
                    key={c.name}
                    type="button"
                    onClick={() => onUpdateFilter('selectedColor', isSelected ? 'all' : c.name)}
                    className={`flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer border ${
                      isSelected
                        ? 'bg-orange-500 text-white border-orange-500 shadow-xs'
                        : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200'
                    }`}
                    title={c.name}
                  >
                    <span
                      className={`w-3.5 h-3.5 rounded-full border shadow-2xs shrink-0 flex items-center justify-center ${
                        c.border ? 'border-slate-300' : 'border-slate-400/40'
                      }`}
                      style={{ backgroundColor: c.hex }}
                    >
                      {isSelected && (
                        <Check className={`w-2.5 h-2.5 ${isLight ? 'text-black' : 'text-white'}`} />
                      )}
                    </span>
                    <span className="truncate">{c.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4. Budget / Fourchette de Prix */}
          <div>
            <div className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5 mb-2.5">
              <Sparkles className="w-3.5 h-3.5 text-orange-500" />
              <span>Budget (FCFA)</span>
            </div>
            <div className="space-y-1.5">
              {PRICE_RANGES.map((range) => {
                const isSelected = filters.priceRange === range.id;
                return (
                  <button
                    key={range.id}
                    type="button"
                    onClick={() => onUpdateFilter('priceRange', range.id)}
                    className={`w-full flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer border ${
                      isSelected
                        ? 'bg-orange-50 border-orange-400 text-orange-950 font-bold'
                        : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200'
                    }`}
                  >
                    <span>{range.label}</span>
                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                      isSelected ? 'border-orange-500 bg-orange-500 text-white' : 'border-slate-300 bg-white'
                    }`}>
                      {isSelected && <Check className="w-2.5 h-2.5" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4. Tri du Catalogue */}
          <div>
            <div className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5 mb-2.5">
              <ArrowUpDown className="w-3.5 h-3.5 text-orange-500" />
              <span>Ordre d'affichage</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {SORT_OPTIONS.map((sort) => {
                const isSelected = filters.sortBy === sort.id;
                return (
                  <button
                    key={sort.id}
                    type="button"
                    onClick={() => onUpdateFilter('sortBy', sort.id)}
                    className={`px-3 py-2 rounded-xl text-xs font-medium text-left transition-all cursor-pointer border ${
                      isSelected
                        ? 'bg-purple-950 text-white font-bold border-purple-950'
                        : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200'
                    }`}
                  >
                    {sort.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 5. Disponibilité Showroom */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3.5 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0">
                <Store className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-emerald-950">En stock au Showroom</p>
                <p className="text-[11px] text-emerald-700">Disponible pour retrait immédiat ou livraison jour même</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onUpdateFilter('inStockOnly', !filters.inStockOnly)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                filters.inStockOnly ? 'bg-emerald-600' : 'bg-slate-300'
              }`}
              role="switch"
              aria-checked={filters.inStockOnly}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                  filters.inStockOnly ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

        </div>

        {/* Empty results helper inside drawer */}
        {totalResultsCount === 0 && (
          <div className="mx-5 mb-3 p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2.5">
            <RotateCcw className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-bold">Aucun produit ne correspond à ces critères</span>
              <p className="text-[11px] text-amber-800 mt-0.5">
                Modifiez vos filtres ou cliquez sur effacer pour réafficher les articles disponibles.
              </p>
            </div>
          </div>
        )}

        {/* Drawer Footer - Action Buttons */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center gap-3 shrink-0">
          {hasActiveFilters && (
            <button
              type="button"
              onClick={onResetFilters}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer shrink-0"
              title="Réinitialiser tous les filtres"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Effacer</span>
            </button>
          )}

          {totalResultsCount === 0 ? (
            <button
              type="button"
              onClick={() => {
                onResetFilters();
                onClose();
              }}
              className="flex-1 py-3 px-4 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-black text-xs sm:text-sm shadow-md transition-all text-center cursor-pointer active:scale-95"
            >
              Réinitialiser et Afficher tout
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-black text-xs sm:text-sm shadow-md shadow-orange-500/25 transition-all text-center cursor-pointer active:scale-95"
            >
              Afficher {totalResultsCount} Produit{totalResultsCount > 1 ? 's' : ''}
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
