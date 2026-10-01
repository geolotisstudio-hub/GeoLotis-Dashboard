import { useState, useEffect } from 'react'
import { Bell, Search, Moon, Sun, Menu, Home } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

// ============================================
// COMPOSANT - BARRE SUPÉRIEURE
// ============================================

export default function TopBar({ title, subtitle, onMenuClick }) {
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('theme')
    return saved === 'dark' || (!saved && document.documentElement.classList.contains('dark'))
  })
  const [searchQuery, setSearchQuery] = useState('')
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode)
    localStorage.setItem('theme', darkMode ? 'dark' : 'light')
  }, [darkMode])

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/installations?q=${encodeURIComponent(searchQuery.trim())}`)
      setMobileSearchOpen(false)
    }
  }

  return (
    <header className="geo-topbar">
      <div className="geo-topbar-inner">
        <div className="geo-topbar-left">
          <button
            onClick={onMenuClick}
            className="geo-topbar-menu-btn"
            title="Ouvrir / Fermer le menu"
          >
            <Menu size={20} />
          </button>
          <div className="geo-topbar-title">
            <h1>{title}</h1>
            {subtitle && <p>{subtitle}</p>}
          </div>
        </div>

        <form onSubmit={handleSearch} className="geo-topbar-search hidden md:block">
          <Search size={17} />
          <input
            type="text"
            placeholder="Rechercher une entreprise..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </form>

        <div className="geo-topbar-actions">
          <button
            onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
            className="geo-topbar-btn md:hidden"
            title="Rechercher"
          >
            <Search size={19} />
          </button>

          <button
            onClick={() => navigate('/')}
            className="hidden sm:flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#0C8E37] to-[#0A6B29] text-white text-sm font-medium hover:shadow-lg hover:shadow-green-900/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
            title="Retour au logiciel"
          >
            <Home size={16} />
            <span className="hidden lg:inline">Logiciel</span>
          </button>

          <button
            onClick={() => setDarkMode(!darkMode)}
            className="geo-topbar-btn"
            title={darkMode ? 'Mode clair' : 'Mode sombre'}
          >
            {darkMode ? (
              <Sun size={19} className="text-amber-400" />
            ) : (
              <Moon size={19} />
            )}
          </button>

          <button
            className="geo-topbar-btn hidden sm:flex"
            title="Notifications"
          >
            <Bell size={19} />
            <span className="geo-topbar-btn-badge" />
          </button>

          <div className="geo-topbar-user">
            <div className="geo-topbar-user-avatar">GS</div>
            <div className="geo-topbar-user-info">
              <p>GéoLotis Studio</p>
              <p>Administrateur</p>
            </div>
          </div>
        </div>
      </div>

      {mobileSearchOpen && (
        <form onSubmit={handleSearch} className="geo-topbar-search mt-3 w-full md:hidden relative">
          <Search size={17} />
          <input
            type="text"
            placeholder="Rechercher une entreprise..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            autoFocus
          />
        </form>
      )}
    </header>
  )
}