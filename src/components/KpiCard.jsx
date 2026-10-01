import { motion } from 'framer-motion'

// ============================================
// COMPOSANT - CARTE KPI PREMIUM
// ============================================

export default function KpiCard({ title, value, icon: Icon, color = '#0C8E37', subtitle, trend }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="geo-kpi-card"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="geo-kpi-card-label">{title}</p>
          <p className="geo-kpi-card-value">{value}</p>
          {subtitle && (
            <p className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>
              {subtitle}
            </p>
          )}
          {trend && (
            <span className={`geo-kpi-card-trend ${trend >= 0 ? 'geo-kpi-card-trend-up' : 'geo-kpi-card-trend-down'}`}>
              {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
            </span>
          )}
        </div>
        {Icon && (
          <div
            className="geo-kpi-card-icon"
            style={{ backgroundColor: `${color}15`, color }}
          >
            <Icon size={24} />
          </div>
        )}
      </div>
    </motion.div>
  )
}