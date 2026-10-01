import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'
import { isTableMissingError } from '../utils/supabaseErrors'

// ============================================
// HOOK - GESTION DES ACTIVITÉS GLOBALES
// ============================================

export function useActivites({ installationId = null, limit = null } = {}) {
  const [activites, setActivites] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchActivites = useCallback(async () => {
    try {
      setLoading(true)
      let query = supabase
        .from('activites_globales')
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
          setActivites([])
          setError(null)
          return
        }
        throw error
      }
      setActivites(data || [])
      setError(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [installationId, limit])

  useEffect(() => {
    fetchActivites()
  }, [fetchActivites])

  return { activites, loading, error, refetch: fetchActivites }
}