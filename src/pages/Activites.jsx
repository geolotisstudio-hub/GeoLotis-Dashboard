import { useState } from 'react'
import { useActivites } from '../hooks/useActivites'
import DataTable from '../components/DataTable'
import FilterBar from '../components/FilterBar'
import LoadingSpinner from '../components/LoadingSpinner'
import EmptyState from '../components/EmptyState'
import { formatDate, formatRelative } from '../utils/format'
import { ACTIONS } from '../utils/constants'
import { Activity, User, CalendarDays, ListChecks } from 'lucide-react'

// ============================================
// PAGE - JOURNAL D'ACTIVITÉS GLOBAL
// ============================================

export default function Activites() {
  const { activites, loading, error } = useActivites({ limit: 100 })
  const [filters, setFilters] = useState({
    search: '',
    action: '',
    dateDebut: '',
    dateFin: '',
  })

  if (loading) {
    return <LoadingSpinner message="Chargement des activités..." />
  }

  if (error) {
    return <EmptyState title="Erreur de chargement" message={error} />
  }

  // Filtrage des données
  const filteredData = activites.filter(act => {
    // Recherche par client
    if (filters.search && !act.user_name?.toLowerCase().includes(filters.search.toLowerCase())) {
      return false
    }
    // Filtre par action
    if (filters.action && act.action !== filters.action) {
      return false
    }
    // Filtre par période
    if (filters.dateDebut && new Date(act.created_at) < new Date(filters.dateDebut)) {
      return false
    }
    if (filters.dateFin && new Date(act.created_at) > new Date(filters.dateFin)) {
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
      render: (row) => (
        <div>
          <p className="text-xs font-medium">{formatDate(row.created_at)}</p>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{formatRelative(row.created_at)}</p>
        </div>
      ),
    },
    { key: 'installation_id', label: 'Installation', sortable: true },
    { key: 'user_name', label: 'Utilisateur', sortable: true },
    { key: 'user_position', label: 'Poste', sortable: true },
    {
      key: 'action',
      label: 'Action',
      sortable: true,
      render: (row) => (
        <span className="geo-badge geo-badge-blue">{row.action}</span>
      ),
    },
    { key: 'details', label: 'Détails' },
  ]

  // Filtres
  const filterConfig = [
    {
      type: 'search',
      key: 'search',
      placeholder: 'Rechercher un utilisateur...',
      value: filters.search,
    },
    {
      type: 'select',
      key: 'action',
      placeholder: 'Toutes les actions',
      options: ACTIONS.map(a => ({ value: a, label: a })),
      value: filters.action,
    },
    {
      type: 'date',
      key: 'dateDebut',
      value: filters.dateDebut,
    },
    {
      type: 'date',
      key: 'dateFin',
      value: filters.dateFin,
    },
  ]

  // Stats rapides
  const uniqueUsers = new Set(activites.map(a => a.user_name).filter(Boolean)).size
  const uniqueActions = new Set(activites.map(a => a.action).filter(Boolean)).size

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div>
        <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Journal d'activités</h2>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
          Suivi des actions effectuées par les utilisateurs sur l'ensemble des installations.
        </p>
      </div>

      {/* Stats rapides */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="geo-kpi-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="geo-kpi-card-label">Total activités</p>
              <p className="geo-kpi-card-value">{filteredData.length}</p>
            </div>
            <div className="geo-kpi-card-icon" style={{ backgroundColor: 'rgba(12, 142, 55, 0.1)', color: '#0C8E37' }}>
              <Activity size={22} />
            </div>
          </div>
        </div>
        <div className="geo-kpi-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="geo-kpi-card-label">Utilisateurs</p>
              <p className="geo-kpi-card-value">{uniqueUsers}</p>
            </div>
            <div className="geo-kpi-card-icon" style={{ backgroundColor: 'rgba(49, 130, 206, 0.1)', color: '#3182ce' }}>
              <User size={22} />
            </div>
          </div>
        </div>
        <div className="geo-kpi-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="geo-kpi-card-label">Actions distinctes</p>
              <p className="geo-kpi-card-value">{uniqueActions}</p>
            </div>
            <div className="geo-kpi-card-icon" style={{ backgroundColor: 'rgba(243, 146, 0, 0.1)', color: '#F39200' }}>
              <ListChecks size={22} />
            </div>
          </div>
        </div>
      </div>

      {/* Tableau */}
      <div className="geo-chart-card">
        <div className="geo-chart-card-header">
          <div>
            <h2 className="geo-chart-card-title">Journal des activités</h2>
            <p className="geo-chart-card-subtitle">
              {filteredData.length} activité{filteredData.length > 1 ? 's' : ''} enregistrée{filteredData.length > 1 ? 's' : ''}
            </p>
          </div>
        </div>

        <FilterBar filters={filterConfig} onFilterChange={setFilters} />

        <DataTable
          columns={columns}
          data={filteredData}
          pageSize={15}
          emptyMessage="Aucune activité trouvée"
        />
      </div>
    </div>
  )
}