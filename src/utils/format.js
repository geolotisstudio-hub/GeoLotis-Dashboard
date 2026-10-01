import { format, formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'

// ============================================
// FONCTIONS DE FORMATAGE
// ============================================

/**
 * Formate une date en français (ex: 14 août 2026, 10:30)
 */
export function formatDate(dateStr) {
  if (!dateStr) return '—'
  return format(new Date(dateStr), 'd MMM yyyy, HH:mm', { locale: fr })
}

/**
 * Formate une date en français sans heure (ex: 14 août 2026)
 */
export function formatDateSimple(dateStr) {
  if (!dateStr) return '—'
  return format(new Date(dateStr), 'd MMM yyyy', { locale: fr })
}

/**
 * Formate une date relative (ex: il y a 3 jours)
 */
export function formatRelative(dateStr) {
  if (!dateStr) return '—'
  return formatDistanceToNow(new Date(dateStr), { addSuffix: true, locale: fr })
}

/**
 * Formate un nombre avec des milliers (ex: 1 234)
 */
export function formatNumber(num) {
  if (num === null || num === undefined || isNaN(num)) return '0'
  return new Intl.NumberFormat('fr-FR').format(num)
}

/**
 * Formate un montant en FCFA (ex: 1 234 567 FCFA)
 */
export function formatFCFA(amount) {
  if (amount === null || amount === undefined || isNaN(amount)) return '0 FCFA'
  return `${new Intl.NumberFormat('fr-FR').format(amount)} FCFA`
}

/**
 * Formate un pourcentage
 */
export function formatPercent(value, decimals = 1) {
  if (value === null || value === undefined || isNaN(value)) return '0%'
  return `${value.toFixed(decimals)}%`
}

/**
 * Formate une durée en jours de manière lisible
 */
export function formatDays(days) {
  if (days === null || days === undefined || isNaN(days)) return '—'
  if (days < 0) return formatDays(Math.abs(days)) + ' (futur)'
  if (days < 1) return 'moins d\'un jour'
  if (days < 30) return `${Math.round(days)} jour${days >= 2 ? 's' : ''}`
  if (days < 365) return `${Math.round(days / 30)} mois`
  return `${(days / 365).toFixed(1)} an${days >= 730 ? 's' : ''}`
}