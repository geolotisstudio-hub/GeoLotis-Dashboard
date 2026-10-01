import { useMemo, useState, useEffect } from 'react'
import { useInstallations } from '../hooks/useInstallations'
import { useTelemetry } from '../hooks/useTelemetry'
import { useActivites } from '../hooks/useActivites'
import LoadingSpinner from '../components/LoadingSpinner'
import EmptyState from '../components/EmptyState'
import DataTable from '../components/DataTable'
import { formatNumber, formatRelative } from '../utils/format'
import { VERSION_COLORS } from '../utils/constants'
import { Building2, Activity, AlertTriangle, CalendarDays, RefreshCw, Sparkles, TrendingUp, Users, Package, Database } from 'lucide-react'
import { motion } from 'framer-motion'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js'
import { Line, Bar, Doughnut } from 'react-chartjs-2'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler
)

// ============================================
// PAGE - VUE D'ENSEMBLE (DASHBOARD PREMIUM)
// ============================================

// Carte statistique premium
function StatCard({ title, value, icon: Icon, color = '#0C8E37', subtitle, trend, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -6, transition: { duration: 0.2 } }}
      className="geo-kpi-card"
    >
      {/* Glow background effect on hover */}
      <div 
        className="absolute -right-12 -top-12 w-36 h-36 rounded-full opacity-0 group-hover:opacity-10 transition-opacity duration-500 blur-2xl pointer-events-none"
        style={{ background: color }}
      />
      
      <div className="flex items-center justify-between">
        <div
          className="geo-kpi-card-icon"
          style={{ backgroundColor: `${color}15`, color }}
        >
          <Icon size={24} className="stroke-[2.2]" />
        </div>
        {trend && (
          <span className="geo-kpi-card-trend geo-kpi-card-trend-up">
            <TrendingUp size={12} />
            {trend}
          </span>
        )}
      </div>

      <div className="mt-5">
        <p className="geo-kpi-card-label">{title}</p>
        <p className="geo-kpi-card-value">{value}</p>
        {subtitle && (
          <div className="mt-2 flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
            <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>{subtitle}</p>
          </div>
        )}
      </div>
    </motion.div>
  )
}

// Carte graphique premium
function ChartCard({ title, subtitle, children, action }) {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
      className="geo-chart-card"
    >
      <div className="geo-chart-card-header">
        <div>
          <h2 className="geo-chart-card-title">{title}</h2>
          {subtitle && <p className="geo-chart-card-subtitle">{subtitle}</p>}
        </div>
        {action && <div>{action}</div>}
      </div>
      <div className="flex-1 w-full">
        {children}
      </div>
    </motion.div>
  )
}

