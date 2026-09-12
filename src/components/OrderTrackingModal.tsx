import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, 
  X, 
  Package, 
  Clock, 
  CheckCircle2, 
  Download, 
  Phone, 
  Store, 
  Truck, 
  AlertCircle, 
  MapPin,
  MessageCircle,
  ShieldCheck,
  Send,
  HelpCircle,
  RotateCcw,
  Check,
  ChevronRight,
  Sparkles,
  ArrowUpRight
} from 'lucide-react';
import { Order, OrderStatus } from '../types';
import { StorageService } from '../services/storage';
import { formatFCFA, formatDate, getStatusBadge } from '../utils/formatters';
import { generateOrderInvoicePDF } from '../services/pdfGenerator';
import { SHOWROOM_INFO } from '../data/senegalLocations';

interface OrderTrackingModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialQuery?: string;
}

export const OrderTrackingModal: React.FC<OrderTrackingModalProps> = ({
  isOpen,
  onClose,
  initialQuery = '',
}) => {
  const [query, setQuery] = useState(initialQuery);
  const [searched, setSearched] = useState(false);
  const [matchedOrders, setMatchedOrders] = useState<Order[]>([]);
  const [recentNumbers, setRecentNumbers] = useState<string[]>([]);

  // Synchronize initial query and recent order numbers when opened
  useEffect(() => {
    if (isOpen) {
      const recents = StorageService.getRecentTrackedOrderNumbers();
      setRecentNumbers(recents);

      if (initialQuery && initialQuery.trim()) {
        setQuery(initialQuery.trim());
        performSearch(initialQuery.trim());
      } else if (recents.length > 0) {
        // Auto-search the most recent order if available
        setQuery(recents[0]);
        performSearch(recents[0]);
      } else {
        // Default show all seed orders or initial state
        const all = StorageService.getOrders();
        if (all.length > 0) {
          setMatchedOrders([all[0]]);
          setSearched(false);
        }
      }
    }
  }, [isOpen, initialQuery]);

  if (!isOpen) return null;

  const performSearch = (searchTerm: string) => {
    const clean = searchTerm.trim();
    if (!clean) return;

    setSearched(true);
    const results = StorageService.searchOrders(clean);
    setMatchedOrders(results);

    if (results.length > 0 && results[0].orderNumber) {
      StorageService.addRecentTrackedOrderNumber(results[0].orderNumber);
      setRecentNumbers(StorageService.getRecentTrackedOrderNumbers());
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    performSearch(query);
  };

  const handleSelectRecent = (orderNum: string) => {
    setQuery(orderNum);
    performSearch(orderNum);
  };

  const getTimelineSteps = (order: Order) => {
    const isCancelled = order.status === 'cancelled';
    const isPaid = order.status === 'paid' || order.status === 'preparing' || order.status === 'delivered';
    const isPreparing = order.status === 'preparing' || order.status === 'delivered';
    const isDelivered = order.status === 'delivered';

    return [
      {
        id: 'placed',
        title: 'Commande Enregistrée',
        desc: `Enregistrée le ${formatDate(order.createdAt)}`,
        status: isCancelled ? 'error' : 'completed',
        date: formatDate(order.createdAt),
      },
      {
        id: 'payment',
        title: 'Règlement & Validation',
        desc: isPaid 
          ? (order.paymentValidatedBy ? `Validé (${order.paymentValidatedBy})` : 'Paiement validé') 
          : 'En attente de paiement (Wave, OM ou Showroom)',
        status: isCancelled ? 'inactive' : isPaid ? 'completed' : 'current',
        date: order.paymentValidatedAt ? formatDate(order.paymentValidatedAt) : undefined,
      },
      {
        id: 'preparation',
        title: 'Préparation Showroom',
        desc: 'Contrôle technique des équipements & test garantie à Nianing',
        status: isCancelled ? 'inactive' : isPreparing ? 'completed' : isPaid ? 'current' : 'pending',
      },
      {
        id: 'dispatch',
        title: order.deliveryType === 'showroom' ? 'Mise à disposition en Boutique' : 'Expédition & Livraison',
        desc: order.deliveryType === 'showroom' 
          ? (isDelivered ? 'Retiré au Showroom Nianing' : 'Disponible au Showroom Nianing (Mbour)') 
          : (isDelivered ? `Livré avec succès à ${order.deliveryCity || 'destination'}` : `Acheminement vers ${order.deliveryCity || 'votre adresse'}`),
        status: isCancelled ? 'inactive' : isDelivered ? 'completed' : isPreparing ? 'current' : 'pending',
      },
      {
        id: 'delivered',
        title: order.deliveryType === 'showroom' ? 'Retiré au Showroom' : 'Commande Livrée',
        desc: isDelivered ? 'Colis remis en main propre avec garantie constructeur' : 'Finalisation de la remise',
        status: isCancelled ? 'inactive' : isDelivered ? 'completed' : 'pending',
      },
    ];
  };

  const handleWhatsAppHelp = (order: Order) => {
    const text = encodeURIComponent(
      `Bonjour Khelcom Business ! 👋\n\nJe souhaite suivre l'avancement de ma commande *${order.orderNumber}* :\n• Nom : ${order.customerName}\n• Téléphone : ${order.customerPhone}\n• Total : ${formatFCFA(order.totalAmount)}\n• Statut actuel : ${order.status}\n\nPouvez-vous me donner plus de précisions sur la disponibilité/livraison ? Merci !`
    );
    window.open(`https://wa.me/${SHOWROOM_INFO.whatsappRaw}?text=${text}`, '_blank');
  };

  const handleCallShowroom = () => {
    window.location.href = `tel:${SHOWROOM_INFO.phone1Raw}`;
  };

  return (
    <div 
      id="order-tracking-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto"
    >
      <div 
        id="order-tracking-modal-container"
        className="bg-[#150428] text-white rounded-3xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto border border-purple-800/80 animate-in zoom-in-95 duration-200"
      >
        
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-purple-900/60 bg-[#1c0736]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-orange-500/20 border border-orange-500/30 text-orange-400">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-white">Suivi de commande en temps réel</h2>
                <span className="hidden xs:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Live Sync
                </span>
              </div>
              <p className="text-xs text-purple-300/80">
                Recherchez par N° de commande (ex: KB-2026-1042) ou téléphone.
              </p>
            </div>
          </div>
          <button
            id="btn-close-order-tracking"
            type="button"
            onClick={onClose}
            className="p-2 rounded-full text-purple-300 hover:text-white hover:bg-purple-900/60 transition-colors cursor-pointer"
            title="Fermer la fenêtre"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search input bar */}
        <div className="p-4 sm:p-6 pb-3 border-b border-purple-900/40 bg-[#120324] space-y-3">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <input
                id="input-order-tracking-search"
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ex: KB-2026-1042, 1042, ou 77 654 32 10..."
                className="w-full bg-[#1e073c] rounded-xl border border-purple-800/80 pl-10 pr-4 py-2.5 text-xs sm:text-sm text-white placeholder-purple-400/60 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 font-mono transition-all shadow-inner"
              />
              <Search className="w-4 h-4 text-purple-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            </div>
            <button
              id="btn-execute-order-tracking-search"
              type="submit"
              className="px-4 sm:px-6 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-400 text-slate-950 font-black text-xs sm:text-sm transition-all cursor-pointer shadow-md active:scale-95 shrink-0"
            >
              Rechercher
            </button>
          </form>

          {/* Quick Recents / Search hint */}
          {recentNumbers.length > 0 ? (
            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              <span className="text-[11px] text-purple-400 font-medium">Vos commandes récentes :</span>
              {recentNumbers.map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => handleSelectRecent(num)}
                  className={`px-2 py-0.5 rounded-lg text-[11px] font-mono font-bold transition-all cursor-pointer border ${
                    query.toUpperCase().includes(num.toUpperCase())
                      ? 'bg-orange-500/20 text-orange-400 border-orange-500/40'
                      : 'bg-purple-950/80 text-purple-300 border-purple-800/60 hover:bg-purple-900 hover:text-white'
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>
          ) : (
            <div className="text-[11px] text-purple-400/80">
              💡 Astuce : Entrez la référence reçue par WhatsApp / SMS ou votre numéro de téléphone (77..., 78..., 70...).
            </div>
          )}
        </div>

        {/* Orders search results */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-6 space-y-5">
          {searched && matchedOrders.length === 0 && (
            <div className="text-center py-10 space-y-4 bg-[#120324] rounded-2xl border border-purple-900/40 p-6">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 mx-auto flex items-center justify-center">
                <AlertCircle className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm sm:text-base font-bold text-white">Aucune commande trouvée</h3>
                <p className="text-xs text-purple-300/80 max-w-sm mx-auto leading-relaxed">
                  Vérifiez le numéro de référence (ex: KB-2026-1042 ou les 4 chiffres 1042) ou le numéro de téléphone utilisé.
                </p>
              </div>
              <div className="pt-2 flex flex-wrap items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setQuery('');
                    setMatchedOrders(StorageService.getOrders());
                    setSearched(false);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-purple-900/80 hover:bg-purple-800 text-purple-200 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Afficher toutes les commandes</span>
                </button>
                <a
                  href={`https://wa.me/${SHOWROOM_INFO.whatsappRaw}?text=${encodeURIComponent("Bonjour Khelcom Business, je ne retrouve pas le suivi de ma commande.")}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all flex items-center gap-1.5"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>Aide WhatsApp</span>
                </a>
              </div>
            </div>
          )}

          {matchedOrders.map((order) => {
            const badge = getStatusBadge(order.status);
            const steps = getTimelineSteps(order);
            const isPaid = order.status === 'paid' || order.status === 'delivered' || order.status === 'preparing' || order.status === 'shipped';

            return (
              <div
                key={order.id}
                id={`tracked-order-card-${order.id}`}
                className="bg-[#130326] rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-purple-800/90 shadow-xl space-y-5"
              >
                {/* Header of Order Card */}
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-purple-900/60 pb-4">
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm sm:text-base font-black text-orange-400 tracking-tight">
                        {order.orderNumber}
                      </span>
                      <span className="text-[11px] text-purple-400">• {order.customerName}</span>
                    </div>
                    <p className="text-xs text-purple-300/80">
                      Passée le {formatDate(order.createdAt)} • Téléphone : <span className="font-mono font-bold text-white">{order.customerPhone}</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border shadow-xs ${badge.bg} ${badge.text} ${badge.border}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                      <span>{badge.label}</span>
                    </span>
                  </div>
                </div>

                {/* VISUAL TIMELINE STEPPER */}
                <div className="space-y-3 bg-[#0d021b] p-4 rounded-2xl border border-purple-900/60">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-purple-200 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-orange-400" />
                      Progression de la commande
                    </span>
                    <span className="text-[10px] text-purple-400 font-mono">
                      Dernière mise à jour : {formatDate(order.updatedAt || order.createdAt)}
                    </span>
                  </div>

                  <div className="relative pl-6 sm:pl-8 space-y-5 before:absolute before:left-3 sm:before:left-4 before:top-2 before:bottom-2 before:w-0.5 before:bg-purple-900/80">
                    {steps.map((st, idx) => {
                      const isDone = st.status === 'completed';
                      const isCurrent = st.status === 'current';
                      const isError = st.status === 'error';

                      return (
                        <div key={st.id} className="relative group">
                          {/* Dot indicator */}
                          <div 
                            className={`absolute -left-6 sm:-left-8 top-0.5 w-6 h-6 rounded-full flex items-center justify-center border-2 transition-all ${
                              isDone
                                ? 'bg-emerald-500 border-emerald-400 text-slate-950 font-bold shadow-md shadow-emerald-500/30'
                                : isCurrent
                                ? 'bg-orange-500 border-orange-300 text-slate-950 font-black ring-4 ring-orange-500/20 animate-pulse'
                                : isError
                                ? 'bg-rose-500 border-rose-400 text-white'
                                : 'bg-[#1e073c] border-purple-800 text-purple-400'
                            }`}
                          >
                            {isDone ? (
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                            ) : isError ? (
                              <X className="w-3.5 h-3.5" />
                            ) : (
                              <span className="text-[10px]">{idx + 1}</span>
                            )}
                          </div>

                          {/* Content */}
                          <div className="space-y-0.5">
                            <div className="flex flex-wrap items-center gap-2">
                              <h4 className={`text-xs sm:text-sm font-bold ${
                                isDone ? 'text-white' : isCurrent ? 'text-orange-400' : 'text-purple-300/70'
                              }`}>
                                {st.title}
                              </h4>
                              {isCurrent && (
                                <span className="px-2 py-0.2 rounded text-[10px] font-bold bg-orange-500/20 text-orange-400 border border-orange-500/30 uppercase tracking-wider">
                                  Étape Actuelle
                                </span>
                              )}
                              {st.date && (
                                <span className="text-[10px] text-purple-400/90 font-mono">({st.date})</span>
                              )}
                            </div>
                            <p className="text-[11px] sm:text-xs text-purple-300/80 leading-relaxed">
                              {st.desc}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Status Notice & Actionable Instruction */}
                {order.status === 'pending_payment' && (
                  <div className="p-3.5 sm:p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs space-y-2">
                    <div className="flex items-start gap-2.5">
                      <Clock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <div className="space-y-1 flex-1">
                        <p className="font-bold text-white text-xs">Paiement en attente de règlement</p>
                        <p className="text-amber-200/90 leading-relaxed text-[11.5px]">
                          Vous pouvez régler via <strong>Wave</strong> ou <strong>Orange Money</strong> au <strong>{SHOWROOM_INFO.phone}</strong>, ou directement en espèces lors de votre passage au Showroom à Nianing.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {order.status === 'paid' && (
                  <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-200 text-xs flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <div>
                      <p className="font-bold text-white text-xs">Paiement 100% validé</p>
                      <p className="text-[11px] text-emerald-300/90">
                        {order.paymentValidatedBy ? `Encaissé par ${order.paymentValidatedBy}` : 'Votre règlement a été reçu avec succès.'}
                      </p>
                    </div>
                  </div>
                )}

                {/* Ordered Items List */}
                <div className="space-y-2 bg-[#0e021a] p-3 sm:p-4 rounded-2xl border border-purple-900/60">
                  <span className="text-[11px] font-bold text-purple-300 uppercase tracking-wider block mb-1">
                    Articles commandés ({order.items.length})
                  </span>
                  <div className="space-y-2 divide-y divide-purple-900/40">
                    {order.items.map((item) => (
                      <div key={item.id} className="flex items-center justify-between text-xs pt-2 first:pt-0">
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <img
                            src={item.productImage}
                            alt={item.productName}
                            className="w-10 h-10 rounded-xl object-cover bg-purple-950 border border-purple-800/80 shrink-0"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="font-bold text-white text-xs truncate" title={item.productName}>
                              {item.productName}
                            </p>
                            <p className="text-[11px] text-purple-300/80 truncate font-mono">
                              {item.variantTitle} (x{item.quantity})
                            </p>
                          </div>
                        </div>
                        <span className="font-bold font-mono text-orange-400 text-xs sm:text-sm shrink-0 ml-2">
                          {formatFCFA(item.totalPrice)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Delivery & Destination Specs */}
                <div className="p-3.5 bg-[#0e021a] rounded-2xl border border-purple-900/60 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-purple-300 font-medium">Mode de réception :</span>
                    <span className="font-bold text-white flex items-center gap-1.5">
                      {order.deliveryType === 'showroom' ? (
                        <>
                          <Store className="w-3.5 h-3.5 text-orange-400" /> Retrait direct au Showroom Nianing
                        </>
                      ) : order.deliveryType === 'distance_delivery' ? (
                        <>
                          <Send className="w-3.5 h-3.5 text-blue-400" /> Livraison à distance ({order.deliveryCity})
                        </>
                      ) : (
                        <>
                          <Truck className="w-3.5 h-3.5 text-purple-400" /> Livraison de main à main ({order.deliveryCity})
                        </>
                      )}
                    </span>
                  </div>

                  {order.deliveryType === 'showroom' ? (
                    <div className="pt-2 border-t border-purple-900/40 flex flex-wrap items-center justify-between gap-2">
                      <span className="text-[11px] text-purple-300">
                        Adresse : <strong className="text-white">{SHOWROOM_INFO.address}</strong>
                      </span>
                      <a
                        href={SHOWROOM_INFO.googleMapsUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] text-orange-400 hover:text-orange-300 font-bold underline"
                      >
                        <MapPin className="w-3 h-3" />
                        <span>Google Maps</span>
                      </a>
                    </div>
                  ) : (
                    <div className="pt-2 border-t border-purple-900/40 flex items-center justify-between text-[11px]">
                      <span className="text-purple-300">Frais de livraison :</span>
                      <span className="font-bold text-white font-mono">
                        {order.deliveryFee === 0 ? 'Gratuit (0 FCFA)' : formatFCFA(order.deliveryFee)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Total and Direct Action Buttons */}
                <div className="pt-2 border-t border-purple-900/60 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs text-purple-300 block">Total Net de la commande</span>
                      <span className="text-lg sm:text-xl font-black font-mono text-white">
                        {formatFCFA(order.totalAmount)}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => generateOrderInvoicePDF(order)}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-950/90 hover:bg-purple-900 text-orange-300 border border-purple-800/80 font-bold text-xs transition-all shadow-xs active:scale-95 cursor-pointer"
                      title="Télécharger la Facture / Bon de Commande PDF officiel"
                    >
                      <Download className="w-3.5 h-3.5 text-orange-400" />
                      <span>Facture / Bon PDF</span>
                    </button>
                  </div>

                  {/* Customer Service & WhatsApp Shortcuts */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => handleWhatsAppHelp(order)}
                      className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md active:scale-95 cursor-pointer transition-all"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>Contacter Showroom (WhatsApp)</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleCallShowroom}
                      className="w-full py-2.5 px-3 rounded-xl bg-[#1e073c] hover:bg-purple-900 text-purple-200 border border-purple-800/80 font-bold text-xs flex items-center justify-center gap-2 active:scale-95 cursor-pointer transition-all"
                    >
                      <Phone className="w-4 h-4 text-orange-400" />
                      <span>Appeler le Showroom</span>
                    </button>
                  </div>
                </div>

              </div>
            );
          })}
        </div>

        {/* Modal Bottom Bar with Hotline info */}
        <div className="px-4 sm:px-6 py-3 border-t border-purple-900/60 bg-[#120324] flex items-center justify-between text-xs text-purple-300/80">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span className="text-[11px]">Garantie constructeur & SAV assurés par Khelcom Business Nianing</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-xs font-bold text-purple-300 hover:text-white underline cursor-pointer"
          >
            Fermer
          </button>
        </div>

      </div>
    </div>
  );
};
