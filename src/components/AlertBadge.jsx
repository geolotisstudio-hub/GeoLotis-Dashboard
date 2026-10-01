// ============================================
// COMPOSANT - BADGE D'ALERTE
// ============================================

export default function AlertBadge({ level = 'info', children }) {
  const styles = {
    danger: 'geo-badge geo-badge-red',
    warning: 'geo-badge geo-badge-orange',
    info: 'geo-badge geo-badge-blue',
    success: 'geo-badge geo-badge-green',
  }

  const icons = {
    danger: '⚠',
    warning: '!',
    info: 'ℹ',
    success: '✓',
  }

  return (
    <span className={styles[level] || styles.info}>
      <span className="mr-1">{icons[level] || icons.info}</span>
      {children}
    </span>
  )
}