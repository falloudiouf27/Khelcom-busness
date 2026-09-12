import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Plus, 
  Trash2, 
  Upload, 
  Sparkles, 
  Check, 
  Layers, 
  DollarSign, 
  Package, 
  Eye, 
  EyeOff,
  ShieldCheck, 
  Image as ImageIcon,
  Tag,
  Sliders,
  Info,
  Camera,
  FolderPlus,
  Loader2,
  Star,
  RefreshCw,
  Link as LinkIcon,
  Download,
  Palette,
  Pipette
} from 'lucide-react';
import { Product, ProductVariant } from '../types';
import { BRANDS, CATEGORIES } from '../data/mockProducts';
import { StorageService } from '../services/storage';
import { formatFCFA } from '../utils/formatters';
import { optimizeImageFile, optimizeMultipleImageFiles } from '../utils/imageOptimizer';
import { POPULAR_COLORS, getColorHex } from '../utils/colors';

interface AdminProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (product: Product) => void;
  productToEdit?: Product | null;
}

export const AdminProductModal: React.FC<AdminProductModalProps> = ({
  isOpen,
  onClose,
  onSave,
  productToEdit,
}) => {
  // Product Basic Info
  const [name, setName] = useState(productToEdit?.name || '');
  const [availableBrands, setAvailableBrands] = useState<string[]>(() => StorageService.getBrands());
  const [brand, setBrand] = useState(productToEdit?.brand || 'Samsung');
  const [isAddingNewBrand, setIsAddingNewBrand] = useState(false);
  const [newBrandInput, setNewBrandInput] = useState('');
  const [category, setCategory] = useState(productToEdit?.category || 'refrigerateurs');
  const [basePrice, setBasePrice] = useState<number | string>(productToEdit?.basePrice ?? 25000);
  const [originalPrice, setOriginalPrice] = useState<number | string | undefined>(productToEdit?.originalPrice ?? '');
  const [shortDescription, setShortDescription] = useState(productToEdit?.shortDescription || '');
  const [description, setDescription] = useState(productToEdit?.description || '');
  
  // Statuses
  const [isOnline, setIsOnline] = useState<boolean>(productToEdit?.isOnline !== false);
  const [isHidden, setIsHidden] = useState<boolean>(productToEdit?.isHidden === true);
  const [inStock, setInStock] = useState<boolean>(productToEdit?.inStock !== false);
  const [isFeatured, setIsFeatured] = useState<boolean>(productToEdit?.isFeatured || false);
  const [isNew, setIsNew] = useState<boolean>(productToEdit?.isNew || false);

  // Images
  const [imageUrl, setImageUrl] = useState(productToEdit?.imageUrl || '');
  const [galleryUrls, setGalleryUrls] = useState<string[]>(productToEdit?.galleryUrls || []);
  const [newGalleryInput, setNewGalleryInput] = useState('');
  const [imageInputMode, setImageInputMode] = useState<'upload' | 'url'>('upload');
  const [isUploadingMain, setIsUploadingMain] = useState(false);
  const [isUploadingGallery, setIsUploadingGallery] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDraggingMain, setIsDraggingMain] = useState(false);
  const [isDraggingGallery, setIsDraggingGallery] = useState(false);

  const mainFileInputRef = useRef<HTMLInputElement>(null);
  const galleryFileInputRef = useRef<HTMLInputElement>(null);

  // Specs
  const [specs, setSpecs] = useState<{ key: string; val: string }[]>(
    productToEdit?.specs 
      ? Object.entries(productToEdit.specs).map(([key, val]) => ({ key, val }))
      : [
          { key: 'Garantie', val: '24 Mois constructeur' },
          { key: 'Classe énergétique', val: 'A+++' },
          { key: 'Origine', val: 'Matériel Neuf & Certifié' },
        ]
  );

  // Variants
  const [openColorPickerIndex, setOpenColorPickerIndex] = useState<number | null>(null);
  const [variants, setVariants] = useState<ProductVariant[]>(
    productToEdit?.variants?.length 
      ? productToEdit.variants 
      : [
          {
            id: `var-${Date.now()}-1`,
            productId: productToEdit?.id || 'temp',
            sku: '',
            title: 'Modèle Standard',
            colorName: 'Gris Inox',
            colorHex: '#94a3b8',
            price: 250000,
            originalPrice: undefined,
            stockQuantity: 10,
            isDefault: true,
          }
        ]
  );

  // Sync state whenever modal opens or productToEdit changes
  useEffect(() => {
    if (!isOpen) return;

    const currentBrandsList = StorageService.getBrands();
    setAvailableBrands(currentBrandsList);

    if (productToEdit) {
      setName(productToEdit.name || '');
      setBrand(productToEdit.brand || currentBrandsList[0] || 'Samsung');
      setCategory(productToEdit.category || 'refrigerateurs');
      setBasePrice(productToEdit.basePrice ?? 25000);
      setOriginalPrice(productToEdit.originalPrice !== undefined ? productToEdit.originalPrice : '');
      setShortDescription(productToEdit.shortDescription || '');
      setDescription(productToEdit.description || '');
      setIsOnline(productToEdit.isOnline !== false);
      setIsHidden(productToEdit.isHidden === true);
      setInStock(productToEdit.inStock !== false);
      setIsFeatured(productToEdit.isFeatured || false);
      setIsNew(productToEdit.isNew || false);
      setImageUrl(productToEdit.imageUrl || '');
      setGalleryUrls(
        productToEdit.galleryUrls && productToEdit.galleryUrls.length > 0
          ? productToEdit.galleryUrls
          : productToEdit.imageUrl
            ? [productToEdit.imageUrl]
            : []
      );
      setNewGalleryInput('');
      setUploadError(null);
      setIsAddingNewBrand(false);
      setNewBrandInput('');

      // Specs
      if (productToEdit.specs && Object.keys(productToEdit.specs).length > 0) {
        setSpecs(Object.entries(productToEdit.specs).map(([key, val]) => ({ key, val })));
      } else {
        setSpecs([
          { key: 'Garantie', val: '24 Mois constructeur' },
          { key: 'Classe énergétique', val: 'A+++' },
          { key: 'Origine', val: 'Matériel Neuf & Certifié' },
        ]);
      }

      // Variants
      if (productToEdit.variants && productToEdit.variants.length > 0) {
        setVariants(productToEdit.variants);
      } else {
        setVariants([
          {
            id: `var-${Date.now()}-1`,
            productId: productToEdit.id,
            sku: productToEdit.sku || `KB-${productToEdit.id.slice(-6)}-V1`,
            title: 'Modèle Standard',
            colorName: 'Gris Inox',
            colorHex: '#94a3b8',
            price: productToEdit.basePrice || 250000,
            originalPrice: productToEdit.originalPrice,
            stockQuantity: 10,
            isDefault: true,
          }
        ]);
      }
    } else {
      // New Product Defaults
      setName('');
      setBrand(currentBrandsList[0] || 'Samsung');
      setCategory('refrigerateurs');
      setBasePrice(25000);
      setOriginalPrice('');
      setShortDescription('');
      setDescription('');
      setIsOnline(true);
      setIsHidden(false);
      setInStock(true);
      setIsFeatured(false);
      setIsNew(true);
      setImageUrl('');
      setGalleryUrls([]);
      setNewGalleryInput('');
      setUploadError(null);
      setIsAddingNewBrand(false);
      setNewBrandInput('');
      setSpecs([
        { key: 'Garantie', val: '24 Mois constructeur' },
        { key: 'Classe énergétique', val: 'A+++' },
        { key: 'Origine', val: 'Matériel Neuf & Certifié' },
      ]);
      setVariants([
        {
          id: `var-${Date.now()}-1`,
          productId: 'temp',
          sku: '',
          title: 'Modèle Standard',
          colorName: 'Gris Inox',
          colorHex: '#94a3b8',
          price: 25000,
          originalPrice: undefined,
          stockQuantity: 10,
          isDefault: true,
        }
      ]);
    }
  }, [isOpen, productToEdit]);

  // Handle clean fallback on save if empty
  const defaultFallbackImage = 'https://images.unsplash.com/photo-1584992236310-6edddc08acff?auto=format&fit=crop&w=900&q=80';

  if (!isOpen) return null;

  const handleAddNewBrand = () => {
    const trimmed = newBrandInput.trim();
    if (!trimmed) return;
    const updated = StorageService.addBrand(trimmed);
    setAvailableBrands(updated);
    setBrand(trimmed);
    setNewBrandInput('');
    setIsAddingNewBrand(false);
  };

  const handleAddSpec = () => {
    setSpecs([...specs, { key: '', val: '' }]);
  };

  const handleRemoveSpec = (index: number) => {
    setSpecs(specs.filter((_, i) => i !== index));
  };

  const handleSpecChange = (index: number, field: 'key' | 'val', value: string) => {
    const updated = [...specs];
    updated[index][field] = value;
    setSpecs(updated);
  };

  const handleAddVariant = () => {
    const newVar: ProductVariant = {
      id: `var-${Date.now()}-${variants.length + 1}`,
      productId: productToEdit?.id || 'temp',
      sku: '',
      title: `Variante ${variants.length + 1}`,
      price: basePrice,
      stockQuantity: 5,
      isDefault: variants.length === 0,
    };
    setVariants([...variants, newVar]);
  };

  const handleRemoveVariant = (index: number) => {
    if (variants.length <= 1) {
      alert('Un produit doit comporter au moins une variante ou taille.');
      return;
    }
    const updated = variants.filter((_, i) => i !== index);
    if (!updated.some((v) => v.isDefault)) {
      updated[0].isDefault = true;
    }
    setVariants(updated);
  };

  const handleVariantChange = (
    index: number,
    fieldOrUpdates: keyof ProductVariant | Partial<ProductVariant>,
    value?: any
  ) => {
    setVariants((prevVariants) => {
      const updated = [...prevVariants];
      if (typeof fieldOrUpdates === 'string') {
        updated[index] = { ...updated[index], [fieldOrUpdates]: value };
        if (fieldOrUpdates === 'isDefault' && value === true) {
          updated.forEach((v, i) => {
            if (i !== index) v.isDefault = false;
          });
        }
      } else {
        updated[index] = { ...updated[index], ...fieldOrUpdates };
        if (fieldOrUpdates.isDefault === true) {
          updated.forEach((v, i) => {
            if (i !== index) v.isDefault = false;
          });
        }
      }
      return updated;
    });
  };

  // Image Upload Handlers
  const handleMainFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    setIsUploadingMain(true);
    setUploadError(null);
    try {
      const optimized = await optimizeImageFile(file);
      setImageUrl(optimized);
    } catch (err: any) {
      setUploadError(err.message || "Erreur lors du traitement de l'image.");
    } finally {
      setIsUploadingMain(false);
      if (mainFileInputRef.current) mainFileInputRef.current.value = '';
    }
  };

  const handleGalleryFilesSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setIsUploadingGallery(true);
    setUploadError(null);
    try {
      const optimizedList = await optimizeMultipleImageFiles(files);
      if (optimizedList.length > 0) {
        setGalleryUrls((prev) => [...prev, ...optimizedList]);
      }
    } catch (err: any) {
      setUploadError(err.message || "Erreur lors du traitement des images de la galerie.");
    } finally {
      setIsUploadingGallery(false);
      if (galleryFileInputRef.current) galleryFileInputRef.current.value = '';
    }
  };

  const handleSetAsMainImage = (index: number) => {
    const selectedUrl = galleryUrls[index];
    const oldMain = imageUrl;
    setImageUrl(selectedUrl);
    const updated = [...galleryUrls];
    if (oldMain && oldMain !== selectedUrl) {
      updated[index] = oldMain;
    } else {
      updated.splice(index, 1);
    }
    setGalleryUrls(updated);
  };

  const handleAddGalleryUrl = () => {
    if (newGalleryInput.trim()) {
      setGalleryUrls([...galleryUrls, newGalleryInput.trim()]);
      setNewGalleryInput('');
    }
  };

  const handleRemoveGalleryUrl = (index: number) => {
    setGalleryUrls(galleryUrls.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Veuillez saisir le nom du produit.');
      return;
    }

    const effectiveBrand = brand.trim() || 'Khelcom';
    const categoryObj = CATEGORIES.find((c) => c.id === category);
    const categoryLabel = categoryObj ? categoryObj.label : 'Électronique & Électroménager';

    const cleanSpecs: Record<string, string> = {};
    specs.forEach((s) => {
      if (s.key.trim() && s.val.trim()) {
        cleanSpecs[s.key.trim()] = s.val.trim();
      }
    });

    const slug = name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    const productId = productToEdit?.id || `prod-${Date.now()}`;

    const numBasePrice = typeof basePrice === 'number' ? basePrice : Number(basePrice) || 0;
    const numOriginalPrice = originalPrice !== undefined && originalPrice !== '' && !isNaN(Number(originalPrice)) && Number(originalPrice) > 0 ? Number(originalPrice) : undefined;

    const cleanVariants = variants.map((v, i) => {
      const resolvedHex = getColorHex(v.colorHex, v.colorName);
      return {
        ...v,
        productId,
        sku: v.sku || `KB-${productId.slice(-6)}-V${i + 1}`,
        colorHex: resolvedHex,
        price: typeof v.price === 'number' ? v.price : Number(v.price) || numBasePrice,
        stockQuantity: Number(v.stockQuantity) || 0,
      };
    });

    const finalProduct: Product = {
      id: productId,
      sku: productToEdit?.sku || `KB-${Date.now().toString().slice(-6)}`,
      name: name.trim(),
      slug,
      brand: effectiveBrand,
      category,
      categoryLabel,
      description: description.trim() || shortDescription.trim() || `${name} disponible chez Khelcom Business.`,
      shortDescription: shortDescription.trim() || `${effectiveBrand} - Garantie officielle constructeur.`,
      basePrice: numBasePrice,
      originalPrice: numOriginalPrice,
      isFeatured,
      isNew,
      inStock,
      isOnline,
      isHidden,
      imageUrl: imageUrl.trim() || defaultFallbackImage,
      galleryUrls: galleryUrls.length > 0 ? galleryUrls : [imageUrl.trim()],
      specs: cleanSpecs,
      variants: cleanVariants,
      createdAt: productToEdit?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSave(finalProduct);
    onClose();
  };

  const numBase = typeof basePrice === 'number' ? basePrice : Number(basePrice) || 0;
  const numOriginal = originalPrice !== undefined && originalPrice !== '' ? Number(originalPrice) : 0;
  const discountPercent = numOriginal > numBase && numOriginal > 0
    ? Math.round(((numOriginal - numBase) / numOriginal) * 100)
    : 0;

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-[#150727] border border-purple-800/80 rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-purple-100">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-purple-900/60 bg-[#1b0833]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/20 border border-orange-500/30 text-orange-400 flex items-center justify-center">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-white">
                {productToEdit ? 'Modifier le Produit' : 'Mettre un Produit en Ligne'}
              </h2>
              <p className="text-xs text-purple-300/70">
                Catalogue Khelcom Business • Affichage immédiat pour les clients
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-purple-300 hover:text-white hover:bg-purple-900/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Status and Visibility Toggles */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 bg-[#1c0936] p-4 rounded-2xl border border-purple-900/50">
            {/* Hide / Show Toggle */}
            <div 
              onClick={() => setIsHidden(!isHidden)}
              className={`flex items-center gap-2.5 p-2 rounded-xl border cursor-pointer select-none transition-all ${
                isHidden 
                  ? 'bg-amber-500/20 border-amber-500/50 text-amber-300' 
                  : 'bg-purple-950/40 border-purple-800/60 hover:bg-purple-900/40'
              }`}
            >
              <input
                type="checkbox"
                checked={isHidden}
                onChange={(e) => setIsHidden(e.target.checked)}
                className="w-4 h-4 rounded text-amber-500 accent-amber-500 focus:ring-0 cursor-pointer"
              />
              <div>
                <span className="text-xs font-bold text-white block">
                  {isHidden ? '🙈 Masqué' : '👁️ Visible'}
                </span>
                <span className="text-[10px] text-purple-300/70 block">
                  {isHidden ? 'Caché boutique' : 'Visible boutique'}
                </span>
              </div>
            </div>

            <div 
              onClick={() => setIsOnline(!isOnline)}
              className="flex items-center gap-2.5 p-2 rounded-xl border border-purple-800/40 hover:bg-purple-900/40 cursor-pointer select-none"
            >
              <input
                type="checkbox"
                checked={isOnline}
                onChange={(e) => setIsOnline(e.target.checked)}
                className="w-4 h-4 rounded text-orange-500 accent-orange-500 focus:ring-0 cursor-pointer"
              />
              <div>
                <span className="text-xs font-bold text-white block">
                  {isOnline ? '🟢 En Ligne' : '⚪ Brouillon'}
                </span>
                <span className="text-[10px] text-purple-300/70 block">Statut fiche</span>
              </div>
            </div>

            <div 
              onClick={() => setInStock(!inStock)}
              className="flex items-center gap-2.5 p-2 rounded-xl border border-purple-800/40 hover:bg-purple-900/40 cursor-pointer select-none"
            >
              <input
                type="checkbox"
                checked={inStock}
                onChange={(e) => setInStock(e.target.checked)}
                className="w-4 h-4 rounded text-orange-500 accent-orange-500 focus:ring-0 cursor-pointer"
              />
              <div>
                <span className="text-xs font-bold text-white block">
                  {inStock ? '📦 En Stock' : '❌ Rupture'}
                </span>
                <span className="text-[10px] text-purple-300/70 block">Disponibilité</span>
              </div>
            </div>

            <div 
              onClick={() => setIsFeatured(!isFeatured)}
              className="flex items-center gap-2.5 p-2 rounded-xl border border-purple-800/40 hover:bg-purple-900/40 cursor-pointer select-none"
            >
              <input
                type="checkbox"
                checked={isFeatured}
                onChange={(e) => setIsFeatured(e.target.checked)}
                className="w-4 h-4 rounded text-orange-500 accent-orange-500 focus:ring-0 cursor-pointer"
              />
              <div>
                <span className="text-xs font-bold text-white block">⭐ Top Vente</span>
                <span className="text-[10px] text-purple-300/70 block">Mis en avant</span>
              </div>
            </div>

            <div 
              onClick={() => setIsNew(!isNew)}
              className="flex items-center gap-2.5 p-2 rounded-xl border border-purple-800/40 hover:bg-purple-900/40 cursor-pointer select-none"
            >
              <input
                type="checkbox"
                checked={isNew}
                onChange={(e) => setIsNew(e.target.checked)}
                className="w-4 h-4 rounded text-orange-500 accent-orange-500 focus:ring-0 cursor-pointer"
              />
              <div>
                <span className="text-xs font-bold text-white block">✨ Nouveauté</span>
                <span className="text-[10px] text-purple-300/70 block">Badge Nouveau</span>
              </div>
            </div>
          </div>

          {/* Section 1: General Info */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-orange-400 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5" /> Informations Générales
            </h3>

            {/* Product Name (Full Width) */}
            <div>
              <label className="block text-xs font-bold text-purple-200 mb-1">
                Nom du Produit <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="ex: Réfrigérateur No-Frost Double Battant Inverter"
                className="w-full bg-[#110421] border border-purple-800 text-white rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-orange-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-purple-200 mb-1">
                  Rayon / Catégorie <span className="text-rose-400">*</span>
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-[#110421] border border-purple-800 text-white rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-orange-500 cursor-pointer"
                >
                  {CATEGORIES.filter((c) => c.id !== 'all').map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-purple-200">
                    Marque <span className="text-rose-400">*</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsAddingNewBrand(!isAddingNewBrand)}
                    className="text-[11px] text-orange-400 hover:text-orange-300 font-bold transition-colors cursor-pointer flex items-center gap-1"
                    title="Ajouter une nouvelle marque à la liste"
                  >
                    <Plus className="w-3 h-3" />
                    <span>{isAddingNewBrand ? 'Fermer' : 'Nouvelle Marque'}</span>
                  </button>
                </div>

                {!isAddingNewBrand ? (
                  <select
                    value={brand}
                    onChange={(e) => {
                      if (e.target.value === '__add_new_brand__') {
                        setIsAddingNewBrand(true);
                      } else {
                        setBrand(e.target.value);
                      }
                    }}
                    className="w-full bg-[#110421] border border-purple-800 text-white rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-orange-500 cursor-pointer"
                  >
                    {availableBrands.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                    <option value="__add_new_brand__" className="text-orange-400 font-bold bg-[#1e0738]">
                      ➕ + Ajouter une nouvelle marque...
                    </option>
                  </select>
                ) : (
                  <div className="space-y-1.5 animate-in fade-in duration-150">
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        value={newBrandInput}
                        onChange={(e) => setNewBrandInput(e.target.value)}
                        placeholder="Nom de la nouvelle marque..."
                        className="flex-1 bg-[#110421] border border-orange-500 text-white rounded-xl px-3 py-2 text-xs focus:outline-none placeholder-purple-400/60"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddNewBrand();
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={handleAddNewBrand}
                        disabled={!newBrandInput.trim()}
                        className="px-3 py-2 bg-orange-500 hover:bg-orange-400 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition-all cursor-pointer shrink-0"
                      >
                        Ajouter
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsAddingNewBrand(false);
                          setNewBrandInput('');
                        }}
                        className="p-2 bg-purple-950 hover:bg-purple-900 text-purple-300 rounded-xl transition-all cursor-pointer shrink-0"
                        title="Annuler"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <span className="text-[10px] text-purple-400 block">
                      Enregistre la marque et l'ajoute à la liste globale.
                    </span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-purple-200 mb-1">
                  Prix de Base (FCFA) <span className="text-rose-400">*</span>
                </label>
                <input
                  type="number"
                  required
                  min={0}
                  step="any"
                  value={basePrice}
                  onChange={(e) => setBasePrice(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="ex: 25000, 5500, 45000..."
                  className="w-full bg-[#110421] border border-purple-800 text-orange-400 font-black rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-orange-500"
                />
                <span className="text-[10px] text-purple-400/80 mt-1 block">
                  Montant en FCFA (ex: 5 500, 25 000, 35 000, 45 000...).
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-purple-200 mb-1">
                  Prix Barré / Promo (Optionnel FCFA)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={0}
                    step="any"
                    value={originalPrice ?? ''}
                    onChange={(e) => setOriginalPrice(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="ex: 10000, 45000, 7500..."
                    className="flex-1 bg-[#110421] border border-purple-800 text-purple-300 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-orange-500"
                  />
                  {discountPercent > 0 && (
                    <span className="px-2.5 py-2 rounded-xl bg-orange-500/20 text-orange-400 border border-orange-500/30 text-xs font-bold">
                      -{discountPercent}%
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-purple-400/80 mt-1 block">
                  Prix avant promo (ex: 10 000 réduit à 5 500 FCFA).
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-purple-200 mb-1">
                  Accroche Courte (Carte produit)
                </label>
                <input
                  type="text"
                  value={shortDescription}
                  onChange={(e) => setShortDescription(e.target.value)}
                  placeholder="ex: Froid ventilé No-Frost, compresseur Inverter garanti 10 ans."
                  className="w-full bg-[#110421] border border-purple-800 text-white rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-orange-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-purple-200 mb-1">
                Description Détaillée & Arguments de Vente
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Détaillez les fonctionnalités, avantages énergétiques, silence et usage recommandé..."
                className="w-full bg-[#110421] border border-purple-800 text-white rounded-xl p-3 text-xs focus:outline-none focus:border-orange-500"
              />
            </div>
          </div>

          {/* Section 2: Photos and Visuals */}
          <div className="space-y-4 pt-4 border-t border-purple-900/50">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-orange-400 flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5" /> Visuels & Photos du Produit
              </h3>

              {/* Mode Switcher */}
              <div className="flex items-center bg-[#110421] p-0.5 rounded-lg border border-purple-900/70 text-[11px]">
                <button
                  type="button"
                  onClick={() => setImageInputMode('upload')}
                  className={`px-2.5 py-1 rounded-md font-semibold transition-all flex items-center gap-1 cursor-pointer ${
                    imageInputMode === 'upload'
                      ? 'bg-orange-500 text-white shadow-sm'
                      : 'text-purple-300 hover:text-white'
                  }`}
                >
                  <Upload className="w-3 h-3" /> Ma Galerie / Photos
                </button>
                <button
                  type="button"
                  onClick={() => setImageInputMode('url')}
                  className={`px-2.5 py-1 rounded-md font-semibold transition-all flex items-center gap-1 cursor-pointer ${
                    imageInputMode === 'url'
                      ? 'bg-orange-500 text-white shadow-sm'
                      : 'text-purple-300 hover:text-white'
                  }`}
                >
                  <LinkIcon className="w-3 h-3" /> Lien URL
                </button>
              </div>
            </div>

            {uploadError && (
              <div className="p-2.5 bg-rose-950/60 border border-rose-800/80 rounded-xl text-rose-300 text-xs flex items-center gap-2">
                <Info className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{uploadError}</span>
              </div>
            )}

            {/* Hidden File Inputs */}
            <input
              type="file"
              accept="image/*"
              ref={mainFileInputRef}
              className="hidden"
              onChange={(e) => handleMainFileSelect(e.target.files)}
            />
            <input
              type="file"
              accept="image/*"
              multiple
              ref={galleryFileInputRef}
              className="hidden"
              onChange={(e) => handleGalleryFilesSelect(e.target.files)}
            />

            {/* 1. MAIN IMAGE SECTION */}
            <div className="bg-[#110421]/90 border border-purple-900/80 rounded-2xl p-3.5 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-purple-200 flex items-center gap-1.5">
                  <span>Photo Principale (Vitrine)</span>
                  <span className="text-rose-400">*</span>
                </label>
                {imageUrl && (
                  <span className="text-[10px] bg-orange-500/20 text-orange-400 font-semibold px-2 py-0.5 rounded-full border border-orange-500/30">
                    Active en couverture
                  </span>
                )}
              </div>

              {/* Upload mode */}
              {imageInputMode === 'upload' && (
                <div className="space-y-2.5">
                  {imageUrl ? (
                    <div className="flex flex-col sm:flex-row items-center gap-3 bg-[#18082e] p-2.5 rounded-xl border border-purple-800/80">
                      <div className="relative group shrink-0">
                        <img
                          src={imageUrl}
                          alt="Photo Principale"
                          className="w-24 h-24 sm:w-20 sm:h-20 rounded-xl object-contain bg-black/40 border border-purple-700/60"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center">
                          <Eye className="w-5 h-5 text-white" />
                        </div>
                      </div>
                      <div className="flex-1 text-center sm:text-left space-y-1">
                        <p className="text-xs font-bold text-white">Image de couverture chargée</p>
                        <p className="text-[11px] text-purple-300">
                          Cette photo s'affiche en premier dans la liste des produits et sur les cartes d'achat.
                        </p>
                        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                          <button
                            type="button"
                            disabled={isUploadingMain}
                            onClick={() => mainFileInputRef.current?.click()}
                            className="px-2.5 py-1 bg-purple-800 hover:bg-purple-700 text-white rounded-lg text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
                          >
                            {isUploadingMain ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <Camera className="w-3 h-3" />
                            )}
                            Remplacer la photo
                          </button>
                          <button
                            type="button"
                            onClick={() => setImageUrl('')}
                            className="px-2 py-1 bg-rose-950/60 hover:bg-rose-900 text-rose-300 rounded-lg text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" /> Supprimer
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div
                      onDragOver={(e) => {
                        e.preventDefault();
                        setIsDraggingMain(true);
                      }}
                      onDragLeave={() => setIsDraggingMain(false)}
                      onDrop={(e) => {
                        e.preventDefault();
                        setIsDraggingMain(false);
                        handleMainFileSelect(e.dataTransfer.files);
                      }}
                      onClick={() => mainFileInputRef.current?.click()}
                      className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
                        isDraggingMain
                          ? 'border-orange-500 bg-orange-500/10'
                          : 'border-purple-800/80 hover:border-orange-500/70 bg-[#16072b]/60 hover:bg-[#1b0833]'
                      }`}
                    >
                      {isUploadingMain ? (
                        <div className="py-2 flex flex-col items-center gap-2">
                          <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
                          <p className="text-xs font-bold text-white">Optimisation et chargement de la photo...</p>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-2">
                          <div className="w-12 h-12 rounded-2xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-400 shadow-inner">
                            <Upload className="w-6 h-6" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-white">
                              Cliquez pour choisir une photo depuis votre galerie / téléphone
                            </p>
                            <p className="text-[11px] text-purple-300/80 mt-0.5">
                              Ou glissez-déposez une image ici (JPEG, PNG, WebP)
                            </p>
                          </div>
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-orange-400 bg-orange-500/10 px-2.5 py-1 rounded-full border border-orange-500/20 mt-1">
                            <Camera className="w-3 h-3" /> Prendre une photo ou ouvrir la galerie
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* URL mode */}
              {imageInputMode === 'url' && (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      placeholder="https://images.unsplash.com/... ou /images/..."
                      className="flex-1 bg-[#16072b] border border-purple-800 text-white rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-orange-500"
                    />
                    {imageUrl && (
                      <button
                        type="button"
                        onClick={() => setImageUrl('')}
                        className="px-2.5 py-2 bg-purple-900 hover:bg-purple-800 text-purple-300 rounded-xl text-xs"
                      >
                        Effacer
                      </button>
                    )}
                  </div>
                  {imageUrl && (
                    <div className="flex items-center gap-3 bg-[#18082e] p-2 rounded-xl border border-purple-800/80">
                      <img
                        src={imageUrl}
                        alt="Aperçu URL"
                        className="w-12 h-12 rounded-xl object-contain bg-black/40 border border-purple-700/60"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1584992236310-6edddc08acff?auto=format&fit=crop&w=300&q=80';
                        }}
                      />
                      <span className="text-[11px] text-purple-300 font-medium truncate flex-1">{imageUrl}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 2. MULTIPLE GALLERY PHOTOS SECTION */}
            <div className="bg-[#110421]/90 border border-purple-900/80 rounded-2xl p-3.5 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-xs font-bold text-purple-200 block">
                    Galerie Photos Complémentaires (Multi-Photos)
                  </label>
                  <span className="text-[11px] text-purple-300/70">
                    Ajoutez plusieurs angles, détails et couleurs du produit
                  </span>
                </div>
                <span className="text-[10px] bg-purple-900/80 text-purple-300 font-bold px-2.5 py-0.5 rounded-full border border-purple-700/60">
                  {galleryUrls.length} photo{galleryUrls.length > 1 ? 's' : ''}
                </span>
              </div>

              {/* Upload actions row */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  disabled={isUploadingGallery}
                  onClick={() => galleryFileInputRef.current?.click()}
                  className="px-3 py-2 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-md shadow-orange-950/40 cursor-pointer"
                >
                  {isUploadingGallery ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <FolderPlus className="w-3.5 h-3.5" />
                  )}
                  <span>Sélectionner des photos (Galerie / Fichiers)</span>
                </button>

                <div className="flex-1 flex gap-1.5 min-w-[220px]">
                  <input
                    type="url"
                    value={newGalleryInput}
                    onChange={(e) => setNewGalleryInput(e.target.value)}
                    placeholder="Ou coller une URL d'image..."
                    className="flex-1 bg-[#16072b] border border-purple-800 text-white rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-orange-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddGalleryUrl}
                    className="px-3 py-1.5 rounded-xl bg-purple-900 hover:bg-purple-800 text-white font-bold text-xs flex items-center gap-1 cursor-pointer shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" /> Ajouter
                  </button>
                </div>
              </div>

              {/* Drag & drop dropzone for multi-photos */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDraggingGallery(true);
                }}
                onDragLeave={() => setIsDraggingGallery(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDraggingGallery(false);
                  handleGalleryFilesSelect(e.dataTransfer.files);
                }}
                className={`border border-dashed rounded-xl p-3 text-center transition-all ${
                  isDraggingGallery
                    ? 'border-orange-500 bg-orange-500/10'
                    : 'border-purple-800/60 bg-[#16072b]/40 hover:border-purple-700'
                }`}
              >
                <p className="text-[11px] text-purple-300 flex items-center justify-center gap-1.5">
                  <Camera className="w-3.5 h-3.5 text-orange-400" />
                  <span>Glissez-déposez plusieurs photos ensemble ici pour les ajouter d'un coup</span>
                </p>
              </div>

              {/* Gallery Thumbnails Grid */}
              {galleryUrls.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-2.5 pt-1">
                  {galleryUrls.map((url, idx) => (
                    <div
                      key={idx}
                      className="relative group bg-[#18082e] border border-purple-800 rounded-xl overflow-hidden p-1 flex flex-col"
                    >
                      <img
                        src={url}
                        alt={`Galerie ${idx + 1}`}
                        className="w-full h-20 rounded-lg object-contain bg-black/40"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1584992236310-6edddc08acff?auto=format&fit=crop&w=300&q=80';
                        }}
                      />
                      <div className="flex items-center justify-between mt-1 px-0.5">
                        <span className="text-[9px] text-purple-400 font-semibold">#{idx + 1}</span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            title="Définir comme photo principale"
                            onClick={() => handleSetAsMainImage(idx)}
                            className="p-1 text-purple-300 hover:text-amber-400 rounded-md hover:bg-purple-800 cursor-pointer"
                          >
                            <Star className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            title="Supprimer cette photo"
                            onClick={() => handleRemoveGalleryUrl(idx)}
                            className="p-1 text-purple-300 hover:text-rose-400 rounded-md hover:bg-rose-950 cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Section 3: Variants & Options */}
          <div className="space-y-4 pt-4 border-t border-purple-900/50">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-orange-400 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5" /> Variantes, Tailles & Prix ({variants.length})
              </h3>
              <button
                type="button"
                onClick={handleAddVariant}
                className="px-2.5 py-1 rounded-lg bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 border border-orange-500/40 text-xs font-bold flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Ajouter Variante
              </button>
            </div>

            <div className="space-y-3">
              {variants.map((variant, index) => (
                <div
                  key={variant.id}
                  className="bg-[#180730] border border-purple-900/60 rounded-2xl p-3.5 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white flex items-center gap-2">
                      Variante #{index + 1}
                      {variant.isDefault && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold">
                          Par Défaut
                        </span>
                      )}
                    </span>
                    <div className="flex items-center gap-2">
                      <div 
                        onClick={() => handleVariantChange(index, 'isDefault', true)}
                        className="text-[11px] text-purple-300 flex items-center gap-1.5 cursor-pointer select-none"
                      >
                        <input
                          type="radio"
                          name="defaultVariant"
                          checked={variant.isDefault}
                          onChange={() => handleVariantChange(index, 'isDefault', true)}
                          className="text-orange-500 accent-orange-500 cursor-pointer"
                        />
                        <span>Par défaut</span>
                      </div>
                      {variants.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveVariant(index)}
                          className="p-1 rounded text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 cursor-pointer"
                          title="Supprimer la variante"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                    <div className="sm:col-span-2">
                      <label className="block text-[10px] font-bold text-purple-300 mb-0.5">
                        Titre / Capacité / Format
                      </label>
                      <input
                        type="text"
                        required
                        value={variant.title}
                        onChange={(e) => handleVariantChange(index, 'title', e.target.value)}
                        placeholder="ex: 450 Litres - Inox Brossé (H: 182cm)"
                        className="w-full bg-[#110421] border border-purple-800 text-white rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-orange-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-purple-300 mb-0.5">
                        Prix Net (FCFA)
                      </label>
                      <input
                        type="number"
                        required
                        min={0}
                        step="any"
                        value={variant.price === 0 ? '' : variant.price}
                        onChange={(e) => handleVariantChange(index, 'price', e.target.value === '' ? '' : Number(e.target.value))}
                        placeholder="ex: 5500, 25000..."
                        className="w-full bg-[#110421] border border-purple-800 text-orange-400 font-bold rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-orange-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-purple-300 mb-0.5">
                        Quantité en Stock
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={variant.stockQuantity}
                        onChange={(e) => handleVariantChange(index, 'stockQuantity', Number(e.target.value))}
                        className="w-full bg-[#110421] border border-purple-800 text-white rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-orange-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                    <div>
                      <label className="block text-[10px] text-purple-400 mb-0.5">Dimensions (cm)</label>
                      <input
                        type="text"
                        value={variant.sizeDimensions || ''}
                        onChange={(e) => handleVariantChange(index, 'sizeDimensions', e.target.value)}
                        placeholder="ex: 182 x 70 x 72 cm"
                        className="w-full bg-[#110421] border border-purple-800 text-white rounded-lg px-2 py-1 text-xs"
                      />
                    </div>
                    <div className="relative">
                      <div className="flex items-center justify-between mb-0.5">
                        <label className="block text-[10px] text-purple-300 font-bold">
                          Couleur & Teinte
                        </label>
                        {getColorHex(variant.colorHex, variant.colorName) && (
                          <span className="text-[9px] text-purple-400 font-mono flex items-center gap-1">
                            <span 
                              className="w-2 h-2 rounded-full inline-block border border-purple-500/50"
                              style={{ backgroundColor: getColorHex(variant.colorHex, variant.colorName) }}
                            />
                            {getColorHex(variant.colorHex, variant.colorName)}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 relative">
                        {/* Interactive Color Swatch / Picker Trigger Button */}
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() => setOpenColorPickerIndex(openColorPickerIndex === index ? null : index)}
                            className="h-7 px-2 rounded-lg bg-[#180730] hover:bg-[#230b45] border border-purple-700/80 text-purple-200 flex items-center gap-1.5 cursor-pointer shadow-xs transition-all active:scale-95"
                            title="Choisir directement une couleur dans la palette"
                          >
                            <span
                              className="w-3.5 h-3.5 rounded-full border border-white/40 shadow-xs shrink-0 inline-block"
                              style={{ backgroundColor: getColorHex(variant.colorHex, variant.colorName) || '#94a3b8' }}
                            />
                            <Palette className="w-3 h-3 text-orange-400" />
                          </button>

                          {/* Color Palette Popover */}
                          {openColorPickerIndex === index && (
                            <div className="absolute left-0 bottom-full mb-2 z-50 w-64 bg-[#1b0633] border border-purple-500/80 rounded-2xl p-3 shadow-2xl space-y-2.5 animate-in fade-in zoom-in-95">
                              <div className="flex items-center justify-between text-[11px] font-bold text-purple-200 border-b border-purple-800/80 pb-1.5">
                                <span className="flex items-center gap-1 text-orange-300">
                                  <Palette className="w-3.5 h-3.5" /> Nuancier Électroménager & IT
                                </span>
                                <button
                                  type="button"
                                  onClick={() => setOpenColorPickerIndex(null)}
                                  className="text-purple-400 hover:text-white p-0.5 cursor-pointer"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>

                              {/* Preset Colors Grid */}
                              <div className="grid grid-cols-5 gap-1.5 max-h-48 overflow-y-auto pr-0.5">
                                {POPULAR_COLORS.map((c) => {
                                  const currentHex = getColorHex(variant.colorHex, variant.colorName);
                                  const isSelected = currentHex?.toLowerCase() === c.hex.toLowerCase();
                                  const isLight = ['#ffffff', '#fef3c7', '#cbd5e1', '#d97706'].includes(c.hex.toLowerCase());

                                  return (
                                    <button
                                      key={c.name}
                                      type="button"
                                      onClick={() => {
                                        handleVariantChange(index, {
                                          colorHex: c.hex,
                                          colorName: c.name,
                                        });
                                        setOpenColorPickerIndex(null);
                                      }}
                                      className={`group relative flex flex-col items-center p-1 rounded-lg transition-colors cursor-pointer ${
                                        isSelected ? 'bg-orange-500/20 ring-1 ring-orange-400' : 'hover:bg-purple-900/60'
                                      }`}
                                      title={`${c.name} (${c.hex})`}
                                    >
                                      <span
                                        className={`w-6 h-6 rounded-full border shadow-inner group-hover:scale-110 transition-transform flex items-center justify-center ${
                                          c.border ? 'border-slate-300' : 'border-purple-500/50'
                                        }`}
                                        style={{ backgroundColor: c.hex }}
                                      >
                                        {isSelected && (
                                          <Check className={`w-3.5 h-3.5 ${isLight ? 'text-black' : 'text-white'}`} />
                                        )}
                                      </span>
                                      <span className="text-[8px] text-purple-300 truncate w-full text-center mt-0.5 leading-tight">
                                        {c.name.split(' ')[0]}
                                      </span>
                                    </button>
                                  );
                                })}
                              </div>

                              {/* Free color picker & Custom Hex & Custom Color Name */}
                              <div className="pt-2.5 border-t border-purple-800/80 space-y-2">
                                <div className="flex items-center justify-between">
                                  <label className="text-[10px] text-purple-200 flex items-center gap-1 font-bold">
                                    <Pipette className="w-3 h-3 text-orange-400" />
                                    <span>Couleur libre personnalisée :</span>
                                  </label>
                                  <span className="text-[9px] font-mono text-orange-400 bg-purple-950 px-1.5 py-0.5 rounded border border-purple-800">
                                    {getColorHex(variant.colorHex, variant.colorName) || '#94a3b8'}
                                  </span>
                                </div>

                                <div className="space-y-2 bg-[#120324] p-2.5 rounded-xl border border-purple-900">
                                  <div className="flex items-center gap-2">
                                    <div className="relative shrink-0 w-8 h-8 rounded-lg overflow-hidden border border-purple-600 shadow-xs flex items-center justify-center">
                                      <input
                                        type="color"
                                        value={getColorHex(variant.colorHex, variant.colorName) || '#94a3b8'}
                                        onChange={(e) => {
                                          const hexVal = e.target.value;
                                          handleVariantChange(index, {
                                            colorHex: hexVal,
                                            colorName: variant.colorName && variant.colorName !== 'Gris Inox' && variant.colorName !== 'Noir Mat' ? variant.colorName : 'Personnalisée',
                                          });
                                        }}
                                        className="absolute -inset-2 w-12 h-12 cursor-pointer bg-transparent border-0"
                                        title="Cliquer pour ouvrir la pipette chromatique"
                                      />
                                      <span 
                                        className="w-full h-full pointer-events-none"
                                        style={{ backgroundColor: getColorHex(variant.colorHex, variant.colorName) || '#94a3b8' }}
                                      />
                                    </div>

                                    <div className="flex-1 min-w-0">
                                      <input
                                        type="text"
                                        value={variant.colorHex || ''}
                                        onChange={(e) => {
                                          let val = e.target.value;
                                          if (!val.startsWith('#') && val.length > 0) {
                                            val = `#${val}`;
                                          }
                                          handleVariantChange(index, {
                                            colorHex: val,
                                            colorName: variant.colorName || 'Personnalisée',
                                          });
                                        }}
                                        placeholder="#Hex (ex: #E63946)"
                                        className="w-full bg-[#180730] border border-purple-800 text-white font-mono rounded-lg px-2 py-1 text-[11px] focus:outline-none focus:border-orange-500"
                                      />
                                    </div>
                                  </div>

                                  <div>
                                    <label className="block text-[9px] text-purple-300 font-semibold mb-1">
                                      Nom / Libellé de la couleur :
                                    </label>
                                    <input
                                      type="text"
                                      value={variant.colorName || ''}
                                      onChange={(e) => {
                                        const nameVal = e.target.value;
                                        handleVariantChange(index, {
                                          colorName: nameVal,
                                        });
                                      }}
                                      placeholder="ex: Bleu Ciel, Or Brossé, Rose Pâle..."
                                      className="w-full bg-[#180730] border border-purple-800 text-white rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-orange-500"
                                    />
                                  </div>
                                </div>

                                {/* Explicit Validate / Apply Button */}
                                <button
                                  type="button"
                                  onClick={() => {
                                    const currentHex = getColorHex(variant.colorHex, variant.colorName) || '#94a3b8';
                                    const finalName = variant.colorName?.trim() ? variant.colorName.trim() : 'Personnalisée';
                                    handleVariantChange(index, {
                                      colorHex: currentHex,
                                      colorName: finalName,
                                    });
                                    setOpenColorPickerIndex(null);
                                  }}
                                  className="w-full py-1.5 px-3 rounded-xl bg-orange-500 hover:bg-orange-400 text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-md transition-all active:scale-98"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  <span>Valider cette couleur</span>
                                </button>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Free text input to type or edit color name freely */}
                        <input
                          type="text"
                          value={variant.colorName || ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            const detected = getColorHex(undefined, val);
                            handleVariantChange(index, {
                              colorName: val,
                              ...(detected ? { colorHex: detected } : {}),
                            });
                          }}
                          placeholder="ex: Gris Inox, Noir Mat, Blanc..."
                          className="flex-1 min-w-0 bg-[#110421] border border-purple-800 text-white rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-orange-500"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] text-purple-400 mb-0.5">Capacité exacte</label>
                      <input
                        type="text"
                        value={variant.capacity || ''}
                        onChange={(e) => handleVariantChange(index, 'capacity', e.target.value)}
                        placeholder="ex: 450 Litres / 12000 BTU / 55 pouces"
                        className="w-full bg-[#110421] border border-purple-800 text-white rounded-lg px-2 py-1 text-xs"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 4: Technical Specifications */}
          <div className="space-y-4 pt-4 border-t border-purple-900/50">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-orange-400 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4" /> Fiche Technique & Garanties ({specs.length})
                </h3>
                <p className="text-[11px] text-purple-300/70 mt-0.5">
                  Renseignez les détails techniques, garanties et performances visibles par les clients.
                </p>
              </div>

              <button
                type="button"
                onClick={handleAddSpec}
                className="self-start sm:self-auto px-3 py-1.5 rounded-xl bg-purple-900/90 hover:bg-purple-800 text-purple-100 border border-purple-700/80 text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition-all active:scale-95"
              >
                <Plus className="w-3.5 h-3.5 text-orange-400" /> Ajouter une caractéristique
              </button>
            </div>

            {/* Quick Suggestion Chips */}
            <div className="space-y-1.5 bg-[#120324] p-3 rounded-2xl border border-purple-900/70">
              <span className="text-[10px] font-bold text-purple-300 uppercase tracking-wider block">
                Ajout rapide de caractéristiques fréquentes :
              </span>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { key: 'Garantie', val: '24 Mois constructeur' },
                  { key: 'Compresseur / Moteur', val: 'Digital Inverter garanti 10 ans' },
                  { key: 'Climat / Tropicalisé', val: 'Tropicalisé (Spécial Sénégal)' },
                  { key: 'Classe énergétique', val: 'A+++ Haute Efficacité' },
                  { key: 'Alimentation électrique', val: '220-240V / 50Hz' },
                  { key: 'Niveau sonore', val: '38 dB (Très silencieux)' },
                  { key: 'Connectivité', val: 'Smart Wi-Fi / Application' },
                  { key: 'Origine & État', val: 'Matériel Neuf d\'Origine' },
                ].map((sug, sIdx) => (
                  <button
                    key={sIdx}
                    type="button"
                    onClick={() => {
                      const existsIndex = specs.findIndex((s) => s.key.toLowerCase() === sug.key.toLowerCase());
                      if (existsIndex >= 0) {
                        handleSpecChange(existsIndex, 'val', sug.val);
                      } else {
                        setSpecs([...specs, { key: sug.key, val: sug.val }]);
                      }
                    }}
                    className="px-2.5 py-1 rounded-lg bg-[#1a0833] hover:bg-purple-800/80 text-purple-200 hover:text-white border border-purple-800/80 text-[11px] font-medium flex items-center gap-1 cursor-pointer transition-all active:scale-95"
                  >
                    <Plus className="w-2.5 h-2.5 text-orange-400" />
                    <span>{sug.key}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Responsive Specs Cards List */}
            <div className="space-y-3">
              {specs.length === 0 ? (
                <div className="text-center py-6 bg-[#130426] border border-dashed border-purple-900/80 rounded-2xl space-y-2">
                  <p className="text-xs text-purple-300">Aucune spécification technique pour l'instant.</p>
                  <button
                    type="button"
                    onClick={handleAddSpec}
                    className="px-3 py-1.5 bg-orange-500 hover:bg-orange-400 text-white font-bold text-xs rounded-xl inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Ajouter une première ligne
                  </button>
                </div>
              ) : (
                specs.map((spec, index) => (
                  <div
                    key={index}
                    className="bg-[#140428] border border-purple-900/80 hover:border-purple-700/90 rounded-2xl p-3 sm:p-3.5 space-y-2.5 transition-all shadow-xs"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-purple-900/80 text-orange-400 text-[10px] font-black flex items-center justify-center border border-purple-700/60">
                          {index + 1}
                        </span>
                        <span className="text-xs font-bold text-white">
                          {spec.key.trim() ? spec.key : `Spécification #${index + 1}`}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveSpec(index)}
                        className="px-2 py-1 rounded-lg text-rose-400 hover:text-rose-200 hover:bg-rose-950/70 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                        title="Supprimer cette caractéristique"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Supprimer</span>
                      </button>
                    </div>

                    {/* Responsive inputs grid: Stacks on mobile, 2 cols on tablet/desktop */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold text-purple-300">
                          Nom de la Caractéristique
                        </label>
                        <input
                          type="text"
                          value={spec.key}
                          onChange={(e) => handleSpecChange(index, 'key', e.target.value)}
                          placeholder="ex: Garantie, Tension, Puissance, Gaz..."
                          className="w-full bg-[#0d021b] border border-purple-800 text-purple-100 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-orange-500 transition-colors"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold text-purple-300">
                          Valeur / Précision
                        </label>
                        <input
                          type="text"
                          value={spec.val}
                          onChange={(e) => handleSpecChange(index, 'val', e.target.value)}
                          placeholder="ex: 24 Mois, 220V Tropicalisé, A+++..."
                          className="w-full bg-[#0d021b] border border-purple-800 text-white font-semibold rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-orange-500 transition-colors"
                        />
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Bottom Action Buttons */}
          <div className="pt-6 border-t border-purple-900/60 flex items-center justify-end gap-3 sticky bottom-0 bg-[#150727] py-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-purple-950 hover:bg-purple-900 text-purple-300 text-xs font-bold border border-purple-800 transition-colors cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-400 text-white text-xs font-black transition-all shadow-md shadow-orange-500/20 active:scale-98 flex items-center gap-2 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>{productToEdit ? 'Enregistrer les Modifications' : 'Mettre le Produit en Ligne'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
