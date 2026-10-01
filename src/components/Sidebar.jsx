import { NavLink, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Building2, Activity, AlertTriangle, Bell, Settings, Map, LogOut, X, ChevronRight } from 'lucide-react'

// ============================================
// COMPOSANT - SIDEBAR (NAVIGATION LATÉRALE)
// ============================================

const menuItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { path: '/installations', label: 'Installations', icon: Building2 },
  { path: '/activites', label: 'Activités', icon: Activity },
  { path: '/erreurs', label: 'Erreurs', icon: AlertTriangle },
  { path: '/alertes', label: 'Alertes', icon: Bell },
  { path: '/parametres', label: 'Paramètres', icon: Settings },
]

export default function Sidebar({ isOpen, onClose }) {
  const navigate = useNavigate()

  const handleLogout = () => {
    window.location.href = '/'
  }

  return (
    <>
      {/* Overlay sombre semi-transparent */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Menu latéral escamotable */}
      <aside
        className={`geo-sidebar ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        {/* Logo */}
        <div className="geo-sidebar-logo">
          <div className="geo-sidebar-logo-content">
            <div className="geo-sidebar-logo-icon">
              <Map size={24} className="text-white" />
            </div>
            <div className="geo-sidebar-logo-text">
              <h1>GéoLotis</h1>
              <p>Dashboard Admin</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-white/10 text-white/50 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Menu */}
        <nav className="geo-sidebar-nav">
          <p className="geo-sidebar-section">Navigation</p>
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.end}
              onClick={onClose}
              className={({ isActive }) =>
                `geo-sidebar-item ${isActive ? 'active' : ''}`
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon size={20} className="geo-sidebar-item-icon" />
                  <span className="flex-1">{item.label}</span>
                  {isActive && <ChevronRight size={16} className="geo-sidebar-item-arrow" />}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="geo-sidebar-footer">
          <div className="geo-sidebar-user">
            <div className="geo-sidebar-user-avatar">GS</div>
            <div className="geo-sidebar-user-info">
              <p>GéoLotis Studio</p>
              <p>v2.4.1</p>
            </div>
            <button
              onClick={handleLogout}
              className="geo-sidebar-logout"
              title="Retour au logiciel"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}