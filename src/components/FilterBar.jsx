// ============================================
// COMPOSANT - BARRE DE FILTRES
// ============================================

export default function FilterBar({ filters, onFilterChange }) {
  const handleChange = (key, value) => {
    onFilterChange({ ...filters, [key]: value })
  }

  return (
    <div className="geo-filter-bar">
      {filters.map((filter, idx) => (
        <div key={idx} className="w-full sm:w-auto">
          {filter.type === 'search' && (
            <div className="relative w-full">
              <input
                type="text"
                placeholder={filter.placeholder || `Rechercher...`}
                value={filter.value || ''}
                onChange={(e) => handleChange(filter.key, e.target.value)}
                className="geo-input w-full"
              />
            </div>
          )}
          {filter.type === 'select' && (
            <select
              value={filter.value || ''}
              onChange={(e) => handleChange(filter.key, e.target.value)}
              className="geo-input w-full"
            >
              <option value="">{filter.placeholder || 'Tous'}</option>
              {filter.options?.map((opt, optIdx) => (
                <option key={optIdx} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          )}
          {filter.type === 'date' && (
            <input
              type="date"
              value={filter.value || ''}
              onChange={(e) => handleChange(filter.key, e.target.value)}
              className="geo-input w-full"
            />
          )}
        </div>
      ))}
    </div>
  )
}