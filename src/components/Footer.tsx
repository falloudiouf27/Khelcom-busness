import React from 'react';
import { 
  MapPin, 
  Phone, 
  Mail, 
  Clock, 
  ShieldCheck, 
  Truck, 
  Store, 
  MessageCircle
} from 'lucide-react';
import { SHOWROOM_INFO } from '../data/senegalLocations';
import { Logo } from './Logo';

interface FooterProps {
  onOpenAdmin: () => void;
  onOpenTracking: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  onOpenAdmin,
  onOpenTracking,
}) => {
  return (
    <footer className="bg-[#120424] text-purple-200/70 border-t border-purple-950 text-xs">
      {/* Guarantees Bar */}
      <div className="border-b border-purple-900/40 bg-[#190733]/90 py-6 sm:py-8 px-4">
        <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <div className="flex items-center gap-3.5">
            <div className="p-2.5 sm:p-3 rounded-2xl bg-orange-500/10 text-orange-400 border border-orange-500/20 shrink-0">
              <ShieldCheck className="w-5 sm:w-6 h-5 sm:h-6" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-white">100% Neuf & Garanti</h4>
              <p className="text-[11px] sm:text-xs text-purple-200/70">Appareils certifiés avec garantie constructeur 1 à 2 ans.</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5">
            <div className="p-2.5 sm:p-3 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
              <Store className="w-5 sm:w-6 h-5 sm:h-6" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-white">Retrait Showroom Nianing</h4>
              <p className="text-[11px] sm:text-xs text-purple-200/70">Gratuit avec vérification et test du matériel à Nianing.</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5">
            <div className="p-2.5 sm:p-3 rounded-2xl bg-blue-500/10 text-blue-400 border border-blue-500/20 shrink-0">
              <Truck className="w-5 sm:w-6 h-5 sm:h-6" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-white">Livraison Proximité & Distance</h4>
              <p className="text-[11px] sm:text-xs text-purple-200/70">Nianing, Mbour et environs selon la grille tarifaire active.</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5">
            <div className="p-2.5 sm:p-3 rounded-2xl bg-purple-500/10 text-purple-300 border border-purple-500/30 shrink-0">
              <MessageCircle className="w-5 sm:w-6 h-5 sm:h-6" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-white">Assistance WhatsApp</h4>
              <p className="text-[11px] sm:text-xs text-purple-200/70">Conseillers disponibles 7j/7 pour vos commandes.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto px-4 py-8 sm:py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8">
          
          {/* Brand Info with Admin Access Trigger on Footer Logo */}
          <div className="lg:col-span-5 space-y-4">
            <div>
              <button
                type="button"
                id="footer-logo-admin-trigger"
                onClick={onOpenAdmin}
                className="group inline-flex items-center text-left focus:outline-none focus:ring-2 focus:ring-orange-500/50 rounded-2xl p-1 -m-1 transition-all hover:opacity-90 active:scale-98 cursor-pointer"
                title="Khelcom Business - Accès Administration"
              >
                <Logo size="md" />
              </button>
            </div>

            <p className="text-xs text-purple-200/80 leading-relaxed max-w-md">
              Khelcom Business est la référence d'électronique et d'électroménager haut de gamme basée à Nianing.
              Découvrez notre large sélection de réfrigérateurs, climatiseurs tropicalisés T3, téléviseurs 4K, cuisinières inox et smartphones aux meilleurs prix nets en Franc CFA.
            </p>

            <div className="space-y-1.5 text-xs text-purple-300/80">
              <p><strong className="text-white">Spécialité :</strong> Électronique, High-Tech & Électroménager</p>
              <p><strong className="text-white">NINEA :</strong> {SHOWROOM_INFO.ninea} | <strong className="text-white">RC :</strong> {SHOWROOM_INFO.rc}</p>
              <p><strong className="text-white">Régime fiscal :</strong> Sans TVA (Prix nets affichés en FCFA)</p>
            </div>
          </div>

          {/* Showroom & Contact */}
          <div className="lg:col-span-4 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">
              Boutique & Showroom (Nianing)
            </h4>
            <ul className="space-y-2.5 text-xs">
              <li className="flex items-start gap-2 text-purple-200">
                <MapPin className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-white">{SHOWROOM_INFO.address}</p>
                  <p className="text-purple-300/80 text-[11px]">{SHOWROOM_INFO.city}</p>
                  <a
                    href={SHOWROOM_INFO.googleMapsUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] text-orange-400 hover:text-orange-300 font-bold underline mt-1"
                  >
                    📍 Voir sur Google Maps (Showroom Nianing)
                  </a>
                </div>
              </li>
              <li className="flex items-center gap-2 text-purple-200">
                <Clock className="w-4 h-4 text-orange-400 shrink-0" />
                <span>{SHOWROOM_INFO.openingHours}</span>
              </li>
              <li className="flex items-center gap-2 text-purple-200">
                <Phone className="w-4 h-4 text-orange-400 shrink-0" />
                <span>Contacts directs : {SHOWROOM_INFO.phone1} / {SHOWROOM_INFO.phone2}</span>
              </li>
              <li className="flex items-center gap-2 text-emerald-400 font-semibold">
                <MessageCircle className="w-4 h-4 shrink-0" />
                <a 
                  href={`https://wa.me/${SHOWROOM_INFO.whatsappRaw}?text=${encodeURIComponent("Bonjour Khelcom Business, je vous contacte depuis la boutique de Nianing.")}`}
                  target="_blank" 
                  rel="noreferrer"
                  className="hover:underline"
                >
                  WhatsApp Direct : {SHOWROOM_INFO.whatsapp}
                </a>
              </li>
            </ul>
          </div>

          {/* Liens rapides */}
          <div className="lg:col-span-3 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">
              Espace Client
            </h4>
            <ul className="space-y-2">
              <li>
                <button
                  onClick={onOpenTracking}
                  className="hover:text-orange-400 transition-colors text-left cursor-pointer"
                >
                  Suivi de commande en temps réel
                </button>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom copyright & Credits */}
        <div className="pt-8 mt-8 border-t border-purple-900/40 flex flex-col md:flex-row items-center justify-between gap-4 text-[11px] text-purple-300/70">
          <p>© {new Date().getFullYear()} Khelcom Business - Nianing. Tous droits réservés.</p>

          {/* Mention VISION 2.0 avec Lien WhatsApp */}
          <div className="flex flex-wrap items-center justify-center gap-2 bg-[#1d073a] px-3.5 py-1.5 rounded-full border border-purple-800/60 shadow-xs">
            <span className="text-purple-200">
              Créé par <strong className="text-white font-bold tracking-wide">VISION 2.0</strong>
            </span>
            <span className="text-purple-500 hidden sm:inline">•</span>
            <a
              href="https://wa.me/221784368656?text=Bonjour%20VISION%202.0%2C%20je%20vous%20contacte%20concernant%20le%20site%20Khelcom%20Business."
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-emerald-400 hover:text-emerald-300 font-bold transition-colors"
              title="Contacter VISION 2.0 sur WhatsApp"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>WhatsApp : +221 78 436 86 56</span>
            </a>
          </div>

          <div className="flex items-center gap-4 text-purple-300/60">
            <span>Devise : Franc CFA (XOF)</span>
            <span>•</span>
            <span>Paiement Espèces & Wave / OM</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
