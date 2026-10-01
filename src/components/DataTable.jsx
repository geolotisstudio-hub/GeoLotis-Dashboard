import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, ArrowUp, ArrowDown } from 'lucide-react'

// ============================================
// COMPOSANT - TABLEAU DE DONNÉES RÉUTILISABLE
// ============================================

export default function DataTable({ 
  columns, 
  data, 
  onRowClick, 
  pageSize = 10,
  emptyMessage = "Aucune donnée disponible"
}) {
  const [currentPage, setCurrentPage] = useState(0)
  const [sortConfig, setSortConfig] = useState(null)

  // Réinitialise la page quand les données changent
  useEffect(() => {
    setCurrentPage(0)
  }, [data])

  // Fonction de tri
  const sortData = (items) => {
    if (!sortConfig) return items
    const { key, direction } = sortConfig
    return [...items].sort((a, b) => {
      const valA = a[key]
      const valB = b[key]
      if (valA === null || valA === undefined) return 1
      if (valB === null || valB === undefined) return -1
      if (valA < valB) return direction === 'asc' ? -1 : 1
      if (valA > valB) return direction === 'asc' ? 1 : -1
      return 0
    })
  }

  const sortedData = sortData(data)
  const totalPages = Math.max(1, Math.ceil(sortedData.length / pageSize))
  const startIndex = currentPage * pageSize
  const pageData = sortedData.slice(startIndex, startIndex + pageSize)

  const handleSort = (key) => {
    setSortConfig(current => {
      if (!current || current.key !== key) {
        return { key, direction: 'asc' }
      }
      if (current.direction === 'asc') {
        return { key, direction: 'desc' }
      }
      return null
    })
  }

  return (
    <div className="w-full">
      <div className="overflow-x-auto">
        <table className="geo-table geo-table-mobile">
          <thead>
            <tr>
              {columns.map((col, idx) => (
                <th
                  key={idx}
                  className={col.sortable ? 'cursor-pointer hover:text-[#0C8E37] transition-colors' : ''}
                  onClick={() => col.sortable && handleSort(col.key)}
                >
                  <span className="inline-flex items-center gap-1.5">
                    {col.label}
                    {col.sortable && sortConfig?.key === col.key && (
                      sortConfig.direction === 'asc' 
                        ? <ArrowUp size={12} className="text-[#0C8E37]" />
                        : <ArrowDown size={12} className="text-[#0C8E37]" />
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageData.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-12 text-center" style={{ color: 'var(--text-muted)' }}>
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              pageData.map((row, idx) => (
                <tr
                  key={idx}
                  onClick={() => onRowClick?.(row)}
                  className={onRowClick ? 'cursor-pointer' : ''}
                >
                  {columns.map((col, colIdx) => (
                    <td key={colIdx} data-label={col.label}>
                      {col.render ? col.render(row) : row[col.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {data.length > pageSize && (
        <div className="geo-pagination">
          <p className="geo-pagination-info">
            {startIndex + 1}-{Math.min(startIndex + pageSize, data.length)} sur {data.length}
          </p>
          <div className="geo-pagination-buttons">
            <button
              onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
              disabled={currentPage === 0}
              className="geo-pagination-btn"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-xs sm:text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
              Page {currentPage + 1} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={currentPage >= totalPages - 1}
              className="geo-pagination-btn"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}