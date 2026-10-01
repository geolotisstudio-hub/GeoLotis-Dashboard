// ============================================
// COMPOSANT - SPINNER DE CHARGEMENT
// ============================================

export default function LoadingSpinner({ message = 'Chargement...' }) {
  return (
    <div className="geo-loader">
      <div className="geo-loader-spinner" />
      <p className="geo-loader-text">{message}</p>
    </div>
  )
}