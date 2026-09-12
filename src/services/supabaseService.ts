import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Product, ProductVariant, Order, OrderItem, AppSettings } from '../types';

/**
 * Validates or converts a string ID to a valid UUID format for PostgreSQL UUID columns
 */
function toUuid(id: string): string {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (uuidRegex.test(id)) return id;

  // Fallback: create deterministic UUID-like string from arbitrary ID
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash << 5) - hash + id.charCodeAt(i);
    hash |= 0;
  }
  const hex = Math.abs(hash).toString(16).padStart(8, '0');
  return `00000000-0000-4000-8000-${hex.padEnd(12, '0')}`;
}

/**
 * Transforms Supabase relational product + variants to application Product object
 */
export function mapRowToProduct(row: any): Product {
  const variants: ProductVariant[] = (row.product_variants || []).map((v: any) => ({
    id: v.id,
    productId: v.product_id || row.id,
    sku: v.sku || '',
    title: v.title || '',
    colorName: v.color_name || undefined,
    colorHex: v.color_hex || undefined,
    sizeDimensions: v.size_dimensions || undefined,
    height: v.height || undefined,
    capacity: v.capacity || undefined,
    price: Number(v.price) || 0,
    originalPrice: v.original_price ? Number(v.original_price) : undefined,
    stockQuantity: Number(v.stock_quantity) || 0,
    imageUrl: v.image_url || undefined,
    isDefault: v.is_default ?? false,
  }));

  // Calculate inStock from variants or row
  const totalStock = variants.reduce((sum, v) => sum + v.stockQuantity, 0);

  return {
    id: row.id,
    sku: row.sku || '',
    name: row.name || '',
    slug: row.slug || row.id,
    brand: row.brand || '',
    category: row.category || '',
    categoryLabel: row.category_label || row.category || '',
    description: row.description || '',
    shortDescription: row.short_description || '',
    basePrice: Number(row.base_price) || 0,
    originalPrice: row.original_price ? Number(row.original_price) : undefined,
    isFeatured: row.is_featured ?? false,
    isNew: row.is_new ?? false,
    inStock: variants.length > 0 ? totalStock > 0 : (row.in_stock ?? true),
    imageUrl: row.image_url || '',
    galleryUrls: Array.isArray(row.gallery_urls) ? row.gallery_urls : [],
    specs: typeof row.specs === 'object' && row.specs !== null ? row.specs : {},
    variants,
    createdAt: row.created_at || new Date().toISOString(),
    updatedAt: row.updated_at || new Date().toISOString(),
  };
}

/**
 * Transforms application Product object to Supabase product row
 */
export function mapProductToRow(product: Product): any {
  const row: any = {
    sku: product.sku,
    name: product.name,
    slug: product.slug || product.sku.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    brand: product.brand,
    category: product.category,
    category_label: product.categoryLabel || product.category,
    description: product.description || '',
    short_description: product.shortDescription || '',
    base_price: Math.round(product.basePrice),
    original_price: product.originalPrice ? Math.round(product.originalPrice) : null,
    is_featured: product.isFeatured ?? false,
    is_new: product.isNew ?? false,
    in_stock: product.inStock ?? true,
    image_url: product.imageUrl || '',
    gallery_urls: product.galleryUrls || [],
    specs: product.specs || {},
  };

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (uuidRegex.test(product.id)) {
    row.id = product.id;
  }
  return row;
}

/**
 * Transforms Supabase relational order + order_items to application Order object
 */
