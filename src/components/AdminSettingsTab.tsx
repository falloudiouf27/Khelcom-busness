import React, { useState } from 'react';
import { 
  Building2, 
  Phone, 
  MapPin, 
  Clock, 
  FileText, 
  Truck, 
  Lock, 
  Download, 
  Upload, 
  RefreshCw, 
  Check, 
  AlertTriangle,
  Shield,
  Save,
  MessageCircle,
  Hash,
  Eye,
  EyeOff,
  Sliders,
  RotateCcw,
  Navigation,
  Globe,
  CheckCircle2,
  HelpCircle,
  Plus,
  Trash2,
  Sparkles,
  Home,
  Building,
  X
} from 'lucide-react';
import { AppSettings, Order, Product, DeliveryZone } from '../types';
import { StorageService } from '../services/storage';
import { formatFCFA } from '../utils/formatters';
import { 
  SENEGAL_14_REGIONS, 
  SENEGAL_DELIVERY_ZONES, 
  DISTANCE_DELIVERY_ZONES,
  getAllLocalZones,
  getAllDistanceZones
} from '../data/senegalLocations';

interface AdminSettingsTabProps {
  settings: AppSettings;
  onSettingsUpdated: (newSettings: AppSettings) => void;
  products: Product[];
  onProductsUpdated: (products: Product[]) => void;
  orders: Order[];
  onOrdersUpdated: (orders: Order[]) => void;
}

