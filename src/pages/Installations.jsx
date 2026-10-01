import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useInstallations } from '../hooks/useInstallations'
import { useTelemetry } from '../hooks/useTelemetry'
import DataTable from '../components/DataTable'
import FilterBar from '../components/FilterBar'
import LoadingSpinner from '../components/LoadingSpinner'
import EmptyState from '../components/EmptyState'
import { formatDate, formatNumber, formatRelative } from '../utils/format'
import { STATUTS, PERIODES } from '../utils/constants'
import { Building2, Activity, AlertCircle, Server, Users, Database } from 'lucide-react'

// ============================================
// PAGE - LISTE DES ENTREPRISES / CLIENTS
// ============================================

export default function Installations() {
  const navigate = useNavigate()
  // Récupère la recherche globale depuis l'URL (?q=...) envoyée par la TopBar
  const [searchParams] = useSearchParams()
  const initialSearch = searchParams.get('q') || ''

  const { installations, loading, error, refetch } = useInstallations()
  const { telemetry } = useTelemetry({ days: 90 })
  const [filters, setFilters] = useState({
    search: initialSearch,
    statut: '',
    version: '',
    periode: '',
  })

  if (loading) {
    return <LoadingSpinner message="Chargement des entreprises..." />
  }

  if (error) {
    return <EmptyState title="Erreur de chargement" message={error} />
  }

  // Dernière télémétrie par installation (pour les colonnes Nb lots / prospects / utilisateurs)
  const latestTelemetryByInst = telemetry.reduce((acc, t) => {
    const existing = acc[t.installation_id]
    if (!existing || new Date(t.date_releve) > new Date(existing.date_releve)) {
      acc[t.installation_id] = t
    }
    return acc
  }, {})

  // Agrège la télémétrie sur toutes les instances d'une entreprise (max)
  const getCompanyMetric = (inst, field) => {
    const ids = (inst.instances && inst.instances.length > 0 ? inst.instances : [inst]).map(i => i.installation_id)
    const vals = ids.map(id => latestTelemetryByInst[id]?.[field] || 0).filter(v => v > 0)
    return vals.length > 0 ? Math.max(...vals) : 0
  }

  // Récupère les versions uniques pour le filtre
  const versions = [...new Set(installations.map(i => i.version_logiciel).filter(Boolean))]

  // Filtrage des données
  const filteredData = installations.filter(inst => {
    const searchTarget = `${inst.nom_client || ''} ${inst.email_contact || ''} ${inst.telephone || ''}`.toLowerCase()
    if (filters.search && !searchTarget.includes(filters.search.toLowerCase())) return false
    if (filters.statut && inst.statut !== filters.statut) return false
    if (filters.version && inst.version_logiciel !== filters.version) return false
    if (filters.periode) {
      const days = parseInt(filters.periode)
      const lastConn = new Date(inst.derniere_connexion)
      const diffDays = (Date.now() - lastConn.getTime()) / (1000 * 60 * 60 * 24)
      if (diffDays > days) return false
    }
    return true
  })

  // Badge de statut
  const renderStatut = (row) => {
    const statut = STATUTS[row.statut] || STATUTS.inactif
    const badgeClass = row.statut === 'actif' ? 'geo-badge-green' : row.statut === 'inactif' ? 'geo-badge-red' : 'geo-badge-gray'
    return (
      <span className={`geo-badge ${badgeClass}`}>
        {statut.label}
      </span>
    )
  }

    // Colonnes du tableau complet (conforme au cahier des charges)
  const columns = [
    { key: 'nom_client', label: 'Nom du client', sortable: true },
    {
      key: 'version_logiciel',
      label: 'Version',
      sortable: true,
      render: (row) => <span className="geo-badge geo-badge-blue">v{row.version_logiciel || '—'}</span>,
    },
    {
      key: 'systeme_os',
      label: 'OS',
      sortable: true,
      render: (row) => <span className="text-xs">{row.systeme_os || '—'}</span>,
    },
    {
      key: 'email_contact',
      label: "Email de l'administrateur",
      sortable: true,
      render: (row) => <span className="text-xs">{row.email_contact || '—'}</span>,
    },
    {
      key: 'telephone',
      label: "Téléphone",
      sortable: true,
      render: (row) => <span className="text-xs">{row.telephone || '—'}</span>,
    },
    {
      key: 'nb_lots',
      label: 'Nb lots',
      sortable: true,
      render: (row) => <span className="font-medium">{formatNumber(getCompanyMetric(row, 'nb_lots'))}</span>,
    },
    {
      key: 'nb_prospects',
      label: 'Nb prospects',
      sortable: true,
      render: (row) => <span>{formatNumber(getCompanyMetric(row, 'nb_prospects'))}</span>,
    },
    {
      key: 'nb_utilisateurs',
      label: 'Nb utilisateurs',
      sortable: true,
      render: (row) => <span>{formatNumber(getCompanyMetric(row, 'nb_utilisateurs'))}</span>,
    },
    {
      key: 'date_installation',
      label: 'Date de création',
      sortable: true,
      render: (row) => <span className="text-xs">{formatDate(row.date_installation || row.created_at)}</span>,
    },
    { key: 'statut', label: 'Statut', sortable: true, render: renderStatut },
    {
      key: 'derniere_connexion',
      label: 'Dernière connexion',
      sortable: true,
      render: (row) => <span className="text-xs">{formatRelative(row.derniere_connexion)}</span>,
    },
  ]

  // Filtres
  const filterConfig = [
    {
      type: 'search',
      key: 'search',
      placeholder: 'Rechercher une entreprise ou admin...',
      value: filters.search,
    },
    {
      type: 'select',
      key: 'statut',
      placeholder: 'Tous les statuts',
      options: Object.entries(STATUTS).map(([value, s]) => ({ value, label: s.label })),
      value: filters.statut,
    },
    {
      type: 'select',
      key: 'version',
      placeholder: 'Toutes les versions',
      options: versions.map(v => ({ value: v, label: v })),
      value: filters.version,
    },
    {
      type: 'select',
      key: 'periode',
      placeholder: 'Dernière connexion',
      options: PERIODES,
      value: filters.periode,
    },
  ]

  // Resumé rapide
  const actives = installations.filter(i => {
    const diffDays = (Date.now() - new Date(i.derniere_connexion).getTime()) / (1000 * 60 * 60 * 24)
    return diffDays < 30
  }).length

  const versionsCount = new Set(installations.map(i => i.version_logiciel).filter(Boolean)).size

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div>
        <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Entreprises</h2>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
          Gestion et suivi de toutes les entreprises clientes de GéoLotis.
        </p>
      </div>

      {/* Stats rapides premium */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="geo-kpi-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="geo-kpi-card-label">Entreprises</p>
              <p className="geo-kpi-card-value">{formatNumber(filteredData.length)}</p>
            </div>
            <div className="geo-kpi-card-icon" style={{ backgroundColor: 'rgba(12, 142, 55, 0.1)', color: '#0C8E37' }}>
              <Building2 size={22} />
            </div>
          </div>
        </div>
        <div className="geo-kpi-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="geo-kpi-card-label">Actives</p>
              <p className="geo-kpi-card-value">{formatNumber(actives)}</p>
            </div>
            <div className="geo-kpi-card-icon" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
              <Activity size={22} />
            </div>
          </div>
        </div>
        <div className="geo-kpi-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="geo-kpi-card-label">Inactives</p>
              <p className="geo-kpi-card-value">{formatNumber(installations.length - actives)}</p>
            </div>
            <div className="geo-kpi-card-icon" style={{ backgroundColor: 'rgba(229, 62, 62, 0.1)', color: '#e53e3e' }}>
              <AlertCircle size={22} />
            </div>
          </div>
        </div>
        <div className="geo-kpi-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="geo-kpi-card-label">Versions</p>
              <p className="geo-kpi-card-value">{formatNumber(versionsCount)}</p>
            </div>
            <div className="geo-kpi-card-icon" style={{ backgroundColor: 'rgba(49, 130, 206, 0.1)', color: '#3182ce' }}>
              <Server size={22} />
            </div>
          </div>
        </div>
      </div>

      {/* Tableau */}
      <div className="geo-chart-card">
        <div className="geo-chart-card-header">
          <div>
            <h2 className="geo-chart-card-title">Liste des entreprises</h2>
            <p className="geo-chart-card-subtitle">
              {filteredData.length} entreprise{filteredData.length > 1 ? 's' : ''} enregistrée{filteredData.length > 1 ? 's' : ''}
            </p>
          </div>
        </div>

        <FilterBar filters={filterConfig} onFilterChange={setFilters} />

        <DataTable
          columns={columns}
          data={filteredData}
          onRowClick={(row) => navigate(`/installations/${row.installation_id}`)}
          emptyMessage="Aucune entreprise trouvée"
        />
      </div>
    </div>
  )
}
