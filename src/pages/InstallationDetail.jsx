import { useState, useEffect, useMemo, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Building2, Users, Target, Activity, AlertTriangle, Mail, Monitor, Phone, MapPin, Server, CalendarDays, Clock } from 'lucide-react'
import { useInstallation } from '../hooks/useInstallations'
import { useTelemetry } from '../hooks/useTelemetry'
import { useActivites } from '../hooks/useActivites'
import { useErreurs } from '../hooks/useErreurs'
import { supabase } from '../lib/supabaseClient'
import LoadingSpinner from '../components/LoadingSpinner'
import EmptyState from '../components/EmptyState'
import DataTable from '../components/DataTable'
import { formatDate, formatNumber, formatRelative } from '../utils/format'
import { STATUTS } from '../utils/constants'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js'
import { Line } from 'react-chartjs-2'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler
)

// ============================================
// PAGE - DÉTAIL D'UNE ENTREPRISE / INSTALLATION
// ============================================

export default function InstallationDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { installation, loading: loadingInst, error: errorInst } = useInstallation(id)
  const { telemetry, loading: loadingTel, error: errorTel } = useTelemetry({ days: 30, installationId: id })
  const { activites, loading: loadingAct, error: errorAct } = useActivites({ installationId: id, limit: 100 })
  const { erreurs, loading: loadingErr, error: errorErr } = useErreurs({ installationId: id, limit: 20 })

    // Chargement de la LISTE RÉELLE des utilisateurs depuis la table
  // utilisateurs_entreprise (base maître) : noms, postes, emails, rôles.
  // Les emails manquants sont complétés depuis activites_globales
  // (MÊME LOGIQUE que le tableau "Activités récentes" : colonne user_email).
  const [utilisateurs, setUtilisateurs] = useState([])
  const [loadingUsers, setLoadingUsers] = useState(true)

  useEffect(() => {
    const fetchUtilisateurs = async () => {
      if (!id) {
        setLoadingUsers(false)
        return
      }
      try {
        setLoadingUsers(true)
        // Une entreprise peut avoir plusieurs installations (appareils) :
        // on charge les utilisateurs de l'installation demandée.
        const { data, error } = await supabase
          .from('utilisateurs_entreprise')
          .select('*')
          .eq('installation_id', id)
          .order('role', { ascending: true })

        if (error) throw error
        let users = data || []

        // ===== COMPLÉTION DES EMAILS depuis les activités =====
        // Le tableau "Activités récentes" affiche user_email issu de
        // activites_globales. On applique la MÊME source ici : pour chaque
        // utilisateur sans email, on cherche son email dans l'historique
        // des activités (correspondance par nom d'utilisateur, en prenant
        // l'email de l'activité la plus récente).
        try {
          const { data: acts } = await supabase
            .from('activites_globales')
            .select('user_name, user_email, created_at')
            .eq('installation_id', id)
            .order('created_at', { ascending: false })

          if (acts && acts.length > 0) {
            // Map : nom d'utilisateur (minuscules, trimé) → email le plus récent
            const emailByName = new Map()
            acts.forEach(a => {
              const key = (a.user_name || '').trim().toLowerCase()
              if (!key) return
              const email = (a.user_email || '').trim()
              if (email && !emailByName.has(key)) {
                emailByName.set(key, email)
              }
            })
            users = users.map(u => {
              const email = (u.user_email || '').trim()
              if (email) return u
              const found = emailByName.get((u.nom || '').trim().toLowerCase())
              return found ? { ...u, user_email: found } : u
            })
          }
        } catch (emailErr) {
          console.warn('[Detail] Complétion emails depuis activités non disponible:', emailErr.message)
        }

        // ===== DÉDOUBLONNAGE =====
        // Un même utilisateur peut apparaître plusieurs fois (chaque appareil de
        // l'entreprise a pu créer sa propre ligne). On conserve UNE ligne par
        // utilisateur, en privilégiant celle qui a l'email puis la plus récente.
        const seenKeys = new Set()
        const deduped = []
        // Priorité : les lignes avec email passent devant celles sans email
        const sortedForDedup = [...users].sort((a, b) => {
          const ea = (a.user_email || '').trim() ? 1 : 0
          const eb = (b.user_email || '').trim() ? 1 : 0
          if (ea !== eb) return eb - ea
          return (new Date(b.derniere_maj || 0) - new Date(a.derniere_maj || 0))
        })
        for (const u of sortedForDedup) {
          const key = (u.user_email || '').trim().toLowerCase()
            || (u.nom || '').trim().toLowerCase()
          if (!key) continue
          if (seenKeys.has(key)) continue
          seenKeys.add(key)
          deduped.push(u)
        }
        users = deduped

        setUtilisateurs(users)
      } catch (err) {
        console.warn('[Detail] Liste utilisateurs non disponible:', err.message)
        setUtilisateurs([])
      } finally {
        setLoadingUsers(false)
      }
    }
    fetchUtilisateurs()
  }, [id])

  
  // Dernière télémétrie pour les statistiques
  const lastTelemetry = useMemo(() => {
    return telemetry.length > 0 ? telemetry[telemetry.length - 1] : null
  }, [telemetry])

  // Données pour le graphique d'activité
  const activityData = useMemo(() => {
    return telemetry.reduce((acc, t) => {
      const date = new Date(t.date_releve).toLocaleDateString('fr-FR')
      acc[date] = (acc[date] || 0) + (t.nb_lots || 0)
      return acc
    }, {})
  }, [telemetry])

  const activityLabels = Object.keys(activityData)
  const activityValues = Object.values(activityData)

  if (loadingInst || loadingTel || loadingAct || loadingErr || loadingUsers) {
    return <LoadingSpinner message="Chargement des détails de l'entreprise..." />
  }

  if (errorInst || !installation) {
    return <EmptyState title="Entreprise introuvable" message={errorInst} />
  }

  const statut = STATUTS[installation.statut] || STATUTS.inactif
  const badgeClass = installation.statut === 'actif' ? 'geo-badge-green' : installation.statut === 'inactif' ? 'geo-badge-red' : 'geo-badge-gray'

  // Colonnes du tableau des utilisateurs
  const activityColumns = [
    { key: 'user_name', label: 'Utilisateur', sortable: true },
    { key: 'user_position', label: 'Poste', sortable: true },
    {
      key: 'user_email',
      label: 'Email',
      sortable: true,
      render: (row) => <span className="text-xs">{row.user_email || '—'}</span>,
    },
    {
      key: 'telephone',
      label: 'Téléphone',
      sortable: true,
      render: (row) => <span className="text-xs">{row.telephone || '—'}</span>,
    },
    {
      key: 'systeme_os',
      label: 'Système',
      sortable: true,
      render: (row) => (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium">
          <Monitor size={13} style={{ color: '#0C8E37' }} />
          {row.systeme_os || '—'}
        </span>
      ),
    },
    { key: 'action', label: 'Action', sortable: true },
    { key: 'details', label: 'Détails' },
    {
      key: 'created_at',
      label: 'Quand',
      sortable: true,
      render: (row) => <span className="text-xs">{formatRelative(row.created_at)}</span>,
    },
  ]

  // Colonnes des erreurs
  const errorColumns = [
    {
      key: 'created_at',
      label: 'Date',
      sortable: true,
      render: (row) => <span className="text-xs">{formatDate(row.created_at)}</span>,
    },
    { key: 'message', label: 'Message', sortable: true },
    { key: 'contexte', label: 'Contexte' },
    { key: 'version_logiciel', label: 'Version', sortable: true },
  ]

  return (
    <div className="space-y-6">
      {/* Bouton retour */}
      <button
        onClick={() => navigate('/installations')}
        className="geo-btn geo-btn-secondary"
      >
        <ArrowLeft size={16} />
        Retour aux entreprises
      </button>

      {/* En-tête entreprise premium */}
      <div className="geo-hero">
        <div className="geo-hero-content">
          <div>
            <div className="geo-hero-badge">
              <MapPin size={13} />
              <span>Entreprise Cliente GéoLotis</span>
            </div>
            <h1 className="mt-4">{installation.nom_client}</h1>
            <div className="mt-3 flex flex-wrap items-center gap-4">
              <span className="inline-flex items-center gap-2 text-sm" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                <Mail size={14} />
                {installation.email_contact || 'Email non renseigné'}
              </span>
              <span className="inline-flex items-center gap-2 text-sm" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                <Phone size={14} />
                {installation.telephone || 'Téléphone non renseigné'}
              </span>
            </div>
          </div>
          <span className={`geo-badge ${badgeClass}`}>
            {statut.label}
          </span>
        </div>
      </div>

      {/* Statistiques principales premium */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="geo-kpi-card">
          <div className="flex items-center gap-3">
            <div className="geo-kpi-card-icon" style={{ backgroundColor: 'rgba(12, 142, 55, 0.1)', color: '#0C8E37' }}>
              <Building2 size={24} />
            </div>
            <div>
              <p className="geo-kpi-card-label">Lots</p>
              <p className="geo-kpi-card-value">{formatNumber(lastTelemetry?.nb_lots ?? 0)}</p>
            </div>
          </div>
        </div>
        <div className="geo-kpi-card">
          <div className="flex items-center gap-3">
            <div className="geo-kpi-card-icon" style={{ backgroundColor: 'rgba(243, 146, 0, 0.1)', color: '#F39200' }}>
              <Target size={24} />
            </div>
            <div>
              <p className="geo-kpi-card-label">Prospects</p>
              <p className="geo-kpi-card-value">{formatNumber(lastTelemetry?.nb_prospects ?? 0)}</p>
            </div>
          </div>
        </div>
        <div className="geo-kpi-card">
          <div className="flex items-center gap-3">
            <div className="geo-kpi-card-icon" style={{ backgroundColor: 'rgba(49, 130, 206, 0.1)', color: '#3182ce' }}>
              <Users size={24} />
            </div>
            <div>
              <p className="geo-kpi-card-label">Utilisateurs</p>
              <p className="geo-kpi-card-value">{formatNumber(lastTelemetry?.nb_utilisateurs ?? 0)}</p>
            </div>
          </div>
        </div>
        <div className="geo-kpi-card">
          <div className="flex items-center gap-3">
            <div className="geo-kpi-card-icon" style={{ backgroundColor: 'rgba(107, 127, 114, 0.1)', color: '#6B7F72' }}>
              <Server size={24} />
            </div>
            <div>
              <p className="geo-kpi-card-label">Version</p>
              <p className="geo-kpi-card-value">{installation.version_logiciel || '—'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Informations système */}
      <div className="geo-chart-card">
        <div className="geo-chart-card-header">
          <h2 className="geo-chart-card-title">Informations système</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl" style={{ backgroundColor: 'rgba(12, 142, 55, 0.03)', border: '1px solid rgba(12, 142, 55, 0.1)' }}>
            <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Système d'exploitation</p>
            <p className="font-medium mt-1" style={{ color: 'var(--text-primary)' }}>{installation.systeme_os || '—'}</p>
          </div>
          <div className="p-4 rounded-xl" style={{ backgroundColor: 'rgba(12, 142, 55, 0.03)', border: '1px solid rgba(12, 142, 55, 0.1)' }}>
            <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Date de création</p>
            <p className="font-medium mt-1" style={{ color: 'var(--text-primary)' }}>{formatDate(installation.date_installation || installation.created_at)}</p>
          </div>
          <div className="p-4 rounded-xl" style={{ backgroundColor: 'rgba(12, 142, 55, 0.03)', border: '1px solid rgba(12, 142, 55, 0.1)' }}>
            <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Dernière connexion</p>
            <p className="font-medium mt-1" style={{ color: 'var(--text-primary)' }}>{formatDate(installation.derniere_connexion)}</p>
          </div>
          <div className="p-4 rounded-xl" style={{ backgroundColor: 'rgba(12, 142, 55, 0.03)', border: '1px solid rgba(12, 142, 55, 0.1)' }}>
            <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Email de l'administrateur</p>
            <p className="font-medium mt-1" style={{ color: 'var(--text-primary)' }}>{installation.email_contact || '—'}</p>
          </div>
                    <div className="p-4 rounded-xl" style={{ backgroundColor: 'rgba(12, 142, 55, 0.03)', border: '1px solid rgba(12, 142, 55, 0.1)' }}>
            <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Téléphone de l'administrateur</p>
            <p className="font-medium mt-1" style={{ color: 'var(--text-primary)' }}>{installation.telephone || '—'}</p>
          </div>
        </div>
      </div>

      {/* Utilisateurs réels de l'entreprise (table utilisateurs_entreprise) */}
      <div className="geo-chart-card">
        <div className="geo-chart-card-header">
          <div>
            <h2 className="geo-chart-card-title flex items-center gap-2">
              <Users size={18} style={{ color: '#0C8E37' }} />
              Utilisateurs de l'entreprise
            </h2>
            <p className="geo-chart-card-subtitle">
              {utilisateurs.length} utilisateur{utilisateurs.length > 1 ? 's' : ''} enregistré{utilisateurs.length > 1 ? 's' : ''}
            </p>
          </div>
        </div>
        {utilisateurs.length > 0 ? (
          <DataTable
            columns={[
              { key: 'nom', label: 'Nom', sortable: true },
              { key: 'poste', label: 'Poste', sortable: true },
              {
                key: 'user_email',
                label: 'Email',
                sortable: true,
                render: (row) => <span className="text-xs">{row.user_email || '—'}</span>,
              },
              {
                key: 'role',
                label: 'Rôle',
                sortable: true,
                render: (row) => (
                  <span className={`geo-badge ${row.role === 'Administrateur' ? 'geo-badge-green' : 'geo-badge-blue'}`}>
                    {row.role}
                  </span>
                ),
              },
              {
                key: 'statut',
                label: 'Statut',
                sortable: true,
                render: (row) => (
                  <span className={`geo-badge ${row.statut === 'actif' ? 'geo-badge-green' : 'geo-badge-red'}`}>
                    {row.statut === 'actif' ? 'Actif' : 'Inactif'}
                  </span>
                ),
              },
              {
                key: 'derniere_maj',
                label: 'Dernière MAJ',
                sortable: true,
                render: (row) => <span className="text-xs">{formatDate(row.derniere_maj)}</span>,
              },
            ]}
            data={utilisateurs}
            pageSize={10}
            emptyMessage="Aucun utilisateur"
          />
        ) : (
          <EmptyState
            title="Aucun utilisateur enregistré"
            message="La liste des utilisateurs apparaîtra ici dès que le logiciel client enverra ses profils (télémétrie)."
          />
        )}
      </div>

      {/* Graphique d'activité */}
      <div className="geo-chart-card">
        <div className="geo-chart-card-header">
          <div>
            <h2 className="geo-chart-card-title">Activité (30 derniers jours)</h2>
            <p className="geo-chart-card-subtitle">Évolution du nombre de lots gérés</p>
          </div>
        </div>
        {activityLabels.length > 0 ? (
          <div className="h-56">
            <Line
              data={{
                labels: activityLabels,
                datasets: [{
                  label: 'Lots',
                  data: activityValues,
                  borderColor: '#0C8E37',
                  backgroundColor: 'rgba(12, 142, 55, 0.1)',
                  fill: true,
                  tension: 0.4,
                  borderWidth: 3,
                  pointRadius: 0,
                  pointHoverRadius: 6,
                  pointBackgroundColor: '#0C8E37',
                  pointBorderColor: '#ffffff',
                  pointBorderWidth: 2,
                }],
              }}
              options={{
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
              }}
            />
          </div>
        ) : (
          <EmptyState title="Aucune activité" message="Pas de données de télémétrie pour cette entreprise" />
        )}
      </div>

      {/* Activités récentes */}
      <div className="geo-chart-card">
        <div className="geo-chart-card-header">
          <div>
            <h2 className="geo-chart-card-title">Activités récentes</h2>
            <p className="geo-chart-card-subtitle">Mouvements récents de cette entreprise</p>
          </div>
        </div>
        <DataTable
          columns={activityColumns}
          data={activites}
          pageSize={10}
          emptyMessage="Aucune activité pour cette entreprise"
        />
      </div>

      {/* Erreurs */}
      <div className="geo-chart-card">
        <div className="geo-chart-card-header">
          <div>
            <h2 className="geo-chart-card-title flex items-center gap-2">
              <AlertTriangle size={18} style={{ color: '#e53e3e' }} />
              Erreurs
            </h2>
            <p className="geo-chart-card-subtitle">
              {erreurs.length} erreur{erreurs.length > 1 ? 's' : ''} enregistrée{erreurs.length > 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <DataTable
          columns={errorColumns}
          data={erreurs}
          pageSize={10}
          emptyMessage="Aucune erreur pour cette entreprise"
        />
      </div>
    </div>
  )
}
