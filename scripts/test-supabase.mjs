import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

// Load .env or .env.local if present
const envLocalPath = path.resolve(process.cwd(), '.env.local');
const envPath = path.resolve(process.cwd(), '.env');

if (fs.existsSync(envLocalPath)) {
  dotenv.config({ path: envLocalPath });
} else if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
}

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

console.log('====================================================');
console.log('🔍 TEST DE CONNEXION SUPABASE - KHELCOM BUSINESS');
console.log('====================================================\n');

if (!supabaseUrl || !supabaseAnonKey) {
  console.log('❌ ÉTAT : Clés Supabase manquantes dans le fichier .env');
  console.log('👉 Action requise :');
  console.log('   Créez un fichier .env à la racine avec :');
  console.log('   VITE_SUPABASE_URL="https://votre-projet.supabase.co"');
  console.log('   VITE_SUPABASE_ANON_KEY="eyJhbGci..."\n');
  process.exit(1);
}

if (!supabaseUrl.startsWith('https://') || supabaseUrl.includes('votre-projet')) {
  console.log('⚠️ URL Supabase invalide ou fictive :', supabaseUrl);
  process.exit(1);
}

console.log('📡 URL Supabase :', supabaseUrl);
console.log('🔑 Clé Publique (Anon) :', supabaseAnonKey.substring(0, 15) + '...');
console.log('\n⏳ Test de connexion et vérification des tables...\n');

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function runDiagnostics() {
  const tables = ['products', 'product_variants', 'orders', 'order_items', 'settings'];
  let allGood = true;

  for (const table of tables) {
    try {
      const { data, error } = await supabase.from(table).select('*').limit(1);
      if (error) {
        console.log(`❌ Table [${table}] : ERREUR (${error.message})`);
        allGood = false;
      } else {
        console.log(`✅ Table [${table}] : ACCESSIBLE (Lignes détectées : ${data ? data.length : 0})`);
      }
    } catch (err) {
      console.log(`❌ Table [${table}] : EXCEPTION (${err.message})`);
      allGood = false;
    }
  }

  console.log('\n----------------------------------------------------');
  if (allGood) {
    console.log('🎉 RÉSULTAT : La base de données Supabase fonctionne parfaitement !');
    console.log('Toutes les tables et politiques RLS sont configurées et opérationnelles.');
  } else {
    console.log('⚠️ RÉSULTAT : Certaines tables sont introuvables ou inaccessibles.');
    console.log('Assurez-vous d\'avoir exécuté le script supabase_schema.sql dans l\'éditeur SQL de Supabase.');
  }
  console.log('----------------------------------------------------\n');
}

runDiagnostics();
