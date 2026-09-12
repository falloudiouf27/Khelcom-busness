import React from 'react';
import { 
  X, 
  FileText, 
  Download, 
  Phone, 
  Mail, 
  MapPin, 
  Store, 
  Truck, 
  Send, 
  Check, 
  Clock, 
  CreditCard, 
  MessageSquare, 
  FileEdit, 
  Printer, 
  ExternalLink, 
  AlertCircle, 
  Package, 
  ShieldCheck,
  Calendar,
  User,
  Info
} from 'lucide-react';
import { Order, OrderStatus, AppSettings } from '../types';
import { formatFCFA, formatDate } from '../utils/formatters';
import { generateOrderInvoicePDF } from '../services/pdfGenerator';

interface AdminOrderDetailsModalProps {
  isOpen: boolean;
  order: Order | null;
  onClose: () => void;
  onEditOrder: (order: Order) => void;
  onValidatePayment?: (orderId: string) => void;
  settings?: AppSettings;
}

export const AdminOrderDetailsModal: React.FC<AdminOrderDetailsModalProps> = ({
  isOpen,
  order,
  onClose,
  onEditOrder,
  onValidatePayment,
  settings,
}) => {
  if (!isOpen || !order) return null;

  const isPaid = order.status === 'paid' || order.status === 'delivered';

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'paid':
        return { label: 'Paiement Validé', bg: 'bg-emerald-500/20', text: 'text-emerald-400', border: 'border-emerald-500/40', dot: 'bg-emerald-400' };
      case 'preparing':
        return { label: 'En Préparation', bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500/40', dot: 'bg-blue-400' };
      case 'delivered':
        return { label: 'Livré & Clôturé', bg: 'bg-teal-500/20', text: 'text-teal-300', border: 'border-teal-500/40', dot: 'bg-teal-400' };
      case 'cancelled':
        return { label: 'Annulé', bg: 'bg-rose-500/20', text: 'text-rose-400', border: 'border-rose-500/40', dot: 'bg-rose-400' };
      case 'pending_payment':
      default:
        return { label: 'En Attente de Paiement', bg: 'bg-amber-500/20', text: 'text-amber-400', border: 'border-amber-500/40', dot: 'bg-amber-400' };
    }
  };

  const getPaymentMethodLabel = (method: string) => {
    switch (method) {
      case 'wave_orange_money':
        return 'Paiement Digital (Wave / Orange Money)';
      case 'showroom_cash':
        return 'Paiement Comptant au Showroom';
      case 'cash_on_delivery':
      default:
        return 'Paiement à la Livraison (Espèces / Wave)';
    }
  };

  const badge = getStatusBadge(order.status);
  const cleanPhone = order.customerPhone.replace(/[^0-9]/g, '');

  // Pre-formatted WhatsApp Message for instant client communication
  const whatsappMessage = encodeURIComponent(
    `Bonjour ${order.customerName},\n\n` +
    `C'est la Direction de *Khelcom Business* (Showroom Nianing / Mbour).\n` +
    `Nous avons bien reçu votre bon de commande *${order.orderNumber}* d'un montant de *${formatFCFA(order.totalAmount)}*.\n\n` +
    `Articles commandés :\n` +
    order.items.map((it) => `• ${it.productName} (${it.variantTitle}) x${it.quantity} - ${formatFCFA(it.totalPrice)}`).join('\n') +
    `\n\nMode : ${order.deliveryType === 'showroom' ? 'Retrait Showroom Nianing' : `Livraison à ${order.deliveryCity || 'votre adresse'}`}` +
    `\nStatut : ${badge.label}\n\n` +
    `Nous restons à votre disposition pour la finalisation. Merci pour votre confiance !`
  );

  const whatsappUrl = `https://wa.me/${cleanPhone.startsWith('221') ? cleanPhone : `221${cleanPhone}`}?text=${whatsappMessage}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-black/85 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-[#180630] border-2 border-purple-700/80 rounded-3xl w-full max-w-4xl max-h-[94vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* MODAL HEADER */}
        <div className="flex items-center justify-between border-b border-purple-900/80 p-4 sm:p-5 shrink-0 bg-[#120324]">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 text-white flex items-center justify-center shadow-md shadow-orange-500/25 shrink-0">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-mono text-orange-400 font-extrabold tracking-wide">
                  {order.orderNumber}
                </span>
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${badge.bg} ${badge.text} ${badge.border}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                  <span>{badge.label}</span>
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-black text-white mt-0.5">
                Bon de Commande & Spécifications Client
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => generateOrderInvoicePDF(order)}
              className="px-3 py-2 rounded-xl bg-purple-900/80 hover:bg-purple-800 text-orange-300 hover:text-white border border-purple-700/80 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
              title="Télécharger la Facture / Bon de commande PDF"
            >
              <Download className="w-4 h-4 text-orange-400" />
              <span className="hidden sm:inline">Facture PDF</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onClose();
                onEditOrder(order);
              }}
              className="px-3 py-2 rounded-xl bg-purple-900/80 hover:bg-purple-800 text-purple-200 hover:text-white border border-purple-700/80 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
              title="Modifier cette commande"
            >
              <FileEdit className="w-4 h-4 text-amber-400" />
              <span className="hidden sm:inline">Modifier</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-purple-300 hover:text-white hover:bg-purple-900/60 transition-colors cursor-pointer"
              title="Fermer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* SCROLLABLE CONTENT */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          
          {/* Order Timestamp & Quick Stats Strip */}
          <div className="bg-[#100220] p-3.5 sm:p-4 rounded-2xl border border-purple-800/60 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-purple-300">
              <Calendar className="w-4 h-4 text-orange-400 shrink-0" />
              <span>
                Commande passée le <strong className="text-white font-bold">{formatDate(order.createdAt)}</strong>
              </span>
            </div>

            <div className="flex items-center gap-2 text-purple-300 font-mono">
              <Clock className="w-4 h-4 text-purple-400 shrink-0" />
              <span>Dernière mise à jour : {formatDate(order.updatedAt || order.createdAt)}</span>
            </div>

            {order.paymentValidatedAt && (
              <div className="w-full pt-2 border-t border-purple-900/40 text-emerald-300 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Paiement validé par <strong>{order.paymentValidatedBy || 'Direction Khelcom'}</strong></span>
                </span>
                <span className="text-[11px] text-emerald-400 font-mono">{formatDate(order.paymentValidatedAt)}</span>
              </div>
            )}
          </div>

          {/* TWO COLUMN GRID: CLIENT INFO & DELIVERY SPECS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* 1. Client Details Card */}
            <div className="bg-[#100220] p-4 sm:p-5 rounded-2xl border border-purple-800/60 space-y-3.5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-purple-900/50 pb-2.5">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-orange-400" />
                    <h3 className="text-xs font-black text-white uppercase tracking-wider">
                      Coordonnées du Client
                    </h3>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-900/60 text-purple-300 border border-purple-700/60">
                    Acheteur
                  </span>
                </div>

                <div className="mt-3 space-y-2.5 text-xs">
                  <div>
                    <span className="text-purple-400 block text-[11px]">Nom complet :</span>
                    <strong className="text-sm font-black text-white block">{order.customerName}</strong>
                  </div>

                  <div>
                    <span className="text-purple-400 block text-[11px]">Téléphone / Contact :</span>
                    <div className="flex items-center gap-2 mt-0.5">
                      <a 
                        href={`tel:${order.customerPhone}`}
                        className="text-sm font-mono font-bold text-orange-400 hover:text-orange-300 hover:underline flex items-center gap-1"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        <span>{order.customerPhone}</span>
                      </a>
                    </div>
                  </div>

                  {order.customerEmail && (
                    <div>
                      <span className="text-purple-400 block text-[11px]">Email :</span>
                      <a 
                        href={`mailto:${order.customerEmail}`}
                        className="text-purple-200 hover:text-white hover:underline flex items-center gap-1 mt-0.5"
                      >
                        <Mail className="w-3.5 h-3.5 text-purple-400" />
                        <span>{order.customerEmail}</span>
                      </a>
                    </div>
                  )}

                  <div className="pt-2 border-t border-purple-900/40">
                    <span className="text-purple-400 block text-[11px]">Mode de règlement choisi :</span>
                    <div className="flex items-center gap-1.5 mt-0.5 font-semibold text-purple-200">
                      <CreditCard className="w-3.5 h-3.5 text-orange-400" />
                      <span>{getPaymentMethodLabel(order.paymentMethod)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Direct WhatsApp Contact Button */}
              <div className="pt-2">
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-emerald-900/40 active:scale-98 cursor-pointer"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Contacter sur WhatsApp (Message pré-rempli)</span>
                </a>
              </div>
            </div>

            {/* 2. Delivery Specifications Card */}
            <div className="bg-[#100220] p-4 sm:p-5 rounded-2xl border border-purple-800/60 space-y-3.5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-purple-900/50 pb-2.5">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-orange-400" />
                    <h3 className="text-xs font-black text-white uppercase tracking-wider">
                      Spécifications de Livraison
                    </h3>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-950/60 text-orange-300 border border-orange-700/60">
                    Destination
                  </span>
                </div>

                <div className="mt-3 space-y-2.5 text-xs">
                  <div>
                    <span className="text-purple-400 block text-[11px]">Mode d'expédition / retrait :</span>
                    <div className="mt-1">
                      {order.deliveryType === 'showroom' ? (
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-orange-500/20 text-orange-300 font-bold border border-orange-500/40">
                          <Store className="w-4 h-4 text-orange-400 shrink-0" />
                          <span>Retrait Showroom Nianing (Sans frais)</span>
                        </div>
                      ) : order.deliveryType === 'distance_delivery' ? (
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-blue-500/20 text-blue-300 font-bold border border-blue-500/40">
                          <Send className="w-4 h-4 text-blue-400 shrink-0" />
                          <span>Expédition Régions du Sénégal ({order.deliveryCity || 'Distance'})</span>
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-purple-500/20 text-purple-300 font-bold border border-purple-500/40">
                          <Truck className="w-4 h-4 text-purple-400 shrink-0" />
                          <span>Livraison Standard ({order.deliveryCity || 'Nianing / Mbour'})</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <span className="text-purple-400 block text-[11px]">Ville / Secteur :</span>
                    <strong className="text-white text-xs block">
                      {order.deliveryCity || (order.deliveryType === 'showroom' ? 'Nianing (Showroom Principal)' : 'Non spécifié')}
                    </strong>
                  </div>

                  {order.deliveryAddress && (
                    <div>
                      <span className="text-purple-400 block text-[11px]">Adresse exacte & Repères :</span>
                      <p className="text-purple-100 bg-[#180630] p-2.5 rounded-xl border border-purple-800/60 mt-0.5 leading-relaxed">
                        {order.deliveryAddress}
                      </p>
                    </div>
                  )}

                  {/* Customer Special Notes / Instructions */}
                  {order.deliveryNotes ? (
                    <div className="bg-amber-950/30 border border-amber-800/60 rounded-xl p-3 space-y-1">
                      <div className="flex items-center gap-1.5 text-amber-300 font-bold text-[11px] uppercase">
                        <Info className="w-3.5 h-3.5 shrink-0" />
                        <span>Instructions particulières du client :</span>
                      </div>
                      <p className="text-amber-100 italic text-xs leading-relaxed">
                        &ldquo;{order.deliveryNotes}&rdquo;
                      </p>
                    </div>
                  ) : (
                    <div className="text-[11px] text-purple-400 italic">
                      Aucune consigne spéciale précisée par le client.
                    </div>
                  )}
                </div>
              </div>

              {/* Showroom Contact Reminder */}
              <div className="pt-2 text-[11px] text-purple-400 flex items-center gap-1.5">
                <Store className="w-3.5 h-3.5 text-orange-400 shrink-0" />
                <span>Showroom : {settings?.address || 'Route de Nianing, Mbour'}, Sénégal</span>
              </div>
            </div>
          </div>

          {/* 3. ORDERED PRODUCTS & SPECIFICATIONS TABLE */}
          <div className="bg-[#100220] p-4 sm:p-5 rounded-2xl border border-purple-800/60 space-y-3">
            <div className="flex items-center justify-between border-b border-purple-900/50 pb-2.5">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-orange-400" />
                <h3 className="text-xs font-black text-white uppercase tracking-wider">
                  Détails des Appareils Commandés ({order.items.length} article{order.items.length > 1 ? 's' : ''})
                </h3>
              </div>
              <span className="text-xs font-mono text-purple-300">
                Total articles : {order.items.reduce((sum, it) => sum + it.quantity, 0)} unité(s)
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse min-w-[560px]">
                <thead className="bg-[#15032a] text-purple-300 font-mono text-[10px] uppercase border-b border-purple-800/60">
                  <tr>
                    <th className="py-2.5 px-3">Article & Image</th>
                    <th className="py-2.5 px-3">Spécifications / Variante</th>
                    <th className="py-2.5 px-3 text-right">Prix Unitaire</th>
                    <th className="py-2.5 px-3 text-center">Quantité</th>
                    <th className="py-2.5 px-3 text-right">Total Ligne</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-purple-900/40 text-purple-100">
                  {order.items.map((item, idx) => (
                    <tr key={item.id || idx} className="hover:bg-purple-950/30 transition-colors">
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-3">
                          <img
                            src={item.productImage}
                            alt={item.productName}
                            className="w-12 h-12 rounded-xl object-cover bg-purple-950 border border-purple-800 shrink-0"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1584992236310-6edddc08acff?auto=format&fit=crop&w=150&q=80';
                            }}
                          />
                          <div>
                            <p className="font-bold text-white text-xs">{item.productName}</p>
                            {item.variantId && (
                              <span className="text-[10px] text-purple-400 font-mono">Ref: #{item.variantId.slice(0, 8)}</span>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-900/60 text-purple-200 font-semibold text-xs border border-purple-700/60">
                          {item.variantTitle}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-right font-mono text-purple-300">
                        {formatFCFA(item.unitPrice)}
                      </td>

                      <td className="py-3 px-3 text-center">
                        <span className="px-2.5 py-0.5 rounded-md bg-[#180630] font-black text-white border border-purple-800 font-mono">
                          x{item.quantity}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-right font-mono font-black text-orange-400">
                        {formatFCFA(item.totalPrice)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 4. FINANCIAL SUMMARY & INTERNAL NOTES */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Admin Notes */}
            <div className="bg-[#100220] p-4 rounded-2xl border border-purple-800/60 space-y-2">
              <h4 className="text-xs font-bold text-purple-300 uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-orange-400" />
                <span>Notes Internes Administration</span>
              </h4>
              {order.adminNotes ? (
                <p className="text-xs text-purple-200 bg-[#180630] p-3 rounded-xl border border-purple-800/60 leading-relaxed">
                  {order.adminNotes}
                </p>
              ) : (
                <p className="text-xs text-purple-400 italic bg-[#180630]/60 p-3 rounded-xl border border-purple-900/40">
                  Aucune note interne enregistrée pour cette commande.
                </p>
              )}
            </div>

            {/* Financial Totals Card */}
            <div className="bg-[#15032a] p-4.5 rounded-2xl border-2 border-purple-700/80 space-y-2.5 shadow-lg">
              <div className="flex justify-between items-center text-xs text-purple-300">
                <span>Sous-total articles :</span>
                <span className="font-mono font-bold text-white">
                  {formatFCFA(order.subtotal || order.items.reduce((s, i) => s + i.totalPrice, 0))}
                </span>
              </div>

              <div className="flex justify-between items-center text-xs text-purple-300">
                <span>Frais d'expédition / livraison :</span>
                <span className="font-mono font-bold text-orange-300">
                  {order.deliveryType === 'showroom'
                    ? '0 FCFA (Gratuit)'
                    : order.deliveryFeeToBeAgreed
                    ? 'À convenir'
                    : formatFCFA(order.deliveryFee || 0)}
                </span>
              </div>

              <div className="pt-2.5 border-t border-purple-700 flex justify-between items-baseline">
                <span className="text-xs sm:text-sm font-black text-white uppercase tracking-wider">
                  Total Net à Payer :
                </span>
                <span className="text-lg sm:text-2xl font-black text-orange-400 font-mono">
                  {formatFCFA(order.totalAmount)}
                </span>
              </div>
            </div>

          </div>

        </div>

        {/* MODAL ACTIONS FOOTER */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-4 sm:p-5 border-t border-purple-900/80 bg-[#120324] shrink-0">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => generateOrderInvoicePDF(order)}
              className="px-4 py-2.5 rounded-xl bg-purple-900 hover:bg-purple-800 text-orange-300 hover:text-white border border-purple-700 font-bold text-xs transition-all flex items-center gap-2 cursor-pointer shadow-xs active:scale-95"
            >
              <Download className="w-4 h-4 text-orange-400" />
              <span>Télécharger Bon / Facture PDF</span>
            </button>

            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2.5 rounded-xl bg-emerald-700/80 hover:bg-emerald-600 text-white font-bold text-xs transition-all flex items-center gap-2 cursor-pointer shadow-xs active:scale-95"
            >
              <MessageSquare className="w-4 h-4 text-emerald-300" />
              <span>WhatsApp Client</span>
            </a>
          </div>

          <div className="flex items-center gap-2">
            {!isPaid && order.status !== 'cancelled' && onValidatePayment && (
              <button
                type="button"
                onClick={() => {
                  onValidatePayment(order.id);
                }}
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all flex items-center gap-2 cursor-pointer shadow-md shadow-emerald-950/60 active:scale-95"
              >
                <Check className="w-4 h-4" />
                <span>Valider le Paiement</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                onClose();
                onEditOrder(order);
              }}
              className="px-4 py-2.5 rounded-xl bg-purple-800 hover:bg-purple-700 text-purple-100 font-bold text-xs transition-all flex items-center gap-2 cursor-pointer border border-purple-600"
            >
              <FileEdit className="w-4 h-4 text-amber-400" />
              <span>Modifier la Commande</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-purple-950 hover:bg-purple-900 text-purple-300 font-bold text-xs transition-colors cursor-pointer border border-purple-800"
            >
              Fermer
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