export function mapRowToOrder(row: any): Order {
  const items: OrderItem[] = (row.order_items || []).map((it: any) => ({
    id: it.id,
    orderId: it.order_id || row.id,
    productId: it.product_id || '',
    variantId: it.variant_id || undefined,
    productName: it.product_name || '',
    variantTitle: it.variant_title || '',
    unitPrice: Number(it.unit_price) || 0,
    quantity: Number(it.quantity) || 1,
    totalPrice: Number(it.total_price) || 0,
    productImage: it.product_image || '',
  }));

  return {
    id: row.id,
    orderNumber: row.order_number,
    customerName: row.customer_name,
    customerPhone: row.customer_phone,
    customerEmail: row.customer_email || undefined,
    deliveryType: row.delivery_type || 'showroom',
    deliveryCity: row.delivery_city || undefined,
    deliveryAddress: row.delivery_address || undefined,
    deliveryNotes: row.delivery_notes || undefined,
    subtotal: Number(row.subtotal) || 0,
    deliveryFee: Number(row.delivery_fee) || 0,
    totalAmount: Number(row.total_amount) || 0,
    status: row.status || 'pending_payment',
    paymentMethod: row.payment_method || 'cash_on_delivery',
    paymentValidatedAt: row.payment_validated_at || undefined,
    paymentValidatedBy: row.payment_validated_by || undefined,
    adminNotes: row.admin_notes || undefined,
    items,
    createdAt: row.created_at || new Date().toISOString(),
    updatedAt: row.updated_at || new Date().toISOString(),
  };
}

/**
 * Transforms application Order object to Supabase order row
 */
export function mapOrderToRow(order: Order): any {
  const row: any = {
    order_number: order.orderNumber,
    customer_name: order.customerName,
    customer_phone: order.customerPhone,
    customer_email: order.customerEmail || null,
    delivery_type: order.deliveryType === 'delivery' ? 'delivery' : 'showroom',
    delivery_city: order.deliveryCity || null,
    delivery_address: order.deliveryAddress || null,
    delivery_notes: order.deliveryNotes || null,
    subtotal: Math.round(order.subtotal || 0),
    delivery_fee: Math.round(order.deliveryFee || 0),
    total_amount: Math.round(order.totalAmount || 0),
    status: order.status || 'pending_payment',
    payment_method: order.paymentMethod || 'cash_on_delivery',
    payment_validated_at: order.paymentValidatedAt || null,
    payment_validated_by: order.paymentValidatedBy || null,
    admin_notes: order.adminNotes || null,
  };

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (uuidRegex.test(order.id)) {
    row.id = order.id;
  }
  return row;
}

/**
 * Transforms Supabase settings row to AppSettings
 */
export function mapRowToSettings(row: any): AppSettings {
  return {
    showroomName: row.showroom_name || 'Khelcom Business',
    gerant: row.gerant || 'Direction Khelcom Business',
    phone1: row.phone1 || '+221 77 000 00 00',
    phone2: row.phone2 || '',
    whatsapp: row.whatsapp || '+221 77 000 00 00',
    address: row.address || 'Nianing, Sénégal',
    city: row.city || 'Nianing',
    openingHours: row.opening_hours || 'Lun - Sam : 08h30 - 20h30',
    ninea: row.ninea || '',
    rc: row.rc || '',
    googleMapsUrl: row.google_maps_url || '',
    invoiceLegalNotice: row.invoice_legal_notice || '',
    defaultDakarFee: Number(row.default_dakar_fee) || 1000,
    defaultRegionFee: Number(row.default_region_fee) || 8000,
    defaultDistanceFee: Number(row.default_distance_fee) || 5000,
    hideDeliveryFees: row.hide_delivery_fees ?? false,
    customRegionFees: row.custom_region_fees || {},
    customLocalZoneFees: row.custom_local_zone_fees || {},
    bannerAnnouncement: row.banner_announcement || '',
  };
}

