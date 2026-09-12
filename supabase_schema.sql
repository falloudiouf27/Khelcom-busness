-- ==========================================================
-- 🏢 KHELCOM BUSINESS - SUPABASE POSTGRESQL SCHEMA (SANS TVA)
-- ==========================================================
-- Application E-commerce & Vitrine Électronique & Électroménager
-- Devise : Franc CFA (XOF)
-- Gestion : Guest Checkout, Variantes Complexes, Validation Admin

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. ENUMS
DO $$ BEGIN
    CREATE TYPE delivery_type_enum AS ENUM ('showroom', 'delivery');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE order_status_enum AS ENUM ('pending_payment', 'paid', 'preparing', 'delivered', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE payment_method_enum AS ENUM ('cash_on_delivery', 'wave_orange_money', 'showroom_cash');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. TABLE: PRODUCTS (Catalogue principal)
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sku VARCHAR(64) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    brand VARCHAR(100) NOT NULL,
    category VARCHAR(100) NOT NULL,
    category_label VARCHAR(150) NOT NULL,
    description TEXT NOT NULL,
    short_description TEXT,
    base_price NUMERIC(12, 0) NOT NULL CHECK (base_price >= 0), -- Net FCFA
    original_price NUMERIC(12, 0),
    is_featured BOOLEAN DEFAULT false,
    is_new BOOLEAN DEFAULT false,
    in_stock BOOLEAN DEFAULT true,
    image_url TEXT NOT NULL,
    gallery_urls TEXT[] DEFAULT '{}',
    specs JSONB DEFAULT '{}'::jsonb, -- Caractéristiques { "Garantie": "24 Mois", "Puissance": "1800W" }
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. TABLE: PRODUCT_VARIANTS (Variantes complexes: Dimensions, Hauteur, Litres, BTU, Couleurs)
CREATE TABLE IF NOT EXISTS public.product_variants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    sku VARCHAR(64) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL, -- Ex: "450 Litres - Inox Brossé (H: 182cm)"
    color_name VARCHAR(100),
    color_hex VARCHAR(20),
    size_dimensions VARCHAR(100), -- Ex: "182 x 70 x 72 cm"
    height VARCHAR(50), -- Ex: "182 cm"
    capacity VARCHAR(100), -- Ex: "450 Litres", "18 000 BTU", "9 kg"
    price NUMERIC(12, 0) NOT NULL CHECK (price >= 0), -- Prix dynamique en FCFA
    original_price NUMERIC(12, 0),
    stock_quantity INTEGER NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
    image_url TEXT,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. TABLE: ORDERS (Commandes Guest sans compte client)
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number VARCHAR(32) UNIQUE NOT NULL, -- Ex: "KB-2026-8942"
    customer_name VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(50) NOT NULL, -- Format Sénégal (+221 ...)
    customer_email VARCHAR(255),
    delivery_type delivery_type_enum NOT NULL DEFAULT 'showroom',
    delivery_city VARCHAR(150),
    delivery_address TEXT,
    delivery_notes TEXT,
    subtotal NUMERIC(12, 0) NOT NULL DEFAULT 0,
    delivery_fee NUMERIC(12, 0) NOT NULL DEFAULT 0,
    total_amount NUMERIC(12, 0) NOT NULL DEFAULT 0, -- Montant Total Net en FCFA (Sans TVA)
    status order_status_enum NOT NULL DEFAULT 'pending_payment',
    payment_method payment_method_enum NOT NULL DEFAULT 'cash_on_delivery',
    payment_validated_at TIMESTAMPTZ,
    payment_validated_by VARCHAR(150),
    admin_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. TABLE: ORDER_ITEMS (Lignes de commande avec snapshot de la variante)
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    variant_id UUID REFERENCES public.product_variants(id) ON DELETE SET NULL,
    product_name VARCHAR(255) NOT NULL,
    variant_title VARCHAR(255) NOT NULL,
    unit_price NUMERIC(12, 0) NOT NULL CHECK (unit_price >= 0),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    total_price NUMERIC(12, 0) NOT NULL CHECK (total_price >= 0),
    product_image TEXT
);

-- 7. TABLE: SETTINGS (Paramètres de la boutique & Frais)
CREATE TABLE IF NOT EXISTS public.settings (
    id TEXT PRIMARY KEY DEFAULT 'app_settings',
    showroom_name TEXT,
    gerant TEXT,
    phone1 TEXT,
    phone2 TEXT,
    whatsapp TEXT,
    address TEXT,
    city TEXT,
    opening_hours TEXT,
    ninea TEXT,
    rc TEXT,
    google_maps_url TEXT,
    invoice_legal_notice TEXT,
    default_dakar_fee NUMERIC DEFAULT 1000,
    default_region_fee NUMERIC DEFAULT 8000,
    default_distance_fee NUMERIC DEFAULT 5000,
    hide_delivery_fees BOOLEAN DEFAULT false,
    custom_region_fees JSONB DEFAULT '{}'::jsonb,
    custom_local_zone_fees JSONB DEFAULT '{}'::jsonb,
    banner_announcement TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. INDEXES POUR HAUTE PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);
CREATE INDEX IF NOT EXISTS idx_products_brand ON public.products(brand);
CREATE INDEX IF NOT EXISTS idx_products_slug ON public.products(slug);
CREATE INDEX IF NOT EXISTS idx_product_variants_product_id ON public.product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_orders_customer_phone ON public.orders(customer_phone);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON public.orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);

-- 9. TRIGGER POUR MISE À JOUR AUTOMATIQUE DU CHAMP updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS trigger_update_products_timestamp ON public.products;
CREATE TRIGGER trigger_update_products_timestamp
    BEFORE UPDATE ON public.products
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_update_orders_timestamp ON public.orders;
CREATE TRIGGER trigger_update_orders_timestamp
    BEFORE UPDATE ON public.orders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 10. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- Lecture et écriture des produits et variantes
CREATE POLICY "Public Read Products" ON public.products FOR SELECT USING (true);
CREATE POLICY "Public Modify Products" ON public.products FOR ALL USING (true);

CREATE POLICY "Public Read Product Variants" ON public.product_variants FOR SELECT USING (true);
CREATE POLICY "Public Modify Product Variants" ON public.product_variants FOR ALL USING (true);

-- Création publique et gestion des commandes (Guest Checkout & Admin)
CREATE POLICY "Public Read Orders" ON public.orders FOR SELECT USING (true);
CREATE POLICY "Public Insert Orders" ON public.orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Update Orders" ON public.orders FOR UPDATE USING (true);
CREATE POLICY "Public Delete Orders" ON public.orders FOR DELETE USING (true);

CREATE POLICY "Public Read Order Items" ON public.order_items FOR SELECT USING (true);
CREATE POLICY "Public Insert Order Items" ON public.order_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Delete Order Items" ON public.order_items FOR DELETE USING (true);

-- Paramètres
CREATE POLICY "Public Read Settings" ON public.settings FOR SELECT USING (true);
CREATE POLICY "Public Modify Settings" ON public.settings FOR ALL USING (true);

-- 11. ACTIVATION REALTIME
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'products'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.products;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'orders'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
  END IF;
END $$;
