import { useInstallations } from '../hooks/useInstallations'
import { useTelemetry } from '../hooks/useTelemetry'
import { useErreurs } from '../hooks/useErreurs'
import LoadingSpinner from '../components/LoadingSpinner'
import EmptyState from '../components/EmptyState'
import AlertBadge from '../components/AlertBadge'
import { formatNumber, formatDays } from '../utils/format'
import { SEUILS, VERSION_ACTUELLE } from '../utils/constants'
import { Clock, RefreshCcw, AlertTriangle, TrendingUp, Bell, ShieldCheck, CheckCircle2 } from 'lucide-react'

// ============================================
// PAGE - ALERTES AUTOMATIQUES
// ============================================

export default function Alertes() {
  const { installations, loading: loadingInst, error: errorInst, refetch: refetchInst } = useInstallations()
  const { telemetry, loading: loadingTel, error: errorTel, refetch: refetchTel } = useTelemetry({ days: 90 })
  const { erreurs, loading: loadingErr, error: errorErr, refetch: refetchErr } = useErreurs({ limit: 100 })

  if (loadingInst || loadingTel || loadingErr) {
    return <LoadingSpinner message="Analyse des alertes..." />
  }

  if (errorInst || errorTel || errorErr) {
    return <EmptyState title="Erreur de chargement" message={errorInst || errorTel || errorErr} />
  }

  // Récupère la télémétrie la plus récente de chaque installation
  const latestTelemetryByInstallation = telemetry.reduce((acc, t) => {
    const existing = acc[t.installation_id]
    if (!existing || new Date(t.date_releve) > new Date(existing.date_releve)) {
      acc[t.installation_id] = t
    }
    return acc
  }, {})

  // CORRECTION : les installations sont regroupées par entreprise avec plusieurs
  // instances (appareils). On agrège la télémétrie sur TOUTES les instances
  // (max, comme dans le Dashboard) au lieu de ne lire que l'installation canonique.
    const enrichedInstallations = installations.map(inst => {
    const ids = (inst.instances && inst.instances.length > 0 ? inst.instances : [inst]).map(i => i.installation_id)
    const lotsVals = ids.map(id => latestTelemetryByInstallation[id]?.nb_lots || 0).filter(v => v > 0)
    // Version la plus ancienne parmi les appareils de l'entreprise (celle qui nécessite une MAJ)
    const versions = (inst.instances && inst.instances.length > 0 ? inst.instances : [inst])
      .map(i => i.version_logiciel)
      .filter(Boolean)
    const version = versions.length > 0
      ? versions.sort((a, b) => String(a).localeCompare(String(b)))[0]
      : inst.version_logiciel
    return { ...inst, nb_lots: lotsVals.length > 0 ? Math.max(...lotsVals) : 0, version_logiciel: version }
  })

  // ===== ALERTE 1 : Installations inactives depuis 30+ jours =====
  const inactives = enrichedInstallations.filter(inst => {
    const lastConn = new Date(inst.derniere_connexion)
    const diffDays = (Date.now() - lastConn.getTime()) / (1000 * 60 * 60 * 24)
    return diffDays > SEUILS.INACTIF_JOURS
  })

  // ===== ALERTE 2 : Versions obsolètes =====
  const versionsObsolètes = enrichedInstallations.filter(inst => {
    return inst.version_logiciel !== VERSION_ACTUELLE
  })

  // ===== ALERTE 3 : Erreurs récurrentes (3+ fois même message) =====
  const errorCounts = erreurs.reduce((acc, err) => {
    const key = err.message
    acc[key] = (acc[key] || 0) + 1
    return acc
  }, {})

  const recurrentes = Object.entries(errorCounts)
    .filter(([message, count]) => count >= SEUILS.ERREUR_RECURRENTE_COUNT)
    .map(([message, count]) => ({
      message,
      count,
      installationId: erreurs.find(e => e.message === message)?.installation_id,
    }))

  // ===== ALERTE 4 : Volume de données anormal =====
  const avgLots = enrichedInstallations.reduce((sum, i) => sum + (i.nb_lots || 0), 0) / Math.max(1, enrichedInstallations.length)
  const volumeAnormal = enrichedInstallations.filter(inst => {
    return (inst.nb_lots || 0) > avgLots * SEUILS.VOLUME_ANORMAL_MULTIPLE
  })

  const totalAlertes = inactives.length + versionsObsolètes.length + recurrentes.length + volumeAnormal.length

  // Composant d'alerte réutilisable
  const AlertSection = ({ icon: Icon, title, level, count, children }) => (
    <div className="geo-chart-card">
      <div className="geo-chart-card-header">
        <h2 className="geo-chart-card-title flex items-center gap-2">
          <Icon size={18} style={{ color: level === 'danger' ? '#e53e3e' : level === 'warning' ? '#F39200' : '#3182ce' }} />
          {title}
        </h2>
        <AlertBadge level={count > 0 ? level : 'success'}>
          {count > 0 ? `${count} alerte${count > 1 ? 's' : ''}` : 'Aucune'}
        </AlertBadge>
      </div>
      {count > 0 ? (
        <div className="space-y-3">
          {children}
        </div>
      ) : (
        <div className="flex items-center gap-3 p-4 rounded-xl" style={{ backgroundColor: 'rgba(12, 142, 55, 0.05)', border: '1px solid rgba(12, 142, 55, 0.1)' }}>
          <CheckCircle2 size={20} style={{ color: '#0C8E37' }} />
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Aucune alerte détectée ✓</p>
        </div>
      )}
    </div>
  )

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div>
        <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Alertes automatiques</h2>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
          Détection automatique des anomalies et risques d'abandon
        </p>
      </div>

      {/* Bandeau résumé */}
      <div className="geo-hero">
        <div className="geo-hero-content">
          <div>
            <div className="geo-hero-badge">
              <Bell size={13} />
              <span>Tableau de bord des alertes</span>
            </div>
            <h1 className="mt-4">{totalAlertes} alerte{totalAlertes > 1 ? 's' : ''} détectée{totalAlertes > 1 ? 's' : ''}</h1>
            <p className="mt-2">
              Surveillance automatique de l'ensemble des installations GéoLotis.
            </p>
          </div>
                    <div className="flex items-center gap-4">
            <div className="geo-hero-status">
              <div className={`geo-hero-status-dot ${totalAlertes > 0 ? 'bg-warning' : 'bg-success'}`} />
              <div>
                <p>{totalAlertes > 0 ? 'Surveillance Active' : 'Tout est OK'}</p>
                <p>Analyse en temps réel</p>
              </div>
            </div>
            <button
              onClick={async () => {
                await Promise.all([refetchInst(), refetchTel(), refetchErr()])
              }}
              className="geo-topbar-btn"
              title="Actualiser les alertes"
            >
              <RefreshCcw size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Alertes d'inactivité */}
      <AlertSection
        icon={Clock}
        title="Installations inactives"
        level="danger"
        count={inactives.length}
      >
        {inactives.map((inst, idx) => {
          const daysInactive = Math.round((Date.now() - new Date(inst.derniere_connexion).getTime()) / (1000 * 60 * 60 * 24))
          return (
            <div key={idx} className="flex items-center justify-between p-4 rounded-xl" style={{ backgroundColor: 'rgba(229, 62, 62, 0.03)', border: '1px solid rgba(229, 62, 62, 0.1)' }}>
              <div>
                <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{inst.nom_client}</p>
                <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                  Inactif depuis {formatDays(daysInactive)}
                </p>
              </div>
              <span className="geo-badge geo-badge-red">
                {formatDays(daysInactive)}
              </span>
            </div>
          )
        })}
      </AlertSection>

      {/* Versions obsolètes */}
      <AlertSection
        icon={RefreshCcw}
        title="Versions obsolètes"
        level="warning"
        count={versionsObsolètes.length}
      >
        {versionsObsolètes.map((inst, idx) => (
          <div key={idx} className="flex items-center justify-between p-4 rounded-xl" style={{ backgroundColor: 'rgba(243, 146, 0, 0.03)', border: '1px solid rgba(243, 146, 0, 0.1)' }}>
            <div>
              <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{inst.nom_client}</p>
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                Mise à jour disponible
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="geo-badge geo-badge-orange">v{inst.version_logiciel}</span>
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>→</span>
              <span className="geo-badge geo-badge-green">v{VERSION_ACTUELLE}</span>
            </div>
          </div>
        ))}
      </AlertSection>

      {/* Erreurs récurrentes */}
      <AlertSection
        icon={AlertTriangle}
        title="Erreurs récurrentes"
        level="danger"
        count={recurrentes.length}
      >
        {recurrentes.map((err, idx) => (
          <div key={idx} className="flex items-center justify-between p-4 rounded-xl" style={{ backgroundColor: 'rgba(229, 62, 62, 0.03)', border: '1px solid rgba(229, 62, 62, 0.1)' }}>
            <div className="flex-1 mr-4">
              <p className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>{err.message}</p>
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                Installation : {err.installationId || 'Inconnue'}
              </p>
            </div>
            <span className="geo-badge geo-badge-red">{err.count}×</span>
          </div>
        ))}
      </AlertSection>

      {/* Volume anormal */}
      <AlertSection
        icon={TrendingUp}
        title="Volume de données anormal"
        level="warning"
        count={volumeAnormal.length}
      >
        {volumeAnormal.map((inst, idx) => (
          <div key={idx} className="flex items-center justify-between p-4 rounded-xl" style={{ backgroundColor: 'rgba(243, 146, 0, 0.03)', border: '1px solid rgba(243, 146, 0, 0.1)' }}>
            <div>
              <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{inst.nom_client}</p>
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                Moyenne : {formatNumber(Math.round(avgLots))} lots
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm font-bold" style={{ color: '#F39200' }}>
                {formatNumber(inst.nb_lots)} lots
              </span>
              <span className="geo-badge geo-badge-orange">
                {(inst.nb_lots / avgLots).toFixed(1)}x moyenne
              </span>
            </div>
          </div>
        ))}
      </AlertSection>
    </div>
  )
}