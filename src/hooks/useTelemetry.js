import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'
import { isTableMissingError } from '../utils/supabaseErrors'

// ============================================
// HOOK - GESTION DE LA TÉLÉMÉTRIE
// ============================================

export function useTelemetry({ days = 30, installationId = null } = {}) {
  const [telemetry, setTelemetry] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchTelemetry = useCallback(async () => {
    try {
      setLoading(true)
      const fromDate = new Date()
      fromDate.setDate(fromDate.getDate() - days)

      let query = supabase
        .from('telemetry')
        .select('*')
        .gte('date_releve', fromDate.toISOString())
        .order('date_releve', { ascending: true })

      if (installationId) {
        query = query.eq('installation_id', installationId)
      }

      const { data, error } = await query

      if (error) {
        if (isTableMissingError(error)) {
          setTelemetry([])
          setError(null)
          return
        }
        throw error
      }
      setTelemetry(data || [])
      setError(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [days, installationId])

  useEffect(() => {
    fetchTelemetry()
  }, [fetchTelemetry])

  return { telemetry, loading, error, refetch: fetchTelemetry }
}