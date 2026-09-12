import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { 
  CheckCircle, 
  MessageCircle, 
  Download, 
  Store, 
  Truck, 
  Send,
  X, 
  Copy, 
  Check, 
  ArrowRight,
  ShieldCheck,
  Clock,
  MapPin
} from 'lucide-react';
import { Order } from '../types';
import { formatFCFA, formatDate, getStatusBadge } from '../utils/formatters';
import { generateOrderInvoicePDF } from '../services/pdfGenerator';
import { SHOWROOM_INFO } from '../data/senegalLocations';

interface OrderSuccessModalProps {
  order: Order | null;
  onClose: () => void;
  onTrackOrder: (orderNumber: string) => void;
}

export const OrderSuccessModal: React.FC<OrderSuccessModalProps> = ({
  order,
  onClose,
  onTrackOrder,
}) => {
  const [copied, setCopied] = React.useState(false);

  useEffect(() => {
    if (order) {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
      });
    }
  }, [order]);

  if (!order) return null;

  const handleCopyOrderNumber = () => {
    navigator.clipboard.writeText(order.orderNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWhatsAppConfirmation = () => {
    const itemsSummary = order.items
      .map((i) => `• ${i.productName} (${i.variantTitle}) x${i.quantity}`)
      .join('\n');

    const deliveryDesc = order.deliveryType === 'showroom'
      ? 'Retrait Showroom Nianing (Mbour)'
      : order.deliveryType === 'distance_delivery'
      ? `Livraison à Distance (${order.deliveryCity})`
      : `Livraison Nianing de main à main (${order.deliveryCity})`;

    const msg = `Bonjour Khelcom Business ! 👋\n\nJe viens de passer la commande *${order.orderNumber}* sur votre boutique en ligne :\n\n*Client :* ${order.customerName}\n*Téléphone :* ${order.customerPhone}\n*Mode :* ${deliveryDesc}\n\n*Articles :*\n${itemsSummary}\n\n*Total Net à payer :* ${formatFCFA(order.totalAmount)}\n\nMerci de me confirmer la préparation du matériel !`;

    window.open(`https://wa.me/${SHOWROOM_INFO.whatsappRaw}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const statusBadge = getStatusBadge(order.status);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/85 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
      <div className="bg-white rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden my-auto border border-slate-200 animate-in zoom-in-95 duration-200">
        
        {/* Header Ribbon */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-950 p-6 text-white text-center relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-400 text-emerald-400 mx-auto flex items-center justify-center mb-3 shadow-lg">
            <CheckCircle className="w-9 h-9" />
          </div>

          <h2 className="text-xl sm:text-2xl font-black">Commande Enregistrée !</h2>
          <p className="text-xs text-slate-300 mt-1">
            Merci {order.customerName}, votre demande a été transmise à notre équipe.
          </p>

          <div className="mt-4 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-800/90 border border-slate-700 font-mono text-sm font-bold text-amber-400 shadow-inner">
            <span>Réf: {order.orderNumber}</span>
            <button
              onClick={handleCopyOrderNumber}
              className="text-slate-400 hover:text-white transition-colors"
              title="Copier le numéro de commande"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-5">
          
          {/* Status Alert */}
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-start gap-3">
            <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-900 space-y-1">
              <p className="font-bold">Statut actuel : En attente de règlement</p>
              <p className="text-amber-800/90 leading-relaxed">
                Le paiement sera validé lors de votre passage au showroom ou à la réception de votre livraison par notre livreur.
              </p>
            </div>
          </div>

          {/* Logistics Recap */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 space-y-2.5 text-xs">
            <div className="flex items-center justify-between text-slate-500">
              <span>Mode de récupération :</span>
              <span className="font-bold text-slate-900 flex items-center gap-1">
                {order.deliveryType === 'showroom' ? (
                  <>
                    <Store className="w-3.5 h-3.5 text-amber-600" /> Retrait Showroom Nianing (Gratuit)
                  </>
                ) : order.deliveryType === 'distance_delivery' ? (
                  <>
                    <Send className="w-3.5 h-3.5 text-blue-600" /> Livraison à distance ({order.deliveryCity})
                  </>
                ) : (
                  <>
                    <Truck className="w-3.5 h-3.5 text-purple-600" /> Livraison de main à main à {order.deliveryCity}
                  </>
                )}
              </span>
            </div>

            <div className="flex items-center justify-between text-slate-500">
              <span>Contact :</span>
              <span className="font-bold text-slate-900">{order.customerPhone}</span>
            </div>

            <div className="flex items-center justify-between text-slate-500 pt-2 border-t border-slate-200">
              <span>Montant Net Total :</span>
              <span className="text-base font-black text-slate-900">{formatFCFA(order.totalAmount)}</span>
            </div>
          </div>

          {/* Showroom in-store pickup instruction */}
          {order.deliveryType === 'showroom' && (
            <div className="p-3.5 rounded-2xl bg-amber-50/90 border border-amber-200 text-xs space-y-2.5">
              <div className="flex items-start gap-2.5">
                <div className="p-1.5 rounded-lg bg-orange-500 text-white shrink-0 mt-0.5">
                  <Store className="w-4 h-4" />
                </div>
                <div className="space-y-1 flex-1">
                  <p className="font-bold text-slate-900 text-xs">Retrait direct en magasin (Showroom Nianing)</p>
                  <p className="text-slate-700 leading-relaxed font-medium text-[11px]">
                    Vous devez venir retirer et tester votre produit <strong>directement dans notre boutique à Nianing (Mbour)</strong>.
                    Présentez votre référence de commande <strong>{order.orderNumber}</strong>.
                  </p>
                </div>
              </div>
              <a
                href={SHOWROOM_INFO.googleMapsUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-[11px] transition-colors"
              >
                <MapPin className="w-3.5 h-3.5" />
                <span>Ouvrir l'itinéraire Google Maps vers la boutique</span>
              </a>
            </div>
          )}

          {/* Fast WhatsApp confirmation action */}
          <div className="space-y-2.5 pt-2">
            <button
              onClick={handleWhatsAppConfirmation}
              className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm transition-all shadow-md active:scale-98 cursor-pointer"
            >
              <MessageCircle className="w-5 h-5" />
              <span>Confirmer ma commande sur WhatsApp</span>
            </button>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => generateOrderInvoicePDF(order)}
                className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-colors"
              >
                <Download className="w-3.5 h-3.5 text-slate-600" />
                <span>Télécharger le devis PDF</span>
              </button>

              <button
                onClick={() => {
                  onClose();
                  onTrackOrder(order.orderNumber);
                }}
                className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors"
              >
                <span>Suivre ma commande</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
