import React, { useState, useMemo } from 'react';
import {
  Tag,
  Plus,
  Trash2,
  Edit2,
  Search,
  Check,
  AlertTriangle,
  Sparkles,
  Package,
  Layers,
  RefreshCw,
  X,
  ExternalLink,
  ArrowUpDown,
  Filter,
  CheckCircle2,
  Info,
  Download
} from 'lucide-react';
import { Product } from '../types';
import { StorageService } from '../services/storage';

interface AdminBrandsTabProps {
  products: Product[];
  brands: string[];
  onBrandsUpdated: (updatedBrands: string[]) => void;
  onProductsUpdated?: (updatedProducts: Product[]) => void;
  onNavigateToProductsWithBrand?: (brandName: string) => void;
}

// Popular tech & appliance brands in Senegal / West Africa for quick-add recommendations
const POPULAR_SUGGESTIONS = [
  'Samsung',
  'Apple',
  'LG',
  'Hisense',
  'Bosch',
  'TCL',
  'Midea',
  'Beko',
  'Philips',
  'Moulinex',
  'Sony',
  'Xiaomi',
  'Tecno',
  'Infinix',
  'Huawei',
  'JBL',
  'Anker',
  'Tefal',
  'Rowenta',
  'Delonghi',
  'Kenwood',
  'Whirlpool',
  'Carrier',
  'Daikin',
  'Sharp',
  'HP',
  'Dell',
  'Lenovo',
  'Canon',
  'Solstar',
  'Nasco',
  'Smart Technology',
  'Westpool',
  'Yusuf',
  'EVA Fashion',
  'Luxury Edition',
];