export const SupabaseService = {
  isAvailable(): boolean {
    return isSupabaseConfigured() && supabase !== null;
  },

  // -------------------------------------------------------------
  // PRODUCTS & VARIANTS
  // -------------------------------------------------------------
  async fetchProducts(): Promise<Product[] | null> {
    if (!this.isAvailable() || !supabase) return null;
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          product_variants (*)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('[Supabase] Error fetching products:', error.message);
        return null;
      }
      return (data || []).map(mapRowToProduct);
    } catch (e) {
      console.warn('[Supabase] Exception fetching products:', e);
      return null;
    }
  },

  async upsertProduct(product: Product): Promise<boolean> {
    if (!this.isAvailable() || !supabase) return false;
    try {
      const productRow = mapProductToRow(product);

      // 1. Upsert product row
      const { data: savedProduct, error: prodError } = await supabase
        .from('products')
        .upsert(productRow, { onConflict: 'sku' })
        .select('id')
        .single();

      if (prodError || !savedProduct) {
        console.error('[Supabase] Error saving product:', prodError?.message);
        return false;
      }

      const productId = savedProduct.id;

      // 2. Upsert associated variants
      if (Array.isArray(product.variants) && product.variants.length > 0) {
        const variantRows = product.variants.map((v) => ({
          product_id: productId,
          sku: v.sku || `${product.sku}-${Math.random().toString(36).substring(2, 6)}`,
          title: v.title,
          color_name: v.colorName || null,
          color_hex: v.colorHex || null,
          size_dimensions: v.sizeDimensions || null,
          height: v.height || null,
          capacity: v.capacity || null,
          price: Math.round(v.price),
          original_price: v.originalPrice ? Math.round(v.originalPrice) : null,
          stock_quantity: Math.max(0, Math.floor(v.stockQuantity || 0)),
          image_url: v.imageUrl || null,
          is_default: v.isDefault ?? false,
        }));

        const { error: varError } = await supabase
          .from('product_variants')
          .upsert(variantRows, { onConflict: 'sku' });

        if (varError) {
          console.warn('[Supabase] Error upserting variants:', varError.message);
        }
      }

      return true;
    } catch (e) {
      console.error('[Supabase] Exception upserting product & variants:', e);
      return false;
    }
  },

  async deleteProduct(productId: string): Promise<boolean> {
    if (!this.isAvailable() || !supabase) return false;
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);

      if (error) {
        console.error('[Supabase] Error deleting product:', error.message);
        return false;
      }
      return true;
    } catch (e) {
      console.error('[Supabase] Exception deleting product:', e);
      return false;
    }
  },

  // -------------------------------------------------------------
  // ORDERS & ORDER ITEMS
  // -------------------------------------------------------------
  async fetchOrders(): Promise<Order[] | null> {
    if (!this.isAvailable() || !supabase) return null;
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (*)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('[Supabase] Error fetching orders:', error.message);
        return null;
      }
      return (data || []).map(mapRowToOrder);
    } catch (e) {
      console.warn('[Supabase] Exception fetching orders:', e);
      return null;
    }
  },

  async insertOrder(order: Order): Promise<boolean> {
    if (!this.isAvailable() || !supabase) return false;
    try {
      const orderRow = mapOrderToRow(order);

      // 1. Insert order
      const { data: savedOrder, error: orderError } = await supabase
        .from('orders')
        .upsert(orderRow, { onConflict: 'order_number' })
        .select('id')
        .single();

      if (orderError || !savedOrder) {
        console.error('[Supabase] Error inserting order:', orderError?.message);
        return false;
      }

      const orderId = savedOrder.id;

      // 2. Insert order items
      if (Array.isArray(order.items) && order.items.length > 0) {
        const itemRows = order.items.map((it) => {
          const itemRow: any = {
            order_id: orderId,
            product_name: it.productName,
            variant_title: it.variantTitle,
            unit_price: Math.round(it.unitPrice),
            quantity: Math.max(1, it.quantity),
            total_price: Math.round(it.totalPrice),
            product_image: it.productImage || null,
          };

          const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
          if (it.productId && uuidRegex.test(it.productId)) {
            itemRow.product_id = it.productId;
          }
          if (it.variantId && uuidRegex.test(it.variantId)) {
            itemRow.variant_id = it.variantId;
          }

          return itemRow;
        });

        const { error: itemsError } = await supabase
          .from('order_items')
          .insert(itemRows);

        if (itemsError) {
          console.warn('[Supabase] Error inserting order items:', itemsError.message);
        }
      }

      return true;
    } catch (e) {
      console.error('[Supabase] Exception inserting order:', e);
      return false;
    }
  },

  async updateOrderStatus(orderId: string, status: Order['status'], updates?: Partial<Order>): Promise<boolean> {
    if (!this.isAvailable() || !supabase) return false;
    try {
      const payload: any = {
        status,
        updated_at: new Date().toISOString(),
      };
      if (updates?.paymentValidatedAt) payload.payment_validated_at = updates.paymentValidatedAt;
      if (updates?.paymentValidatedBy) payload.payment_validated_by = updates.paymentValidatedBy;
      if (updates?.adminNotes) payload.admin_notes = updates.adminNotes;

      const { error } = await supabase
        .from('orders')
        .update(payload)
        .eq('id', orderId);

      if (error) {
        console.error('[Supabase] Error updating order status:', error.message);
        return false;
      }
      return true;
    } catch (e) {
      console.error('[Supabase] Exception updating order status:', e);
      return false;
    }
  },

  async deleteOrder(orderId: string): Promise<boolean> {
    if (!this.isAvailable() || !supabase) return false;
    try {
      const { error } = await supabase
        .from('orders')
        .delete()
        .eq('id', orderId);

      if (error) {
        console.error('[Supabase] Error deleting order:', error.message);
        return false;
      }
      return true;
    } catch (e) {
      console.error('[Supabase] Exception deleting order:', e);
      return false;
    }
  },

  // -------------------------------------------------------------
  // SETTINGS
  // -------------------------------------------------------------
  async fetchSettings(): Promise<AppSettings | null> {
    if (!this.isAvailable() || !supabase) return null;
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('*')
        .eq('id', 'app_settings')
        .maybeSingle();

      if (error || !data) return null;
      return mapRowToSettings(data);
    } catch (e) {
      console.warn('[Supabase] Exception fetching settings:', e);
      return null;
    }
  },

  async saveSettings(settings: AppSettings): Promise<boolean> {
    if (!this.isAvailable() || !supabase) return false;
    try {
      const { error } = await supabase
        .from('settings')
        .upsert({
          id: 'app_settings',
          showroom_name: settings.showroomName,
          gerant: settings.gerant,
          phone1: settings.phone1,
          phone2: settings.phone2,
          whatsapp: settings.whatsapp,
          address: settings.address,
          city: settings.city,
          opening_hours: settings.openingHours,
          ninea: settings.ninea,
          rc: settings.rc,
          google_maps_url: settings.googleMapsUrl,
          invoice_legal_notice: settings.invoiceLegalNotice,
          default_dakar_fee: settings.defaultDakarFee,
          default_region_fee: settings.defaultRegionFee,
          default_distance_fee: settings.defaultDistanceFee,
          hide_delivery_fees: settings.hideDeliveryFees,
          custom_region_fees: settings.customRegionFees,
          custom_local_zone_fees: settings.customLocalZoneFees,
          banner_announcement: settings.bannerAnnouncement,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'id' });

      if (error) {
        console.error('[Supabase] Error saving settings:', error.message);
        return false;
      }
      return true;
    } catch (e) {
      console.error('[Supabase] Exception saving settings:', e);
      return false;
    }
  },

  async fetchBrands(): Promise<string[] | null> {
    if (!this.isAvailable() || !supabase) return null;
    try {
      const { data, error } = await supabase
        .from('products')
        .select('brand');

      if (error || !data) return null;
      const brands = Array.from(new Set(data.map((p) => p.brand).filter(Boolean)));
      return brands.length > 0 ? brands : null;
    } catch (e) {
      return null;
    }
  },

  // -------------------------------------------------------------
  // REALTIME SUBSCRIPTIONS
  // -------------------------------------------------------------
  subscribeToProducts(onChange: (products: Product[]) => void): () => void {
    if (!this.isAvailable() || !supabase) return () => {};
    
    const channel = supabase
      .channel('public:products_variants')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, async () => {
        const fresh = await this.fetchProducts();
        if (fresh) onChange(fresh);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'product_variants' }, async () => {
        const fresh = await this.fetchProducts();
        if (fresh) onChange(fresh);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },

  subscribeToOrders(onChange: (orders: Order[]) => void): () => void {
    if (!this.isAvailable() || !supabase) return () => {};

    const channel = supabase
      .channel('public:orders_items')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, async () => {
        const fresh = await this.fetchOrders();
        if (fresh) onChange(fresh);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'order_items' }, async () => {
        const fresh = await this.fetchOrders();
        if (fresh) onChange(fresh);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }
};