export default function Dashboard() {
  const { installations, loading: loadingInst, error: errorInst, refetch: refetchInstallations } = useInstallations()
  const { telemetry, loading: loadingTel, error: errorTel, refetch: refetchTelemetry } = useTelemetry({ days: 30 })
  const { activites, loading: loadingAct, error: errorAct, refetch: refetchActivites } = useActivites({ limit: 10 })
  const [isRefreshing, setIsRefreshing] = useState(false)

  const refreshAll = async () => {
    setIsRefreshing(true)
    try {
      await Promise.all([
        refetchInstallations(),
        refetchTelemetry(),
        refetchActivites(),
      ])
    } finally {
      setIsRefreshing(false)
    }
  }

    // Auto-refresh toutes les 60 secondes
  useEffect(() => {
    const interval = setInterval(() => {
      refetchInstallations()
      refetchTelemetry()
      refetchActivites()
    }, 60000)
    return () => clearInterval(interval)
  }, [refetchInstallations, refetchTelemetry, refetchActivites])

  // Calculs optimisés avec useMemo
  const stats = useMemo(() => {
    if (loadingInst || loadingTel) return null

    const now = Date.now()
    const totalInstallations = installations.length
    const actives = installations.filter(i => {
      const diffDays = (now - new Date(i.derniere_connexion).getTime()) / (1000 * 60 * 60 * 24)
      return diffDays < 7
    }).length
    const inactives = installations.filter(i => {
      const diffDays = (now - new Date(i.derniere_connexion).getTime()) / (1000 * 60 * 60 * 24)
      return diffDays > 30
    }).length

    const latestByInst = telemetry.reduce((acc, t) => {
      const existing = acc[t.installation_id]
      if (!existing || new Date(t.date_releve) > new Date(existing.date_releve)) {
        acc[t.installation_id] = t
      }
      return acc
    }, {})

        // Totaux calculés PAR ENTREPRISE (installations déjà regroupées).
    // Tous les appareils d'une même entreprise rapportent les MÊMES chiffres
    // (même base de données) : on prend donc le MAX par entreprise, jamais une somme
    // qui compterait plusieurs fois les mêmes données.
    const perCompany = (field) => installations.reduce((sum, inst) => {
      const ids = (inst.instances && inst.instances.length > 0 ? inst.instances : [inst]).map(i => i.installation_id)
      const vals = ids.map(id => latestByInst[id]?.[field] || 0).filter(v => v > 0)
      return sum + (vals.length > 0 ? Math.max(...vals) : 0)
    }, 0)
    const totalLots = perCompany('nb_lots')
    const totalProspects = perCompany('nb_prospects')
    const totalUsers = perCompany('nb_utilisateurs')

    // CORRECTION DOUBLE-COMPTAGE : au lieu de sommer nb_lots de toutes les entrées
    // télémétrie (ce qui double-compte quand plusieurs appareils d'une même entreprise
    // rapportent le même jour), on agrège d'abord par entreprise (max) puis on somme
    // les totaux entreprises par date.
    const telemetryByInst = telemetry.reduce((acc, t) => {
      const date = new Date(t.date_releve).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })
      if (!acc[date]) acc[date] = {}
      const existing = acc[date][t.installation_id]
      if (!existing || new Date(t.date_releve) > new Date(existing.date_releve)) {
        acc[date][t.installation_id] = t
      }
      return acc
    }, {})

        const companyLatestByDate = {}
    Object.entries(telemetryByInst).forEach(([date, instMap]) => {
      installations.forEach(inst => {
        const ids = (inst.instances && inst.instances.length > 0 ? inst.instances : [inst])
          .map(i => i.installation_id)
        const vals = ids.map(id => instMap[id]?.nb_lots || 0).filter(v => v > 0)
        if (vals.length > 0) {
          if (!companyLatestByDate[date]) companyLatestByDate[date] = 0
          companyLatestByDate[date] += Math.max(...vals)
        }
      })
    })
    const activityData = companyLatestByDate

    const growthData = installations.reduce((acc, i) => {
      const month = new Date(i.date_installation).toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' })
      acc[month] = (acc[month] || 0) + 1
      return acc
    }, {})

        const versionData = installations.reduce((acc, i) => {
      const v = i.version_logiciel || 'Inconnue'
      acc[v] = (acc[v] || 0) + 1
      return acc
    }, {})

        // Calcul des tendances : comparer la période récente (15 derniers jours) à l'ancienne
    const halfPeriod = now - (15 * 24 * 60 * 60 * 1000)
    const recentTelemetry = telemetry.filter(t => new Date(t.date_releve).getTime() >= halfPeriod)
    const olderTelemetry = telemetry.filter(t => new Date(t.date_releve).getTime() < halfPeriod)
    const calcTrend = (recent, older, field) => {
      const recentMax = recent.reduce((m, t) => Math.max(m, t[field] || 0), 0)
      const olderMax = older.reduce((m, t) => Math.max(m, t[field] || 0), 0)
      if (olderMax === 0) return recentMax > 0 ? '+100%' : null
      const pct = ((recentMax - olderMax) / olderMax) * 100
      return `${pct >= 0 ? '+' : ''}${pct.toFixed(0)}%`
    }
    const lotsTrend = calcTrend(recentTelemetry, olderTelemetry, 'nb_lots')

    // Totaux des champs télémétrie complémentaires
    const totalDocuments = perCompany('nb_documents')
    const totalLotsVendus = perCompany('nb_lots_vendus')
    const totalRelances = perCompany('nb_relances_programmees')

    const topClients = installations
      .map(inst => ({
        ...inst,
        nb_lots: (() => {
          const ids = (inst.instances && inst.instances.length > 0 ? inst.instances : [inst]).map(i => i.installation_id)
          const vals = ids.map(id => latestByInst[id]?.nb_lots || 0)
          return vals.length > 0 ? Math.max(...vals) : 0
        })(),
      }))
      .sort((a, b) => b.nb_lots - a.nb_lots)
      .slice(0, 5)

        return {
      totalInstallations, actives, inactives, totalLots, totalProspects, totalUsers,
      totalDocuments, totalLotsVendus, totalRelances, lotsTrend,
      activityLabels: Object.keys(activityData), activityValues: Object.values(activityData),
      growthLabels: Object.keys(growthData), growthValues: Object.values(growthData),
      versionLabels: Object.keys(versionData), versionValues: Object.values(versionData),
      versionColors: Object.keys(versionData).map(v => VERSION_COLORS[v] || VERSION_COLORS.default),
      topClients,
    }
  }, [installations, telemetry, loadingInst, loadingTel])

    if (loadingInst || loadingTel || loadingAct) {
    return <LoadingSpinner message="Chargement du dashboard GéoLotis..." />
  }

  if (errorInst || errorTel || errorAct) {
    return <EmptyState title="Erreur de chargement" message={errorInst || errorTel || errorAct} />
  }

  // Etat vide : aucune donnée → guider l'utilisateur vers le script SQL
  if (!stats || stats.totalInstallations === 0) {
    return (
      <EmptyState
        title="Aucune donnée pour le moment"
        message="Exécutez SCRIPT_SQL_DASHBOARD.sql dans votre base maître Supabase pour créer les tables. Les données apparaîtront ici dès que les premières installations se connecteront."
      />
    )
  }

  // Configurations des graphiques Chart.js
  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { 
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(10, 30, 20, 0.9)',
        titleFont: { family: 'Inter', size: 13, weight: 'bold' },
        bodyFont: { family: 'Inter', size: 12 },
        padding: 12,
        cornerRadius: 12,
        displayColors: false,
      }
    },
    scales: {
      y: { 
        beginAtZero: true, 
        grid: { color: 'rgba(12, 142, 55, 0.05)', drawBorder: false },
        ticks: { font: { family: 'Inter', size: 11 }, color: '#94a3b8' }
      },
      x: { 
        grid: { display: false },
        ticks: { font: { family: 'Inter', size: 11 }, color: '#94a3b8' }
      }
    },
  }

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { 
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(10, 30, 20, 0.9)',
        titleFont: { family: 'Inter', size: 13, weight: 'bold' },
        bodyFont: { family: 'Inter', size: 12 },
        padding: 12,
        cornerRadius: 12,
        displayColors: false,
      }
    },
    scales: {
      y: { 
        beginAtZero: true, 
        grid: { color: 'rgba(12, 142, 55, 0.05)', drawBorder: false },
        ticks: { font: { family: 'Inter', size: 11 }, color: '#94a3b8' }
      },
      x: { 
        grid: { display: false },
        ticks: { font: { family: 'Inter', size: 11 }, color: '#94a3b8' }
      },
    },
  }

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: { 
          padding: 20, 
          usePointStyle: true,
          pointStyle: 'circle',
          font: { family: 'Inter', size: 12, weight: '500' },
          color: '#64748b'
        },
      },
      tooltip: {
        backgroundColor: 'rgba(10, 30, 20, 0.9)',
        titleFont: { family: 'Inter', size: 13, weight: 'bold' },
        bodyFont: { family: 'Inter', size: 12 },
        padding: 12,
        cornerRadius: 12,
      }
    },
    cutout: '72%',
  }

  const horizontalOptions = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y',
    plugins: { 
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(10, 30, 20, 0.9)',
        titleFont: { family: 'Inter', size: 13, weight: 'bold' },
        bodyFont: { family: 'Inter', size: 12 },
        padding: 12,
        cornerRadius: 12,
      }
    },
    scales: {
      x: { 
        beginAtZero: true, 
        grid: { color: 'rgba(12, 142, 55, 0.05)', drawBorder: false },
        ticks: { font: { family: 'Inter', size: 11 }, color: '#94a3b8' }
      },
      y: { 
        grid: { display: false },
        ticks: { font: { family: 'Inter', size: 12, weight: '500' }, color: '#475569' }
      },
    },
  }

  const activityColumns = [
    { key: 'installation_id', label: 'Installation', sortable: true },
    { key: 'user_name', label: 'Utilisateur', sortable: true },
    {
      key: 'action',
      label: 'Action',
      sortable: true,
      render: (row) => (
        <span className="geo-badge geo-badge-green">
          {row.action}
        </span>
      ),
    },
    { key: 'details', label: 'Détails' },
    {
      key: 'created_at',
      label: 'Date & Heure',
      sortable: true,
      render: (row) => (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
          <CalendarDays size={13} />
          {formatRelative(row.created_at)}
        </span>
      ),
    },
  ]

  return (
    <div className="space-y-6 pb-8">
      {/* En-tête Hero Banner premium */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="geo-hero"
      >
                <div className="geo-hero-content">
          <div>
            <div className="geo-hero-badge">
              <Sparkles size={13} />
              <span>GéoLotis Admin Suite • V2.4.1</span>
            </div>
            <h1 className="mt-4">Tableau de Bord Global</h1>
            <p className="mt-2">
              Supervisez l'ensemble des installations, le volume des lots fonciers gérés et l'activité en temps réel de votre parc logiciel.
            </p>
          </div>

          <div className="flex items-center gap-4">
            {/* Statut dynamique basé sur les données */}
            <div className="geo-hero-status">
              <div className={`geo-hero-status-dot ${stats.inactives > 0 ? 'bg-warning' : 'bg-success'}`} />
              <div>
                <p>{stats.inactives > 0 ? `${stats.actives} actives / ${stats.inactives} inactives` : 'Système Opérationnel'}</p>
                <p>{stats.totalInstallations > 0 ? `${Math.round((stats.actives / stats.totalInstallations) * 100)}% Connecté` : 'Aucune donnée'}</p>
              </div>
            </div>

            {/* Bouton de rafraîchissement manuel */}
            <button
              onClick={refreshAll}
              disabled={isRefreshing}
              className="geo-topbar-btn"
              title="Actualiser les données"
            >
              <RefreshCw size={18} className={isRefreshing ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>
      </motion.div>

            {/* Grille des Cartes KPI */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-5">
        <StatCard title="Entreprises" value={formatNumber(stats.totalInstallations)} icon={Building2} color="#059669" delay={0.0} />
        <StatCard title="Actives" value={formatNumber(stats.actives)} icon={Activity} color="#10b981" subtitle="< 7 jours" delay={0.05} />
        <StatCard title="Inactives" value={formatNumber(stats.inactives)} icon={AlertTriangle} color="#f43f5e" subtitle="> 30 jours" delay={0.1} />
        <StatCard title="Total Lots" value={formatNumber(stats.totalLots)} icon={Database} color="#0ea5e9" trend={stats.lotsTrend || undefined} delay={0.15} />
        <StatCard title="Total Prospects" value={formatNumber(stats.totalProspects)} icon={Users} color="#f59e0b" delay={0.2} />
        <StatCard title="Utilisateurs" value={formatNumber(stats.totalUsers)} icon={Users} color="#8b5cf6" delay={0.25} />
      </div>

      {/* Cartes KPI complémentaires (telemetry fields) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard title="Documents" value={formatNumber(stats.totalDocuments)} icon={Package} color="#6366f1" delay={0.3} />
        <StatCard title="Lots Vendus" value={formatNumber(stats.totalLotsVendus)} icon={TrendingUp} color="#ec4899" delay={0.35} />
        <StatCard title="Lots Disponibles" value={formatNumber(stats.totalLots - stats.totalLotsVendus)} icon={Package} color="#14b8a3" delay={0.4} />
        <StatCard title="Relances Programmées" value={formatNumber(stats.totalRelances)} icon={CalendarDays} color="#f97316" delay={0.45} />
      </div>

      {/* Graphiques principaux (Ligne & Barres) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard 
          title="Activité des installations" 
          subtitle="Évolution du volume de lots gérés sur 30 jours"
          action={
            <span className="geo-chart-card-badge">
              Temps réel
            </span>
          }
        >
          <div className="h-56 pt-2">
            {stats.activityLabels.length > 0 ? (
              <Line
                data={{
                  labels: stats.activityLabels,
                  datasets: [{
                    label: 'Lots',
                    data: stats.activityValues,
                    borderColor: '#059669',
                    backgroundColor: (context) => {
                      const ctx = context.chart.ctx;
                      const gradient = ctx.createLinearGradient(0, 0, 0, 300);
                      gradient.addColorStop(0, 'rgba(5, 150, 105, 0.25)');
                      gradient.addColorStop(1, 'rgba(5, 150, 105, 0.0)');
                      return gradient;
                    },
                    fill: true,
                    tension: 0.4,
                    borderWidth: 3,
                    pointRadius: 0,
                    pointHoverRadius: 6,
                    pointBackgroundColor: '#059669',
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 2,
                  }],
                }}
                options={lineOptions}
              />
            ) : (
              <EmptyState title="Aucune donnée" message="En attente de télémétrie" />
            )}
          </div>
        </ChartCard>

        <ChartCard 
          title="Croissance des installations" 
          subtitle="Nombre de nouvelles installations par mois"
        >
          <div className="h-56 pt-2">
            {stats.growthLabels.length > 0 ? (
              <Bar
                data={{
                  labels: stats.growthLabels,
                  datasets: [{
                    label: 'Nouvelles installations',
                    data: stats.growthValues,
                    backgroundColor: '#10b981',
                    borderRadius: 12,
                    borderSkipped: false,
                  }],
                }}
                options={barOptions}
              />
            ) : (
              <EmptyState title="Aucune donnée" message="Pas d'installations enregistrées" />
            )}
          </div>
        </ChartCard>
      </div>

      {/* Graphiques secondaires (Donut versions & Top Clients) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard 
          title="Répartition des versions" 
          subtitle="Part de marché des versions logicielles"
        >
          <div className="h-56 flex items-center justify-center pt-2">
            {stats.versionLabels.length > 0 ? (
              <div className="w-full h-full max-w-sm">
                <Doughnut
                  data={{
                    labels: stats.versionLabels,
                    datasets: [{
                      data: stats.versionValues,
                      backgroundColor: ['#059669', '#0ea5e9', '#f59e0b', '#8b5cf6', '#64748b'],
                      borderWidth: 4,
                      borderColor: document.documentElement.classList.contains('dark') ? '#111827' : '#ffffff',
                      hoverOffset: 6,
                    }],
                  }}
                  options={doughnutOptions}
                />
              </div>
            ) : (
              <EmptyState title="Aucune version" message="Pas de données disponibles" />
            )}
          </div>
        </ChartCard>

        <ChartCard 
          title="Top 5 clients" 
          subtitle="Classement des clients par nombre de lots fonciers"
        >
          <div className="h-56 pt-2">
            {stats.topClients.length > 0 ? (
              <Bar
                data={{
                  labels: stats.topClients.map(c => c.nom_client || 'Client inconnu'),
                  datasets: [{
                    label: 'Nombre de lots',
                    data: stats.topClients.map(c => c.nb_lots),
                    backgroundColor: '#0ea5e9',
                    borderRadius: 10,
                    borderSkipped: false,
                  }],
                }}
                options={horizontalOptions}
              />
            ) : (
              <EmptyState title="Aucun client" message="Pas de données disponibles" />
            )}
          </div>
        </ChartCard>
      </div>

      {/* Activités Récentes - Tableau premium */}
      <div className="geo-chart-card">
        <div className="geo-chart-card-header">
          <div>
            <h2 className="geo-chart-card-title">Activités récentes</h2>
            <p className="geo-chart-card-subtitle">Les 10 dernières actions enregistrées sur le système</p>
          </div>
        </div>
        <DataTable
          columns={activityColumns}
          data={activites}
          pageSize={10}
          emptyMessage="Aucune activité récente"
        />
      </div>
    </div>
  )
}