export const AdminBrandsTab: React.FC<AdminBrandsTabProps> = ({
  products,
  brands,
  onBrandsUpdated,
  onProductsUpdated,
  onNavigateToProductsWithBrand,
}) => {
  // Search and filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'with_products' | 'empty'>('all');
  const [sortBy, setSortBy] = useState<'name_asc' | 'name_desc' | 'count_desc' | 'count_asc'>('name_asc');

  // New brand state
  const [newBrandName, setNewBrandName] = useState('');
  const [addError, setAddError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);

  // Edit brand modal state
  const [editingBrand, setEditingBrand] = useState<{ oldName: string; newName: string } | null>(null);
  const [updateLinkedProducts, setUpdateLinkedProducts] = useState(true);

  // Delete confirmation modal state
  const [brandToDelete, setBrandToDelete] = useState<string | null>(null);

  // Reset confirmation modal state
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);

  // Map products count by brand (case-insensitive key mapping)
  const productCountMap = useMemo(() => {
    const map: Record<string, Product[]> = {};
    products.forEach((p) => {
      const bKey = (p.brand || '').trim().toLowerCase();
      if (!map[bKey]) map[bKey] = [];
      map[bKey].push(p);
    });
    return map;
  }, [products]);

  const getProductsForBrand = (brandName: string): Product[] => {
    const bKey = brandName.trim().toLowerCase();
    return productCountMap[bKey] || [];
  };

  // Filtered & sorted brands
  const filteredBrands = useMemo(() => {
    return brands
      .filter((brand) => {
        const matchesQuery = brand.toLowerCase().includes(searchQuery.toLowerCase().trim());
        if (!matchesQuery) return false;

        const count = getProductsForBrand(brand).length;
        if (filterType === 'with_products') return count > 0;
        if (filterType === 'empty') return count === 0;
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'name_asc') {
          return a.localeCompare(b, 'fr', { sensitivity: 'base' });
        }
        if (sortBy === 'name_desc') {
          return b.localeCompare(a, 'fr', { sensitivity: 'base' });
        }
        if (sortBy === 'count_desc') {
          const countA = getProductsForBrand(a).length;
          const countB = getProductsForBrand(b).length;
          return countB - countA || a.localeCompare(b);
        }
        if (sortBy === 'count_asc') {
          const countA = getProductsForBrand(a).length;
          const countB = getProductsForBrand(b).length;
          return countA - countB || a.localeCompare(b);
        }
        return 0;
      });
  }, [brands, searchQuery, filterType, sortBy, productCountMap]);

  // Available quick suggestions (not yet in brand list)
  const availableSuggestions = useMemo(() => {
    const brandLowerSet = new Set(brands.map((b) => b.toLowerCase().trim()));
    return POPULAR_SUGGESTIONS.filter((s) => !brandLowerSet.has(s.toLowerCase().trim()));
  }, [brands]);

  // Total stats
  const totalBrandsCount = brands.length;
  const brandsWithProductsCount = brands.filter((b) => getProductsForBrand(b).length > 0).length;
  const emptyBrandsCount = totalBrandsCount - brandsWithProductsCount;

  // Actions
  const showToast = (text: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const handleAddBrand = (nameToAdd?: string) => {
    const targetName = (nameToAdd !== undefined ? nameToAdd : newBrandName).trim();
    if (!targetName) {
      setAddError('Veuillez saisir un nom de marque valide.');
      return;
    }

    if (brands.some((b) => b.toLowerCase().trim() === targetName.toLowerCase())) {
      setAddError(`La marque "${targetName}" existe déjà dans la liste.`);
      return;
    }

    setAddError(null);
    const updated = StorageService.addBrand(targetName);
    onBrandsUpdated(updated);
    setNewBrandName('');
    showToast(`Marque "${targetName}" ajoutée avec succès aux marques disponibles.`);
  };

  const handleDeleteBrand = () => {
    if (!brandToDelete) return;
    const name = brandToDelete;
    const linkedProducts = getProductsForBrand(name);

    const updated = StorageService.removeBrand(name);
    onBrandsUpdated(updated);
    setBrandToDelete(null);
    showToast(
      linkedProducts.length > 0
        ? `Marque "${name}" retirée de la liste (${linkedProducts.length} produit(s) continuent d'exister au catalogue).`
        : `Marque "${name}" supprimée avec succès.`
    );
  };

  const handleConfirmEditBrand = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBrand) return;
    const { oldName, newName } = editingBrand;
    const trimmedNew = newName.trim();

    if (!trimmedNew) {
      alert('Le nom de la marque ne peut pas être vide.');
      return;
    }

    if (
      trimmedNew.toLowerCase() !== oldName.toLowerCase() &&
      brands.some((b) => b.toLowerCase().trim() === trimmedNew.toLowerCase())
    ) {
      alert(`Une marque nommée "${trimmedNew}" existe déjà.`);
      return;
    }

    const res = StorageService.updateBrand(oldName, trimmedNew, updateLinkedProducts);
    onBrandsUpdated(res.brands);

    if (updateLinkedProducts && res.updatedProductsCount > 0 && onProductsUpdated) {
      const refreshedProducts = StorageService.getProducts();
      onProductsUpdated(refreshedProducts);
    }

    setEditingBrand(null);
    showToast(
      res.updatedProductsCount > 0
        ? `Marque renommée en "${trimmedNew}" et ${res.updatedProductsCount} produit(s) mis à jour.`
        : `Marque renommée en "${trimmedNew}".`
    );
  };

  const handlePurgeEmptyBrands = () => {
    const nonEmptyBrands = brands.filter((b) => getProductsForBrand(b).length > 0);
    if (nonEmptyBrands.length === brands.length) {
      showToast('Toutes les marques actuelles ont des produits associés.', 'info');
      return;
    }
    const removedCount = brands.length - nonEmptyBrands.length;
    const updated = StorageService.saveBrands(nonEmptyBrands);
    onBrandsUpdated(updated);
    showToast(`${removedCount} marque(s) sans produit purgée(s) avec succès.`);
  };

  const handleResetBrands = () => {
    const updated = StorageService.resetBrands();
    onBrandsUpdated(updated);
    setIsResetConfirmOpen(false);
    showToast('Liste des marques réinitialisée aux marques standards Khelcom.');
  };

  const handleExportBrands = () => {
    const exportData = {
      exportedAt: new Date().toISOString(),
      brandsCount: brands.length,
      brands: brands.map((b) => ({
        name: b,
        productsCount: getProductsForBrand(b).length,
      })),
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `khelcom_marques_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Export JSON téléchargé avec succès.');
  };

  // Color generator for initials badge
  const getBrandBadgeColor = (name: string) => {
    const palettes = [
      'from-orange-500 to-amber-600 text-white',
      'from-purple-600 to-indigo-600 text-white',
      'from-emerald-500 to-teal-600 text-white',
      'from-blue-500 to-cyan-600 text-white',
      'from-rose-500 to-pink-600 text-white',
      'from-amber-500 to-orange-600 text-white',
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % palettes.length;
    return palettes[index];
  };

  return (
    <div className="space-y-6">
      
      {/* TOAST FEEDBACK */}
      {toastMessage && (
        <div
          className={`p-4 rounded-2xl flex items-center justify-between gap-3 shadow-xl animate-in fade-in slide-in-from-top-3 duration-200 border ${
            toastMessage.type === 'success'
              ? 'bg-emerald-950/90 text-emerald-200 border-emerald-700'
              : toastMessage.type === 'info'
              ? 'bg-blue-950/90 text-blue-200 border-blue-700'
              : 'bg-rose-950/90 text-rose-200 border-rose-700'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {toastMessage.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : (
              <Info className="w-5 h-5 text-blue-400 shrink-0" />
            )}
            <span className="text-xs sm:text-sm font-semibold">{toastMessage.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="p-1 hover:bg-white/10 rounded-lg text-white/80 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 1. TOP STATS OVERVIEW */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-[#180630] border border-purple-800/80 rounded-2xl p-4 shadow-lg flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-400 shrink-0">
            <Tag className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-purple-300/80 uppercase tracking-wider block">
              Marques Disponibles
            </span>
            <div className="text-2xl font-black text-white">{totalBrandsCount}</div>
            <span className="text-[11px] text-orange-400 font-semibold block">
              Actives sur la boutique
            </span>
          </div>
        </div>

        <div className="bg-[#180630] border border-purple-800/80 rounded-2xl p-4 shadow-lg flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-purple-300/80 uppercase tracking-wider block">
              Marques avec Produits
            </span>
            <div className="text-2xl font-black text-white">{brandsWithProductsCount}</div>
            <span className="text-[11px] text-emerald-400 font-semibold block">
              Présentes au catalogue
            </span>
          </div>
        </div>

        <div className="bg-[#180630] border border-purple-800/80 rounded-2xl p-4 shadow-lg flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-purple-900/40 border border-purple-700/60 flex items-center justify-center text-purple-300 shrink-0">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-purple-300/80 uppercase tracking-wider block">
              Marques Vides (Sans Produit)
            </span>
            <div className="text-2xl font-black text-white">{emptyBrandsCount}</div>
            <span className="text-[11px] text-purple-400 font-semibold block">
              Prêtes pour futurs ajouts
            </span>
          </div>
        </div>
      </div>

      {/* 2. ADD BRAND SECTION */}
      <div className="bg-[#180630] border border-purple-800/80 rounded-3xl p-4 sm:p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-purple-900/60 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-orange-500/20 border border-orange-500/40 flex items-center justify-center text-orange-400">
              <Plus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black text-white">
                Ajouter une Nouvelle Marque
              </h3>
              <p className="text-[11px] text-purple-300/80">
                La marque apparaîtra instantanément dans les filtres du site et le formulaire d'ajout de produit.
              </p>
            </div>
          </div>
        </div>

        {/* Input Form */}
        <div className="flex flex-col sm:flex-row items-stretch gap-2.5">
          <div className="relative flex-1">
            <input
              type="text"
              value={newBrandName}
              onChange={(e) => {
                setNewBrandName(e.target.value);
                if (addError) setAddError(null);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddBrand();
                }
              }}
              placeholder="Ex: Sony, Xiaomi, Tefal, Kenwood, Westpool..."
              className="w-full bg-[#100220] border border-purple-700 text-white rounded-xl px-4 py-2.5 text-xs sm:text-sm focus:outline-none focus:border-orange-500 placeholder-purple-400/60"
            />
            {newBrandName && (
              <button
                type="button"
                onClick={() => setNewBrandName('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-purple-400 hover:text-white p-1"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => handleAddBrand()}
            disabled={!newBrandName.trim()}
            className="px-5 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 disabled:opacity-50 disabled:cursor-not-allowed text-white font-extrabold text-xs sm:text-sm rounded-xl transition-all shadow-md shadow-orange-500/20 active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4 shrink-0" />
            <span>Ajouter la Marque</span>
          </button>
        </div>

        {addError && (
          <p className="text-xs text-rose-400 font-bold flex items-center gap-1.5 pt-1">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{addError}</span>
          </p>
        )}

        {/* Quick Add Suggestions Chips */}
        {availableSuggestions.length > 0 && (
          <div className="pt-2">
            <span className="text-[11px] font-bold text-purple-300 block mb-2 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Suggestions rapides de marques populaires à ajouter en 1 clic :</span>
            </span>
            <div className="flex flex-wrap gap-1.5">
              {availableSuggestions.slice(0, 14).map((sug) => (
                <button
                  key={sug}
                  type="button"
                  onClick={() => handleAddBrand(sug)}
                  className="px-2.5 py-1 rounded-lg bg-[#120324] hover:bg-orange-500 hover:text-white border border-purple-800 text-purple-200 text-xs font-semibold transition-all flex items-center gap-1 cursor-pointer group shadow-xs"
                >
                  <Plus className="w-3 h-3 text-orange-400 group-hover:text-white" />
                  <span>{sug}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 3. SEARCH, FILTER & BULK CONTROLS */}
      <div className="bg-[#180630] border border-purple-800/80 rounded-2xl p-3 sm:p-4 shadow-md space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          
          {/* Search */}
          <div className="relative flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher une marque..."
              className="w-full bg-[#100220] border border-purple-700 text-white rounded-xl pl-9 pr-4 py-2 text-xs focus:outline-none focus:border-orange-500"
            />
            <Search className="w-4 h-4 text-purple-400 absolute left-3 top-1/2 -translate-y-1/2" />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-purple-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1 overflow-x-auto pb-0.5 md:pb-0 scrollbar-none">
            <button
              type="button"
              onClick={() => setFilterType('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                filterType === 'all'
                  ? 'bg-orange-500 text-white shadow-xs'
                  : 'bg-[#100220] text-purple-300 hover:bg-purple-950 border border-purple-800/80'
              }`}
            >
              Toutes ({brands.length})
            </button>

            <button
              type="button"
              onClick={() => setFilterType('with_products')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                filterType === 'with_products'
                  ? 'bg-orange-500 text-white shadow-xs'
                  : 'bg-[#100220] text-purple-300 hover:bg-purple-950 border border-purple-800/80'
              }`}
            >
              Avec Produits ({brandsWithProductsCount})
            </button>

            <button
              type="button"
              onClick={() => setFilterType('empty')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                filterType === 'empty'
                  ? 'bg-orange-500 text-white shadow-xs'
                  : 'bg-[#100220] text-purple-300 hover:bg-purple-950 border border-purple-800/80'
              }`}
            >
              Sans Produit ({emptyBrandsCount})
            </button>
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-1.5 bg-[#100220] border border-purple-700 rounded-xl px-2.5 py-1.5 shrink-0">
            <ArrowUpDown className="w-3.5 h-3.5 text-purple-400 shrink-0" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-transparent text-purple-200 text-xs font-semibold focus:outline-none cursor-pointer"
            >
              <option value="name_asc" className="bg-[#180630]">Nom (A → Z)</option>
              <option value="name_desc" className="bg-[#180630]">Nom (Z → A)</option>
              <option value="count_desc" className="bg-[#180630]">Nombre de produits (Décroissant)</option>
              <option value="count_asc" className="bg-[#180630]">Nombre de produits (Croissant)</option>
            </select>
          </div>

        </div>
      </div>

      {/* 4. BRANDS GRID LIST */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-bold text-purple-300">
            {filteredBrands.length} marque{filteredBrands.length > 1 ? 's' : ''} affichée{filteredBrands.length > 1 ? 's' : ''}
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportBrands}
              className="px-2.5 py-1 rounded-lg bg-[#180630] hover:bg-purple-900 border border-purple-800 text-[11px] font-semibold text-purple-300 flex items-center gap-1.5 cursor-pointer transition-colors"
              title="Exporter les marques au format JSON"
            >
              <Download className="w-3.5 h-3.5 text-purple-400" />
              <span>Exporter</span>
            </button>

            {emptyBrandsCount > 0 && (
              <button
                type="button"
                onClick={handlePurgeEmptyBrands}
                className="px-2.5 py-1 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/60 text-[11px] font-semibold text-rose-300 flex items-center gap-1.5 cursor-pointer transition-colors"
                title="Supprimer toutes les marques sans aucun produit associé"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                <span>Purger sans produits ({emptyBrandsCount})</span>
              </button>
            )}
          </div>
        </div>

        {filteredBrands.length === 0 ? (
          <div className="text-center py-12 px-4 bg-[#180630] rounded-3xl border border-purple-800/80 shadow-lg space-y-3">
            <Tag className="w-12 h-12 text-purple-400 mx-auto opacity-40" />
            <p className="text-sm font-bold text-white">Aucune marque ne correspond à votre recherche.</p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setFilterType('all');
              }}
              className="px-4 py-2 bg-purple-900 hover:bg-purple-800 text-purple-200 rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              Réinitialiser la recherche
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {filteredBrands.map((brandName) => {
              const brandProducts = getProductsForBrand(brandName);
              const hasProducts = brandProducts.length > 0;
              const badgeGradient = getBrandBadgeColor(brandName);
              const initial = brandName.charAt(0).toUpperCase();

              return (
                <div
                  key={brandName}
                  className="bg-[#180630] border border-purple-800/80 hover:border-purple-700 rounded-2xl p-4 shadow-lg transition-all flex flex-col justify-between gap-3 group"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Monogram Badge */}
                      <div
                        className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${badgeGradient} flex items-center justify-center font-black text-base shadow-md shrink-0`}
                      >
                        {initial}
                      </div>

                      <div className="min-w-0">
                        <h4 className="text-sm sm:text-base font-black text-white truncate" title={brandName}>
                          {brandName}
                        </h4>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                              hasProducts
                                ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                                : 'bg-purple-950/60 text-purple-400 border-purple-800/50'
                            }`}
                          >
                            <Package className="w-3 h-3" />
                            <span>{brandProducts.length} produit{brandProducts.length > 1 ? 's' : ''}</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Actions Buttons */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() =>
                          setEditingBrand({
                            oldName: brandName,
                            newName: brandName,
                          })
                        }
                        className="p-2 rounded-xl bg-purple-950 hover:bg-purple-900 text-purple-300 hover:text-white border border-purple-800 transition-colors cursor-pointer"
                        title={`Modifier le nom de la marque "${brandName}"`}
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => setBrandToDelete(brandName)}
                        className="p-2 rounded-xl bg-rose-950/40 hover:bg-rose-900 text-rose-400 hover:text-white border border-rose-800/50 transition-colors cursor-pointer active:scale-95"
                        title={`Supprimer la marque "${brandName}"`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Associated Products Preview (If any) */}
                  {hasProducts ? (
                    <div className="pt-2 border-t border-purple-900/40">
                      <div className="flex items-center justify-between text-[11px] text-purple-300 mb-1.5">
                        <span className="font-semibold">Produits récents :</span>
                        {onNavigateToProductsWithBrand && (
                          <button
                            type="button"
                            onClick={() => onNavigateToProductsWithBrand(brandName)}
                            className="text-orange-400 hover:text-orange-300 hover:underline flex items-center gap-0.5 cursor-pointer font-bold"
                          >
                            <span>Voir tout</span>
                            <ExternalLink className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                        {brandProducts.slice(0, 4).map((p) => (
                          <div
                            key={p.id}
                            className="w-10 h-10 rounded-lg overflow-hidden bg-purple-950 border border-purple-800/60 shrink-0 relative group/img"
                            title={`${p.name} - ${p.basePrice.toLocaleString()} FCFA`}
                          >
                            <img
                              src={p.imageUrl || 'https://images.unsplash.com/photo-1584992236310-6edddc08acff?auto=format&fit=crop&w=150&q=80'}
                              alt={p.name}
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ))}
                        {brandProducts.length > 4 && (
                          <span className="text-[10px] font-bold text-purple-400 pl-1 shrink-0">
                            +{brandProducts.length - 4}
                          </span>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="pt-2 border-t border-purple-900/40 text-[11px] text-purple-400/80 italic">
                      Aucun produit n'est actuellement associé à cette marque.
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 5. RESET STANDARD BRANDS CARD */}
      <div className="bg-[#130325] border border-purple-900/80 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <h4 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
            <RefreshCw className="w-4 h-4 text-purple-400" />
            <span>Réinitialiser la Liste des Marques</span>
          </h4>
          <p className="text-[11px] text-purple-300/80 max-w-xl">
            Restaure la liste initiale des marques standards (Samsung, Apple, LG, Hisense, Bosch, TCL, Midea, Beko, Philips, Moulinex).
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsResetConfirmOpen(true)}
          className="px-4 py-2 bg-purple-950 hover:bg-purple-900 text-purple-200 border border-purple-700/80 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0"
        >
          Réinitialiser par défaut
        </button>
      </div>

      {/* MODAL 1: EDIT BRAND */}
      {editingBrand && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[#180630] border border-purple-700 rounded-3xl p-5 sm:p-6 w-full max-w-md shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-purple-900/60 pb-3">
              <div className="flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-orange-400" />
                <h4 className="text-base font-bold text-white">Modifier la Marque</h4>
              </div>
              <button
                type="button"
                onClick={() => setEditingBrand(null)}
                className="p-1 rounded-lg text-purple-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmEditBrand} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-purple-200 mb-1.5">
                  Nom de la marque
                </label>
                <input
                  type="text"
                  required
                  value={editingBrand.newName}
                  onChange={(e) =>
                    setEditingBrand({ ...editingBrand, newName: e.target.value })
                  }
                  className="w-full bg-[#100220] border border-purple-700 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-orange-500"
                  autoFocus
                />
              </div>

              {getProductsForBrand(editingBrand.oldName).length > 0 && (
                <div className="bg-purple-950/60 border border-purple-800 rounded-xl p-3 space-y-2">
                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={updateLinkedProducts}
                      onChange={(e) => setUpdateLinkedProducts(e.target.checked)}
                      className="mt-0.5 rounded-sm accent-orange-500"
                    />
                    <div className="text-xs">
                      <span className="font-bold text-white">
                        Mettre à jour les {getProductsForBrand(editingBrand.oldName).length} produit(s) associés
                      </span>
                      <p className="text-[11px] text-purple-300/80 mt-0.5">
                        Tous les produits actuellement étiquetés "{editingBrand.oldName}" prendront automatiquement le nouveau nom.
                      </p>
                    </div>
                  </label>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingBrand(null)}
                  className="px-4 py-2.5 rounded-xl bg-purple-950 hover:bg-purple-900 text-purple-200 font-bold text-xs cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-400 text-white font-bold text-xs cursor-pointer shadow-md shadow-orange-500/20 active:scale-95 flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Enregistrer les modifications</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: DELETE BRAND CONFIRMATION */}
      {brandToDelete && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[#180630] border border-rose-800/80 rounded-3xl p-5 sm:p-6 w-full max-w-md shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-base font-bold text-white">Supprimer cette marque ?</h4>
                <p className="text-xs text-rose-300 font-bold mt-0.5 font-mono">
                  &ldquo;{brandToDelete}&rdquo;
                </p>
              </div>
            </div>

            <div className="bg-[#100220] border border-purple-900/60 rounded-xl p-3 text-xs text-purple-300 space-y-2">
              <p>
                Cette action supprimera <strong>{brandToDelete}</strong> de la liste des marques disponibles pour les filtres et ajouts de produits.
              </p>
              {getProductsForBrand(brandToDelete).length > 0 && (
                <div className="bg-amber-950/40 border border-amber-800/60 rounded-lg p-2.5 text-amber-200 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <span>
                    <strong>Attention :</strong> {getProductsForBrand(brandToDelete).length} produit(s) utilisent actuellement cette marque. Vos produits ne seront pas supprimés, mais la marque ne figurera plus dans la liste prédéfinie.
                  </span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setBrandToDelete(null)}
                className="px-4 py-2.5 rounded-xl bg-purple-950 hover:bg-purple-900 text-purple-200 font-bold text-xs cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleDeleteBrand}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs cursor-pointer shadow-md shadow-rose-600/30 active:scale-95 flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>Confirmer la suppression</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: RESET BRANDS CONFIRMATION */}
      {isResetConfirmOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[#180630] border border-purple-700 rounded-3xl p-5 sm:p-6 w-full max-w-md shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-orange-500/10 border border-orange-500/30 text-orange-400 flex items-center justify-center shrink-0">
                <RefreshCw className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-base font-bold text-white">Réinitialiser les marques ?</h4>
                <p className="text-xs text-purple-300 mt-0.5">
                  Restaure les 10 marques standards de base.
                </p>
              </div>
            </div>

            <p className="text-xs text-purple-300 leading-relaxed">
              Toutes les marques personnalisées ajoutées seront remplacées par la liste standard par défaut. Les produits existants conserveront leur nom de marque actuel.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsResetConfirmOpen(false)}
                className="px-4 py-2.5 rounded-xl bg-purple-950 hover:bg-purple-900 text-purple-200 font-bold text-xs cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleResetBrands}
                className="px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-400 text-white font-bold text-xs cursor-pointer shadow-md shadow-orange-500/20 active:scale-95 flex items-center gap-1.5"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Confirmer la réinitialisation</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
