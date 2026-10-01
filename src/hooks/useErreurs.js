import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'
import { isTableMissingError } from '../utils/supabaseErrors'

// ============================================
// HOOK - GESTION DES ERREURS
// ============================================

export function useErreurs({ installationId = null, limit = null } = {}) {
  const [erreurs, setErreurs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchErreurs = useCallback(async () => {
    try {
      setLoading(true)
      let query = supabase
        .from('erreurs')
        .select('*')
        .order('created_at', { ascending: false })

      if (installationId) {
        query = query.eq('installation_id', installationId)
      }
      if (limit) {
        query = query.limit(limit)
      }

      const { data, error } = await query

      if (error) {
        if (isTableMissingError(error)) {
          setErreurs([])
          setError(null)
          return
        }
        throw error
      }
      setErreurs(data || [])
      setError(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [installationId, limit])

  useEffect(() => {
    fetchErreurs()
  }, [fetchErreurs])

  return { erreurs, loading, error, refetch: fetchErreurs }
}