import React, { useState } from 'react';
import { 
  X, 
  Store, 
  Truck, 
  Phone, 
  User, 
  MapPin, 
  CreditCard, 
  Banknote, 
  ShieldCheck, 
  ArrowRight,
  Info,
  CheckCircle2,
  Send,
  Navigation,
  AlertCircle,
  AlertTriangle,
  Wand2,
  PackageCheck,
  Clock,
  ExternalLink
} from 'lucide-react';
import { CartItem, DeliveryType, Order, PaymentMethod, AppSettings } from '../types';
import { StorageService } from '../services/storage';
import { 
  SENEGAL_DELIVERY_ZONES, 
  DISTANCE_DELIVERY_ZONES, 
  SHOWROOM_INFO, 
  SENEGAL_14_REGIONS,
  getEffectiveDistanceZoneFee,
  getEffectiveLocalZoneFee,
  getAllLocalZones,
  getAllDistanceZones
} from '../data/senegalLocations';
import { formatFCFA, generateOrderNumber } from '../utils/formatters';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onOrderSuccess: (order: Order) => void;
  settings?: AppSettings;
  onAutoAdjustCart?: () => void;
  initialDeliveryType?: DeliveryType;
  initialZoneId?: string;
  initialDistanceZoneId?: string;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  items,
  onOrderSuccess,
  settings,
  onAutoAdjustCart,
  initialDeliveryType = 'showroom',
  initialZoneId = SENEGAL_DELIVERY_ZONES[0].id,
  initialDistanceZoneId = DISTANCE_DELIVERY_ZONES[0].id,
}) => {
  // Guest customer fields
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('+221 ');
  const [customerEmail, setCustomerEmail] = useState('');
  
  // Logistics - initialized from cart selection
  const [deliveryType, setDeliveryType] = useState<DeliveryType>(initialDeliveryType);
  const [selectedZoneId, setSelectedZoneId] = useState(initialZoneId);
  const [selectedDistanceZoneId, setSelectedDistanceZoneId] = useState(initialDistanceZoneId);
  const [deliveryCityCustom, setDeliveryCityCustom] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryNotes, setDeliveryNotes] = useState('');

  // Payment
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash_on_delivery');
  
  // Validation & Submission
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [stockError, setStockError] = useState<string | null>(null);

  if (!isOpen) return null;

  // Live stock verification
  const stockValidation = StorageService.verifyCartStock(items);
  const hasStockIssues = !stockValidation.isValid;

  // Financial calculations (Without VAT)
  const subtotal = items.reduce(
    (acc, item) => acc + item.selectedVariant.price * item.quantity,
    0
  );

  // All available delivery zones (including admin custom-added neighborhoods and locations)
  const allLocalZones = getAllLocalZones(settings);
  const allDistanceZones = getAllDistanceZones(settings);

  const selectedNianingZone = allLocalZones.find((z) => z.id === selectedZoneId) || allLocalZones[0] || SENEGAL_DELIVERY_ZONES[0];
  const selectedDistanceZone = allDistanceZones.find((z) => z.id === selectedDistanceZoneId) || allDistanceZones[0] || DISTANCE_DELIVERY_ZONES[0];
  
  const isFeeHidden = Boolean(settings?.hideDeliveryFees);

  // Dynamic fee calculation based on settings
  const nianingFee = getEffectiveLocalZoneFee(selectedNianingZone, settings);
  const distanceFee = getEffectiveDistanceZoneFee(selectedDistanceZone, settings);

  let deliveryFee = 0;
  if (deliveryType === 'delivery') {
    deliveryFee = isFeeHidden ? 0 : nianingFee;
  } else if (deliveryType === 'distance_delivery') {
    deliveryFee = isFeeHidden ? 0 : distanceFee;
  }

  const totalAmount = subtotal + deliveryFee;

  const handleAdjustStock = () => {
    if (onAutoAdjustCart) {
      onAutoAdjustCart();
      setStockError(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStockError(null);
    const newErrors: Record<string, string> = {};

    // 1. Verify live stock before accepting
    const liveValidation = StorageService.verifyCartStock(items);
    if (!liveValidation.isValid) {
      const issueDetails = liveValidation.issues
        .map(
          (i) =>
            `${i.item.product.name} (${i.item.selectedVariant.title}) : ${i.requested} demandé(s), ${i.available} dispo`
        )
        .join(' | ');
      setStockError(`Stock insuffisant : ${issueDetails}`);
      return;
    }

    if (!customerName.trim()) {
      newErrors.customerName = 'Veuillez saisir votre nom complet.';
    }

    const cleanPhone = customerPhone.replace(/[\s+-]/g, '');
    if (!cleanPhone || cleanPhone.length < 8) {
      newErrors.customerPhone = 'Veuillez saisir un numéro de téléphone valide (ex: +221 77 123 45 67).';
    }

    if (deliveryType === 'delivery' && !deliveryAddress.trim()) {
      newErrors.deliveryAddress = 'Veuillez indiquer votre adresse ou quartier à Nianing.';
    }

    if (deliveryType === 'distance_delivery' && !deliveryAddress.trim()) {
      newErrors.deliveryAddress = 'Veuillez indiquer votre ville et adresse précise de destination.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);

    let resolvedCity = 'Showroom Nianing (Mbour)';
    if (deliveryType === 'delivery') {
      resolvedCity = `Nianing - ${selectedNianingZone.name}`;
    } else if (deliveryType === 'distance_delivery') {
      resolvedCity = deliveryCityCustom.trim() ? `${selectedDistanceZone.region} (${deliveryCityCustom.trim()})` : selectedDistanceZone.name;
    }

    const orderItems = items.map((item) => ({
      id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      orderId: '',
      productId: item.product.id,
      variantId: item.selectedVariant.id,
      productName: item.product.name,
      variantTitle: item.selectedVariant.title,
      unitPrice: item.selectedVariant.price,
      quantity: item.quantity,
      totalPrice: item.selectedVariant.price * item.quantity,
      productImage: item.selectedVariant.imageUrl || item.product.imageUrl,
    }));

    // Atomically deduct stock from inventory
    const deductionResult = StorageService.deductOrderStock(orderItems);
    if (!deductionResult.success) {
      setIsSubmitting(false);
      setStockError(
        deductionResult.errors?.join(' | ') ||
          'Le stock a changé. Impossible de valider la commande.'
      );
      return;
    }

    const newOrder: Order = {
      id: `ord-${Date.now()}`,
      orderNumber: generateOrderNumber(),
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      customerEmail: customerEmail.trim() || undefined,
      deliveryType,
      deliveryCity: resolvedCity,
      deliveryAddress: deliveryType !== 'showroom' ? deliveryAddress.trim() : undefined,
      deliveryNotes: deliveryNotes.trim() || undefined,
      subtotal,
      deliveryFee,
      deliveryFeeToBeAgreed: isFeeHidden && deliveryType !== 'showroom',
      totalAmount,
      status: 'pending_payment',
      paymentMethod,
      items: orderItems,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Save order
    StorageService.saveOrder(newOrder);

    setTimeout(() => {
      setIsSubmitting(false);
      onOrderSuccess(newOrder);
      onClose();
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
      <div className="bg-white rounded-2xl sm:rounded-3xl w-full max-w-3xl max-h-[94vh] flex flex-col shadow-2xl overflow-hidden my-auto border border-slate-200">
        
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-purple-900/40 bg-[#1e0a3c] text-white">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-extrabold text-white">Finaliser ma commande</h2>
              <span className="px-2.5 py-0.5 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30 text-xs font-bold">
                Commande Directe (Sans Compte)
              </span>
            </div>
            <p className="text-xs text-purple-200/80 mt-0.5">
              Remplissez vos coordonnées pour valider votre commande en 1 minute.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-purple-300 hover:text-white hover:bg-purple-900/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Stock issues banner if any */}
          {(hasStockIssues || stockError) && (
            <div className="bg-rose-50 border border-rose-300 rounded-2xl p-4 text-xs text-rose-900 space-y-2">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-bold text-sm text-rose-950">Vérification de stock requise</h4>
                  <p className="text-rose-700 mt-0.5">
                    {stockError || "Certains articles de votre panier ne sont plus disponibles dans les quantités demandées."}
                  </p>
                </div>
              </div>

              {stockValidation.issues.length > 0 && (
                <div className="bg-white/80 rounded-xl p-2.5 border border-rose-200 space-y-1 text-[11px]">
                  {stockValidation.issues.map((issue, idx) => (
                    <div key={idx} className="flex items-center justify-between text-rose-800">
                      <span>• <strong>{issue.item.product.name}</strong> ({issue.item.selectedVariant.title})</span>
                      <span className="font-bold">
                        Demandé: {issue.requested} | Dispo: {issue.available}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {onAutoAdjustCart && (
                <button
                  type="button"
                  onClick={handleAdjustStock}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition-colors cursor-pointer shadow-xs"
                >
                  <Wand2 className="w-3.5 h-3.5" />
                  <span>Ajuster automatiquement les quantités au stock disponible</span>
                </button>
              )}
            </div>
          )}

          {/* ORDER ITEMS & STOCK SUMMARY */}
          <div className="space-y-3 bg-purple-50/40 p-4 rounded-2xl border border-purple-100">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <PackageCheck className="w-4 h-4 text-purple-700" />
                Articles commandés & Disponibilité en stock
              </h3>
              <span className="text-[11px] font-bold text-purple-800">
                {items.reduce((sum, item) => sum + item.quantity, 0)} unité(s)
              </span>
            </div>

            <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
              {items.map((item, idx) => {
                const liveStock = StorageService.getVariantLiveStock(
                  item.product.id,
                  item.selectedVariant.id
                );
                const isOutOfStock = liveStock <= 0;
                const isOverStock = item.quantity > liveStock;

                return (
                  <div
                    key={idx}
                    className={`flex items-center justify-between p-2 rounded-xl text-xs border ${
                      isOutOfStock
                        ? 'bg-rose-50 border-rose-300'
                        : isOverStock
                        ? 'bg-amber-50 border-amber-300'
                        : 'bg-white border-slate-200/80'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img
                        src={item.selectedVariant.imageUrl || item.product.imageUrl}
                        alt={item.product.name}
                        className="w-9 h-9 rounded-lg object-cover border border-slate-100 shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="font-bold text-slate-900 truncate text-[11px]">
                          {item.quantity}x {item.product.name}
                        </p>
                        <p className="text-[10px] text-slate-500 truncate">
                          {item.selectedVariant.title}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0 ml-2">
                      <span className="font-black text-slate-900 block text-[11px]">
                        {formatFCFA(item.selectedVariant.price * item.quantity)}
                      </span>
                      {isOutOfStock ? (
                        <span className="text-[10px] font-bold text-rose-600 flex items-center gap-0.5 justify-end">
                          <AlertCircle className="w-2.5 h-2.5" /> Épuisé
                        </span>
                      ) : isOverStock ? (
                        <span className="text-[10px] font-bold text-amber-700 flex items-center gap-0.5 justify-end">
                          <AlertTriangle className="w-2.5 h-2.5" /> Max dispo: {liveStock}
                        </span>
                      ) : (
                        <span className="text-[10px] font-semibold text-emerald-700 flex items-center gap-0.5 justify-end">
                          <CheckCircle2 className="w-2.5 h-2.5" /> En stock ({liveStock})
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* STEP 1: CLIENT INFORMATIONS */}
          <div className="space-y-4">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px]">
                1
              </span>
              Vos Coordonnées de Contact
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nom et Prénom <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Ex: Cheikh Anta Diop"
                    className={`w-full rounded-xl border px-3.5 py-2.5 text-xs text-slate-900 pl-10 focus:outline-none focus:ring-1 ${
                      errors.customerName ? 'border-rose-400 focus:ring-rose-400' : 'border-slate-300 focus:border-amber-500 focus:ring-amber-500'
                    }`}
                  />
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                </div>
                {errors.customerName && (
                  <p className="text-[11px] text-rose-500 mt-1">{errors.customerName}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Numéro de Téléphone (WhatsApp/Appel) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    required
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="+221 77 000 00 00"
                    className={`w-full rounded-xl border px-3.5 py-2.5 text-xs text-slate-900 pl-10 font-mono focus:outline-none focus:ring-1 ${
                      errors.customerPhone ? 'border-rose-400 focus:ring-rose-400' : 'border-slate-300 focus:border-amber-500 focus:ring-amber-500'
                    }`}
                  />
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                </div>
                {errors.customerPhone && (
                  <p className="text-[11px] text-rose-500 mt-1">{errors.customerPhone}</p>
                )}
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Adresse Email <span className="text-slate-400 font-normal">(Optionnel, pour recevoir la facture)</span>
                </label>
                <input
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="contact@exemple.sn"
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                />
              </div>
            </div>
          </div>

          {/* STEP 2: MODE DE RÉCUPÉRATION / LOGISTIQUE */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px]">
                  2
                </span>
                Mode de Récupération ou Livraison
              </h3>
              <span className="text-[11px] text-purple-700 font-bold bg-purple-50 px-2 py-0.5 rounded-lg border border-purple-200 inline-flex items-center gap-1 self-start sm:self-auto">
                <Navigation className="w-3 h-3" /> Nianing de main à main + Livraison à distance partout au Sénégal
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Option 1: Showroom Pickup */}
              <div
                onClick={() => setDeliveryType('showroom')}
                className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${
                  deliveryType === 'showroom'
                    ? 'border-orange-500 bg-orange-50/50 ring-1 ring-orange-500 shadow-xs'
                    : 'border-slate-200 hover:border-purple-300 bg-white'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div className="p-2 rounded-xl bg-orange-500/10 text-orange-600">
                      <Store className="w-4 h-4" />
                    </div>
                    <input
                      type="radio"
                      name="deliveryType"
                      checked={deliveryType === 'showroom'}
                      onChange={() => setDeliveryType('showroom')}
                      className="accent-orange-500 cursor-pointer"
                    />
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 mt-2">Retrait Direct en Magasin</h4>
                  <p className="text-[11px] text-emerald-700 font-bold mt-0.5">100% Gratuit (0 FCFA)</p>
                </div>
                <p className="text-[10px] text-slate-600 mt-2 pt-2 border-t border-slate-100 leading-tight">
                  À récupérer directement dans notre boutique à Nianing (Mbour)
                </p>
              </div>

              {/* Option 2: Home Delivery (Nianing de main à main) */}
              <div
                onClick={() => setDeliveryType('delivery')}
                className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${
                  deliveryType === 'delivery'
                    ? 'border-orange-500 bg-orange-50/50 ring-1 ring-orange-500 shadow-xs'
                    : 'border-slate-200 hover:border-purple-300 bg-white'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div className="p-2 rounded-xl bg-purple-500/10 text-purple-700">
                      <Truck className="w-4 h-4" />
                    </div>
                    <input
                      type="radio"
                      name="deliveryType"
                      checked={deliveryType === 'delivery'}
                      onChange={() => setDeliveryType('delivery')}
                      className="accent-orange-500 cursor-pointer"
                    />
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 mt-2">Nianing & Environs</h4>
                  <p className="text-[11px] text-purple-700 font-bold mt-0.5">
                    {isFeeHidden ? 'À convenir' : formatFCFA(nianingFee)}
                  </p>
                </div>
                <p className="text-[10px] text-slate-500 mt-2 pt-2 border-t border-slate-100 leading-tight">
                  Livraison de main à main
                </p>
              </div>

              {/* Option 3: Distance Delivery (Régions du Sénégal) */}
              <div
                onClick={() => setDeliveryType('distance_delivery')}
                className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${
                  deliveryType === 'distance_delivery'
                    ? 'border-orange-500 bg-orange-50/50 ring-1 ring-orange-500 shadow-xs'
                    : 'border-slate-200 hover:border-purple-300 bg-white'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div className="p-2 rounded-xl bg-amber-500/10 text-amber-700">
                      <Navigation className="w-4 h-4" />
                    </div>
                    <input
                      type="radio"
                      name="deliveryType"
                      checked={deliveryType === 'distance_delivery'}
                      onChange={() => setDeliveryType('distance_delivery')}
                      className="accent-orange-500 cursor-pointer"
                    />
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 mt-2">Partout au Sénégal</h4>
                  <p className="text-[11px] text-amber-700 font-bold mt-0.5">
                    {isFeeHidden ? 'À convenir' : formatFCFA(distanceFee)}
                  </p>
                </div>
                <p className="text-[10px] text-slate-500 mt-2 pt-2 border-t border-slate-100 leading-tight">
                  Dakar, Thiès, Kaolack, etc.
                </p>
              </div>
            </div>

            {/* Detailed instructions for Showroom in-store pickup */}
            {deliveryType === 'showroom' && (
              <div className="bg-amber-50/90 rounded-2xl p-4 border border-amber-200 space-y-3 text-xs text-slate-800">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-xl bg-orange-500 text-white shrink-0 shadow-xs">
                    <Store className="w-5 h-5" />
                  </div>
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-1">
                      <h4 className="font-extrabold text-slate-900 text-sm">
                        Retrait direct en magasin (Showroom Nianing)
                      </h4>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px] border border-emerald-300">
                        Gratuit • Sans attente
                      </span>
                    </div>
                    <p className="text-slate-700 leading-relaxed font-medium">
                      En choisissant cette option, <strong>vous devez venir récupérer votre produit directement dans notre magasin</strong> à Nianing.
                      Votre appareil sera préparé, déballé et testé avec vous sur place avant remise.
                    </p>
                    
                    <div className="bg-white p-3.5 rounded-xl border border-amber-200/80 space-y-2 mt-2">
                      <div className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 text-orange-600 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold text-slate-900">Emplacement de la boutique :</span>
                          <p className="text-slate-700 font-semibold">{SHOWROOM_INFO.address}, {SHOWROOM_INFO.city}</p>
                          <p className="text-[11px] text-slate-500">{SHOWROOM_INFO.landmark}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-1.5 border-t border-slate-100">
                        <Clock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <span className="text-[11px] text-slate-600 font-medium">
                          Horaires d'ouverture : {SHOWROOM_INFO.openingHours}
                        </span>
                      </div>

                      <div className="pt-2">
                        <a
                          href={SHOWROOM_INFO.googleMapsUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs shadow-xs transition-all active:scale-95 cursor-pointer"
                        >
                          <MapPin className="w-4 h-4" />
                          <span>Voir la boutique sur Google Maps (Itinéraire Nianing)</span>
                          <ExternalLink className="w-3.5 h-3.5 ml-0.5" />
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Delivery address details based on type */}
            {deliveryType === 'delivery' && (
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 space-y-3 text-xs">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Secteur / Quartier à Nianing
                  </label>
                  <select
                    value={selectedZoneId}
                    onChange={(e) => setSelectedZoneId(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-amber-500 bg-white cursor-pointer"
                  >
                    {allLocalZones.map((zone) => {
                      const zoneFee = getEffectiveLocalZoneFee(zone, settings);
                      return (
                        <option key={zone.id} value={zone.id}>
                          {zone.name} {isFeeHidden ? `(${zone.estimatedTime})` : `(${formatFCFA(zoneFee)})`}
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Adresse ou point de repère précis <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required={deliveryType === 'delivery'}
                      value={deliveryAddress}
                      onChange={(e) => setDeliveryAddress(e.target.value)}
                      placeholder="Ex: Villa n° 45 près de la pharmacie ou de la plage"
                      className={`w-full rounded-xl border px-3.5 py-2.5 text-xs text-slate-900 pl-10 focus:outline-none focus:ring-1 ${
                        errors.deliveryAddress ? 'border-rose-400 focus:ring-rose-400' : 'border-slate-300 focus:border-amber-500'
                      }`}
                    />
                    <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  </div>
                  {errors.deliveryAddress && (
                    <p className="text-[11px] text-rose-500 mt-1">{errors.deliveryAddress}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Précisions pour le livreur (Optionnel)
                  </label>
                  <input
                    type="text"
                    value={deliveryNotes}
                    onChange={(e) => setDeliveryNotes(e.target.value)}
                    placeholder="Ex: Appeler à l'avance, portail blanc"
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>
            )}

            {deliveryType === 'distance_delivery' && (() => {
              const activeDistanceZone = allDistanceZones.find((z) => z.id === selectedDistanceZoneId) || allDistanceZones[0] || DISTANCE_DELIVERY_ZONES[0];
              const activeRegionDetail = SENEGAL_14_REGIONS.find(
                (r) => r.name.toLowerCase() === activeDistanceZone.region.toLowerCase()
              );

              return (
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 space-y-3.5 text-xs">
                  <div className="flex items-center justify-between gap-2 pb-1 border-b border-slate-200/60">
                    <div className="flex items-center gap-1.5 text-slate-900 font-bold">
                      <Navigation className="w-3.5 h-3.5 text-orange-500" />
                      <span>Expédition dans les Régions & Localités du Sénégal</span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 text-[10px] font-bold border border-purple-200">
                      {allDistanceZones.length} destinations couvertes
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs font-bold text-slate-800">
                          Région / Localité de destination <span className="text-rose-500">*</span>
                        </label>
                        <span className="text-[10px] text-slate-500 font-semibold">{allDistanceZones.length} zones disponibles</span>
                      </div>
                      <select
                        value={selectedDistanceZoneId}
                        onChange={(e) => setSelectedDistanceZoneId(e.target.value)}
                        className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-900 shadow-xs focus:border-orange-500 focus:ring-2 focus:ring-orange-500/30 focus:outline-none transition-all cursor-pointer"
                      >
                        {allDistanceZones.map((zone, idx) => {
                          const regFee = getEffectiveDistanceZoneFee(zone, settings);
                          return (
                            <option key={zone.id} value={zone.id} className="py-1 text-slate-900 font-medium">
                              {idx + 1}. {zone.name} {isFeeHidden ? `(${zone.estimatedTime})` : `— ${formatFCFA(regFee)} (${zone.estimatedTime})`}
                            </option>
                          );
                        })}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-1">
                        Ville, Commune ou Village exact <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={deliveryCityCustom}
                        onChange={(e) => setDeliveryCityCustom(e.target.value)}
                        placeholder="Ex: Touba Mosquée, Thiès Ville, Saint-Louis Sor..."
                        className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                      />
                    </div>
                  </div>

                  {/* Active Region Coverage Badge & Details */}
                  {activeRegionDetail && (
                    <div className="bg-white rounded-xl p-3 border border-purple-100 space-y-1.5 text-[11px] shadow-2xs">
                      <div className="flex items-center justify-between text-slate-900">
                        <span className="font-bold flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-orange-500" />
                          Région sélectionnée : <strong>{activeRegionDetail.name}</strong> (Chef-lieu : {activeRegionDetail.capital})
                        </span>
                        <span className="text-purple-700 font-bold bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200 text-[10px]">
                          ⏱️ {activeDistanceZone.estimatedTime}
                        </span>
                      </div>
                      <div className="text-slate-600 flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-100">
                        <span className="font-semibold text-slate-700">Pôles & Communes desservis :</span>
                        {activeRegionDetail.departments.map((dept, dIdx) => (
                          <span key={dIdx} className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px]">
                            {dept}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">
                      Adresse précise ou Agence Point Relais (GP) <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        required={deliveryType === 'distance_delivery'}
                        value={deliveryAddress}
                        onChange={(e) => setDeliveryAddress(e.target.value)}
                        placeholder="Ex: Quartier Médina x Av. Blaise Diagne, ou Relais Express GP"
                        className={`w-full rounded-xl border px-3.5 py-2.5 text-xs text-slate-900 pl-10 focus:outline-none focus:ring-2 ${
                          errors.deliveryAddress 
                            ? 'border-rose-400 focus:ring-rose-400/30' 
                            : 'border-slate-300 focus:border-orange-500 focus:ring-orange-500/20'
                        }`}
                      />
                      <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    </div>
                    {errors.deliveryAddress && (
                      <p className="text-[11px] text-rose-500 mt-1">{errors.deliveryAddress}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">
                      Instructions particulières pour le transporteur (Optionnel)
                    </label>
                    <input
                      type="text"
                      value={deliveryNotes}
                      onChange={(e) => setDeliveryNotes(e.target.value)}
                      placeholder="Ex: Réceptionner au garage de Mbour ou appeler dès arrivée en ville"
                      className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                    />
                  </div>
                </div>
              );
            })()}
          </div>

          {/* STEP 3: PAIEMENT (SANS TVA) */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px]">
                3
              </span>
              Mode de Règlement (Paiement à la livraison ou au retrait)
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div
                onClick={() => setPaymentMethod(deliveryType === 'showroom' ? 'showroom_cash' : 'cash_on_delivery')}
                className={`p-3.5 rounded-xl border cursor-pointer flex items-center justify-between transition-all ${
                  paymentMethod === 'cash_on_delivery' || paymentMethod === 'showroom_cash'
                    ? 'border-orange-500 bg-orange-50/50 ring-1 ring-orange-500'
                    : 'border-slate-200 hover:border-purple-300 bg-white'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Banknote className="w-4 h-4 text-emerald-600" />
                  <div>
                    <p className="text-xs font-bold text-slate-900">Espèces au retrait / à la livraison</p>
                    <p className="text-[10px] text-slate-500">Règlement direct après vérification</p>
                  </div>
                </div>
                <input
                  type="radio"
                  name="paymentMethod"
                  checked={paymentMethod === 'cash_on_delivery' || paymentMethod === 'showroom_cash'}
                  onChange={() => setPaymentMethod(deliveryType === 'showroom' ? 'showroom_cash' : 'cash_on_delivery')}
                  className="accent-orange-500 cursor-pointer"
                />
              </div>

              <div
                onClick={() => setPaymentMethod('wave_orange_money')}
                className={`p-3.5 rounded-xl border cursor-pointer flex items-center justify-between transition-all ${
                  paymentMethod === 'wave_orange_money'
                    ? 'border-orange-500 bg-orange-50/50 ring-1 ring-orange-500'
                    : 'border-slate-200 hover:border-purple-300 bg-white'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <CreditCard className="w-4 h-4 text-purple-600" />
                  <div>
                    <p className="text-xs font-bold text-slate-900">Wave / Orange Money</p>
                    <p className="text-[10px] text-slate-500">Transfert direct sécurisé</p>
                  </div>
                </div>
                <input
                  type="radio"
                  name="paymentMethod"
                  checked={paymentMethod === 'wave_orange_money'}
                  onChange={() => setPaymentMethod('wave_orange_money')}
                  className="accent-orange-500 cursor-pointer"
                />
              </div>
            </div>

            {/* Tax Note */}
            <div className="p-3 rounded-xl bg-purple-50/70 border border-purple-100 text-[11px] text-purple-950 flex items-start gap-2">
              <Info className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
              <span>
                <strong>Facturation sans TVA :</strong> Conformément à notre politique, tous nos prix sont affichés nets en FCFA. Votre commande est enregistrée avec le statut <em>"En attente de paiement"</em> et sera validée par notre équipe.
              </span>
            </div>
          </div>

          {/* FINANCIAL SUMMARY & SUBMIT */}
          <div className="pt-4 border-t border-slate-200 space-y-3">
            <div className="bg-slate-50 rounded-2xl p-4 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Sous-total ({items.reduce((s, i) => s + i.quantity, 0)} articles) :</span>
                <span className="font-bold text-slate-900">{formatFCFA(subtotal)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Frais de récupération / Livraison :</span>
                {deliveryType === 'showroom' ? (
                  <span className="font-bold text-emerald-700">0 FCFA (Gratuit Showroom)</span>
                ) : isFeeHidden ? (
                  <span className="font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 text-xs">
                    À convenir avec le client
                  </span>
                ) : (
                  <span className="font-bold text-slate-900">
                    {deliveryFee === 0 ? '0 FCFA (Gratuit)' : formatFCFA(deliveryFee)}
                  </span>
                )}
              </div>
              <div className="pt-2 border-t border-slate-200">
                <div className="flex justify-between text-base font-black text-slate-950">
                  <span>Total Net :</span>
                  <span className="text-orange-600 font-extrabold">{formatFCFA(totalAmount)}</span>
                </div>
                {deliveryType !== 'showroom' && isFeeHidden && (
                  <p className="text-[11px] text-amber-800/90 italic font-medium text-right mt-1">
                    * Hors frais de transport (tarif à convenir avec votre conseiller selon votre convenance)
                  </p>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || hasStockIssues}
              id="submit-order-btn"
              className={`w-full flex items-center justify-center gap-2 py-4 px-6 rounded-xl font-black text-sm transition-all shadow-lg active:scale-98 cursor-pointer ${
                hasStockIssues
                  ? 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none'
                  : 'bg-orange-500 hover:bg-orange-400 text-white hover:shadow-orange-500/25'
              }`}
            >
              {isSubmitting ? (
                <span>Vérification & Validation en cours...</span>
              ) : hasStockIssues ? (
                <span>Impossible de commander : stock insuffisant</span>
              ) : (
                <>
                  <span>
                    Confirmer la commande ({formatFCFA(totalAmount)}
                    {deliveryType !== 'showroom' && isFeeHidden ? ' + transport à convenir' : ''})
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
