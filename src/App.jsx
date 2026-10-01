import { lazy, Suspense, useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import LoadingSpinner from './components/LoadingSpinner'
import { createClient } from '@supabase/supabase-js'
import { MASTER_URL, isMasterConfigured, saveMasterKey } from './lib/supabaseClient'
import './index.css'

// ============================================
// CONFIGURATION DES ROUTES (avec code-splitting)
// ============================================

// Chargement paresseux des pages pour optimiser la performance
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Installations = lazy(() => import('./pages/Installations'))
const InstallationDetail = lazy(() => import('./pages/InstallationDetail'))
const Activites = lazy(() => import('./pages/Activites'))
const Erreurs = lazy(() => import('./pages/Erreurs'))
const Alertes = lazy(() => import('./pages/Alertes'))
const Parametres = lazy(() => import('./pages/Parametres'))

// ============================================
// ÉCRAN DE DÉVERROUILLAGE DU DASHBOARD
// --------------------------------------------
// 🔐 Le tableau de bord demande votre clé secrète (service_role)
// à sa première ouverture. Elle n'est JAMAIS écrite dans le code :
// elle reste uniquement sur l'appareil de GéoLotis Studio.
// ============================================
function MasterKeyGate() {
  const [keyValue, setKeyValue] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    const clean = keyValue.trim().replace(/^VITE_[A-Z_]+=/, '').replace(/["']/g, '')
    if (!clean) {
      setMessage('Veuillez coller votre clé.')
      return
    }
    setLoading(true)
    setMessage('Vérification de la clé auprès de la base maître...')
    try {
      const testClient = createClient(MASTER_URL, clean)
      const { error } = await testClient.from('installations').select('installation_id').limit(1)
      if (error) throw error
      saveMasterKey(clean)
      window.location.reload()
    } catch (err) {
      setMessage("Clé refusée par la base maître. Vérifiez qu'il s'agit bien de la clé service_role.")
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f172a', padding: '16px' }}>
      <form onSubmit={handleSubmit} style={{ maxWidth: 520, width: '100%', background: '#ffffff', borderRadius: 12, padding: 'clamp(20px, 5vw, 28px)', boxShadow: '0 10px 40px rgba(0,0,0,0.35)' }}>
        <h2 style={{ margin: '0 0 8px', color: '#0f172a', fontSize: 'clamp(1.1rem, 4.5vw, 1.5rem)' }}>🔐 Accès Dashboard GéoLotis</h2>
        <p style={{ margin: '0 0 18px', color: '#475569', fontSize: 'clamp(0.8rem, 3.5vw, 0.95rem)', lineHeight: 1.5 }}>
          Ce tableau de bord est protégé. Collez votre <strong>clé service_role</strong> de la base maître
          (Supabase → Settings → API).
        </p>
        <input
          type="password"
          value={keyValue}
          onChange={(e) => setKeyValue(e.target.value)}
          placeholder="eyJhbGciOi..."
          required
          style={{ width: '100%', padding: '12px 14px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: '1rem', boxSizing: 'border-box' }}
        />
        {message && (
          <p style={{ marginTop: 12, fontSize: '0.85rem', color: message.startsWith('Clé refusée') ? '#dc2626' : '#0C8E37' }}>{message}</p>
        )}
        <button
          type="submit"
          disabled={loading}
          style={{ marginTop: 16, width: '100%', padding: '12px 16px', borderRadius: 8, border: 'none', background: '#0C8E37', color: '#fff', fontWeight: 600, cursor: loading ? 'wait' : 'pointer', fontSize: '1rem' }}
        >
          {loading ? 'Vérification...' : 'Déverrouiller le dashboard'}
        </button>
        <p style={{ marginTop: 14, fontSize: '0.75rem', color: '#94a3b8', lineHeight: 1.4 }}>
          La clé n'est jamais envoyée ailleurs : elle reste uniquement sur cet appareil.
        </p>
      </form>
    </div>
  )
}

export default function App() {
  return (
    <Suspense fallback={<LoadingSpinner message="Chargement de la page..." />}>
      {!isMasterConfigured ? (
        <MasterKeyGate />
      ) : (
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="installations" element={<Installations />} />
            <Route path="installations/:id" element={<InstallationDetail />} />
            <Route path="activites" element={<Activites />} />
            <Route path="erreurs" element={<Erreurs />} />
            <Route path="alertes" element={<Alertes />} />
            <Route path="parametres" element={<Parametres />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      )}
    </Suspense>
  )
}