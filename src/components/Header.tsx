import React, { useState } from 'react';
import { 
  ShoppingBag, 
  Search, 
  MapPin, 
  Phone, 
  Lock, 
  SlidersHorizontal, 
  Sparkles, 
  MessageCircle, 
  X, 
  Snowflake, 
  Wind, 
  Tv, 
  Flame, 
  Smartphone, 
  Coffee, 
  Waves, 
  Layers, 
  Filter,
  ChevronDown,
  Package
} from 'lucide-react';
import { CATEGORIES } from '../data/mockProducts';
import { SHOWROOM_INFO } from '../data/senegalLocations';
import { Logo } from './Logo';

interface HeaderProps {
  cartCount: number;
  onOpenCart: () => void;
  onOpenAdmin: () => void;
  onOpenArchitecture: () => void;
  onOpenTracking: () => void;
  onOpenFilters: () => void;
  activeFiltersCount?: number;
  selectedCategory: string;
  onSelectCategory: (catId: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

const getCategoryIcon = (id: string) => {
  switch (id) {
    case 'all':
      return <Layers className="w-3.5 h-3.5 shrink-0" />;
    case 'refrigerateurs':
      return <Snowflake className="w-3.5 h-3.5 shrink-0" />;
    case 'climatiseurs':
      return <Wind className="w-3.5 h-3.5 shrink-0" />;
    case 'televiseurs':
      return <Tv className="w-3.5 h-3.5 shrink-0" />;
    case 'cuisinieres':
      return <Flame className="w-3.5 h-3.5 shrink-0" />;
    case 'lave-linge':
      return <Waves className="w-3.5 h-3.5 shrink-0" />;
    case 'petits-electromenager':
      return <Coffee className="w-3.5 h-3.5 shrink-0" />;
    case 'smartphones':
      return <Smartphone className="w-3.5 h-3.5 shrink-0" />;
    default:
      return <Sparkles className="w-3.5 h-3.5 shrink-0" />;
  }
};

export const Header: React.FC<HeaderProps> = ({
  cartCount,
  onOpenCart,
  onOpenAdmin,
  onOpenArchitecture,
  onOpenTracking,
  onOpenFilters,
  activeFiltersCount = 0,
  selectedCategory,
  onSelectCategory,
  searchQuery,
  onSearchChange,
}) => {
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

  const selectedCatObj = CATEGORIES.find((c) => c.id === selectedCategory) || CATEGORIES[0];
  const isAllSelected = selectedCategory === 'all';

  return (
    <header className="sticky top-0 z-40 bg-[#190733] border-b border-purple-900/60 text-white shadow-xl">
      
      {/* 1. Top micro-bar: Showroom location & Hotline */}
      <div className="bg-[#100323] px-3 sm:px-4 py-1 text-[11px] sm:text-xs text-purple-200/90 border-b border-purple-950/80">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
          
          {/* Left: Direct Hotline & Location */}
          <div className="flex items-center gap-2 sm:gap-4 truncate">
            <a 
              href={`tel:${SHOWROOM_INFO.phone1Raw}`} 
              className="flex items-center gap-1.5 text-purple-200 hover:text-white transition-colors font-semibold truncate"
              title="Appeler le showroom"
            >
              <Phone className="w-3 h-3 text-orange-500 shrink-0" />
              <span className="truncate">{SHOWROOM_INFO.phone}</span>
            </a>
            <span className="hidden md:inline text-purple-500/50">•</span>
            <a 
              href={SHOWROOM_INFO.googleMapsUrl}
              target="_blank"
              rel="noreferrer"
              className="hidden md:flex items-center gap-1 text-purple-300 hover:text-orange-400 transition-colors"
              title="Ouvrir l'emplacement du showroom à Nianing sur Google Maps"
            >
              <MapPin className="w-3 h-3 text-orange-400 shrink-0" />
              <span>Nianing • Localisation GPS</span>
            </a>
          </div>

          {/* Right: Fast WhatsApp link & Order Tracking */}
          <div className="flex items-center gap-2.5 sm:gap-4 shrink-0 text-[11px]">
            <a 
              href={`https://wa.me/${SHOWROOM_INFO.whatsappRaw}?text=${encodeURIComponent("Bonjour Khelcom Business, je souhaite commander un appareil électroménager.")}`}
              target="_blank" 
              rel="noreferrer"
              className="flex items-center gap-1 text-emerald-400 hover:text-emerald-300 transition-colors font-semibold"
            >
              <MessageCircle className="w-3 h-3 shrink-0" />
              <span className="hidden xs:inline">WhatsApp</span>
            </a>
            
            <button
              id="header-order-tracking-btn"
              type="button"
              onClick={onOpenTracking}
              className="flex items-center gap-1 hover:text-orange-400 text-purple-200 font-semibold transition-colors cursor-pointer"
              title="Suivre l'avancement d'une commande"
            >
              <Package className="w-3 h-3 text-orange-400 shrink-0" />
              <span>Suivi Commande</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Main navigation bar (Logo, Search, Admin & Cart) */}
      <div className="max-w-7xl mx-auto px-2.5 sm:px-4 py-2 sm:py-2.5">
        <div className="flex items-center justify-between gap-2 sm:gap-4">
          
          {/* Official Logo */}
          <div className="shrink-0 min-w-0">
            <Logo size="md" />
          </div>

          {/* Desktop Search bar */}
          <div className="hidden md:flex flex-1 max-w-xl mx-4">
            <div className="relative w-full">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Rechercher un frigo, climatiseur, TV Samsung, lave-linge..."
                className="w-full bg-[#260b4c]/90 text-white placeholder-purple-300/60 text-xs sm:text-sm rounded-xl pl-10 pr-4 py-2 border border-purple-800/60 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all shadow-inner"
              />
              <Search className="w-4 h-4 text-purple-300 absolute left-3.5 top-1/2 -translate-y-1/2" />
              {searchQuery && (
                <button 
                  type="button"
                  onClick={() => onSearchChange('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-purple-200 hover:text-white bg-purple-900 px-1.5 py-0.5 rounded cursor-pointer"
                >
                  Effacer
                </button>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            {/* Mobile Search Toggle */}
            <button
              type="button"
              onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
              className="md:hidden p-2 rounded-xl text-purple-200 hover:text-white bg-purple-950/90 border border-purple-800/80 active:scale-95 transition-all cursor-pointer"
              aria-label={mobileSearchOpen ? "Fermer la recherche" : "Ouvrir la recherche"}
              title={mobileSearchOpen ? "Fermer" : "Rechercher"}
            >
              {mobileSearchOpen ? (
                <X className="w-4 h-4 text-orange-400" />
              ) : (
                <Search className="w-4 h-4" />
              )}
            </button>

            {/* Cart Button with Count Badge */}
            <button
              id="header-cart-btn"
              type="button"
              onClick={onOpenCart}
              className="relative flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-400 text-white font-bold text-xs sm:text-sm transition-all shadow-md shadow-orange-500/20 active:scale-95 shrink-0 cursor-pointer"
              title="Consulter le panier"
            >
              <ShoppingBag className="w-4 h-4 shrink-0" />
              <span className="hidden sm:inline">Panier</span>
              {cartCount > 0 && (
                <span className="flex items-center justify-center min-w-[18px] h-4.5 px-1 rounded-full bg-[#16042b] text-orange-400 text-[11px] sm:text-xs font-black shadow-inner border border-orange-500/50">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Search input expand */}
        {mobileSearchOpen && (
          <div className="mt-2 pt-2 border-t border-purple-900/60 md:hidden animate-in fade-in slide-in-from-top-1 duration-150">
            <div className="relative w-full flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  placeholder="Rechercher un frigo, TV, split, téléphone..."
                  className="w-full bg-[#260b4c] text-white placeholder-purple-300/60 text-xs rounded-xl pl-9 pr-8 py-2 border border-purple-700 focus:outline-none focus:border-orange-500"
                  autoFocus
                />
                <Search className="w-4 h-4 text-purple-300 absolute left-3 top-1/2 -translate-y-1/2" />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => onSearchChange('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-purple-400 hover:text-white p-0.5 cursor-pointer"
                    aria-label="Effacer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <button
                type="button"
                onClick={() => setMobileSearchOpen(false)}
                className="text-xs text-purple-300 hover:text-white px-2 py-2 font-medium cursor-pointer"
              >
                Fermer
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 3. Filter Navigation Bar with EXACT 3 Filter Elements */}
      <div className="bg-[#120426]/95 backdrop-blur-md border-t border-purple-900/50 px-2 sm:px-4 py-1.5 relative overflow-x-auto scrollbar-none">
        <div className="max-w-7xl mx-auto flex items-center gap-1.5 sm:gap-2.5 relative min-w-max sm:min-w-0">
          
          {/* Button 1: Master All-Filters Button */}
          <button
            id="header-master-filter-btn"
            type="button"
            onClick={onOpenFilters}
            className="whitespace-nowrap flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-black transition-all shrink-0 cursor-pointer bg-gradient-to-r from-orange-500 via-amber-500 to-orange-500 text-white shadow-xs border border-orange-300/40 hover:brightness-110 active:scale-95"
            title="Ouvrir le panneau complet des filtres (Marques, Prix, Stock, Tri, Rayons)"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-white shrink-0" />
            <span className="tracking-tight sm:tracking-normal">Tous les Filtres</span>
            {activeFiltersCount > 0 ? (
              <span className="flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full bg-[#16042b] text-orange-400 text-[10px] font-black shadow-inner border border-orange-400/40">
                {activeFiltersCount}
              </span>
            ) : (
              <span className="w-1.5 h-1.5 rounded-full bg-white/90 animate-pulse hidden sm:inline-block"></span>
            )}
          </button>

          {/* Button 2: Bouton Sélectionné : "Tous les rayons" */}
          <button
            id="header-category-all-btn"
            type="button"
            onClick={() => onSelectCategory('all')}
            className={`whitespace-nowrap flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-semibold transition-all shrink-0 cursor-pointer active:scale-95 ${
              isAllSelected
                ? 'bg-purple-800 text-white font-bold shadow-xs border border-orange-400/60'
                : 'bg-[#20083c]/90 text-purple-200 hover:bg-[#2c0d52] hover:text-white border border-purple-800/50'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-orange-400 shrink-0" />
            <span>Tous les rayons</span>
          </button>

          {/* Button 3: Ouvre la petite fenêtre modale de sélection de rayon (CSS selector: button#header-category-dropdown-btn) */}
          <div className="relative shrink-0">
            <button
              id="header-category-dropdown-btn"
              type="button"
              onClick={() => setIsCategoryModalOpen(true)}
              className={`whitespace-nowrap flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-semibold transition-all cursor-pointer active:scale-95 border ${
                !isAllSelected
                  ? 'bg-orange-500 text-white font-bold border-orange-400 shadow-xs'
                  : 'bg-[#20083c]/90 text-purple-200 hover:bg-[#2c0d52] hover:text-white border-purple-800/60'
              }`}
              title="Ouvrir la fenêtre de sélection des rayons"
            >
              {!isAllSelected ? (
                <>
                  {getCategoryIcon(selectedCategory)}
                  <span className="max-w-[100px] xs:max-w-[130px] sm:max-w-[190px] truncate font-bold">{selectedCatObj.label}</span>
                </>
              ) : (
                <>
                  <Filter className="w-3.5 h-3.5 text-orange-400 shrink-0" />
                  <span>Rayons</span>
                </>
              )}
              <ChevronDown className="w-3.5 h-3.5 text-orange-300 shrink-0" />
            </button>
          </div>

        </div>
      </div>

      {/* 4. Fenêtre Modale de sélection de rayon (Petite fenêtre centrée & responsive sur la Landing Page) */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3.5 sm:p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150">
          
          {/* Overlay Click-to-close */}
          <div 
            className="absolute inset-0" 
            onClick={() => setIsCategoryModalOpen(false)} 
          />

          {/* Modal Card Window */}
          <div 
            className="relative w-full max-w-md bg-[#190633] border border-purple-700/90 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden z-10 animate-in zoom-in-95 duration-150 flex flex-col max-h-[85vh]"
            onClick={(e) => e.stopPropagation()}
          >
            
            {/* Modal Header */}
            <div className="px-4 py-3 sm:py-3.5 border-b border-purple-900/80 bg-[#120324] flex items-center justify-between gap-2 shrink-0">
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-pulse shrink-0"></span>
                <div>
                  <h3 className="text-sm sm:text-base font-black text-white tracking-tight">
                    Choisir un Rayon d'Appareils
                  </h3>
                  <p className="text-[10px] sm:text-[11px] text-purple-300/80">
                    Sélectionnez votre catégorie pour filtrer le catalogue
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCategoryModalOpen(false)}
                className="p-1.5 rounded-xl text-purple-300 hover:text-white hover:bg-purple-900/70 transition-colors cursor-pointer shrink-0"
                aria-label="Fermer la fenêtre"
              >
                <X className="w-5 h-5 text-purple-300" />
              </button>
            </div>

            {/* Modal Body: Radio button list */}
            <div className="p-3 sm:p-4 overflow-y-auto space-y-1.5 flex-1 scrollbar-none" role="radiogroup" aria-label="Sélection du rayon">
              {CATEGORIES.map((category) => {
                const isSelected = selectedCategory === category.id;
                return (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => {
                      onSelectCategory(category.id);
                      setIsCategoryModalOpen(false);
                    }}
                    className={`w-full flex items-center justify-between gap-3 px-3.5 py-3 rounded-xl sm:rounded-2xl text-xs sm:text-sm text-left transition-all cursor-pointer select-none active:scale-[0.98] border ${
                      isSelected
                        ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold border-orange-400/80 shadow-md shadow-orange-500/20'
                        : 'text-purple-100 hover:bg-purple-900/60 hover:text-white bg-purple-950/40 border-purple-900/60'
                    }`}
                  >
                    {/* Radio visual + Icon + Label */}
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      {/* Styled Radio Circle */}
                      <div 
                        className={`w-4.5 h-4.5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                          isSelected 
                            ? 'border-white bg-white' 
                            : 'border-purple-400/80 bg-purple-950/80'
                        }`}
                      >
                        {isSelected && (
                          <div className="w-2.5 h-2.5 rounded-full bg-orange-600"></div>
                        )}
                      </div>

                      <span className={`p-1.5 rounded-lg ${isSelected ? 'bg-white/20 text-white' : 'bg-purple-900/80 text-orange-400'} shrink-0`}>
                        {getCategoryIcon(category.id)}
                      </span>

                      <span className="truncate font-semibold">{category.label}</span>
                    </div>

                    {/* Status Badge */}
                    {isSelected && (
                      <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/25 text-white shrink-0">
                        Sélectionné
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Modal Footer */}
            <div className="p-3 sm:p-3.5 bg-[#120324] border-t border-purple-900/80 flex flex-col sm:flex-row items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setIsCategoryModalOpen(false);
                  onOpenFilters();
                }}
                className="w-full sm:flex-1 py-2.5 px-3 rounded-xl bg-purple-950 hover:bg-purple-900 text-orange-300 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-orange-500/30 active:scale-98"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-orange-400" />
                <span>Tous les filtres (Marques, Prix)</span>
              </button>

              <button
                type="button"
                onClick={() => setIsCategoryModalOpen(false)}
                className="w-full sm:w-auto py-2.5 px-5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold transition-all cursor-pointer shadow-xs active:scale-98"
              >
                Fermer
              </button>
            </div>

          </div>
        </div>
      )}

    </header>
  );
};
