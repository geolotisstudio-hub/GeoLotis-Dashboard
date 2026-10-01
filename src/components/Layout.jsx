import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import TopBar from './TopBar'
import { clearMasterKey } from '../lib/supabaseClient'

// ============================================
// COMPOSANT - LAYOUT PRINCIPAL
// ============================================

const pageTitles = {
  '/': 'Vue d\'ensemble',
  '/installations': 'Installations',
  '/activites': 'Activités',
  '/erreurs': 'Erreurs',
  '/alertes': 'Alertes',
  '/parametres': 'Paramètres',
}

const pageSubtitles = {
  '/': 'Supervision globale du parc logiciel',
  '/installations': 'Gestion des installations GéoLotis',
  '/activites': 'Journal des actions utilisateurs',
  '/erreurs': 'Suivi des erreurs rencontrées',
  '/alertes': 'Détection automatique des anomalies',
  '/parametres': 'Configuration et gestion des accès',
}

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()

  const currentTitle = pageTitles[location.pathname] || 'GéoLotis Dashboard'
  const currentSubtitle = pageSubtitles[location.pathname] || ''

  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ backgroundColor: 'var(--bg-light)' }}>
      {/* Sidebar (glissante sur mobile/tablette/desktop au clic sur les 3 traits) */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* 🔐 Bouton discret pour changer la clé d'accès à la base maître */}
      <button
        onClick={() => {
          if (window.confirm('Effacer la clé enregistrée sur cet appareil ? Le dashboard demandera la clé au prochain démarrage.')) {
            clearMasterKey()
            window.location.reload()
          }
        }}
        title="Changer la clé d'accès à la base maître"
        style={{
          position: 'fixed',
          bottom: '10px',
          right: '12px',
          zIndex: 1500,
          background: 'rgba(15, 23, 42, 0.55)',
          color: '#e2e8f0',
          border: 'none',
          borderRadius: '20px',
          padding: '6px 12px',
          fontSize: '0.7rem',
          cursor: 'pointer'
        }}
      >
        🔑 Clé d'accès
      </button>

      {/* Contenu principal */}
      <div className="flex-1 flex flex-col w-full min-h-0">
        <TopBar
          title={currentTitle}
          subtitle={currentSubtitle}
          onMenuClick={() => setSidebarOpen(!sidebarOpen)}
        />

        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto overflow-x-hidden min-h-0">
          <div className="fade-in-up max-w-[1600px] mx-auto w-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}