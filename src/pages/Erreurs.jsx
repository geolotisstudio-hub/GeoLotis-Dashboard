import { useState } from 'react'
import { useErreurs } from '../hooks/useErreurs'
import DataTable from '../components/DataTable'
import FilterBar from '../components/FilterBar'
import LoadingSpinner from '../components/LoadingSpinner'
import EmptyState from '../components/EmptyState'
import { formatDate, formatNumber } from '../utils/format'
import { AlertTriangle, Bug, Server, ShieldAlert } from 'lucide-react'

// ============================================
// PAGE - LISTE DES ERREURS
// ============================================

export default function Erreurs() {
  const { erreurs, loading, error } = useErreurs({ limit: 100 })
  const [filters, setFilters] = useState({
    search: '',
    version: '',
  })

  if (loading) {
    return <LoadingSpinner message="Chargement des erreurs..." />
  }

  if (error) {
    return <EmptyState title="Erreur de chargement" message={error} />
  }

  // Récupère les versions uniques
  const versions = [...new Set(erreurs.map(e => e.version_logiciel).filter(Boolean))]

  // Filtrage des données
  const filteredData = erreurs.filter(err => {
    // Recherche par installation
    if (filters.search && !err.installation_id?.toLowerCase().includes(filters.search.toLowerCase())) {
      return false
    }
    // Filtre par version
    if (filters.version && err.version_logiciel !== filters.version) {
      return false
    }
    return true
  })

  // Colonnes du tableau
  const columns = [
    {
      key: 'created_at',
      label: 'Date',
      sortable: true,
      render: (row) => <span className="text-xs">{formatDate(row.created_at)}</span>,
    },
    { key: 'installation_id', label: 'Installation', sortable: true },
    { key: 'version_logiciel', label: 'Version', sortable: true },
    { key: 'message', label: 'Message d\u2019erreur', sortable: true },
    { key: 'contexte', label: 'Contexte' },
  ]

  // Filtres
  const filterConfig = [
    {
      type: 'search',
      key: 'search',
      placeholder: 'Rechercher une installation...',
      value: filters.search,
    },
    {
      type: 'select',
      key: 'version',
      placeholder: 'Toutes les versions',
      options: versions.map(v => ({ value: v, label: v })),
      value: filters.version,
    },
  ]

  // Statistiques des erreurs
  const stats = {
    total: erreurs.length,
    versions: versions.length,
    installations: new Set(erreurs.map(e => e.installation_id)).size,
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div>
        <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Erreurs</h2>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
          Suivi des erreurs rencontrées sur l'ensemble des installations.
        </p>
      </div>

      {/* Statistiques premium */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="geo-kpi-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="geo-kpi-card-label">Total erreurs</p>
              <p className="geo-kpi-card-value">{formatNumber(stats.total)}</p>
            </div>
            <div className="geo-kpi-card-icon" style={{ backgroundColor: 'rgba(229, 62, 62, 0.1)', color: '#e53e3e' }}>
              <Bug size={22} />
            </div>
          </div>
        </div>
        <div className="geo-kpi-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="geo-kpi-card-label">Versions concernées</p>
              <p className="geo-kpi-card-value">{formatNumber(stats.versions)}</p>
            </div>
            <div className="geo-kpi-card-icon" style={{ backgroundColor: 'rgba(49, 130, 206, 0.1)', color: '#3182ce' }}>
              <Server size={22} />
            </div>
          </div>
        </div>
        <div className="geo-kpi-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="geo-kpi-card-label">Installations concernées</p>
              <p className="geo-kpi-card-value">{formatNumber(stats.installations)}</p>
            </div>
            <div className="geo-kpi-card-icon" style={{ backgroundColor: 'rgba(243, 146, 0, 0.1)', color: '#F39200' }}>
              <ShieldAlert size={22} />
            </div>
          </div>
        </div>
      </div>

      {/* Tableau des erreurs */}
      <div className="geo-chart-card">
        <div className="geo-chart-card-header">
          <div>
            <h2 className="geo-chart-card-title">Liste des erreurs</h2>
            <p className="geo-chart-card-subtitle">
              {filteredData.length} erreur{filteredData.length > 1 ? 's' : ''} enregistrée{filteredData.length > 1 ? 's' : ''}
            </p>
          </div>
        </div>

        <FilterBar filters={filterConfig} onFilterChange={setFilters} />

        <DataTable
          columns={columns}
          data={filteredData}
          pageSize={15}
          emptyMessage="Aucune erreur trouvée"
        />
      </div>
    </div>
  )
}