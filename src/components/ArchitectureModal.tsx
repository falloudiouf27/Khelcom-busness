import React, { useState } from 'react';
import { Copy, Check, Database, FolderTree, FileCode, Shield, Server, Terminal, X } from 'lucide-react';

interface ArchitectureModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SUPABASE_SQL_SCRIPT = `-- ==========================================================
-- 🏢 KHELCOM BUSINESS - SUPABASE POSTGRESQL SCHEMA (SANS TVA)
-- ==========================================================
-- Application E-commerce & Vitrine Électronique & Électroménager
-- Devise : Franc CFA (XOF)
-- Gestion : Guest Checkout, Variantes Complexes, Validation Admin

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. ENUMS
CREATE TYPE delivery_type_enum AS ENUM ('showroom', 'delivery');
CREATE TYPE order_status_enum AS ENUM ('pending_payment', 'paid', 'preparing', 'delivered', 'cancelled');
CREATE TYPE payment_method_enum AS ENUM ('cash_on_delivery', 'wave_orange_money', 'showroom_cash');

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
    original_price NUMERIC(12, 0) CHECK (original_price >= base_price),
    is_featured BOOLEAN DEFAULT false,
    is_new BOOLEAN DEFAULT false,
    in_stock BOOLEAN DEFAULT true,
    image_url TEXT NOT NULL,
    gallery_urls TEXT[] DEFAULT '{}',
    specs JSONB DEFAULT '{}'::jsonb, -- Caractéristiques { "Garantie": "24 Mois", "Puissance": "1800W" }
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. TABLE: PRODUCT_VARIANTES (Variantes complexes: Dimensions, Hauteur, Litres, BTU, Couleurs)
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

-- 7. INDEXES POUR HAUTE PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);
CREATE INDEX IF NOT EXISTS idx_products_brand ON public.products(brand);
CREATE INDEX IF NOT EXISTS idx_products_slug ON public.products(slug);
CREATE INDEX IF NOT EXISTS idx_product_variants_product_id ON public.product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_orders_customer_phone ON public.orders(customer_phone);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON public.orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);

-- 8. TRIGGER POUR MISE À JOUR AUTOMATIQUE DU CHAMP updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER trigger_update_products_timestamp
    BEFORE UPDATE ON public.products
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_orders_timestamp
    BEFORE UPDATE ON public.orders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 9. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Lecture publique des produits et variantes
CREATE POLICY "Public Read Products" ON public.products FOR SELECT USING (true);
CREATE POLICY "Public Read Product Variants" ON public.product_variants FOR SELECT USING (true);

-- Création publique des commandes (Guest Checkout)
CREATE POLICY "Public Insert Orders" ON public.orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Insert Order Items" ON public.order_items FOR INSERT WITH CHECK (true);

-- Lecture des commandes par téléphone ou numéro (pour le suivi client)
CREATE POLICY "Public Select Own Orders" ON public.orders FOR SELECT USING (true);
CREATE POLICY "Public Select Own Items" ON public.order_items FOR SELECT USING (true);

-- Accès complet réservé au rôle de service (Admin Dashboard)
-- (Configuré via Supabase Service Role Key côté serveur / Server Actions)
`;

