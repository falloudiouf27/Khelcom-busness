import React from 'react';
import { 
  Home, 
  ShoppingBag, 
  Search, 
  MessageCircle, 
  Package, 
  Layers,
  PhoneCall
} from 'lucide-react';
import { SHOWROOM_INFO } from '../data/senegalLocations';

interface MobileBottomNavProps {
  cartCount: number;
  onOpenCart: () => void;
  onOpenTracking: () => void;
  onScrollToCatalog: () => void;
  activeCategory: string;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  cartCount,
  onOpenCart,
  onOpenTracking,
  onScrollToCatalog,
}) => {
  const handleWhatsApp = () => {
    const text = encodeURIComponent("Bonjour Khelcom Business, je vous contacte depuis la boutique en ligne.");
    window.open(`https://wa.me/${SHOWROOM_INFO.whatsappRaw}?text=${text}`, '_blank');
  };

  return (
    <nav 
      aria-label="Navigation mobile principale"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#16042c]/95 backdrop-blur-lg border-t border-purple-900/70 py-1.5 px-3 shadow-2xl"
    >
      <div className="flex items-center justify-around max-w-md mx-auto">
        
        {/* Accueil */}
        <button
          onClick={() => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className="flex flex-col items-center justify-center py-1 px-2 text-purple-300 hover:text-orange-400 active:scale-95 transition-all cursor-pointer"
        >
          <Home className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] font-bold">Accueil</span>
        </button>

        {/* Rayons / Catalogue */}
        <button
          onClick={onScrollToCatalog}
          className="flex flex-col items-center justify-center py-1 px-2 text-purple-300 hover:text-orange-400 active:scale-95 transition-all cursor-pointer"
        >
          <Layers className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] font-bold">Rayons</span>
        </button>

        {/* Panier with floating badge */}
        <button
          onClick={onOpenCart}
          className="relative flex flex-col items-center justify-center py-1 px-3 text-orange-400 active:scale-95 transition-all cursor-pointer"
        >
          <div className="relative">
            <div className="w-10 h-10 -mt-4 rounded-full bg-gradient-to-tr from-orange-600 to-amber-500 text-white flex items-center justify-center shadow-lg shadow-orange-500/30 border-2 border-[#16042c]">
              <ShoppingBag className="w-5 h-5" />
            </div>
            {cartCount > 0 && (
              <span className="absolute -top-4 -right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-white text-orange-600 text-[10px] font-black shadow-md">
                {cartCount}
              </span>
            )}
          </div>
          <span className="text-[10px] font-bold text-orange-400 mt-0.5">Panier</span>
        </button>

        {/* Direct WhatsApp */}
        <button
          onClick={handleWhatsApp}
          className="flex flex-col items-center justify-center py-1 px-2 text-emerald-400 hover:text-emerald-300 active:scale-95 transition-all cursor-pointer"
        >
          <MessageCircle className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] font-bold">WhatsApp</span>
        </button>

        {/* Suivi de commande */}
        <button
          onClick={onOpenTracking}
          className="flex flex-col items-center justify-center py-1 px-2 text-purple-300 hover:text-orange-400 active:scale-95 transition-all cursor-pointer"
        >
          <Package className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] font-bold">Suivi</span>
        </button>

      </div>
    </nav>
  );
};
