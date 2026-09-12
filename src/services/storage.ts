import { Order, Product, CartItem, AppSettings, OrderItem, ProductReview } from '../types';
import { INITIAL_PRODUCTS, BRANDS as DEFAULT_BRANDS } from '../data/mockProducts';
import { SHOWROOM_INFO } from '../data/senegalLocations';
import { SupabaseService } from './supabaseService';

const STORAGE_KEYS = {
  PRODUCTS: 'khelcom_products_v4',
  ORDERS: 'khelcom_orders_v4',
  CART: 'khelcom_cart_v4',
  ADMIN_AUTH: 'khelcom_admin_auth_v1',
  SETTINGS: 'khelcom_settings_v1',
  ADMIN_PIN: 'khelcom_admin_pin_v1',
  BRANDS: 'khelcom_brands_v2',
  LAST_TRACKED: 'khelcom_last_tracked_orders_v4',
};

const DEFAULT_SETTINGS: AppSettings = {
  showroomName: SHOWROOM_INFO.name,
  gerant: 'Direction Khelcom Business',
  phone1: SHOWROOM_INFO.phone1,
  phone2: SHOWROOM_INFO.phone2,
  whatsapp: SHOWROOM_INFO.whatsapp,
  address: SHOWROOM_INFO.address,
  city: SHOWROOM_INFO.city,
  openingHours: SHOWROOM_INFO.openingHours,
  ninea: SHOWROOM_INFO.ninea,
  rc: SHOWROOM_INFO.rc,
  googleMapsUrl: SHOWROOM_INFO.googleMapsUrl,
  invoiceLegalNotice: 'Régime sans TVA - Vente d\'électroménager & électronique sous garantie constructeur.',
  defaultDakarFee: 1000,
  defaultRegionFee: 8000,
  defaultDistanceFee: 5000,
  hideDeliveryFees: false,
  customRegionFees: {},
  customLocalZoneFees: {},
  bannerAnnouncement: '🔥 Arrivage Récent Électroménager & Smartphones Haut de Gamme à Prix Direct Dépôt !',
};

const SEED_ORDERS: Order[] = [];

