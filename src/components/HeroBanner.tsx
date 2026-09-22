import React from 'react';
import { 
  ShieldCheck, 
  Truck, 
  Store, 
  Flame, 
  CheckCircle2, 
  ArrowRight,
  Sparkles,
  MapPin,
  Clock,
  Phone,
  MessageCircle,
  Tag
} from 'lucide-react';
import { SHOWROOM_INFO } from '../data/senegalLocations';
import { StorageService } from '../services/storage';
import { Logo } from './Logo';

interface HeroBannerProps {
  onExploreCatalog: () => void;
  onOpenShowroom: () => void;
  brands?: string[];
  onSelectBrand?: (brand: string) => void;
  announcement?: string;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({
  onExploreCatalog,
  onOpenShowroom,
  brands: propBrands,
  onSelectBrand,
  announcement,
}) => {
  const currentBrands = propBrands && propBrands.length > 0 ? propBrands : StorageService.getBrands();
  const displayBrands = currentBrands.slice(0, 8);
  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-[#20083b] via-[#17052c] to-[#0d021a] text-white border-b border-purple-900/60">
      {/* Decorative background ambient glows */}
      <div className="absolute top-0 right-1/4 w-60 sm:w-96 h-60 sm:h-96 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-4 sm:left-10 w-52 sm:w-80 h-52 sm:h-80 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />

      {/* Hero Content Container */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-9 lg:py-12 relative z-10">
        
        {/* Main Grid: Responsive 1 col on mobile, 12 cols on desktop */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-8 items-center">
          
          {/* CSS Selector 1: Main Hero Copy (Left Column) */}
          <div className="lg:col-span-7 space-y-3.5 sm:space-y-4.5">
            
            {/* Tag pill badges & Announcement banner */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-1.5 sm:gap-2 px-3 py-1 rounded-full bg-purple-950/90 border border-purple-800/80 text-orange-400 text-[11px] sm:text-xs font-semibold shadow-xs">
                <Sparkles className="w-3.5 h-3.5 text-orange-400 shrink-0" />
                <span className="truncate">Vente Directe & Showroom • Nianing</span>
              </div>

              {announcement && announcement.trim() && (
                <div className="inline-flex items-center gap-1.5 sm:gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-orange-500/20 to-amber-500/20 border border-orange-500/40 text-orange-300 text-[11px] sm:text-xs font-bold shadow-sm">
                  <Flame className="w-3.5 h-3.5 text-orange-400 shrink-0 animate-bounce" />
                  <span className="line-clamp-1">{announcement}</span>
                </div>
              )}
            </div>

            {/* H1 Heading */}
            <h1 className="text-2xl xs:text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight text-white">
              L'excellence de l'électronique & de l'électroménager à{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-orange-500 to-amber-300">
                Nianing
              </span>
            </h1>

            {/* Paragraph Description */}
            <p className="text-xs sm:text-sm md:text-base text-purple-200/90 max-w-xl leading-relaxed">
              Réfrigérateurs Inverter, Climatiseurs Tropicalisés T3, Smart TV 4K, Cuisinières Inox et Lave-linge.
              Commandez sans créer de compte avec <strong className="text-white font-bold">retrait gratuit en Showroom</strong> (ouvert à tous) ou <strong className="text-white font-bold">livraison à domicile rapide</strong> (Nianing, Mbour et environs selon la grille tarifaire active).
            </p>

            {/* Mobile-First Action Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 pt-1">
              <button
                id="hero-catalog-btn"
                onClick={onExploreCatalog}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 sm:px-6 py-3 sm:py-3.5 rounded-xl bg-orange-500 hover:bg-orange-400 text-white font-bold text-xs sm:text-sm transition-all shadow-md shadow-orange-500/20 active:scale-95 cursor-pointer min-h-[44px]"
              >
                <span>Explorer le catalogue</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                id="hero-showroom-btn"
                onClick={onOpenShowroom}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 sm:px-5 py-3 sm:py-3.5 rounded-xl bg-[#260b4c]/90 hover:bg-[#341166] border border-purple-700/80 text-white font-semibold text-xs sm:text-sm transition-all active:scale-95 cursor-pointer min-h-[44px]"
              >
                <Store className="w-4 h-4 text-orange-400 shrink-0" />
                <span>Voir notre Showroom</span>
              </button>
            </div>

            {/* Value Props Grid */}
            <div className="pt-3 sm:pt-4 grid grid-cols-1 xs:grid-cols-3 gap-2 sm:gap-3 border-t border-purple-900/50 text-[11px] sm:text-xs text-purple-200">
              <div className="flex items-center gap-2 py-0.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>100% Neuf Garanti</span>
              </div>
              <div className="flex items-center gap-2 py-0.5">
                <Store className="w-4 h-4 text-orange-400 shrink-0" />
                <span>Retrait Gratuit Showroom</span>
              </div>
              <div className="flex items-center gap-2 py-0.5">
                <Truck className="w-4 h-4 text-purple-300 shrink-0" />
                <span>Livraison Nianing & Mbour</span>
              </div>
            </div>
          </div>

          {/* Right Showcase Card (Showroom & Official Details) */}
          <div className="lg:col-span-5 w-full">
            <div className="bg-[#1b0633]/95 border border-purple-800/80 rounded-2xl sm:rounded-3xl p-4 sm:p-5.5 backdrop-blur-md shadow-xl space-y-3 sm:space-y-4 relative overflow-hidden">
              
              {/* Card Header with Official Brand & Status */}
              <div className="flex items-center justify-between border-b border-purple-900/80 pb-3 gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <Logo size="sm" showText={false} />
                  <div className="min-w-0">
                    <div className="flex items-center gap-1 leading-none">
                      <span className="font-black text-sm text-white">Khelcom</span>
                      <span className="font-extrabold text-sm text-orange-500">business</span>
                    </div>
                    <span className="text-[10px] text-purple-300/80 font-semibold block truncate mt-0.5">
                      Showroom Électronique & Électroménager
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-[10px] sm:text-xs font-bold shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span>Ouvert 7j/7</span>
                </div>
              </div>

              {/* Showroom Location, Hours, Contacts */}
              <div className="space-y-2.5 text-xs text-purple-200/90">
                <div className="flex items-start gap-2.5">
                  <MapPin className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
                  <div className="leading-snug">
                    <strong className="text-white block font-semibold">Boutique & Showroom :</strong>
                    <span className="text-purple-300/90">{SHOWROOM_INFO.address}</span>
                    <a
                      href={SHOWROOM_INFO.googleMapsUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] text-orange-400 hover:text-orange-300 font-bold underline mt-1"
                    >
                      📍 Voir sur Google Maps (Showroom Nianing)
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <Clock className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                  <div className="leading-snug">
                    <strong className="text-white block font-semibold">Horaires d'ouverture :</strong>
                    <span className="text-purple-300/90">{SHOWROOM_INFO.openingHours}</span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <Phone className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div className="leading-snug">
                    <strong className="text-white block font-semibold">Contacts directs & WhatsApp :</strong>
                    <div className="flex flex-wrap items-center gap-2 mt-0.5 font-mono">
                      <a 
                        href={`tel:${SHOWROOM_INFO.phone1Raw}`} 
                        className="text-orange-400 font-bold hover:underline"
                        title="Appeler la ligne 1"
                      >
                        {SHOWROOM_INFO.phone1}
                      </a>
                      <span className="text-purple-500">•</span>
                      <a 
                        href={`tel:${SHOWROOM_INFO.phone2Raw}`} 
                        className="text-orange-400 font-bold hover:underline"
                        title="Appeler la ligne 2"
                      >
                        {SHOWROOM_INFO.phone2}
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              {/* Certified Brands */}
              <div className="pt-3 border-t border-purple-900/80">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[10px] sm:text-[11px] uppercase tracking-wider text-purple-300/90 font-bold flex items-center gap-1.5">
                    <Tag className="w-3 h-3 text-orange-400" />
                    <span>Grandes Marques Certifiées</span>
                  </p>
                  <span className="text-[10px] text-orange-400 font-medium">100% Originales</span>
                </div>
                
                {displayBrands.length === 0 ? (
                  <div className="text-center py-2 text-[10px] text-purple-400 italic">
                    Aucune marque configurée.
                  </div>
                ) : (
                  <div className="grid grid-cols-4 gap-1.5">
                    {displayBrands.map((brand) => (
                      <button
                        key={brand}
                        type="button"
                        onClick={() => {
                          if (onSelectBrand) {
                            onSelectBrand(brand);
                          } else {
                            onExploreCatalog();
                          }
                        }}
                        title={`Voir les produits de la marque ${brand}`}
                        className="px-1.5 py-1 rounded-lg bg-[#280c4e] text-purple-100 font-bold text-[9px] sm:text-[10px] border border-purple-700/60 text-center tracking-wider hover:border-orange-500/80 hover:bg-orange-500 hover:text-white transition-all cursor-pointer truncate uppercase"
                      >
                        {brand}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Express checkout & delivery callout */}
              <div className="p-2.5 sm:p-3 rounded-xl bg-orange-500/10 border border-orange-500/30 text-[11px] sm:text-xs text-orange-200 flex items-center gap-2">
                <Truck className="w-4 h-4 text-orange-400 shrink-0" />
                <span className="leading-tight">
                  <strong className="text-orange-300">Retrait & Livraison :</strong> Retrait gratuit en Showroom ou livraison à domicile rapide (Nianing, Mbour et environs).
                </span>
              </div>

            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