export const AdminSettingsTab: React.FC<AdminSettingsTabProps> = ({
  settings,
  onSettingsUpdated,
  products,
  onProductsUpdated,
  orders,
  onOrdersUpdated,
}) => {
  const [formData, setFormData] = useState<AppSettings>({ ...settings });
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Delivery fee deactivation / hiding mode
  const [hideDeliveryFees, setHideDeliveryFees] = useState<boolean>(Boolean(settings.hideDeliveryFees));

  // Custom zones lists
  const [customLocations, setCustomLocations] = useState<DeliveryZone[]>(() => settings.customLocations || []);
  const [customNeighborhoods, setCustomNeighborhoods] = useState<DeliveryZone[]>(() => settings.customNeighborhoods || []);

  // Modal / Add form state
  const [showAddZoneModal, setShowAddZoneModal] = useState<boolean>(false);
  const [newZoneType, setNewZoneType] = useState<'neighborhood' | 'location'>('neighborhood');
  const [newZoneName, setNewZoneName] = useState<string>('');
  const [newZoneRegion, setNewZoneRegion] = useState<string>('Nianing');
  const [newZoneFee, setNewZoneFee] = useState<string>('1000');
  const [newZoneEstimatedTime, setNewZoneEstimatedTime] = useState<string>('1 à 2 heures');
  const [newZoneError, setNewZoneError] = useState<string | null>(null);

  // Filter tab for the zones management UI
  const [activeZoneCategory, setActiveZoneCategory] = useState<'local' | 'regions' | 'custom'>('local');

  // Dedicated string states for delivery tariff inputs to allow full erase and prevent sticky zeros
  const [feeNianingStr, setFeeNianingStr] = useState<string>(
    settings.defaultDakarFee !== undefined ? String(settings.defaultDakarFee) : '1000'
  );
  const [feeDistanceStr, setFeeDistanceStr] = useState<string>(
    settings.defaultDistanceFee !== undefined ? String(settings.defaultDistanceFee) : '5000'
  );
  const [feeRegionStr, setFeeRegionStr] = useState<string>(
    settings.defaultRegionFee !== undefined ? String(settings.defaultRegionFee) : '8000'
  );

  // Individual region fees state (for all 14 regions of Senegal + any custom added locations)
  const [regionFees, setRegionFees] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    DISTANCE_DELIVERY_ZONES.forEach((zone) => {
      const savedFee = settings.customRegionFees?.[zone.id] ?? settings.customRegionFees?.[zone.region];
      initial[zone.id] = savedFee !== undefined ? String(savedFee) : String(zone.fee);
    });
    (settings.customLocations || []).forEach((zone) => {
      const savedFee = settings.customRegionFees?.[zone.id];
      initial[zone.id] = savedFee !== undefined ? String(savedFee) : String(zone.fee);
    });
    return initial;
  });

  // Local Nianing zones fee state (+ any custom added neighborhoods)
  const [localZoneFees, setLocalZoneFees] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    SENEGAL_DELIVERY_ZONES.forEach((zone) => {
      const savedFee = settings.customLocalZoneFees?.[zone.id];
      initial[zone.id] = savedFee !== undefined ? String(savedFee) : String(zone.fee);
    });
    (settings.customNeighborhoods || []).forEach((zone) => {
      const savedFee = settings.customLocalZoneFees?.[zone.id];
      initial[zone.id] = savedFee !== undefined ? String(savedFee) : String(zone.fee);
    });
    return initial;
  });

  const [feeErrors, setFeeErrors] = useState<{
    nianing?: string;
    distance?: string;
    region?: string;
  }>({});

  // Reset all 14 regional fees to their recommended defaults
  const handleResetRegionalFees = () => {
    const reset: Record<string, string> = {};
    DISTANCE_DELIVERY_ZONES.forEach((zone) => {
      reset[zone.id] = String(zone.fee);
    });
    customLocations.forEach((zone) => {
      reset[zone.id] = String(zone.fee);
    });
    setRegionFees(reset);
  };

  // Reset local Nianing zone fees
  const handleResetLocalZoneFees = () => {
    const reset: Record<string, string> = {};
    SENEGAL_DELIVERY_ZONES.forEach((zone) => {
      reset[zone.id] = String(zone.fee);
    });
    customNeighborhoods.forEach((zone) => {
      reset[zone.id] = String(zone.fee);
    });
    setLocalZoneFees(reset);
  };

  // Add new neighborhood or location
  const handleAddNewZone = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newZoneName.trim()) {
      setNewZoneError('Veuillez saisir un nom valide pour cette zone.');
      return;
    }
    const cleanFee = Math.max(0, Number(newZoneFee) || 0);
    const idPrefix = newZoneType === 'neighborhood' ? 'neigh' : 'loc';
    const cleanId = `${idPrefix}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

    const newZoneItem: DeliveryZone = {
      id: cleanId,
      name: newZoneName.trim(),
      region: newZoneRegion.trim() || (newZoneType === 'neighborhood' ? 'Nianing' : 'Thiès'),
      fee: cleanFee,
      estimatedTime: newZoneEstimatedTime.trim() || (newZoneType === 'neighborhood' ? '1 à 2 heures' : '24 à 48 heures'),
      isCustom: true,
    };

    if (newZoneType === 'neighborhood') {
      setCustomNeighborhoods((prev) => [...prev, newZoneItem]);
      setLocalZoneFees((prev) => ({ ...prev, [newZoneItem.id]: String(cleanFee) }));
      setActiveZoneCategory('local');
    } else {
      setCustomLocations((prev) => [...prev, newZoneItem]);
      setRegionFees((prev) => ({ ...prev, [newZoneItem.id]: String(cleanFee) }));
      setActiveZoneCategory('regions');
    }

    // Reset modal form
    setNewZoneName('');
    setNewZoneFee(newZoneType === 'neighborhood' ? '1000' : '5000');
    setNewZoneEstimatedTime(newZoneType === 'neighborhood' ? '1 à 2 heures' : '24 à 48 heures');
    setNewZoneRegion(newZoneType === 'neighborhood' ? 'Nianing' : 'Thiès');
    setShowAddZoneModal(false);
    setNewZoneError(null);
  };

  // Delete custom neighborhood
  const handleDeleteCustomNeighborhood = (zoneId: string) => {
    setCustomNeighborhoods((prev) => prev.filter((z) => z.id !== zoneId));
    setLocalZoneFees((prev) => {
      const copy = { ...prev };
      delete copy[zoneId];
      return copy;
    });
  };

  // Delete custom location
  const handleDeleteCustomLocation = (zoneId: string) => {
    setCustomLocations((prev) => prev.filter((z) => z.id !== zoneId));
    setRegionFees((prev) => {
      const copy = { ...prev };
      delete copy[zoneId];
      return copy;
    });
  };

  // PIN security change
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinMessage, setPinMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Import state
  const [importText, setImportText] = useState('');
  const [showImportModal, setShowImportModal] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);

  const handleChange = (field: keyof AppSettings, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();

    const errors: { nianing?: string; distance?: string; region?: string } = {};

    if (!feeNianingStr.trim()) {
      errors.nianing = 'Veuillez saisir un tarif (ou 0 pour gratuit). Ne peut être vide.';
    } else if (isNaN(Number(feeNianingStr)) || Number(feeNianingStr) < 0) {
      errors.nianing = 'Veuillez saisir un montant positif ou nul.';
    }

    if (!feeDistanceStr.trim()) {
      errors.distance = 'Veuillez saisir un tarif (ou 0 pour gratuit). Ne peut être vide.';
    } else if (isNaN(Number(feeDistanceStr)) || Number(feeDistanceStr) < 0) {
      errors.distance = 'Veuillez saisir un montant positif ou nul.';
    }

    if (!feeRegionStr.trim()) {
      errors.region = 'Veuillez saisir un tarif (ou 0 pour gratuit). Ne peut être vide.';
    } else if (isNaN(Number(feeRegionStr)) || Number(feeRegionStr) < 0) {
      errors.region = 'Veuillez saisir un montant positif ou nul.';
    }

    if (Object.keys(errors).length > 0) {
      setFeeErrors(errors);
      return;
    }

    setFeeErrors({});

    // Parse custom numeric fees
    const parsedCustomRegionFees: Record<string, number> = {};
    Object.entries(regionFees).forEach(([key, val]) => {
      const num = Number(val);
      parsedCustomRegionFees[key] = isNaN(num) || num < 0 ? 0 : num;
    });

    const parsedCustomLocalZoneFees: Record<string, number> = {};
    Object.entries(localZoneFees).forEach(([key, val]) => {
      const num = Number(val);
      parsedCustomLocalZoneFees[key] = isNaN(num) || num < 0 ? 0 : num;
    });

    const updatedSettings: AppSettings = {
      ...formData,
      defaultDakarFee: Number(feeNianingStr),
      defaultDistanceFee: Number(feeDistanceStr),
      defaultRegionFee: Number(feeRegionStr),
      hideDeliveryFees,
      customRegionFees: parsedCustomRegionFees,
      customLocalZoneFees: parsedCustomLocalZoneFees,
      customLocations,
      customNeighborhoods,
    };

    StorageService.saveSettings(updatedSettings);
    onSettingsUpdated(updatedSettings);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleUpdatePin = (e: React.FormEvent) => {
    e.preventDefault();
    const storedPin = StorageService.getAdminPin();
    const envAdminPassword = import.meta.env.VITE_ADMIN_PASSWORD;

    const validCurrentPasswords: string[] = [
      storedPin,
      ...(envAdminPassword ? [envAdminPassword] : [])
    ].filter(Boolean);

    const isValidCurrent = validCurrentPasswords.includes(currentPin.trim());

    if (!isValidCurrent) {
      setPinMessage({ type: 'error', text: 'Le code PIN / mot de passe actuel est incorrect.' });
      return;
    }

    if (newPin.length < 4) {
      setPinMessage({ type: 'error', text: 'Le nouveau code doit contenir au moins 4 caractères.' });
      return;
    }

    if (newPin !== confirmPin) {
      setPinMessage({ type: 'error', text: 'Les deux nouveaux mots de passe ne correspondent pas.' });
      return;
    }

    StorageService.setAdminPin(newPin);
    setPinMessage({ type: 'success', text: 'Code PIN administrateur mis à jour avec succès !' });
    setCurrentPin('');
    setNewPin('');
    setConfirmPin('');
    setTimeout(() => setPinMessage(null), 4000);
  };

  const handleExportData = () => {
    const dataStr = StorageService.exportAllData();
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `khelcom_business_backup_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImportSubmit = () => {
    if (!importText.trim()) return;
    const success = StorageService.importData(importText.trim());
    if (success) {
      const refreshedProducts = StorageService.getProducts();
      const refreshedOrders = StorageService.getOrders();
      const refreshedSettings = StorageService.getSettings();
      onProductsUpdated(refreshedProducts);
      onOrdersUpdated(refreshedOrders);
      onSettingsUpdated(refreshedSettings);
      setFormData(refreshedSettings);
      setFeeNianingStr(refreshedSettings.defaultDakarFee !== undefined ? String(refreshedSettings.defaultDakarFee) : '1000');
      setFeeDistanceStr(refreshedSettings.defaultDistanceFee !== undefined ? String(refreshedSettings.defaultDistanceFee) : '5000');
      setFeeRegionStr(refreshedSettings.defaultRegionFee !== undefined ? String(refreshedSettings.defaultRegionFee) : '8000');
      setFeeErrors({});
      setImportStatus('Données importées avec succès !');
      setTimeout(() => {
        setShowImportModal(false);
        setImportStatus(null);
        setImportText('');
      }, 1500);
    } else {
      setImportStatus('Erreur : format JSON invalide.');
    }
  };

  // Reset modal state
  const [resetAction, setResetAction] = useState<'catalog' | 'orders' | 'clean_launch' | null>(null);
  const [resetSuccessMessage, setResetSuccessMessage] = useState<string | null>(null);

  const handleConfirmReset = () => {
    if (resetAction === 'catalog') {
      const res = StorageService.resetProducts();
      onProductsUpdated(res);
      setResetSuccessMessage('Tous les produits du catalogue ont été supprimés avec succès (catalogue vidé).');
    } else if (resetAction === 'orders') {
      const res = StorageService.resetOrders();
      onOrdersUpdated(res);
      setResetSuccessMessage('Toutes les commandes de test ont été purgées avec succès (0 commande, CA à 0 FCFA).');
    } else if (resetAction === 'clean_launch') {
      const res = StorageService.resetAllDataForLaunch();
      onProductsUpdated(res.products);
      onOrdersUpdated(res.orders);
      setResetSuccessMessage('Boutique réinitialisée avec succès pour le lancement officiel (0 produit, 0 commande).');
    }
    setResetAction(null);
    setTimeout(() => setResetSuccessMessage(null), 4000);
  };

  const handleResetCatalog = () => {
    setResetAction('catalog');
  };

  const handleResetOrders = () => {
    setResetAction('orders');
  };

  const handleCleanLaunch = () => {
    setResetAction('clean_launch');
  };

  return (
    <div className="flex-1 overflow-y-auto p-3.5 sm:p-6 space-y-6 sm:space-y-8">
      
      {/* Save Notification Banner */}
      {saveSuccess && (
        <div className="p-3.5 bg-emerald-500/20 border border-emerald-500/40 rounded-2xl text-emerald-300 text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>Paramètres de la boutique enregistrés avec succès !</span>
        </div>
      )}

      {/* Main Settings Form */}
      <form onSubmit={handleSaveSettings} className="space-y-6">
        
        {/* Section 1: Business Identity & Contact */}
        <div className="bg-[#180730] border border-purple-900/60 rounded-3xl p-4 sm:p-6 space-y-4">
          <div className="flex items-center gap-2.5 pb-2 border-b border-purple-900/40">
            <Building2 className="w-4 h-4 text-orange-400" />
            <h3 className="text-sm font-bold text-white">Identité de l'Entreprise & Showroom</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-bold text-purple-200 mb-1">
                Nom Commercial de l'Enseigne
              </label>
              <input
                type="text"
                value={formData.showroomName}
                onChange={(e) => handleChange('showroomName', e.target.value)}
                className="w-full bg-[#110421] border border-purple-800 text-white rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-orange-500"
              />
            </div>

            <div>
              <label className="block font-bold text-purple-200 mb-1">
                Responsable / Direction Commerciale
              </label>
              <input
                type="text"
                value={formData.gerant}
                onChange={(e) => handleChange('gerant', e.target.value)}
                placeholder="ex: Direction Khelcom Business"
                className="w-full bg-[#110421] border border-purple-800 text-white rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-orange-500"
              />
            </div>

            <div>
              <label className="block font-bold text-purple-200 mb-1">
                Numéro Principal (Ligne 1 & WhatsApp)
              </label>
              <input
                type="text"
                value={formData.phone1}
                onChange={(e) => handleChange('phone1', e.target.value)}
                placeholder="+221 78 108 71 48"
                className="w-full bg-[#110421] border border-purple-800 text-white font-mono rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-orange-500"
              />
            </div>

            <div>
              <label className="block font-bold text-purple-200 mb-1">
                Numéro Secondaire (Ligne 2)
              </label>
              <input
                type="text"
                value={formData.phone2}
                onChange={(e) => handleChange('phone2', e.target.value)}
                placeholder="+221 77 136 01 46"
                className="w-full bg-[#110421] border border-purple-800 text-white font-mono rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-orange-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-bold text-purple-200 mb-1">
                Adresse Physique du Showroom & Dépôt
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => handleChange('address', e.target.value)}
                placeholder="ex: Showroom Khelcom Business, Nianing / Dakar"
                className="w-full bg-[#110421] border border-purple-800 text-white rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-orange-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-bold text-purple-200 mb-1">
                Lien Google Maps du Magasin / Showroom (Localisation GPS)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={formData.googleMapsUrl || ''}
                  onChange={(e) => handleChange('googleMapsUrl', e.target.value)}
                  placeholder="https://maps.app.goo.gl/QVw9tr1Hd99sqsQW7"
                  className="flex-1 bg-[#110421] border border-purple-800 text-white rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-orange-500 text-xs font-mono"
                />
                {formData.googleMapsUrl && (
                  <a
                    href={formData.googleMapsUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3.5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors shrink-0"
                  >
                    Tester le lien
                  </a>
                )}
              </div>
            </div>

            <div>
              <label className="block font-bold text-purple-200 mb-1">
                Horaires d'Ouverture
              </label>
              <input
                type="text"
                value={formData.openingHours}
                onChange={(e) => handleChange('openingHours', e.target.value)}
                placeholder="Lundi - Samedi : 08h30 - 20h30"
                className="w-full bg-[#110421] border border-purple-800 text-white rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-orange-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-bold text-purple-200 mb-1.5">
                NINEA & Registre de Commerce (RC)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="w-full min-w-0">
                  <input
                    type="text"
                    value={formData.ninea}
                    onChange={(e) => handleChange('ninea', e.target.value)}
                    placeholder="NINEA (ex: 009876543 2V2)"
                    className="w-full bg-[#110421] border border-purple-800 text-white rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-orange-500 font-mono"
                  />
                </div>
                <div className="w-full min-w-0">
                  <input
                    type="text"
                    value={formData.rc}
                    onChange={(e) => handleChange('rc', e.target.value)}
                    placeholder="RC (ex: SN-MBR-2023-B-14820)"
                    className="w-full bg-[#110421] border border-purple-800 text-white rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-orange-500 font-mono"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Delivery & Shipping Rates */}
        <div className="bg-[#180730] border border-purple-900/60 rounded-3xl p-5 sm:p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-purple-900/40">
            <div className="flex items-center gap-2.5">
              <Truck className="w-5 h-5 text-orange-400" />
              <div>
                <h3 className="text-sm font-bold text-white">Gestion & Tarification des Livraisons</h3>
                <p className="text-[11px] text-purple-300/70">
                  Contrôlez l'affichage des frais et configurez les tarifs pour les 14 régions du Sénégal
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <span className={`px-2.5 py-1 rounded-full text-[10px] font-black border uppercase tracking-wider ${
                hideDeliveryFees 
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' 
                  : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
              }`}>
                {hideDeliveryFees ? 'Mode Frais Masqués' : 'Frais Automatiques Chiffrés'}
              </span>
            </div>
          </div>

          {/* MASTER TOGGLE: Deactivate / Hide Delivery Fees */}
          <div className={`p-4 rounded-2xl border transition-all ${
            hideDeliveryFees 
              ? 'bg-amber-950/40 border-amber-500/50 shadow-md ring-1 ring-amber-500/30' 
              : 'bg-[#110421] border-purple-800/80 hover:border-purple-700'
          }`}>
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-2">
                  {hideDeliveryFees ? (
                    <EyeOff className="w-4 h-4 text-amber-400 shrink-0" />
                  ) : (
                    <Eye className="w-4 h-4 text-emerald-400 shrink-0" />
                  )}
                  <span className="text-xs font-black text-white">
                    Désactiver l'affichage des frais de livraison aux clients
                  </span>
                </div>
                <p className="text-[11px] text-purple-200/90 leading-relaxed font-normal">
                  {hideDeliveryFees ? (
                    <strong className="text-amber-300">
                      Mode activé : Aucun montant de livraison n'est affiché au client (il n'est pas marqué 0 FCFA ou Gratuit, mais <em>"À convenir avec le client"</em>).
                    </strong>
                  ) : (
                    <span>
                      Mode désactivé : Le client voit les tarifs chiffrés en FCFA calculés selon sa région ou son secteur.
                    </span>
                  )}
                </p>
                <div className="flex items-start gap-2 pt-1 text-[10.5px] text-purple-300/80">
                  <HelpCircle className="w-3.5 h-3.5 text-orange-400 shrink-0 mt-0.5" />
                  <span>
                    Ce réglage vous offre une flexibilité totale pour échanger ultérieurement avec le client (par téléphone ou WhatsApp) et convenir du transporteur ou du tarif selon le colis.
                  </span>
                </div>
              </div>

              <div className="shrink-0 pt-1 sm:pt-0">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hideDeliveryFees}
                    onChange={(e) => setHideDeliveryFees(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-12 h-6 bg-purple-950 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-purple-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500 border border-purple-700"></div>
                </label>
              </div>
            </div>
          </div>

          {/* Tarifs par Défaut (Généraux) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-orange-400" />
                Tarifs de Référence Généraux (FCFA)
              </h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block font-bold text-purple-200 mb-1">
                  Nianing & Proximité (FCFA) <span className="text-orange-400">*</span>
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={feeNianingStr}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === '' || /^\d+$/.test(val)) {
                      setFeeNianingStr(val);
                      if (feeErrors.nianing) {
                        setFeeErrors((prev) => ({ ...prev, nianing: undefined }));
                      }
                    }
                  }}
                  placeholder="Ex: 1000"
                  className={`w-full bg-[#110421] border text-orange-400 font-bold rounded-xl px-3.5 py-2.5 focus:outline-none transition-all ${
                    feeErrors.nianing 
                      ? 'border-rose-500 ring-1 ring-rose-500/50' 
                      : 'border-purple-800 focus:border-orange-500 focus:ring-1 focus:ring-orange-500/40'
                  }`}
                />
                {feeErrors.nianing && (
                  <span className="text-[10px] text-rose-400 font-semibold mt-1 block">
                    {feeErrors.nianing}
                  </span>
                )}
              </div>

              <div>
                <label className="block font-bold text-purple-200 mb-1">
                  Petite Côte & Proximité Élargie (FCFA) <span className="text-orange-400">*</span>
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={feeDistanceStr}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === '' || /^\d+$/.test(val)) {
                      setFeeDistanceStr(val);
                      if (feeErrors.distance) {
                        setFeeErrors((prev) => ({ ...prev, distance: undefined }));
                      }
                    }
                  }}
                  placeholder="Ex: 5000"
                  className={`w-full bg-[#110421] border text-orange-400 font-bold rounded-xl px-3.5 py-2.5 focus:outline-none transition-all ${
                    feeErrors.distance 
                      ? 'border-rose-500 ring-1 ring-rose-500/50' 
                      : 'border-purple-800 focus:border-orange-500 focus:ring-1 focus:ring-orange-500/40'
                  }`}
                />
                {feeErrors.distance && (
                  <span className="text-[10px] text-rose-400 font-semibold mt-1 block">
                    {feeErrors.distance}
                  </span>
                )}
              </div>

              <div>
                <label className="block font-bold text-purple-200 mb-1">
                  Régions Éloignées Standard (FCFA) <span className="text-orange-400">*</span>
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={feeRegionStr}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === '' || /^\d+$/.test(val)) {
                      setFeeRegionStr(val);
                      if (feeErrors.region) {
                        setFeeErrors((prev) => ({ ...prev, region: undefined }));
                      }
                    }
                  }}
                  placeholder="Ex: 8000"
                  className={`w-full bg-[#110421] border text-orange-400 font-bold rounded-xl px-3.5 py-2.5 focus:outline-none transition-all ${
                    feeErrors.region 
                      ? 'border-rose-500 ring-1 ring-rose-500/50' 
                      : 'border-purple-800 focus:border-orange-500 focus:ring-1 focus:ring-orange-500/40'
                  }`}
                />
                {feeErrors.region && (
                  <span className="text-[10px] text-rose-400 font-semibold mt-1 block">
                    {feeErrors.region}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Grille détaillée des 14 Régions du Sénégal avec tarifs personnalisables */}
          <div className="pt-4 border-t border-purple-900/40 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-orange-400" />
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                    Tarifs Spécifiques par Région (14 Régions du Sénégal)
                  </h4>
                </div>
                <p className="text-[11px] text-purple-300/80 mt-0.5">
                  Chaque région dispose de son propre tarif en FCFA, modifiable individuellement.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleResetRegionalFees}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-950 hover:bg-purple-900 text-purple-300 hover:text-white border border-purple-800 text-[11px] font-semibold transition-all cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3 text-orange-400" />
                  <span>Rétablir tarifs recommandés</span>
                </button>
                <span className="px-2 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
                  14 Régions
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-96 overflow-y-auto pr-1">
              {SENEGAL_14_REGIONS.map((reg, rIdx) => {
                const zone = DISTANCE_DELIVERY_ZONES.find((z) => z.region.toLowerCase() === reg.name.toLowerCase()) || DISTANCE_DELIVERY_ZONES[0];
                const currentVal = regionFees[zone.id] !== undefined ? regionFees[zone.id] : String(zone.fee);

                return (
                  <div
                    key={reg.code}
                    className="p-3 rounded-2xl bg-[#110421] border border-purple-800/80 space-y-2 text-xs hover:border-purple-600 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-1">
                      <div>
                        <span className="font-bold text-white text-xs block">
                          {rIdx + 1}. {reg.name}
                        </span>
                        <span className="text-[10px] text-purple-300/70">
                          Chef-lieu : <strong className="text-purple-200">{reg.capital}</strong>
                        </span>
                      </div>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-950 text-purple-300 font-mono border border-purple-800">
                        {reg.code}
                      </span>
                    </div>

                    <div className="pt-1">
                      <label className="block text-[10px] font-bold text-purple-300 mb-1">
                        Tarif appliqué :
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          value={currentVal}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val === '' || /^\d+$/.test(val)) {
                              setRegionFees((prev) => ({ ...prev, [zone.id]: val }));
                            }
                          }}
                          placeholder={String(zone.fee)}
                          className="w-full bg-[#180730] border border-purple-700/80 rounded-xl px-3 py-1.5 text-xs text-orange-400 font-bold font-mono focus:outline-none focus:border-orange-500 pr-14"
                        />
                        <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-purple-400 font-bold">
                          FCFA
                        </span>
                      </div>
                    </div>

                    <div className="text-[9.5px] text-purple-400/80 flex items-center justify-between pt-1 border-t border-purple-900/40">
                      <span>⏱️ {reg.estimatedTime}</span>
                      {hideDeliveryFees ? (
                        <span className="text-amber-400 font-medium">Masqué au client</span>
                      ) : (
                        <span className="text-emerald-400 font-medium">Actif</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Secteurs Locaux & Nouvelles Localités / Quartiers Personnalisés */}
          <div className="pt-5 border-t border-purple-900/50 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#130424] p-4 rounded-2xl border border-purple-800/80">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-orange-500/20 text-orange-400 border border-orange-500/30">
                    <MapPin className="w-4 h-4" />
                  </span>
                  <h4 className="text-xs font-black text-white uppercase tracking-wider">
                    Secteurs Locaux, Quartiers & Nouvelles Localités
                  </h4>
                  {(customNeighborhoods.length > 0 || customLocations.length > 0) && (
                    <span className="px-2 py-0.5 rounded-full bg-orange-500/20 border border-orange-500/40 text-orange-300 text-[10px] font-bold">
                      {customNeighborhoods.length + customLocations.length} personnalisé(s)
                    </span>
                  )}
                </div>
                <p className="text-[11.5px] text-purple-300/80">
                  Gérez la tarification par quartier à Nianing et ajoutez dynamiquement de nouvelles villes ou communes du Sénégal.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setNewZoneType('neighborhood');
                    setNewZoneName('');
                    setNewZoneRegion('Nianing');
                    setNewZoneFee('1000');
                    setNewZoneEstimatedTime('1 à 2 heures');
                    setNewZoneError(null);
                    setShowAddZoneModal(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-500 hover:bg-orange-400 text-white text-xs font-bold shadow-md hover:shadow-orange-500/20 transition-all cursor-pointer active:scale-95"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Nouveau Quartier</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setNewZoneType('location');
                    setNewZoneName('');
                    setNewZoneRegion('Thiès');
                    setNewZoneFee('5000');
                    setNewZoneEstimatedTime('24 à 48 heures');
                    setNewZoneError(null);
                    setShowAddZoneModal(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-900/90 hover:bg-purple-800 text-purple-200 border border-purple-700 text-xs font-bold shadow-xs transition-all cursor-pointer active:scale-95"
                >
                  <Globe className="w-3.5 h-3.5 text-amber-400" />
                  <span>+ Nouvelle Ville / Localité</span>
                </button>

                <button
                  type="button"
                  onClick={handleResetLocalZoneFees}
                  title="Réinitialiser les tarifs aux valeurs par défaut"
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-purple-950 hover:bg-purple-900 text-purple-300 text-[11px] border border-purple-800 transition-all cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3 text-orange-400" />
                  <span>Rétablir</span>
                </button>
              </div>
            </div>

            {/* Category Navigation Bar */}
            <div className="flex flex-wrap items-center gap-1.5 p-1 bg-[#110421] rounded-xl border border-purple-900/80">
              <button
                type="button"
                onClick={() => setActiveZoneCategory('local')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeZoneCategory === 'local'
                    ? 'bg-purple-800 text-white shadow-xs'
                    : 'text-purple-300/80 hover:text-white hover:bg-purple-900/40'
                }`}
              >
                <Home className="w-3.5 h-3.5 text-orange-400" />
                <span>Quartiers & Secteurs Locaux ({SENEGAL_DELIVERY_ZONES.length + customNeighborhoods.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveZoneCategory('regions')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeZoneCategory === 'regions'
                    ? 'bg-purple-800 text-white shadow-xs'
                    : 'text-purple-300/80 hover:text-white hover:bg-purple-900/40'
                }`}
              >
                <Building className="w-3.5 h-3.5 text-amber-400" />
                <span>Villes & Localités Régionales ({DISTANCE_DELIVERY_ZONES.length + customLocations.length})</span>
              </button>

              {(customNeighborhoods.length > 0 || customLocations.length > 0) && (
                <button
                  type="button"
                  onClick={() => setActiveZoneCategory('custom')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeZoneCategory === 'custom'
                      ? 'bg-orange-600 text-white shadow-xs'
                      : 'text-orange-300 hover:text-white hover:bg-orange-950/40'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
                  <span>Mes Ajouts Personnalisés ({customNeighborhoods.length + customLocations.length})</span>
                </button>
              )}
            </div>

            {/* Display: Local Neighborhoods */}
            {(activeZoneCategory === 'local' || activeZoneCategory === 'custom') && (
              <div className="space-y-2">
                {activeZoneCategory !== 'custom' && (
                  <div className="flex items-center justify-between text-xs text-purple-300/90 font-bold px-1">
                    <span>Quartiers de Nianing & environs immédiats</span>
                    <span className="text-[11px] text-purple-400">{SENEGAL_DELIVERY_ZONES.length + customNeighborhoods.length} zones actives</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {/* Default Local Zones */}
                  {activeZoneCategory !== 'custom' && SENEGAL_DELIVERY_ZONES.map((zone) => {
                    const currentVal = localZoneFees[zone.id] !== undefined ? localZoneFees[zone.id] : String(zone.fee);
                    return (
                      <div
                        key={zone.id}
                        className="p-3 rounded-2xl bg-[#110421] border border-purple-800/80 space-y-2 text-xs hover:border-purple-600/80 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-1">
                          <div>
                            <span className="font-extrabold text-white text-[12px] block">{zone.name}</span>
                            <span className="text-[10px] text-purple-400/90">{zone.region || 'Nianing / Mbour'}</span>
                          </div>
                          <span className="text-[9.5px] text-purple-300 bg-purple-950 px-1.5 py-0.5 rounded border border-purple-800/60 shrink-0">
                            ⏱️ {zone.estimatedTime}
                          </span>
                        </div>
                        <div className="relative">
                          <input
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            value={currentVal}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (val === '' || /^\d+$/.test(val)) {
                                setLocalZoneFees((prev) => ({ ...prev, [zone.id]: val }));
                              }
                            }}
                            className="w-full bg-[#180730] border border-purple-700/80 rounded-xl px-2.5 py-1.5 text-xs text-orange-400 font-bold font-mono focus:outline-none focus:border-orange-500 pr-12"
                          />
                          <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-purple-400 font-bold">
                            FCFA
                          </span>
                        </div>
                      </div>
                    );
                  })}

                  {/* Custom Neighborhoods Added by Admin */}
                  {customNeighborhoods.map((zone) => {
                    const currentVal = localZoneFees[zone.id] !== undefined ? localZoneFees[zone.id] : String(zone.fee);
                    return (
                      <div
                        key={zone.id}
                        className="p-3 rounded-2xl bg-[#1a0731] border-2 border-orange-500/40 space-y-2 text-xs shadow-sm hover:border-orange-400 transition-all"
                      >
                        <div className="flex items-start justify-between gap-1">
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-extrabold text-white text-[12px]">{zone.name}</span>
                              <span className="px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-300 border border-orange-500/40 text-[9px] font-bold">
                                Ajouté
                              </span>
                            </div>
                            <span className="text-[10px] text-purple-300">{zone.region || 'Quartier local'}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleDeleteCustomNeighborhood(zone.id)}
                            title="Supprimer ce quartier"
                            className="p-1 rounded-lg text-rose-400 hover:text-rose-200 hover:bg-rose-950/60 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="relative">
                          <input
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            value={currentVal}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (val === '' || /^\d+$/.test(val)) {
                                setLocalZoneFees((prev) => ({ ...prev, [zone.id]: val }));
                              }
                            }}
                            className="w-full bg-[#110421] border border-orange-500/50 rounded-xl px-2.5 py-1.5 text-xs text-orange-400 font-bold font-mono focus:outline-none focus:border-orange-400 pr-12"
                          />
                          <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-orange-300 font-bold">
                            FCFA
                          </span>
                        </div>

                        <div className="text-[9.5px] text-purple-300 flex items-center justify-between pt-0.5">
                          <span>⏱️ {zone.estimatedTime}</span>
                          <span className="text-emerald-400 font-semibold">Quartier actif</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Display: Regional Locations */}
            {(activeZoneCategory === 'regions' || (activeZoneCategory === 'custom' && customLocations.length > 0)) && (
              <div className="space-y-2 pt-2">
                {activeZoneCategory !== 'custom' && (
                  <div className="flex items-center justify-between text-xs text-purple-300/90 font-bold px-1">
                    <span>Villes, Communes & Régions du Sénégal</span>
                    <span className="text-[11px] text-purple-400">{DISTANCE_DELIVERY_ZONES.length + customLocations.length} localités actives</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {/* Default Regional Zones */}
                  {activeZoneCategory !== 'custom' && DISTANCE_DELIVERY_ZONES.map((zone) => {
                    const currentVal = regionFees[zone.id] !== undefined ? regionFees[zone.id] : String(zone.fee);
                    return (
                      <div
                        key={zone.id}
                        className="p-3 rounded-2xl bg-[#110421] border border-purple-800/80 space-y-2 text-xs hover:border-purple-600/80 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-1">
                          <div>
                            <span className="font-extrabold text-white text-[12px] block">{zone.name}</span>
                            <span className="text-[10px] text-purple-400/90">Région : {zone.region}</span>
                          </div>
                          <span className="text-[9.5px] text-purple-300 bg-purple-950 px-1.5 py-0.5 rounded border border-purple-800/60 shrink-0">
                            ⏱️ {zone.estimatedTime}
                          </span>
                        </div>
                        <div className="relative">
                          <input
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            value={currentVal}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (val === '' || /^\d+$/.test(val)) {
                                setRegionFees((prev) => ({ ...prev, [zone.id]: val }));
                              }
                            }}
                            className="w-full bg-[#180730] border border-purple-700/80 rounded-xl px-2.5 py-1.5 text-xs text-orange-400 font-bold font-mono focus:outline-none focus:border-orange-500 pr-12"
                          />
                          <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-purple-400 font-bold">
                            FCFA
                          </span>
                        </div>
                      </div>
                    );
                  })}

                  {/* Custom Locations Added by Admin */}
                  {customLocations.map((zone) => {
                    const currentVal = regionFees[zone.id] !== undefined ? regionFees[zone.id] : String(zone.fee);
                    return (
                      <div
                        key={zone.id}
                        className="p-3 rounded-2xl bg-[#1a0731] border-2 border-amber-500/40 space-y-2 text-xs shadow-sm hover:border-amber-400 transition-all"
                      >
                        <div className="flex items-start justify-between gap-1">
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-extrabold text-white text-[12px]">{zone.name}</span>
                              <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[9px] font-bold">
                                Localité ajoutée
                              </span>
                            </div>
                            <span className="text-[10px] text-purple-300">Région : {zone.region}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleDeleteCustomLocation(zone.id)}
                            title="Supprimer cette localité"
                            className="p-1 rounded-lg text-rose-400 hover:text-rose-200 hover:bg-rose-950/60 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="relative">
                          <input
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            value={currentVal}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (val === '' || /^\d+$/.test(val)) {
                                setRegionFees((prev) => ({ ...prev, [zone.id]: val }));
                              }
                            }}
                            className="w-full bg-[#110421] border border-amber-500/50 rounded-xl px-2.5 py-1.5 text-xs text-orange-400 font-bold font-mono focus:outline-none focus:border-amber-400 pr-12"
                          />
                          <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-amber-300 font-bold">
                            FCFA
                          </span>
                        </div>

                        <div className="text-[9.5px] text-purple-300 flex items-center justify-between pt-0.5">
                          <span>⏱️ {zone.estimatedTime}</span>
                          <span className="text-emerald-400 font-semibold">Localité active</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Section 3: Invoicing Legal Notices */}
        <div className="bg-[#180730] border border-purple-900/60 rounded-3xl p-5 sm:p-6 space-y-4">
          <div className="flex items-center gap-2.5 pb-2 border-b border-purple-900/40">
            <FileText className="w-4 h-4 text-orange-400" />
            <h3 className="text-sm font-bold text-white">Mentions Légales des Factures PDF</h3>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block font-bold text-purple-200 mb-1">
                Mention de Facturation (Régime fiscal sans TVA)
              </label>
              <input
                type="text"
                value={formData.invoiceLegalNotice}
                onChange={(e) => handleChange('invoiceLegalNotice', e.target.value)}
                className="w-full bg-[#110421] border border-purple-800 text-white rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-orange-500"
              />
            </div>

            <div>
              <label className="block font-bold text-purple-200 mb-1">
                Message d'Annonce sur la Bannière d'Accueil
              </label>
              <input
                type="text"
                value={formData.bannerAnnouncement || ''}
                onChange={(e) => handleChange('bannerAnnouncement', e.target.value)}
                placeholder="ex: Arrivage Récent Électroménager..."
                className="w-full bg-[#110421] border border-purple-800 text-white rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-orange-500"
              />
            </div>
          </div>
        </div>

        {/* Submit button for Settings */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="px-6 py-3 rounded-2xl bg-orange-500 hover:bg-orange-400 text-white font-extrabold text-xs transition-all shadow-md active:scale-98 flex items-center gap-2 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Enregistrer Tous les Paramètres</span>
          </button>
        </div>

      </form>

      {/* Section 4: Security & PIN Management */}
      <div className="bg-[#180730] border border-purple-900/60 rounded-3xl p-5 sm:p-6 space-y-4">
        <div className="flex items-center gap-2.5 pb-2 border-b border-purple-900/40">
          <Lock className="w-4 h-4 text-orange-400" />
          <h3 className="text-sm font-bold text-white">Sécurité & Code d'Accès Administrateur</h3>
        </div>

        <p className="text-xs text-purple-300/80">
          Modifiez le mot de passe requis pour accéder à l'espace d'administration.
        </p>

        {pinMessage && (
          <div
            className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2 ${
              pinMessage.type === 'success'
                ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300'
                : 'bg-rose-500/20 border border-rose-500/40 text-rose-300'
            }`}
          >
            {pinMessage.text}
          </div>
        )}

        <form onSubmit={handleUpdatePin} className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div>
            <label className="block font-bold text-purple-200 mb-1">Mot de passe actuel</label>
            <input
              type="password"
              required
              value={currentPin}
              onChange={(e) => setCurrentPin(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-[#110421] border border-purple-800 text-white rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-orange-500"
            />
          </div>

          <div>
            <label className="block font-bold text-purple-200 mb-1">Nouveau mot de passe</label>
            <input
              type="password"
              required
              value={newPin}
              onChange={(e) => setNewPin(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-[#110421] border border-purple-800 text-white rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-orange-500"
            />
          </div>

          <div>
            <label className="block font-bold text-purple-200 mb-1">Confirmer le nouveau</label>
            <input
              type="password"
              required
              value={confirmPin}
              onChange={(e) => setConfirmPin(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-[#110421] border border-purple-800 text-white rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-orange-500"
            />
          </div>

          <div className="sm:col-span-3 flex justify-end">
            <button
              type="submit"
              className="px-4 py-2.5 rounded-xl bg-purple-900 hover:bg-purple-800 text-white text-xs font-bold transition-colors cursor-pointer"
            >
              Mettre à Jour le Mot de Passe
            </button>
          </div>
        </form>
      </div>

      {/* Section 5: Data Management, Backup & Reset */}
      <div className="bg-[#180730] border border-purple-900/60 rounded-3xl p-5 sm:p-6 space-y-4">
        <div className="flex items-center gap-2.5 pb-2 border-b border-purple-900/40">
          <Shield className="w-4 h-4 text-orange-400" />
          <h3 className="text-sm font-bold text-white">Sauvegarde & Restauration des Données</h3>
        </div>

        <p className="text-xs text-purple-300/80">
          Exportez l'ensemble du catalogue et des commandes en format JSON sécurisé, ou restaurez une sauvegarde précédente.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
          {/* Export JSON */}
          <button
            type="button"
            onClick={handleExportData}
            className="p-3.5 rounded-2xl bg-[#110421] hover:bg-purple-950/80 border border-purple-800 text-left transition-all group cursor-pointer"
          >
            <Download className="w-5 h-5 text-orange-400 mb-2 group-hover:scale-110 transition-transform" />
            <div className="text-xs font-bold text-white">Exporter les Données</div>
            <div className="text-[10px] text-purple-300/70 mt-0.5">Sauvegarde complète (JSON)</div>
          </button>

          {/* Import JSON */}
          <button
            type="button"
            onClick={() => setShowImportModal(true)}
            className="p-3.5 rounded-2xl bg-[#110421] hover:bg-purple-950/80 border border-purple-800 text-left transition-all group cursor-pointer"
          >
            <Upload className="w-5 h-5 text-purple-300 mb-2 group-hover:scale-110 transition-transform" />
            <div className="text-xs font-bold text-white">Importer / Restaurer</div>
            <div className="text-[10px] text-purple-300/70 mt-0.5">Recharger un fichier JSON</div>
          </button>

          {/* Reset / Purge Catalog */}
          <button
            type="button"
            onClick={handleResetCatalog}
            className="p-3.5 rounded-2xl bg-[#110421] hover:bg-rose-950/40 border border-purple-800 hover:border-rose-700/60 text-left transition-all group cursor-pointer"
          >
            <Trash2 className="w-5 h-5 text-rose-400 mb-2 group-hover:scale-110 transition-transform" />
            <div className="text-xs font-bold text-white">Réinitialiser / Vider Catalogue</div>
            <div className="text-[10px] text-purple-300/70 mt-0.5">Supprimer tous les produits</div>
          </button>

          {/* Reset Orders */}
          <button
            type="button"
            onClick={handleResetOrders}
            className="p-3.5 rounded-2xl bg-[#110421] hover:bg-amber-950/40 border border-purple-800 hover:border-amber-700/60 text-left transition-all group cursor-pointer"
          >
            <AlertTriangle className="w-5 h-5 text-amber-400 mb-2 group-hover:scale-110 transition-transform" />
            <div className="text-xs font-bold text-white">Purger Commandes Test</div>
            <div className="text-[10px] text-purple-300/70 mt-0.5">Mettre le CA et commandes à 0</div>
          </button>

          {/* Clean Launch Reset */}
          <button
            type="button"
            onClick={handleCleanLaunch}
            className="p-3.5 rounded-2xl bg-gradient-to-br from-rose-950/30 to-[#110421] hover:from-rose-900/50 hover:to-purple-950 border border-rose-800/80 text-left transition-all group cursor-pointer"
          >
            <Sparkles className="w-5 h-5 text-orange-400 mb-2 group-hover:scale-110 transition-transform" />
            <div className="text-xs font-bold text-white">Lancement Officiel (Zéro Données)</div>
            <div className="text-[10px] text-orange-300/80 mt-0.5">Purger Catalogue & Commandes</div>
          </button>
        </div>
      </div>

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-70 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="bg-[#180730] border border-purple-800 rounded-3xl w-full max-w-lg p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-purple-900/60 pb-3">
              <h4 className="text-sm font-bold text-white">Importer des Données JSON</h4>
              <button
                onClick={() => setShowImportModal(false)}
                className="text-purple-300 hover:text-white"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-purple-300/80">
              Collez ci-dessous le contenu JSON de votre fichier de sauvegarde pour restaurer l'état de l'application.
            </p>

            <textarea
              rows={6}
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              placeholder="Collez votre JSON ici..."
              className="w-full bg-[#110421] border border-purple-800 text-white rounded-xl p-3 text-xs font-mono focus:outline-none focus:border-orange-500"
            />

            {importStatus && (
              <p className="text-xs font-bold text-orange-400">{importStatus}</p>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowImportModal(false)}
                className="px-3 py-2 rounded-xl bg-purple-950 text-purple-300 text-xs font-bold cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleImportSubmit}
                className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-400 text-white text-xs font-bold cursor-pointer"
              >
                Confirmer l'Importation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Ajouter un Nouveau Quartier ou une Nouvelle Localité */}
      {showAddZoneModal && (
        <div className="fixed inset-0 z-80 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in">
          <div className="bg-[#180730] border-2 border-purple-800 rounded-3xl w-full max-w-lg p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-purple-900/80 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center border border-orange-500/40">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">
                    {newZoneType === 'neighborhood' ? 'Ajouter un Quartier / Secteur Local' : 'Ajouter une Ville / Localité Régionale'}
                  </h4>
                  <p className="text-[10.5px] text-purple-300">
                    Sera immédiatement disponible lors du passage de commande
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddZoneModal(false)}
                className="w-7 h-7 rounded-lg bg-purple-950 text-purple-300 hover:text-white flex items-center justify-center cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Zone Type Toggle */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-[#110421] rounded-xl border border-purple-900/80">
              <button
                type="button"
                onClick={() => {
                  setNewZoneType('neighborhood');
                  setNewZoneRegion('Nianing');
                  setNewZoneFee('1000');
                  setNewZoneEstimatedTime('1 à 2 heures');
                }}
                className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  newZoneType === 'neighborhood'
                    ? 'bg-orange-500 text-white shadow-md'
                    : 'text-purple-300 hover:text-white'
                }`}
              >
                <Home className="w-3.5 h-3.5" />
                <span>🏡 Quartier Local</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setNewZoneType('location');
                  setNewZoneRegion('Thiès');
                  setNewZoneFee('5000');
                  setNewZoneEstimatedTime('24 à 48 heures');
                }}
                className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  newZoneType === 'location'
                    ? 'bg-purple-800 text-white shadow-md'
                    : 'text-purple-300 hover:text-white'
                }`}
              >
                <Building className="w-3.5 h-3.5" />
                <span>🗺️ Ville / Région</span>
              </button>
            </div>

            <form onSubmit={handleAddNewZone} className="space-y-3.5">
              {newZoneError && (
                <div className="p-2.5 rounded-xl bg-rose-950/80 border border-rose-500/60 text-rose-200 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{newZoneError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-white mb-1">
                  Nom du {newZoneType === 'neighborhood' ? 'quartier ou secteur' : 'de la ville ou commune'} <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newZoneName}
                  onChange={(e) => setNewZoneName(e.target.value)}
                  placeholder={newZoneType === 'neighborhood' ? 'Ex: Nianing Plage Nord, Domaine de Warang...' : 'Ex: Touba Mosquée, Mbour Centre, Saly Portudal...'}
                  className="w-full bg-[#110421] border border-purple-700 text-white rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-white mb-1">
                    {newZoneType === 'neighborhood' ? 'Secteur de rattachement' : 'Région / Département'}
                  </label>
                  <input
                    type="text"
                    value={newZoneRegion}
                    onChange={(e) => setNewZoneRegion(e.target.value)}
                    placeholder={newZoneType === 'neighborhood' ? 'Ex: Nianing Centre' : 'Ex: Thiès, Dakar, Kaolack...'}
                    className="w-full bg-[#110421] border border-purple-700 text-white rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-white mb-1">
                    Tarif de livraison (FCFA)
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={newZoneFee}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === '' || /^\d+$/.test(val)) {
                          setNewZoneFee(val);
                        }
                      }}
                      placeholder="1000"
                      className="w-full bg-[#110421] border border-purple-700 text-orange-400 font-bold font-mono rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-orange-500 pr-14"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-purple-400 font-bold">
                      FCFA
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-white mb-1">
                  Délai indicatif de livraison
                </label>
                <input
                  type="text"
                  value={newZoneEstimatedTime}
                  onChange={(e) => setNewZoneEstimatedTime(e.target.value)}
                  placeholder="Ex: 1 à 2 heures, 24 à 48 heures"
                  className="w-full bg-[#110421] border border-purple-700 text-white rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-orange-500"
                />
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {(newZoneType === 'neighborhood' 
                    ? ['1 à 2 heures', '2 à 4 heures', 'Moins d\'1 heure', 'Dans la journée'] 
                    : ['24 heures (Express)', '24 à 48 heures', '48 à 72 heures', '72 heures max']
                  ).map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setNewZoneEstimatedTime(preset)}
                      className="px-2 py-0.5 rounded-lg bg-purple-950 hover:bg-purple-900 border border-purple-800 text-[10px] text-purple-300 transition-colors cursor-pointer"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-purple-900/60">
                <button
                  type="button"
                  onClick={() => setShowAddZoneModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-purple-950 hover:bg-purple-900 text-purple-300 text-xs font-bold cursor-pointer transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-400 text-white text-xs font-bold shadow-lg hover:shadow-orange-500/25 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Enregistrer et Ajouter</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Reset Actions */}
      {resetAction && (
        <div className="fixed inset-0 z-70 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in">
          <div className="bg-[#180730] border border-rose-500/60 rounded-3xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/40 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-base font-bold text-white">
                  {resetAction === 'catalog'
                    ? 'Supprimer tous les produits du catalogue ?'
                    : resetAction === 'orders'
                    ? 'Purger toutes les commandes de test ?'
                    : 'Réinitialiser complètement la boutique (Lancement) ?'}
                </h4>
                <p className="text-xs text-purple-300 mt-1">
                  {resetAction === 'catalog'
                    ? 'Attention : Cette opération supprimera définitivement tous les produits de votre catalogue. Vous repartirez d\'un catalogue vierge.'
                    : resetAction === 'orders'
                    ? 'Attention : Cette opération supprimera définitivement toutes les commandes de test et remettra le chiffre d\'affaires à 0 FCFA.'
                    : 'Cette opération effacera tous les produits, toutes les commandes et tous les paniers pour lancer la boutique officielle avec un compteur à zéro.'}
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setResetAction(null)}
                className="px-4 py-2 rounded-xl bg-purple-950 text-purple-300 text-xs font-bold hover:bg-purple-900 cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleConfirmReset}
                className={`px-4 py-2 rounded-xl text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-lg active:scale-95 ${
                  resetAction === 'catalog' || resetAction === 'clean_launch'
                    ? 'bg-rose-600 hover:bg-rose-500'
                    : 'bg-amber-600 hover:bg-amber-500'
                }`}
              >
                {resetAction === 'catalog' || resetAction === 'clean_launch' ? (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Confirmer la réinitialisation</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Confirmer la purge</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Success Toast */}
      {resetSuccessMessage && (
        <div className="fixed bottom-6 right-6 z-70 max-w-sm bg-emerald-950/95 border border-emerald-500/60 text-emerald-200 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2.5 text-xs font-medium backdrop-blur-xs animate-in slide-in-from-bottom-3">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{resetSuccessMessage}</span>
        </div>
      )}

    </div>
  );
};