export const NEXTJS_DIRECTORY_STRUCTURE = `khelcom-business/
├── app/
│   ├── layout.tsx                    # Layout global (Polices, Header, Footer, CartProvider)
│   ├── page.tsx                      # Page d'accueil : Vitrine, Bannières, Produits vedettes
│   ├── catalogue/
│   │   ├── page.tsx                  # Catalogue complet avec filtres par facettes & recherche
│   │   └── [slug]/
│   │       └── page.tsx              # Fiche produit détaillée (sélecteur dynamique de variantes)
│   ├── panier/
│   │   └── page.tsx                  # Récapitulatif du panier d'achat
│   ├── commande/
│   │   ├── page.tsx                  # Guest Checkout (Retrait Showroom vs Livraison, Nom & Tél)
│   │   └── confirmation/[id]/
│   │       └── page.tsx              # Confirmation de commande, Suivi & Bouton WhatsApp
│   ├── suivi/
│   │   └── page.tsx                  # Page de suivi de commande par Téléphone / Numéro KB
│   ├── showroom/
│   │   └── page.tsx                  # Présentation du Showroom de Dakar, Horaires, Carte, Contact
│   ├── admin/
│   │   ├── login/
│   │   │   └── page.tsx              # Page de connexion sécurisée pour l'administrateur
│   │   ├── layout.tsx                # Layout sécurisé du tableau de bord Admin
│   │   ├── page.tsx                  # Dashboard Admin (KPIs : CA, Commandes en attente)
│   │   ├── commandes/
│   │   │   ├── page.tsx              # Table des commandes, Validation Paiement, Générateur PDF
│   │   │   └── [id]/page.tsx         # Détail d'une commande
│   │   └── produits/
│   │       ├── page.tsx              # Gestion du stock & des 200 références
│   │       └── nouveau/page.tsx      # Ajout d'un produit avec ses variantes complexes
│   └── api/
│       ├── orders/
│       │   ├── route.ts              # Création et listing des commandes
│       │   └── [id]/
│       │       ├── validate-payment/
│       │       │   └── route.ts      # Action Admin : Valider le paiement manuellement
│       │       └── invoice/
│       │           └── route.ts      # Génération de la facture PDF
│       └── products/
│           └── route.ts              # API Produits & Variantes
├── components/
│   ├── ui/                           # Composants Shadcn UI (Button, Dialog, Input, Select, etc.)
│   ├── header/
│   │   ├── Navbar.tsx                # Barre de navigation responsive avec recherche instantanée
│   │   ├── CategoryNav.tsx           # Rubans des catégories d'électroménager
│   │   └── CartDrawer.tsx            # Tiroir panier d'accès rapide
│   ├── products/
│   │   ├── ProductCard.tsx           # Carte produit avec prix FCFA et badge de garantie
│   │   ├── ProductGrid.tsx           # Grille responsive avec tri
│   │   ├── VariantSelector.tsx       # Sélecteur dynamique (Litres, BTU, Puissance, Couleur)
│   │   └── ProductSpecs.tsx          # Tableau des caractéristiques techniques
│   ├── checkout/
│   │   ├── DeliveryOptionSelector.tsx# Choix : Retrait Showroom (0 FCFA) vs Livraison Domicile
│   │   └── GuestCheckoutForm.tsx     # Formulaire ultra-rapide (Nom, Tél Sénégal, Adresse)
│   └── admin/
│       ├── StatsCards.tsx            # Indicateurs de performance
│       ├── OrdersTable.tsx           # Tableau interactif avec filtre de statut
│       └── InvoiceGenerator.tsx      # Moteur PDF Facture / Devis aux couleurs de Khelcom
├── lib/
│   ├── supabase/
│   │   ├── client.ts                 # Client Supabase pour le front-end (Guest)
│   │   └── server.ts                 # Client Supabase avec Service Role (Admin sécurisé)
│   ├── formatters.ts                 # Formatage FCFA (ex: "385 000 FCFA"), dates & téléphones
│   ├── pdf-service.ts                # Générateur de facture / devis officiel
│   └── whatsapp.ts                   # Générateur de liens de commande WhatsApp automatisés
├── types/
│   ├── index.ts                      # Interfaces TypeScript (Product, Variant, Order, OrderItem)
│   └── database.types.ts             # Types auto-générés par Supabase CLI
├── public/
│   ├── logo-khelcom.svg              # Logo Khelcom Business
│   └── images/                       # Visuels showroom, bannières haute qualité
├── .env.example                      # Variables Supabase (URL, ANON_KEY, SERVICE_ROLE_KEY)
└── package.json                      # Dépendances (Next.js, Supabase, Tailwind, Shadcn, Lucide)`;

export const ArchitectureModal: React.FC<ArchitectureModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'sql' | 'nextjs'>('sql');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const currentContent = activeTab === 'sql' ? SUPABASE_SQL_SCRIPT : NEXTJS_DIRECTORY_STRUCTURE;

  const handleCopy = () => {
    navigator.clipboard.writeText(currentContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-5xl h-[88vh] flex flex-col shadow-2xl overflow-hidden text-slate-100">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Architecture & Script Supabase
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-medium">
                  Khelcom Business
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Script SQL PostgreSQL complet pour Supabase & Arborescence Next.js App Router
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              id="copy-architecture-btn"
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-slate-950 font-semibold text-xs transition-colors shadow-sm"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copié !' : 'Copier le code'}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 px-6 pt-3 border-b border-slate-800 bg-slate-950/40">
          <button
            onClick={() => setActiveTab('sql')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-all border-b-2 ${
              activeTab === 'sql'
                ? 'border-amber-400 text-amber-400 bg-slate-800/60'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
            }`}
          >
            <FileCode className="w-4 h-4" />
            1. Script SQL Supabase (Tables, Variantes, RLS, Indexes)
          </button>
          <button
            onClick={() => setActiveTab('nextjs')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-all border-b-2 ${
              activeTab === 'nextjs'
                ? 'border-amber-400 text-amber-400 bg-slate-800/60'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
            }`}
          >
            <FolderTree className="w-4 h-4" />
            2. Structure des Dossiers Next.js (App Router)
          </button>
        </div>

        {/* Code Content */}
        <div className="flex-1 p-6 overflow-y-auto font-mono text-xs leading-relaxed bg-slate-950 text-slate-300 select-all">
          <pre className="whitespace-pre-wrap">{currentContent}</pre>
        </div>

        {/* Footer info */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/90 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-emerald-400">
              <Shield className="w-3.5 h-3.5" /> RLS Sécurisé (Guest Insert + Admin Access)
            </span>
            <span className="flex items-center gap-1.5 text-blue-400">
              <Server className="w-3.5 h-3.5" /> 100% Adapté Supabase Cloud
            </span>
          </div>
          <p className="text-slate-500">Khelcom Business • Dakar, Sénégal</p>
        </div>
      </div>
    </div>
  );
};
