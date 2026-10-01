import { Inbox } from 'lucide-react'

// ============================================
// COMPOSANT - ÉTAT VIDE
// ============================================

export default function EmptyState({ title = 'Aucune donnée', message, icon: Icon = Inbox }) {
  return (
    <div className="geo-empty">
      <div className="geo-empty-icon">
        <Icon size={28} />
      </div>
      <h3>{title}</h3>
      {message && <p>{message}</p>}
    </div>
  )
}