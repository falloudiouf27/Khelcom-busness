import React, { useState } from 'react';
import { 
  X, 
  Trash2, 
  ShoppingBag, 
  ArrowRight, 
  ShieldCheck, 
  Store, 
  Truck,
  Plus,
  Minus,
  AlertTriangle,
  AlertCircle,
  Wand2,
  CheckCircle2,
  MapPin,
  ChevronDown
} from 'lucide-react';
import { CartItem, DeliveryType, AppSettings } from '../types';
import { StorageService } from '../services/storage';
import { formatFCFA } from '../utils/formatters';
import { 
  SENEGAL_DELIVERY_ZONES, 
  DISTANCE_DELIVERY_ZONES, 
  SHOWROOM_INFO,
  getEffectiveDistanceZoneFee,
  getEffectiveLocalZoneFee,
  getAllLocalZones,
  getAllDistanceZones
} from '../data/senegalLocations';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQuantity: (index: number, newQty: number) => void;
  onRemoveItem: (index: number) => void;
  onClearCart: () => void;
  onProceedToCheckout: (preferences?: { 
    deliveryType: DeliveryType; 
    zoneId: string; 
    distanceZoneId: string;
  }) => void;
  onAutoAdjustCart?: () => void;
  settings?: AppSettings;
  initialDeliveryType?: DeliveryType;
  initialZoneId?: string;
  initialDistanceZoneId?: string;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  items,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onProceedToCheckout,
  onAutoAdjustCart,
  settings,
  initialDeliveryType = 'showroom',
  initialZoneId = SENEGAL_DELIVERY_ZONES[0].id,
  initialDistanceZoneId = DISTANCE_DELIVERY_ZONES[0].id,
}) => {
  if (!isOpen) return null;

  // Local dynamic delivery selection inside cart
  const [deliveryType, setDeliveryType] = useState<DeliveryType>(initialDeliveryType);
  const [selectedZoneId, setSelectedZoneId] = useState<string>(initialZoneId);
  const [selectedDistanceZoneId, setSelectedDistanceZoneId] = useState<string>(initialDistanceZoneId);

  const subtotal = items.reduce(
    (acc, item) => acc + item.selectedVariant.price * item.quantity,
    0
  );

  // Dynamic delivery fee calculation
  const allLocalZones = getAllLocalZones(settings);
  const allDistanceZones = getAllDistanceZones(settings);

  const selectedNianingZone = allLocalZones.find((z) => z.id === selectedZoneId) || allLocalZones[0] || SENEGAL_DELIVERY_ZONES[0];
  const selectedDistanceZone = allDistanceZones.find((z) => z.id === selectedDistanceZoneId) || allDistanceZones[0] || DISTANCE_DELIVERY_ZONES[0];

  const nianingFee = getEffectiveLocalZoneFee(selectedNianingZone, settings);
  const distanceFee = getEffectiveDistanceZoneFee(selectedDistanceZone, settings);

  const isFeeHidden = Boolean(settings?.hideDeliveryFees);

  let deliveryFee = 0;
  let deliveryLabel = 'Retrait gratuit Showroom';
  let deliveryEstTime = 'Disponible immédiatement';

  if (deliveryType === 'delivery') {
    deliveryFee = isFeeHidden ? 0 : nianingFee;
    deliveryLabel = `Livraison ${selectedNianingZone.name}`;
    deliveryEstTime = selectedNianingZone.estimatedTime;
  } else if (deliveryType === 'distance_delivery') {
    deliveryFee = isFeeHidden ? 0 : distanceFee;
    deliveryLabel = `Livraison ${selectedDistanceZone.region}`;
    deliveryEstTime = selectedDistanceZone.estimatedTime;
  }

  const finalTotalAmount = subtotal + deliveryFee;

  // Real-time stock verification across items
  const stockValidation = StorageService.verifyCartStock(items);
  const hasStockIssues = !stockValidation.isValid;

  // Handle auto-adjust if no callback provided
  const handleAutoAdjust = () => {
    if (onAutoAdjustCart) {
      onAutoAdjustCart();
      return;
    }
    // Default adjust logic
    items.forEach((item, index) => {
      const liveStock = StorageService.getVariantLiveStock(
        item.product.id,
        item.selectedVariant.id
      );
      if (liveStock <= 0) {
        onRemoveItem(index);
      } else if (item.quantity > liveStock) {
        onUpdateQuantity(index, liveStock);
      }
    });
  };

  const handleCheckoutClick = () => {
    onClose();
    onProceedToCheckout({
      deliveryType,
      zoneId: selectedZoneId,
      distanceZoneId: selectedDistanceZoneId,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
        
        {/* Drawer Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-purple-900/50 bg-[#1e0a3c] text-white shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-orange-500/20 text-orange-400 border border-orange-500/30">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Mon Panier</h2>
              <p className="text-xs text-purple-200/80">
                {items.length} article{items.length > 1 ? 's' : ''} sélectionné{items.length > 1 ? 's' : ''}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {items.length > 0 && (
              <button
                onClick={onClearCart}
                className="text-xs text-purple-300 hover:text-rose-400 transition-colors p-1 cursor-pointer"
                title="Vider le panier"
              >
                Vider
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-purple-300 hover:text-white hover:bg-purple-900/60 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Global stock issues warning banner */}
        {hasStockIssues && items.length > 0 && (
          <div className="bg-rose-50 border-b border-rose-200 p-3 text-xs text-rose-900 flex flex-col gap-2 shrink-0">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <span className="font-bold">Stock insuffisant pour certains articles</span>
                <p className="text-[11px] text-rose-700 mt-0.5">
                  Veuillez réduire les quantités ou ajuster votre panier avant de commander.
                </p>
              </div>
            </div>
            <button
              onClick={handleAutoAdjust}
              className="self-start inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-[11px] transition-colors cursor-pointer shadow-xs"
            >
              <Wand2 className="w-3 h-3" />
              <span>Ajuster automatiquement au stock disponible</span>
            </button>
          </div>
        )}

        {/* Drawer Items List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4 text-slate-500">
              <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                <ShoppingBag className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-800">Votre panier est vide</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-xs">
                  Parcourez notre catalogue d'électronique et électroménager et ajoutez vos articles favoris.
                </p>
              </div>
              <button
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Découvrir les produits
              </button>
            </div>
          ) : (
            <>
              {items.map((item, index) => {
                const liveStock = StorageService.getVariantLiveStock(
                  item.product.id,
                  item.selectedVariant.id
                );
                const isItemOutOfStock = liveStock <= 0;
                const isItemOverStock = item.quantity > liveStock;

                return (
                  <div
                    key={`${item.product.id}-${item.selectedVariant.id}-${index}`}
                    className={`rounded-2xl p-3.5 border transition-all flex flex-col gap-2 relative ${
                      isItemOutOfStock
                        ? 'bg-rose-50/70 border-rose-300'
                        : isItemOverStock
                        ? 'bg-amber-50/70 border-amber-300'
                        : 'bg-slate-50 rounded-2xl border-slate-200/70'
                    }`}
                  >
                    <div className="flex gap-3">
                      {/* Product thumbnail */}
                      <div className="w-20 h-20 rounded-xl bg-white border border-slate-100 overflow-hidden shrink-0 relative">
                        <img
                          src={item.selectedVariant.imageUrl || item.product.imageUrl}
                          alt={item.product.name}
                          className={`w-full h-full object-cover ${isItemOutOfStock ? 'grayscale-40' : ''}`}
                        />
                      </div>

                      {/* Details */}
                      <div className="flex-1 min-w-0 flex flex-col justify-between">
                        <div>
                          <div className="flex items-start justify-between gap-1">
                            <span className="text-[10px] font-bold text-amber-700 uppercase">
                              {item.product.brand}
                            </span>
                            <button
                              onClick={() => onRemoveItem(index)}
                              className="text-slate-400 hover:text-rose-600 transition-colors p-0.5 cursor-pointer"
                              title="Supprimer du panier"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <h4 className="text-xs font-bold text-slate-900 truncate">
                            {item.product.name}
                          </h4>
                          <p className="text-[11px] text-slate-500 truncate mt-0.5 font-medium">
                            Variante : {item.selectedVariant.title}
                          </p>
                        </div>

                        {/* Quantity and Price */}
                        <div className="flex items-center justify-between pt-2 mt-1 border-t border-slate-200/50">
                          <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg p-0.5">
                            <button
                              onClick={() => onUpdateQuantity(index, item.quantity - 1)}
                              className="w-5 h-5 rounded flex items-center justify-center text-slate-600 hover:bg-slate-100 text-xs font-bold cursor-pointer"
                              title="Diminuer"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="text-xs font-bold w-5 text-center text-slate-900">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => onUpdateQuantity(index, item.quantity + 1)}
                              disabled={item.quantity >= liveStock}
                              className="w-5 h-5 rounded flex items-center justify-center text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent text-xs font-bold cursor-pointer"
                              title={item.quantity >= liveStock ? 'Stock maximum atteint' : 'Augmenter'}
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>

                          <div className="text-right">
                            <span className="text-xs font-black text-slate-900 block">
                              {formatFCFA(item.selectedVariant.price * item.quantity)}
                            </span>
                            {item.quantity > 1 && (
                              <span className="text-[10px] text-slate-400">
                                {formatFCFA(item.selectedVariant.price)} / u
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Stock validation badge per item */}
                    <div className="pt-1.5 border-t border-slate-200/60 flex items-center justify-between text-[11px]">
                      {isItemOutOfStock ? (
                        <div className="flex items-center justify-between w-full text-rose-700 font-bold">
                          <span className="flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" /> Épuisé en stock
                          </span>
                          <button
                            onClick={() => onRemoveItem(index)}
                            className="text-[10px] underline hover:text-rose-900 cursor-pointer"
                          >
                            Retirer
                          </button>
                        </div>
                      ) : isItemOverStock ? (
                        <div className="flex items-center justify-between w-full text-amber-800 font-bold">
                          <span className="flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3 text-amber-600" /> 
                            Demandé: {item.quantity} | Dispo: {liveStock}
                          </span>
                          <button
                            onClick={() => onUpdateQuantity(index, liveStock)}
                            className="px-1.5 py-0.5 rounded bg-amber-200 hover:bg-amber-300 text-[10px] text-amber-950 font-bold transition-colors cursor-pointer"
                          >
                            Ajuster à {liveStock}
                          </button>
                        </div>
                      ) : liveStock <= 3 ? (
                        <span className="text-amber-700 font-medium flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> Plus que {liveStock} en stock
                        </span>
                      ) : (
                        <span className="text-emerald-700 font-medium flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> En stock ({liveStock} disponibles)
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Dynamic Delivery Zone & Price Calculator in Cart */}
              <div className="mt-4 p-4 rounded-2xl bg-purple-50/70 border border-purple-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-purple-950 flex items-center gap-1.5">
                    <Truck className="w-4 h-4 text-orange-500" />
                    <span>Mode & Zone de Livraison</span>
                  </span>
                  <span className="text-[11px] font-bold text-orange-600">
                    {deliveryFee === 0 ? 'Gratuit (0 FCFA)' : formatFCFA(deliveryFee)}
                  </span>
                </div>

                {/* Delivery Mode Tabs */}
                <div className="grid grid-cols-3 gap-1.5 p-1 bg-white rounded-xl border border-purple-200/80 text-[11px] font-bold">
                  <button
                    type="button"
                    onClick={() => setDeliveryType('showroom')}
                    className={`py-1.5 px-1 rounded-lg transition-all text-center cursor-pointer flex flex-col items-center gap-0.5 ${
                      deliveryType === 'showroom'
                        ? 'bg-[#1b0633] text-white shadow-xs'
                        : 'text-slate-600 hover:text-purple-900 hover:bg-purple-50'
                    }`}
                  >
                    <Store className="w-3 h-3 text-orange-400" />
                    <span className="truncate">Showroom</span>
                    <span className="text-[9px] font-normal opacity-80">0 FCFA</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDeliveryType('delivery')}
                    className={`py-1.5 px-1 rounded-lg transition-all text-center cursor-pointer flex flex-col items-center gap-0.5 ${
                      deliveryType === 'delivery'
                        ? 'bg-orange-500 text-white shadow-xs'
                        : 'text-slate-600 hover:text-purple-900 hover:bg-purple-50'
                    }`}
                  >
                    <MapPin className="w-3 h-3 text-white" />
                    <span className="truncate">Nianing</span>
                    <span className="text-[9px] font-normal opacity-90">
                      {isFeeHidden ? 'À convenir' : '1 000 FCFA'}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDeliveryType('distance_delivery')}
                    className={`py-1.5 px-1 rounded-lg transition-all text-center cursor-pointer flex flex-col items-center gap-0.5 ${
                      deliveryType === 'distance_delivery'
                        ? 'bg-purple-900 text-white shadow-xs'
                        : 'text-slate-600 hover:text-purple-900 hover:bg-purple-50'
                    }`}
                  >
                    <Truck className="w-3 h-3 text-orange-400" />
                    <span className="truncate">Régions</span>
                    <span className="text-[9px] font-normal opacity-80">
                      {isFeeHidden ? 'À convenir' : 'Dès 3 000 F'}
                    </span>
                  </button>
                </div>

                {/* Sub-selectors for precise zones */}
                {deliveryType === 'delivery' && (
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700 block">
                      Quartier ou secteur à Nianing :
                    </label>
                    <select
                      value={selectedZoneId}
                      onChange={(e) => setSelectedZoneId(e.target.value)}
                      className="w-full bg-white border border-purple-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 font-semibold focus:outline-none focus:border-orange-500 cursor-pointer"
                    >
                      {allLocalZones.map((zone) => {
                        const localFee = getEffectiveLocalZoneFee(zone, settings);
                        return (
                          <option key={zone.id} value={zone.id}>
                            {zone.name} {isFeeHidden ? `(${zone.estimatedTime})` : `(+${formatFCFA(localFee)})`}
                          </option>
                        );
                      })}
                    </select>
                    <p className="text-[10px] text-slate-500 flex items-center gap-1">
                      <span>⏱️ Délai estimé : {selectedNianingZone.estimatedTime}</span>
                    </p>
                  </div>
                )}

                {deliveryType === 'distance_delivery' && (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <label className="font-bold text-slate-800">
                        Région de destination :
                      </label>
                      <span className="text-[10px] text-purple-700 font-bold bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200">
                        14 Régions
                      </span>
                    </div>
                    <select
                      value={selectedDistanceZoneId}
                      onChange={(e) => setSelectedDistanceZoneId(e.target.value)}
                      className="w-full bg-white border border-purple-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-bold focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 cursor-pointer shadow-2xs"
                    >
                      {allDistanceZones.map((zone, idx) => {
                        const regFee = getEffectiveDistanceZoneFee(zone, settings);
                        return (
                          <option key={zone.id} value={zone.id}>
                            {idx + 1}. {zone.name} {isFeeHidden ? `(${zone.estimatedTime})` : `(+${formatFCFA(regFee)})`}
                          </option>
                        );
                      })}
                    </select>
                    <p className="text-[10px] text-slate-500 flex items-center justify-between">
                      <span>⏱️ Expédition : {selectedDistanceZone.estimatedTime}</span>
                      <span className="text-emerald-700 font-semibold">Toutes les 14 régions</span>
                    </p>
                  </div>
                )}

                {deliveryType === 'showroom' && (
                  <div className="text-[11px] text-slate-600 bg-white/80 p-2.5 rounded-xl border border-purple-100 flex items-center gap-2">
                    <Store className="w-4 h-4 text-orange-500 shrink-0" />
                    <span>Retrait et test immédiat au <strong>Showroom Nianing (Mbour)</strong></span>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Drawer Footer with Dynamic Calculations & Checkout CTA */}
        {items.length > 0 && (
          <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50/95 space-y-3 shrink-0">
            <div className="space-y-1.5 text-xs">
              <div className="flex items-center justify-between text-slate-600">
                <span>Sous-total articles :</span>
                <span className="font-bold text-slate-900">{formatFCFA(subtotal)}</span>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span className="truncate pr-2">Frais ({deliveryType === 'showroom' ? 'Showroom Nianing' : deliveryType === 'delivery' ? selectedNianingZone.name : selectedDistanceZone.region}) :</span>
                {deliveryType === 'showroom' ? (
                  <span className="font-bold shrink-0 text-emerald-700">
                    0 FCFA (Gratuit)
                  </span>
                ) : isFeeHidden ? (
                  <span className="font-bold shrink-0 text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 text-[11px]">
                    À convenir avec le client
                  </span>
                ) : (
                  <span className="font-bold shrink-0 text-slate-900">
                    +{formatFCFA(deliveryFee)}
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between text-slate-500 text-[11px]">
                <span>Régime fiscal :</span>
                <span className="text-emerald-700 font-semibold">Sans TVA (Prix Nets)</span>
              </div>
              <div className="flex flex-col text-sm pt-2 border-t border-slate-200">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">Total Net :</span>
                  <span className="text-lg font-black text-slate-950">{formatFCFA(finalTotalAmount)}</span>
                </div>
                {deliveryType !== 'showroom' && isFeeHidden && (
                  <span className="text-[10px] text-amber-800/90 italic font-medium text-right mt-0.5">
                    * Frais de livraison à convenir ultérieurement avec votre conseiller
                  </span>
                )}
              </div>
            </div>

            {hasStockIssues ? (
              <div className="space-y-2">
                <button
                  onClick={handleAutoAdjust}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm transition-all shadow-md active:scale-98 cursor-pointer"
                >
                  <Wand2 className="w-4 h-4" />
                  <span>Ajuster au stock disponible</span>
                </button>
                <p className="text-[11px] text-center text-rose-600 font-semibold">
                  ⚠️ Corrigez les quantités dépassant le stock avant de valider la commande.
                </p>
              </div>
            ) : (
              <button
                id="cart-checkout-btn"
                onClick={handleCheckoutClick}
                className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-orange-500 hover:bg-orange-400 text-white font-bold text-sm transition-all shadow-lg hover:shadow-orange-500/20 active:scale-98 cursor-pointer"
              >
                <span>Commander • {formatFCFA(finalTotalAmount)}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}

            <div className="flex items-center justify-center gap-3 text-[11px] text-slate-500 pt-0.5 flex-wrap">
              <span className="flex items-center gap-1">
                <Store className="w-3 h-3 text-orange-600" /> Showroom Nianing (0 F)
              </span>
              <span>•</span>
              <span className="flex items-center gap-1 text-purple-800 font-semibold">
                <Truck className="w-3 h-3 text-purple-700" /> Livraison Sénégal
              </span>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
