export interface ProductVariant {
  id: string;
  productId: string;
  sku: string;
  title: string; // e.g. "450 Litres - Gris Inox", "12000 BTU - Inverter"
  colorName?: string;
  colorHex?: string;
  sizeDimensions?: string; // e.g. "178 x 70 x 68 cm"
  height?: string; // e.g. "185 cm"
  capacity?: string; // e.g. "450 L", "18000 BTU", "9 kg", "55 pouces"
  price: number; // in FCFA (XOF)
  originalPrice?: number;
  stockQuantity: number;
  imageUrl?: string;
  isDefault?: boolean;
}

export interface ProductReview {
  id: string;
  productId: string;
  userName: string;
  userCity?: string;
  rating: number; // 1 to 5
  comment?: string;
  createdAt: string;
  verifiedPurchase?: boolean;
  isFeatured?: boolean;
  adminReply?: {
    text: string;
    repliedAt: string;
    repliedBy: string;
  };
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  slug: string;
  brand: string; // Samsung, LG, Hisense, Bosch, TCL, Midea, Beko, Apple, Philips
  category: string; // 'refrigerateurs' | 'climatiseurs' | 'televiseurs' | 'lave-linge' | 'cuisinieres' | 'petits-electromenager' | 'smartphones'
  categoryLabel: string;
  description: string;
  shortDescription: string;
  basePrice: number; // in FCFA
  originalPrice?: number;
  isFeatured?: boolean;
  isNew?: boolean;
  inStock: boolean;
  isOnline?: boolean; // online vs draft/archived
  isHidden?: boolean; // explicitly hidden from catalog and homepage
  imageUrl: string;
  galleryUrls: string[];
  specs: Record<string, string>; // e.g. { "Garantie": "24 Mois", "Classe Énergie": "A+++", "Puissance": "1800W" }
  variants: ProductVariant[];
  rating?: number; // Average rating e.g. 4.8 (only if has reviews)
  reviewCount?: number; // Total number of reviews (0 or undefined if none)
  reviews?: ProductReview[];
  createdAt: string;
  updatedAt?: string;
}

export interface DeliveryZone {
  id: string;
  name: string;
  region: string;
  fee: number; // in FCFA
  estimatedTime: string;
  isCustom?: boolean;
}

export interface AppSettings {
  showroomName: string;
  gerant: string;
  phone1: string;
  phone2: string;
  whatsapp: string;
  address: string;
  city: string;
  openingHours: string;
  ninea: string;
  rc: string;
  googleMapsUrl?: string;
  invoiceLegalNotice: string;
  defaultDakarFee: number;
  defaultRegionFee: number;
  defaultDistanceFee?: number;
  hideDeliveryFees?: boolean; // When true, delivery fee amounts are deactivated/hidden from clients (displayed as "À convenir ultérieurement / Sur devis")
  customRegionFees?: Record<string, number>; // Specific fee per region (e.g. { 'dist-dakar': 5000, 'dist-thies': 3000, ... })
  customLocalZoneFees?: Record<string, number>; // Specific fee per local zone (e.g. { 'nianing-centre': 1000, ... })
  customLocations?: DeliveryZone[]; // Dynamically added regional locations/villes
  customNeighborhoods?: DeliveryZone[]; // Dynamically added local neighborhoods/quartiers/secteurs
  customAdminPin?: string;
  bannerAnnouncement?: string;
}

export type DeliveryType = 'showroom' | 'delivery' | 'distance_delivery';

export type OrderStatus = 'pending_payment' | 'paid' | 'preparing' | 'delivered' | 'cancelled';

export type PaymentMethod = 'cash_on_delivery' | 'wave_orange_money' | 'showroom_cash';

export interface CartItem {
  product: Product;
  selectedVariant: ProductVariant;
  quantity: number;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  variantId?: string;
  productName: string;
  variantTitle: string;
  unitPrice: number; // in FCFA
  quantity: number;
  totalPrice: number;
  productImage: string;
}

export interface Order {
  id: string;
  orderNumber: string; // e.g. "KB-2026-8942"
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  deliveryType: DeliveryType;
  deliveryCity?: string;
  deliveryAddress?: string;
  deliveryNotes?: string;
  subtotal: number;
  deliveryFee: number;
  deliveryFeeToBeAgreed?: boolean; // True if delivery fee is to be determined later with customer
  totalAmount: number; // in FCFA Net
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentValidatedAt?: string;
  paymentValidatedBy?: string;
  adminNotes?: string;
  items: OrderItem[];
  createdAt: string;
  updatedAt: string;
}

export interface FilterState {
  search: string;
  category: string;
  brand: string;
  minPrice: number;
  maxPrice: number;
  inStockOnly: boolean;
  sortBy: 'featured' | 'price_asc' | 'price_desc' | 'newest';
}
