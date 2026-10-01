import { createClient } from '@supabase/supabase-js'

// ============================================
// CLIENT SUPABASE - BASE MAÎTRE GÉOLOTIS
// ============================================
// 🔐 SÉCURITÉ : la clé utilisée ici est votre SECRET PERSONNEL
// (clé service_role de la base maître).
//
// Elle n'est JAMAIS écrite dans le code source (donc jamais livrée
// aux clients dans l'APK ou l'installateur Windows). Elle est saisie
// une seule fois par GéoLotis Studio à l'ouverture du dashboard et
// conservée uniquement sur SON propre appareil (stockage local).
// ============================================

// URL de la base Maître : lisible dans .env (VITE_MASTER_URL), avec la
// valeur par défaut conservée en repli pour que le dashboard fonctionne
// même sans fichier .env.
// ⚠️ C'est l'URL de VOTRE base maître : elle ne doit jamais être modifiée
//    par un client. La clé, elle, n'est JAMAIS dans le code (voir ci-dessous).
export const MASTER_URL =
  import.meta.env.VITE_MASTER_URL || 'https://peqrlpevdxovjfudgoxq.supabase.co'

const STORAGE_KEY = 'geolotis_master_service_key'

export function getMasterKey() {
  try {
    return localStorage.getItem(STORAGE_KEY) || ''
  } catch (e) {
    return ''
  }
}

export function saveMasterKey(keyValue) {
  const clean = String(keyValue || '').trim().replace(/["']/g, '')
  if (!clean) return false
  try {
    localStorage.setItem(STORAGE_KEY, clean)
  } catch (e) {
    return false
  }
  return true
}

export function clearMasterKey() {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch (e) {}
}

export const isMasterConfigured = Boolean(getMasterKey())

// Si la clé n'est pas encore configurée, le dashboard affichera
// automatiquement l'écran de déverrouillage (voir App.jsx).
export const supabase = createClient(MASTER_URL, getMasterKey() || 'cle-non-configuree')