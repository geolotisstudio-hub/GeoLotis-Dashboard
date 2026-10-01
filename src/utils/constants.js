// ============================================
// CONSTANTES GLOBALES DU DASHBOARD
// ============================================

// Palette de couleurs GéoLotis
export const COLORS = {
  primary: '#0C8E37',
  primaryDark: '#0A6B29',
  primaryLight: '#10B953',
  danger: '#e53e3e',
  warning: '#F39200',
  info: '#3182ce',
  success: '#38a169',
  text: '#2d3748',
  muted: '#718096',
  border: '#e2e8f0',
}

// Couleurs des graphiques
export const CHART_COLORS = {
  primary: '#0C8E37',
  secondary: '#3182ce',
  warning: '#F39200',
  danger: '#e53e3e',
  info: '#718096',
  success: '#38a169',
  violet: '#805ad5',
  pink: '#d53f8c',
}

// Palette pour les versions
export const VERSION_COLORS = {
  '2.4.1': '#0C8E37',
  '2.4.0': '#3182ce',
  '2.3.2': '#F39200',
  '2.3.0': '#F39200',
  '2.2.0': '#718096',
  '2.1.0': '#e53e3e',
  default: '#718096',
}

// Statuts des installations
export const STATUTS = {
  actif: { label: 'Actif', color: '#38a169', bg: 'rgba(56, 161, 105, 0.1)' },
  inactif: { label: 'Inactif', color: '#e53e3e', bg: 'rgba(229, 62, 62, 0.1)' },
  desinstalle: { label: 'Désinstallé', color: '#718096', bg: 'rgba(113, 128, 150, 0.1)' },
}

// Gravité des erreurs (adapté au schéma)
export const GRAVITE = {
  critique: { label: 'Critique', color: '#e53e3e', bg: 'rgba(229, 62, 62, 0.1)' },
  moyenne: { label: 'Moyenne', color: '#F39200', bg: 'rgba(243, 146, 0, 0.1)' },
  mineure: { label: 'Mineure', color: '#3182ce', bg: 'rgba(49, 130, 206, 0.1)' },
}

// Seuils d'alerte
export const SEUILS = {
  INACTIF_JOURS: 30,        // Inactif après 30 jours
  VERSION_OBSOLETE_JOURS: 14, // Version obsolète si pas de maj depuis 14 jours
  ERREUR_RECURRENTE_COUNT: 3,  // Même erreur 3+ fois
  VOLUME_ANORMAL_MULTIPLE: 3,  // Volume > 3x la moyenne
}

// Version la plus récente de GéoLotis
export const VERSION_ACTUELLE = '2.4.1'

// Options des périodes
export const PERIODES = [
  { value: '7', label: '7 derniers jours' },
  { value: '30', label: '30 derniers jours' },
  { value: '90', label: '90 derniers jours' },
  { value: '365', label: '12 derniers mois' },
]

// Options des jours pour le graphique
export const PERIODES_GRAPHIQUE = [
  { value: '7', label: '7 jours' },
  { value: '30', label: '30 jours' },
  { value: '90', label: '90 jours' },
]

// Actions possibles
export const ACTIONS = [
  'connexion',
  'vente_lot',
  'import_plan',
  'ajout_prospect',
  'export_pdf',
  'modification',
]