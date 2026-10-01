// ============================================
// UTILITAIRE - GESTION DES ERREURS SUPABASE
// ============================================

/**
 * Vérifie si l'erreur est due à une table inexistante
 * (cas où le script SQL n'a pas encore été exécuté)
 */
export function isTableMissingError(error) {
  if (!error) return false
  const msg = error.message || ''
  return (
    msg.includes('does not exist') ||
    msg.includes('PGRST205') ||
    msg.includes('relation') ||
    msg.includes('not found')
  )
}