export const StorageService = {
  // PRODUCTS
  getProducts(): Product[] {
    try {
      // Clear all legacy storage keys
      ['khelcom_products_v1', 'khelcom_products_v2', 'khelcom_products_v3', 'khelcom_orders_v1', 'khelcom_orders_v2', 'khelcom_orders_v3'].forEach(k => {
        try { localStorage.removeItem(k); } catch {}
      });

      const data = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
      if (data === null) {
        localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify([]));
        return [];
      }
      const parsed = JSON.parse(data);
      if (!Array.isArray(parsed)) return [];
      // If legacy mock products are found in current storage, clear them
      if (parsed.some(p => p.id?.startsWith('prod-magsafe') || p.id?.startsWith('prod-00'))) {
        localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify([]));
        return [];
      }
      return parsed;
    } catch {
      return [];
    }
  },

  saveProducts(products: Product[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
      if (SupabaseService.isAvailable()) {
        products.forEach((p) => {
          SupabaseService.upsertProduct(p).catch((err) =>
            console.warn('[StorageService] Error syncing product to Supabase:', err)
          );
        });
      }
    } catch (e) {
      console.error('Error saving products to storage', e);
    }
  },

  getProductById(id: string): Product | undefined {
    const products = this.getProducts();
    return products.find((p) => p.id === id);
  },

  // RATINGS & REVIEWS
  addProductReview(
    productId: string,
    reviewData: { userName: string; rating: number; comment?: string }
  ): { success: boolean; product?: Product; review?: ProductReview; error?: string } {
    try {
      const products = this.getProducts();
      const productIndex = products.findIndex((p) => p.id === productId);
      if (productIndex === -1) {
        return { success: false, error: 'Produit introuvable' };
      }

      const product = { ...products[productIndex] };
      const currentReviews: ProductReview[] = Array.isArray(product.reviews)
        ? [...product.reviews]
        : [];

      const newReview: ProductReview = {
        id: `rev-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        productId,
        userName: reviewData.userName.trim() || 'Client Vérifié',
        userCity: (reviewData as any).userCity || undefined,
        rating: Math.min(5, Math.max(1, reviewData.rating)),
        comment: reviewData.comment?.trim() || undefined,
        verifiedPurchase: (reviewData as any).verifiedPurchase ?? true,
        createdAt: (reviewData as any).createdAt || new Date().toISOString(),
      };

      currentReviews.unshift(newReview);

      const totalRating = currentReviews.reduce((sum, r) => sum + r.rating, 0);
      const avgRating = Number((totalRating / currentReviews.length).toFixed(1));

      product.reviews = currentReviews;
      product.reviewCount = currentReviews.length;
      product.rating = avgRating;
      product.updatedAt = new Date().toISOString();

      products[productIndex] = product;
      this.saveProducts(products);

      return { success: true, product, review: newReview };
    } catch (err) {
      console.error('Error adding product review', err);
      return { success: false, error: 'Erreur lors de l\'enregistrement de votre avis.' };
    }
  },

  getAllReviews(): {
    review: ProductReview;
    productId: string;
    productName: string;
    productBrand: string;
    productCategory: string;
    productSku: string;
    productImage: string;
  }[] {
    const products = this.getProducts();
    const all: {
      review: ProductReview;
      productId: string;
      productName: string;
      productBrand: string;
      productCategory: string;
      productSku: string;
      productImage: string;
    }[] = [];

    products.forEach((p) => {
      if (Array.isArray(p.reviews)) {
        p.reviews.forEach((r) => {
          all.push({
            review: r,
            productId: p.id,
            productName: p.name,
            productBrand: p.brand,
            productCategory: p.categoryLabel || p.category,
            productSku: p.sku,
            productImage: p.imageUrl,
          });
        });
      }
    });

    return all.sort((a, b) => new Date(b.review.createdAt).getTime() - new Date(a.review.createdAt).getTime());
  },

  deleteProductReview(productId: string, reviewId: string): { success: boolean; product?: Product; products?: Product[] } {
    try {
      const products = this.getProducts();
      const productIndex = products.findIndex((p) => p.id === productId);
      if (productIndex === -1) return { success: false };

      const product = { ...products[productIndex] };
      const currentReviews: ProductReview[] = (product.reviews || []).filter((r) => r.id !== reviewId);

      if (currentReviews.length > 0) {
        const totalRating = currentReviews.reduce((sum, r) => sum + r.rating, 0);
        product.rating = Number((totalRating / currentReviews.length).toFixed(1));
        product.reviewCount = currentReviews.length;
      } else {
        product.rating = undefined;
        product.reviewCount = 0;
      }
      product.reviews = currentReviews;
      product.updatedAt = new Date().toISOString();

      products[productIndex] = product;
      this.saveProducts(products);
      return { success: true, product, products };
    } catch (err) {
      console.error('Error deleting review', err);
      return { success: false };
    }
  },

  replyToProductReview(
    productId: string,
    reviewId: string,
    replyText: string,
    repliedBy: string = 'Direction Khelcom'
  ): { success: boolean; product?: Product; products?: Product[] } {
    try {
      const products = this.getProducts();
      const productIndex = products.findIndex((p) => p.id === productId);
      if (productIndex === -1) return { success: false };

      const product = { ...products[productIndex] };
      const currentReviews = (product.reviews || []).map((r) => {
        if (r.id === reviewId) {
          return {
            ...r,
            adminReply: replyText.trim()
              ? {
                  text: replyText.trim(),
                  repliedAt: new Date().toISOString(),
                  repliedBy,
                }
              : undefined,
          };
        }
        return r;
      });

      product.reviews = currentReviews;
      product.updatedAt = new Date().toISOString();
      products[productIndex] = product;
      this.saveProducts(products);
      return { success: true, product, products };
    } catch (err) {
      console.error('Error replying to review', err);
      return { success: false };
    }
  },

  toggleFeatureReview(productId: string, reviewId: string): { success: boolean; product?: Product; products?: Product[] } {
    try {
      const products = this.getProducts();
      const productIndex = products.findIndex((p) => p.id === productId);
      if (productIndex === -1) return { success: false };

      const product = { ...products[productIndex] };
      const currentReviews = (product.reviews || []).map((r) => {
        if (r.id === reviewId) {
          return {
            ...r,
            isFeatured: !r.isFeatured,
          };
        }
        return r;
      });

      product.reviews = currentReviews;
      product.updatedAt = new Date().toISOString();
      products[productIndex] = product;
      this.saveProducts(products);
      return { success: true, product, products };
    } catch (err) {
      console.error('Error toggling feature review', err);
      return { success: false };
    }
  },

  getProductReviews(productId: string): ProductReview[] {
    const product = this.getProductById(productId);
    return product?.reviews || [];
  },

  // STOCK MANAGEMENT
  getVariantLiveStock(productId: string, variantId: string): number {
    const product = this.getProductById(productId);
    if (!product) return 0;
    const variant = product.variants.find((v) => v.id === variantId);
    if (!variant) return 0;
    return Number(variant.stockQuantity) || 0;
  },

  verifyCartStock(cart: CartItem[]): {
    isValid: boolean;
    issues: {
      item: CartItem;
      requested: number;
      available: number;
      reason: 'out_of_stock' | 'insufficient_stock';
    }[];
  } {
    const products = this.getProducts();
    const issues: {
      item: CartItem;
      requested: number;
      available: number;
      reason: 'out_of_stock' | 'insufficient_stock';
    }[] = [];

    cart.forEach((cartItem) => {
      const product = products.find((p) => p.id === cartItem.product.id);
      if (!product) {
        issues.push({
          item: cartItem,
          requested: cartItem.quantity,
          available: 0,
          reason: 'out_of_stock',
        });
        return;
      }

      const variant = product.variants.find((v) => v.id === cartItem.selectedVariant.id);
      const available = variant ? Number(variant.stockQuantity) || 0 : 0;

      if (available <= 0) {
        issues.push({
          item: cartItem,
          requested: cartItem.quantity,
          available: 0,
          reason: 'out_of_stock',
        });
      } else if (cartItem.quantity > available) {
        issues.push({
          item: cartItem,
          requested: cartItem.quantity,
          available,
          reason: 'insufficient_stock',
        });
      }
    });

    return {
      isValid: issues.length === 0,
      issues,
    };
  },

  deductOrderStock(orderItems: OrderItem[]): {
    success: boolean;
    updatedProducts: Product[];
    errors?: string[];
  } {
    const products = this.getProducts();
    const errors: string[] = [];

    // Verify first
    for (const item of orderItems) {
      if (!item.productId) continue;
      const product = products.find((p) => p.id === item.productId);
      if (!product) {
        errors.push(`Produit "${item.productName}" introuvable.`);
        continue;
      }
      if (item.variantId) {
        const variant = product.variants.find((v) => v.id === item.variantId);
        const currentStock = variant ? Number(variant.stockQuantity) || 0 : 0;
        if (currentStock < item.quantity) {
          errors.push(
            `Stock insuffisant pour "${item.productName} (${item.variantTitle})": demandé ${item.quantity}, disponible ${currentStock}.`
          );
        }
      }
    }

    // Deduct stock
    const updatedProducts = products.map((product) => {
      const matchedItems = orderItems.filter((it) => it.productId === product.id);
      if (matchedItems.length === 0) return product;

      const updatedVariants = product.variants.map((variant) => {
        const matchedVariantItem = matchedItems.find((it) => it.variantId === variant.id);
        if (!matchedVariantItem) return variant;

        const currentStock = Number(variant.stockQuantity) || 0;
        const newStock = Math.max(0, currentStock - matchedVariantItem.quantity);
        return {
          ...variant,
          stockQuantity: newStock,
        };
      });

      // Recalculate total available stock across variants
      const totalStock = updatedVariants.reduce((sum, v) => sum + (Number(v.stockQuantity) || 0), 0);

      return {
        ...product,
        variants: updatedVariants,
        inStock: totalStock > 0,
        updatedAt: new Date().toISOString(),
      };
    });

    this.saveProducts(updatedProducts);
    return {
      success: errors.length === 0,
      updatedProducts,
      errors: errors.length > 0 ? errors : undefined,
    };
  },

  restoreOrderStock(orderItems: OrderItem[]): Product[] {
    const products = this.getProducts();
    const updatedProducts = products.map((product) => {
      const matchedItems = orderItems.filter((it) => it.productId === product.id);
      if (matchedItems.length === 0) return product;

      const updatedVariants = product.variants.map((variant) => {
        const matchedVariantItem = matchedItems.find((it) => it.variantId === variant.id);
        if (!matchedVariantItem) return variant;

        const currentStock = Number(variant.stockQuantity) || 0;
        const newStock = currentStock + matchedVariantItem.quantity;
        return {
          ...variant,
          stockQuantity: newStock,
        };
      });

      const totalStock = updatedVariants.reduce((sum, v) => sum + (Number(v.stockQuantity) || 0), 0);

      return {
        ...product,
        variants: updatedVariants,
        inStock: totalStock > 0,
        updatedAt: new Date().toISOString(),
      };
    });

    this.saveProducts(updatedProducts);
    return updatedProducts;
  },

  updateVariantStock(productId: string, variantId: string, newStock: number): Product[] {
    const products = this.getProducts();
    const cleanStock = Math.max(0, Math.floor(Number(newStock) || 0));

    const updatedProducts = products.map((product) => {
      if (product.id !== productId) return product;

      const updatedVariants = product.variants.map((v) => {
        if (v.id === variantId) {
          return {
            ...v,
            stockQuantity: cleanStock,
          };
        }
        return v;
      });

      const totalStock = updatedVariants.reduce((sum, v) => sum + (Number(v.stockQuantity) || 0), 0);

      return {
        ...product,
        variants: updatedVariants,
        inStock: totalStock > 0,
        updatedAt: new Date().toISOString(),
      };
    });

    this.saveProducts(updatedProducts);
    return updatedProducts;
  },

  // ORDERS
  getOrders(): Order[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.ORDERS);
      if (data === null) {
        localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify([]));
        return [];
      }
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  },

  saveOrder(order: Order): Order[] {
    const orders = this.getOrders();
    const index = orders.findIndex((o) => o.id === order.id);
    let updated: Order[];
    const now = new Date().toISOString();

    if (index > -1) {
      updated = [...orders];
      updated[index] = {
        ...order,
        updatedAt: now,
      };
    } else {
      updated = [
        {
          ...order,
          createdAt: order.createdAt || now,
          updatedAt: now,
        },
        ...orders,
      ];
    }

    try {
      localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(updated));
      if (order.orderNumber) {
        this.addRecentTrackedOrderNumber(order.orderNumber);
      }
      if (SupabaseService.isAvailable()) {
        SupabaseService.insertOrder(order).catch((err) =>
          console.warn('[StorageService] Error syncing order to Supabase:', err)
        );
      }
    } catch (e) {
      console.error('Error saving order', e);
    }
    return updated;
  },

  updateOrderStatus(
    orderId: string,
    status: Order['status'],
    options?: { paymentValidated?: boolean; adminNotes?: string; validatedBy?: string }
  ): Order | null {
    const orders = this.getOrders();
    const index = orders.findIndex((o) => o.id === orderId);
    if (index === -1) return null;

    const now = new Date().toISOString();
    const updatedOrder: Order = {
      ...orders[index],
      status,
      updatedAt: now,
      ...(options?.paymentValidated && {
        paymentValidatedAt: now,
        paymentValidatedBy: options.validatedBy || 'Admin Khelcom',
      }),
      ...(options?.adminNotes && {
        adminNotes: options.adminNotes,
      }),
    };

    orders[index] = updatedOrder;
    try {
      localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
      if (SupabaseService.isAvailable()) {
        SupabaseService.updateOrderStatus(orderId, status, {
          paymentValidatedAt: updatedOrder.paymentValidatedAt,
          paymentValidatedBy: updatedOrder.paymentValidatedBy,
          adminNotes: updatedOrder.adminNotes,
        }).catch((err) =>
          console.warn('[StorageService] Error syncing order status to Supabase:', err)
        );
      }
    } catch (e) {
      console.error('Error updating order', e);
    }
    return updatedOrder;
  },

  deleteOrder(orderId: string): Order[] {
    const orders = this.getOrders();
    const updated = orders.filter((o) => o.id !== orderId);
    try {
      localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(updated));
      if (SupabaseService.isAvailable()) {
        SupabaseService.deleteOrder(orderId).catch((err) =>
          console.warn('[StorageService] Error deleting order in Supabase:', err)
        );
      }
    } catch (e) {
      console.error('Error deleting order', e);
    }
    return updated;
  },

  getRecentTrackedOrderNumbers(): string[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.LAST_TRACKED);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  addRecentTrackedOrderNumber(orderNumber: string): void {
    if (!orderNumber || !orderNumber.trim()) return;
    try {
      const clean = orderNumber.trim().toUpperCase();
      const current = this.getRecentTrackedOrderNumbers();
      const filtered = current.filter((n) => n.toUpperCase() !== clean);
      const updated = [clean, ...filtered].slice(0, 5);
      localStorage.setItem(STORAGE_KEYS.LAST_TRACKED, JSON.stringify(updated));
    } catch (e) {
      console.error('Error saving recent tracked order', e);
    }
  },

  findOrdersByPhone(phone: string): Order[] {
    const rawDigits = phone.replace(/\D/g, '');
    if (!rawDigits || rawDigits.length < 4) return [];

    // Strip Senegal prefix 221 or 00221 if present
    let localDigits = rawDigits;
    if (localDigits.startsWith('00221')) {
      localDigits = localDigits.substring(5);
    } else if (localDigits.startsWith('221') && localDigits.length > 9) {
      localDigits = localDigits.substring(3);
    }

    const orders = this.getOrders();
    return orders.filter((o) => {
      const orderDigits = o.customerPhone.replace(/\D/g, '');
      let orderLocal = orderDigits;
      if (orderLocal.startsWith('00221')) {
        orderLocal = orderLocal.substring(5);
      } else if (orderLocal.startsWith('221') && orderLocal.length > 9) {
        orderLocal = orderLocal.substring(3);
      }

      return (
        orderDigits.includes(rawDigits) ||
        rawDigits.includes(orderDigits) ||
        (localDigits.length >= 6 && orderLocal.includes(localDigits)) ||
        (orderLocal.length >= 6 && localDigits.includes(orderLocal))
      );
    });
  },

  findOrderByNumber(orderNumber: string): Order | undefined {
    if (!orderNumber || !orderNumber.trim()) return undefined;
    const raw = orderNumber.trim().toUpperCase().replace(/^[#№N°\s]+/, '');
    const cleanSearch = raw.replace(/[^A-Z0-9]/g, '');
    const orders = this.getOrders();

    // 1. Exact match on orderNumber or id
    const exact = orders.find(
      (o) =>
        o.orderNumber.toUpperCase() === raw ||
        o.id.toUpperCase() === raw ||
        o.orderNumber.toUpperCase().replace(/[^A-Z0-9]/g, '') === cleanSearch
    );
    if (exact) return exact;

    // 2. Partial suffix match (e.g. searching '1042' matches 'KB-2026-1042')
    const partialMatch = orders.find((o) => {
      const oClean = o.orderNumber.toUpperCase().replace(/[^A-Z0-9]/g, '');
      return (
        oClean.endsWith(cleanSearch) ||
        oClean.includes(cleanSearch) ||
        o.id.toUpperCase().includes(raw)
      );
    });

    return partialMatch;
  },

  searchOrders(query: string): Order[] {
    if (!query || !query.trim()) return [];
    const trimmed = query.trim();
    const cleanUpper = trimmed.toUpperCase().replace(/^[#№N°\s]+/, '');
    const cleanAlphanumeric = cleanUpper.replace(/[^A-Z0-9]/g, '');
    const digitsOnly = trimmed.replace(/\D/g, '');

    const orders = this.getOrders();
    const matchedMap = new Map<string, Order>();

    // 1. Check order number or ID exact or partial match
    orders.forEach((o) => {
      const oNumUpper = o.orderNumber.toUpperCase();
      const oNumClean = oNumUpper.replace(/[^A-Z0-9]/g, '');
      const oIdUpper = o.id.toUpperCase();

      if (
        oNumUpper === cleanUpper ||
        oIdUpper === cleanUpper ||
        oNumClean === cleanAlphanumeric ||
        (cleanAlphanumeric.length >= 3 && oNumClean.includes(cleanAlphanumeric)) ||
        (cleanUpper.length >= 3 && oIdUpper.includes(cleanUpper))
      ) {
        matchedMap.set(o.id, o);
      }
    });

    // 2. Check customer phone
    if (digitsOnly.length >= 4) {
      let searchPhoneLocal = digitsOnly;
      if (searchPhoneLocal.startsWith('00221')) {
        searchPhoneLocal = searchPhoneLocal.substring(5);
      } else if (searchPhoneLocal.startsWith('221') && searchPhoneLocal.length > 9) {
        searchPhoneLocal = searchPhoneLocal.substring(3);
      }

      orders.forEach((o) => {
        const orderDigits = o.customerPhone.replace(/\D/g, '');
        let orderLocal = orderDigits;
        if (orderLocal.startsWith('00221')) {
          orderLocal = orderLocal.substring(5);
        } else if (orderLocal.startsWith('221') && orderLocal.length > 9) {
          orderLocal = orderLocal.substring(3);
        }

        if (
          orderDigits.includes(digitsOnly) ||
          digitsOnly.includes(orderDigits) ||
          (searchPhoneLocal.length >= 6 && orderLocal.includes(searchPhoneLocal)) ||
          (orderLocal.length >= 6 && searchPhoneLocal.includes(orderLocal))
        ) {
          matchedMap.set(o.id, o);
        }
      });
    }

    // 3. Check customer name and email (substring, case insensitive)
    const lowerQuery = trimmed.toLowerCase();
    if (lowerQuery.length >= 3) {
      orders.forEach((o) => {
        if (
          o.customerName.toLowerCase().includes(lowerQuery) ||
          (o.customerEmail && o.customerEmail.toLowerCase().includes(lowerQuery)) ||
          (o.deliveryCity && o.deliveryCity.toLowerCase().includes(lowerQuery))
        ) {
          matchedMap.set(o.id, o);
        }
      });
    }

    const results = Array.from(matchedMap.values());
    return results.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  },

  // CART
  getCart(): CartItem[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CART);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  saveCart(cart: CartItem[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.CART, JSON.stringify(cart));
    } catch (e) {
      console.error('Error saving cart', e);
    }
  },

  clearCart(): void {
    try {
      localStorage.removeItem(STORAGE_KEYS.CART);
    } catch (e) {
      console.error('Error clearing cart', e);
    }
  },

  // PRODUCT CRUD OPERATIONS
  upsertProduct(product: Product): Product[] {
    const products = this.getProducts();
    const existingIndex = products.findIndex((p) => p.id === product.id);
    let updated: Product[];

    if (existingIndex > -1) {
      updated = [...products];
      updated[existingIndex] = {
        ...product,
        isHidden: product.isHidden ?? false,
        updatedAt: new Date().toISOString(),
      };
    } else {
      updated = [
        {
          ...product,
          createdAt: product.createdAt || new Date().toISOString(),
          isOnline: product.isOnline !== undefined ? product.isOnline : true,
          isHidden: product.isHidden ?? false,
        },
        ...products,
      ];
    }

    this.saveProducts(updated);
    return updated;
  },

  deleteProduct(productId: string): Product[] {
    const products = this.getProducts();
    const updated = products.filter((p) => p.id !== productId);
    this.saveProducts(updated);
    if (SupabaseService.isAvailable()) {
      SupabaseService.deleteProduct(productId).catch((err) =>
        console.warn('[StorageService] Error deleting product from Supabase:', err)
      );
    }
    return updated;
  },

  toggleProductHidden(productId: string): Product[] {
    const products = this.getProducts();
    const updated = products.map((p) => {
      if (p.id === productId) {
        const currentHidden = p.isHidden === true;
        return {
          ...p,
          isHidden: !currentHidden,
          updatedAt: new Date().toISOString(),
        };
      }
      return p;
    });
    this.saveProducts(updated);
    return updated;
  },

  toggleProductOnline(productId: string): Product[] {
    const products = this.getProducts();
    const updated = products.map((p) => {
      if (p.id === productId) {
        const currentOnline = p.isOnline !== false;
        return {
          ...p,
          isOnline: !currentOnline,
          updatedAt: new Date().toISOString(),
        };
      }
      return p;
    });
    this.saveProducts(updated);
    return updated;
  },

  resetProducts(): Product[] {
    try {
      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify([]));
      return [];
    } catch {
      return [];
    }
  },

  restoreInitialDemoProducts(): Product[] {
    try {
      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(INITIAL_PRODUCTS));
      return INITIAL_PRODUCTS;
    } catch {
      return INITIAL_PRODUCTS;
    }
  },

  resetOrders(): Order[] {
    try {
      localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify([]));
      return [];
    } catch {
      return [];
    }
  },

  resetAllDataForLaunch(): { products: Product[]; orders: Order[] } {
    try {
      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify([]));
      localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify([]));
      localStorage.setItem(STORAGE_KEYS.CART, JSON.stringify([]));
      localStorage.setItem(STORAGE_KEYS.LAST_TRACKED, JSON.stringify([]));
      // Remove legacy storage version keys
      localStorage.removeItem('khelcom_products_v2');
      localStorage.removeItem('khelcom_products_v1');
      localStorage.removeItem('khelcom_orders_v1');
      localStorage.removeItem('khelcom_cart_v1');
      localStorage.removeItem('khelcom_last_tracked_orders_v1');
      return { products: [], orders: [] };
    } catch {
      return { products: [], orders: [] };
    }
  },

  // SETTINGS
  getSettings(): AppSettings {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (!data) {
        localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(DEFAULT_SETTINGS));
        return DEFAULT_SETTINGS;
      }
      return { ...DEFAULT_SETTINGS, ...JSON.parse(data) };
    } catch {
      return DEFAULT_SETTINGS;
    }
  },

  saveSettings(settings: AppSettings): void {
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
      if (SupabaseService.isAvailable()) {
        SupabaseService.saveSettings(settings).catch((err) =>
          console.warn('[StorageService] Error saving settings to Supabase:', err)
        );
      }
    } catch (e) {
      console.error('Error saving settings', e);
    }
  },

  getAdminPin(): string {
    try {
      return localStorage.getItem(STORAGE_KEYS.ADMIN_PIN) || 'Khelcom2212026';
    } catch {
      return 'Khelcom2212026';
    }
  },

  setAdminPin(newPin: string): void {
    try {
      localStorage.setItem(STORAGE_KEYS.ADMIN_PIN, newPin.trim());
    } catch (e) {
      console.error('Error setting admin pin', e);
    }
  },

  // DATA EXPORT / IMPORT
  exportAllData(): string {
    const payload = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      products: this.getProducts(),
      orders: this.getOrders(),
      settings: this.getSettings(),
    };
    return JSON.stringify(payload, null, 2);
  },

  importData(jsonString: string): boolean {
    try {
      const data = JSON.parse(jsonString);
      if (data.products && Array.isArray(data.products)) {
        this.saveProducts(data.products);
      }
      if (data.orders && Array.isArray(data.orders)) {
        localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(data.orders));
      }
      if (data.settings && typeof data.settings === 'object') {
        this.saveSettings(data.settings);
      }
      return true;
    } catch (e) {
      console.error('Import failed', e);
      return false;
    }
  },

  // ADMIN AUTH
  isAdminAuthenticated(): boolean {
    try {
      return localStorage.getItem(STORAGE_KEYS.ADMIN_AUTH) === 'true';
    } catch {
      return false;
    }
  },

  setAdminAuthenticated(auth: boolean): void {
    try {
      if (auth) {
        localStorage.setItem(STORAGE_KEYS.ADMIN_AUTH, 'true');
      } else {
        localStorage.removeItem(STORAGE_KEYS.ADMIN_AUTH);
      }
    } catch (e) {
      console.error('Error setting admin auth', e);
    }
  },

  // BRANDS MANAGEMENT
  getBrands(): string[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.BRANDS);
      if (data === null) {
        localStorage.setItem(STORAGE_KEYS.BRANDS, JSON.stringify(DEFAULT_BRANDS));
        return DEFAULT_BRANDS;
      }
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
      return DEFAULT_BRANDS;
    } catch {
      return DEFAULT_BRANDS;
    }
  },

  saveBrands(brands: string[]): string[] {
    try {
      const cleaned = Array.from(new Set(brands.map((b) => b.trim()).filter(Boolean)));
      localStorage.setItem(STORAGE_KEYS.BRANDS, JSON.stringify(cleaned));
      return cleaned;
    } catch (e) {
      console.error('Error saving brands', e);
      return this.getBrands();
    }
  },

  addBrand(newBrand: string): string[] {
    const trimmed = newBrand.trim();
    if (!trimmed) return this.getBrands();
    const current = this.getBrands();
    if (!current.some((b) => b.toLowerCase() === trimmed.toLowerCase())) {
      current.push(trimmed);
      return this.saveBrands(current);
    }
    return current;
  },

  removeBrand(brandToRemove: string): string[] {
    const trimmed = brandToRemove.trim();
    const current = this.getBrands();
    const filtered = current.filter((b) => b.toLowerCase() !== trimmed.toLowerCase());
    return this.saveBrands(filtered);
  },

  updateBrand(
    oldName: string,
    newName: string,
    updateProducts: boolean = true
  ): { brands: string[]; updatedProductsCount: number } {
    const trimmedOld = oldName.trim();
    const trimmedNew = newName.trim();
    if (!trimmedNew) return { brands: this.getBrands(), updatedProductsCount: 0 };

    const current = this.getBrands();
    const updatedBrands = current.map((b) =>
      b.toLowerCase() === trimmedOld.toLowerCase() ? trimmedNew : b
    );
    const savedBrands = this.saveBrands(updatedBrands);

    let updatedProductsCount = 0;
    if (updateProducts && trimmedOld.toLowerCase() !== trimmedNew.toLowerCase()) {
      const products = this.getProducts();
      let hasChanges = false;
      const newProducts = products.map((p) => {
        if (p.brand.toLowerCase() === trimmedOld.toLowerCase()) {
          hasChanges = true;
          updatedProductsCount++;
          return { ...p, brand: trimmedNew };
        }
        return p;
      });
      if (hasChanges) {
        this.saveProducts(newProducts);
      }
    }

    return { brands: savedBrands, updatedProductsCount };
  },

  resetBrands(): string[] {
    return this.saveBrands(DEFAULT_BRANDS);
  },

  // CLOUD SYNC WITH SUPABASE
  async syncWithSupabase(): Promise<{
    products?: Product[];
    orders?: Order[];
    settings?: AppSettings;
    brands?: string[];
  }> {
    if (!SupabaseService.isAvailable()) return {};
    try {
      const [prods, ords, sttngs, brnds] = await Promise.all([
        SupabaseService.fetchProducts(),
        SupabaseService.fetchOrders(),
        SupabaseService.fetchSettings(),
        SupabaseService.fetchBrands(),
      ]);

      const result: {
        products?: Product[];
        orders?: Order[];
        settings?: AppSettings;
        brands?: string[];
      } = {};

      if (prods !== null && prods.length > 0) {
        localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(prods));
        result.products = prods;
      }
      if (ords !== null && ords.length > 0) {
        localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(ords));
        result.orders = ords;
      }
      if (sttngs !== null) {
        localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(sttngs));
        result.settings = sttngs;
      }
      if (brnds !== null && brnds.length > 0) {
        localStorage.setItem(STORAGE_KEYS.BRANDS, JSON.stringify(brnds));
        result.brands = brnds;
      }

      return result;
    } catch (e) {
      console.warn('[StorageService] Error during syncWithSupabase:', e);
      return {};
    }
  },
};
