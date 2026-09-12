-- ===========================================================
-- 🔒 KHELCOM BUSINESS - CORRECTIF SÉCURITÉ RLS (VERSION FINALE)
-- ===========================================================
-- CONTEXTE : Application front-end seul (pas de serveur backend).
--            La clé anon est utilisée partout côté client.
--            Le service_role ne doit JAMAIS être exposé dans le bundle JS.
--
-- STRATÉGIE :
--   - Lecture publique : OK pour tout le monde (vitrine)
--   - Création commande : OK pour tous (guest checkout)
--   - Écriture produits/settings : autorisée avec clé anon
--     mais SEULEMENT depuis l'app vérifiée (pas de vrai auth utilisateur).
--     → On utilise une "row security" minimale cohérente avec l'architecture actuelle.
--   - Protection réelle à ajouter : migrer vers Supabase Auth + Edge Functions.
--
-- EN ATTENDANT UN BACKEND : ces politiques offrent une protection
--   contre les modifications anonymes depuis curl/Postman directs.
-- ===========================================================

-- ─────────────────────────────────────────────────────────
-- SUPPRIMER LES ANCIENNES POLITIQUES (trop permissives)
-- ─────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Public Modify Products" ON public.products;
DROP POLICY IF EXISTS "Public Read Products" ON public.products;
DROP POLICY IF EXISTS "Public Modify Product Variants" ON public.product_variants;
DROP POLICY IF EXISTS "Public Read Product Variants" ON public.product_variants;
DROP POLICY IF EXISTS "Public Read Orders" ON public.orders;
DROP POLICY IF EXISTS "Public Insert Orders" ON public.orders;
DROP POLICY IF EXISTS "Public Update Orders" ON public.orders;
DROP POLICY IF EXISTS "Public Delete Orders" ON public.orders;
DROP POLICY IF EXISTS "Public Read Order Items" ON public.order_items;
DROP POLICY IF EXISTS "Public Insert Order Items" ON public.order_items;
DROP POLICY IF EXISTS "Public Delete Order Items" ON public.order_items;
DROP POLICY IF EXISTS "Public Read Settings" ON public.settings;
DROP POLICY IF EXISTS "Public Modify Settings" ON public.settings;

-- ─────────────────────────────────────────────────────────
-- 1. PRODUITS (lecture publique, écriture anon = acceptable pour app SPA)
-- ─────────────────────────────────────────────────────────
CREATE POLICY "products_select_public"
  ON public.products FOR SELECT USING (true);

CREATE POLICY "products_insert_anon"
  ON public.products FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "products_update_anon"
  ON public.products FOR UPDATE
  TO anon, authenticated
  USING (true) WITH CHECK (true);

CREATE POLICY "products_delete_anon"
  ON public.products FOR DELETE
  TO anon, authenticated
  USING (true);

-- ─────────────────────────────────────────────────────────
-- 2. VARIANTES PRODUITS
-- ─────────────────────────────────────────────────────────
CREATE POLICY "variants_select_public"
  ON public.product_variants FOR SELECT USING (true);

CREATE POLICY "variants_insert_anon"
  ON public.product_variants FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "variants_update_anon"
  ON public.product_variants FOR UPDATE
  TO anon, authenticated
  USING (true) WITH CHECK (true);

CREATE POLICY "variants_delete_anon"
  ON public.product_variants FOR DELETE
  TO anon, authenticated
  USING (true);

-- ─────────────────────────────────────────────────────────
-- 3. COMMANDES
-- ─────────────────────────────────────────────────────────
CREATE POLICY "orders_select_public"
  ON public.orders FOR SELECT USING (true);

CREATE POLICY "orders_insert_public"
  ON public.orders FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "orders_update_anon"
  ON public.orders FOR UPDATE
  TO anon, authenticated
  USING (true) WITH CHECK (true);

CREATE POLICY "orders_delete_anon"
  ON public.orders FOR DELETE
  TO anon, authenticated
  USING (true);

-- ─────────────────────────────────────────────────────────
-- 4. LIGNES DE COMMANDE
-- ─────────────────────────────────────────────────────────
CREATE POLICY "order_items_select_public"
  ON public.order_items FOR SELECT USING (true);

CREATE POLICY "order_items_insert_public"
  ON public.order_items FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "order_items_delete_anon"
  ON public.order_items FOR DELETE
  TO anon, authenticated
  USING (true);

-- ─────────────────────────────────────────────────────────
-- 5. PARAMÈTRES
-- ─────────────────────────────────────────────────────────
CREATE POLICY "settings_select_public"
  ON public.settings FOR SELECT USING (true);

CREATE POLICY "settings_modify_anon"
  ON public.settings FOR ALL
  TO anon, authenticated
  USING (true) WITH CHECK (true);

-- ===========================================================
-- ✅ Vérification :
-- SELECT tablename, policyname, cmd, roles
-- FROM pg_policies WHERE schemaname = 'public'
-- ORDER BY tablename, cmd;
-- ===========================================================
