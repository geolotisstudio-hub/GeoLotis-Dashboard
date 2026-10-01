import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useInstallations } from '../hooks/useInstallations'
import LoadingSpinner from '../components/LoadingSpinner'
import { isTableMissingError } from '../utils/supabaseErrors'
import { toast } from 'sonner'
import { Users, Download, Palette, UserPlus, Trash2, Map, Settings, Shield, Database } from 'lucide-react'

// ============================================
// PAGE - PARAMÈTRES
// ============================================

export default function Parametres() {
  const { installations, loading: loadingInst } = useInstallations()
  const [admins, setAdmins] = useState([])
  const [loadingAdmins, setLoadingAdmins] = useState(true)
  const [newAdmin, setNewAdmin] = useState({ email: '', full_name: '', role: 'admin' })
  const [dashboardConfig, setDashboardConfig] = useState({
    nom: 'GéoLotis',
    couleur: '#0C8E37',
  })

  // Charger les admins
  useEffect(() => {
    fetchAdmins()
  }, [])

  const fetchAdmins = async () => {
    try {
      setLoadingAdmins(true)
      const { data, error } = await supabase
        .from('admin_users')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        if (isTableMissingError(error)) {
          setAdmins([])
          return
        }
        throw error
      }
      setAdmins(data || [])
    } catch (err) {
      toast.error('Erreur lors du chargement des admins')
    } finally {
      setLoadingAdmins(false)
    }
  }

  const addAdmin = async (e) => {
    e.preventDefault()
    if (!newAdmin.email) {
      toast.error('Email requis')
      return
    }

    try {
      const { error } = await supabase
        .from('admin_users')
        .insert([{
          email: newAdmin.email,
          full_name: newAdmin.full_name || newAdmin.email,
          role: newAdmin.role,
          is_active: true,
        }])

      if (error) throw error
      toast.success('Admin ajouté avec succès')
      setNewAdmin({ email: '', full_name: '', role: 'admin' })
      fetchAdmins()
    } catch (err) {
      toast.error(err.message || 'Erreur lors de l\'ajout')
    }
  }

  const deleteAdmin = async (id) => {
    try {
      const { error } = await supabase
        .from('admin_users')
        .delete()
        .eq('id', id)

      if (error) throw error
      toast.success('Admin supprimé')
      fetchAdmins()
    } catch (err) {
      toast.error(err.message || 'Erreur lors de la suppression')
    }
  }

  // Export CSV des installations
  const exportCSV = () => {
    if (installations.length === 0) {
      toast.error('Aucune donnée à exporter')
      return
    }

    const headers = [
      'ID Installation', 'Nom du client', 'Version', 'OS', 'Email',
      'Téléphone', 'Date installation', 'Dernière connexion', 'Statut'
    ]

    const rows = installations.map(i => [
      i.installation_id || '',
      i.nom_client || '',
      i.version_logiciel || '',
      i.systeme_os || '',
      i.email_contact || '',
      i.telephone || '',
      i.date_installation || '',
      i.derniere_connexion || '',
      i.statut || '',
    ])

    const csv = [headers, ...rows]
      .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n')

    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = 'geolotis_installations.csv'
    link.click()
    URL.revokeObjectURL(link.url)
    toast.success('Export CSV téléchargé')
  }

  // Export CSV des activités
  const exportActivitesCSV = async () => {
    try {
      const { data, error } = await supabase
        .from('activites_globales')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1000)

      if (error) throw error
      if (!data || data.length === 0) {
        toast.error('Aucune activité à exporter')
        return
      }

      const headers = ['Date', 'Installation', 'Utilisateur', 'Poste', 'Action', 'Détails']
      const rows = data.map(a => [
        a.created_at || '',
        a.installation_id || '',
        a.user_name || '',
        a.user_position || '',
        a.action || '',
        a.details || '',
      ])

      const csv = [headers, ...rows]
        .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
        .join('\n')

      const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = 'geolotis_activites.csv'
      link.click()
      URL.revokeObjectURL(link.url)
      toast.success('Export des activités téléchargé')
    } catch (err) {
      toast.error(err.message || 'Erreur lors de l\'export')
    }
  }

    // ============================================
  // PERSISTANCE DE LA CONFIGURATION DU DASHBOARD
  // Chargée depuis localStorage au montage, sauvegardée via le bouton.
  // ============================================
  useEffect(() => {
    try {
      const saved = localStorage.getItem('geolotis_dashboard_config')
      if (saved) {
        const parsed = JSON.parse(saved)
        if (parsed.nom || parsed.couleur) {
          setDashboardConfig(prev => ({ ...prev, ...parsed }))
        }
      }
    } catch (e) {}
  }, [])

  const saveDashboardConfig = () => {
    try {
      localStorage.setItem('geolotis_dashboard_config', JSON.stringify(dashboardConfig))
      // Applique la couleur principale en variable CSS globale
      document.documentElement.style.setProperty('--primary', dashboardConfig.couleur)
      toast.success('Configuration sauvegardée')
    } catch (e) {
      toast.error('Impossible de sauvegarder la configuration')
    }
  }

  if (loadingInst || loadingAdmins) {
    return <LoadingSpinner message="Chargement des paramètres..." />
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div>
        <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Paramètres</h2>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
          Configuration du dashboard et gestion des accès
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gestion des admins */}
        <div className="geo-chart-card">
          <div className="geo-chart-card-header">
            <h2 className="geo-chart-card-title flex items-center gap-2">
              <Shield size={18} style={{ color: '#0C8E37' }} />
              Comptes administrateurs
            </h2>
          </div>

          {/* Formulaire d'ajout */}
          <form onSubmit={addAdmin} className="space-y-3 mb-6 p-4 rounded-xl" style={{ backgroundColor: 'rgba(12, 142, 55, 0.03)', border: '1px solid rgba(12, 142, 55, 0.1)' }}>
            <h3 className="text-sm font-medium flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <UserPlus size={16} style={{ color: '#0C8E37' }} />
              Ajouter un admin
            </h3>
            <input
              type="email"
              placeholder="Email"
              value={newAdmin.email}
              onChange={(e) => setNewAdmin({ ...newAdmin, email: e.target.value })}
              className="geo-input"
              required
            />
            <input
              type="text"
              placeholder="Nom complet (optionnel)"
              value={newAdmin.full_name}
              onChange={(e) => setNewAdmin({ ...newAdmin, full_name: e.target.value })}
              className="geo-input"
            />
            <select
              value={newAdmin.role}
              onChange={(e) => setNewAdmin({ ...newAdmin, role: e.target.value })}
              className="geo-input"
            >
              <option value="admin">Admin</option>
              <option value="super_admin">Super Admin</option>
            </select>
            <button type="submit" className="geo-btn geo-btn-primary w-full justify-center">
              <UserPlus size={16} />
              Ajouter
            </button>
          </form>

          {/* Liste des admins */}
          <div className="space-y-2">
            {admins.length === 0 ? (
              <p className="text-sm text-center py-4" style={{ color: 'var(--text-muted)' }}>
                Aucun admin enregistré
              </p>
            ) : (
              admins.map((admin) => (
                <div key={admin.id} className="flex items-center justify-between p-3 rounded-xl" style={{ backgroundColor: 'rgba(12, 142, 55, 0.03)', border: '1px solid rgba(12, 142, 55, 0.1)' }}>
                  <div>
                    <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{admin.full_name || admin.email}</p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{admin.email}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="geo-badge geo-badge-green">{admin.role}</span>
                    {admin.is_active === false && (
                      <span className="geo-badge geo-badge-red">Inactif</span>
                    )}
                    <button
                      onClick={() => deleteAdmin(admin.id)}
                      className="p-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                      style={{ color: '#e53e3e' }}
                      title="Supprimer"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Configuration du dashboard */}
        <div className="space-y-6">
          {/* Apparence */}
          <div className="geo-chart-card">
            <div className="geo-chart-card-header">
              <h2 className="geo-chart-card-title flex items-center gap-2">
                <Palette size={18} style={{ color: '#0C8E37' }} />
                Configuration du dashboard
              </h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm mb-1" style={{ color: 'var(--text-muted)' }}>
                  Nom du dashboard
                </label>
                <input
                  type="text"
                  value={dashboardConfig.nom}
                  onChange={(e) => setDashboardConfig({ ...dashboardConfig, nom: e.target.value })}
                  className="geo-input"
                />
              </div>
                            <div>
                <label className="block text-sm mb-1" style={{ color: 'var(--text-muted)' }}>
                  Couleur principale
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={dashboardConfig.couleur}
                    onChange={(e) => setDashboardConfig({ ...dashboardConfig, couleur: e.target.value })}
                    className="w-14 h-10 rounded-lg cursor-pointer"
                  />
                  <span className="text-sm font-mono" style={{ color: 'var(--text-primary)' }}>{dashboardConfig.couleur}</span>
                </div>
              </div>
              <button
                onClick={saveDashboardConfig}
                className="geo-btn geo-btn-secondary w-full justify-center"
              >
                <Settings size={16} />
                Sauvegarder la configuration
              </button>
            </div>
          </div>

          {/* Export des données */}
          <div className="geo-chart-card">
            <div className="geo-chart-card-header">
              <h2 className="geo-chart-card-title flex items-center gap-2">
                <Database size={18} style={{ color: '#0C8E37' }} />
                Export des données
              </h2>
            </div>

            <div className="space-y-3">
              <button onClick={exportCSV} className="geo-btn geo-btn-secondary w-full justify-center">
                <Download size={16} />
                Exporter les installations (CSV)
              </button>
              <button onClick={exportActivitesCSV} className="geo-btn geo-btn-secondary w-full justify-center">
                <Download size={16} />
                Exporter les activités (CSV)
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}