import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'
import { isTableMissingError } from '../utils/supabaseErrors'

// ============================================
// HOOK - GESTION DES ENTREPRISES / INSTALLATIONS
// --------------------------------------------
// Un MEME client (ex : "Bloc 1") peut se connecter depuis PLUSIEURS appareils :
//   - le logiciel Windows installe,
//   - l'application Android,
//   - le dashboard web (localhost, deploiement, etc.).
// Chaque appareil envoie SA PROPRE ligne dans la table "installations".
// Ces lignes appartiennent pourtant a la MEME entreprise.
// On doit donc les REGROUPER pour n'afficher qu'une seule entreprise par client.
// ============================================

// Noms qui ne representent PAS une vraie identite d'entreprise.
const DEFAULT_NAMES = [
  'installation geolotis',
  'installation geolotis',
  'installation geolotis inc',
  'installation geolotis inc',
  'installation'
]

const isDefaultName = (name) => {
  const n = (name || '').trim().toLowerCase()
  return !n || DEFAULT_NAMES.includes(n)
}

// Normaliser une URL Supabase : minuscules + suppression du slash final
const normUrl = (url) => (url || '').trim().toLowerCase().replace(/\/+$/, '')

// Identifier "INST-CORP-XXXX" : ID de corporation identique pour tous les appareils d'une meme entreprise.
const getCorpId = (installationId) => {
  const id = (installationId || '').trim()
  if (id.startsWith('INST-CORP-')) return id
  return null
}

// Tous les "signaux d'identite" d'une ligne : preuve que cette ligne appartient a une entreprise.
const getIdentityTokens = (item) => {
  const tokens = []
  const url = normUrl(item.supabase_url)
  if (url) tokens.push('url:' + url)
  const nom = (item.nom_client || '').trim()
  if (!isDefaultName(nom)) tokens.push('nom:' + nom.toLowerCase())
  const email = (item.email_contact || '').trim().toLowerCase()
  if (email) tokens.push('email:' + email)
  const corp = getCorpId(item.installation_id)
  if (corp) tokens.push('corp:' + corp)
  return tokens
}

// ============================================
// UNION-FIND : regroupe toutes les lignes partageant au moins un signe d'identite.
// ============================================
function groupByEnterprise(rawList) {
  const groups = []
  const tokenToGroup = new Map()
  rawList.forEach((item) => {
    const tokens = getIdentityTokens(item)
    if (tokens.length === 0) {
      groups.push({ tokens: new Set(), items: [item] })
      return
    }
    let representativeId = null
    for (const t of tokens) {
      if (!tokenToGroup.has(t)) continue
      const gid = tokenToGroup.get(t)
      if (representativeId === null) {
        representativeId = gid
      } else if (gid !== representativeId) {
        for (const token of groups[gid].tokens) tokenToGroup.set(token, representativeId)
        groups[representativeId].tokens = new Set([...groups[representativeId].tokens, ...groups[gid].tokens])
        groups[representativeId].items.push(...groups[gid].items)
        groups[gid].items = []
      }
    }
    if (representativeId === null) {
      representativeId = groups.length
      groups.push({ tokens: new Set(), items: [] })
    }
    groups[representativeId].items.push(item)
    for (const t of tokens) {
      groups[representativeId].tokens.add(t)
      tokenToGroup.set(t, representativeId)
    }
  })
  return groups.filter(g => g.items.length > 0)
}
// Construire l'entreprise "representative" a partir d'un groupe de lignes.
function buildCompany(group) {
  const items = group.items
  const score = (it) =>
    (isDefaultName(it.nom_client) ? 0 : 2) + (normUrl(it.supabase_url) ? 2 : 0)
  let best = items[0]
  for (const it of items) if (score(it) > score(best)) best = it
  const instSeen = new Set()
  const company = { ...best, instances: [] }

  items.forEach((it) => {
    if (it.installation_id && !instSeen.has(it.installation_id)) {
      instSeen.add(it.installation_id)
      company.instances.push(it)
    }
    if (isDefaultName(company.nom_client) && it.nom_client && !isDefaultName(it.nom_client)) {
      company.nom_client = it.nom_client
    }
    if (!company.supabase_url && it.supabase_url) company.supabase_url = it.supabase_url
    if (!company.email_contact && it.email_contact) company.email_contact = it.email_contact
    if (!company.telephone && it.telephone) company.telephone = it.telephone
    if (!company.version_logiciel && it.version_logiciel) company.version_logiciel = it.version_logiciel
    if (new Date(it.derniere_connexion || 0).getTime() > new Date(company.derniere_connexion || 0).getTime()) {
      company.derniere_connexion = it.derniere_connexion
    }
    const itDate = new Date(it.date_installation || it.created_at || 0).getTime()
    const exDate = new Date(company.date_installation || company.created_at || 0).getTime()
    if (!company.date_installation || itDate < exDate) company.date_installation = it.date_installation || it.created_at
  })

  const osSet = new Set()
  items.forEach(it => { if (it.systeme_os) osSet.add(it.systeme_os.trim()) })
  if (osSet.size > 0) company.systeme_os = Array.from(osSet).join(' et ')
  return company
}

export function useInstallations() {
  const [installations, setInstallations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchInstallations = useCallback(async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('installations')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        if (isTableMissingError(error)) {
          setInstallations([])
          setError(null)
          return
        }
        throw error
      }

      const rawList = data || []

      // 1. Regrouper les lignes appartenant a la MEME entreprise
      const companies = groupByEnterprise(rawList).map(buildCompany)

            // 2. Fiabiliser l'email du contact administrateur depuis utilisateurs_entreprise
      try {
        const { data: admins } = await supabase
          .from('utilisateurs_entreprise')
          .select('installation_id, user_email')
          .eq('role', 'Administrateur')
        if (admins && admins.length > 0) {
          const adminByInst = new Map(admins.map(a => [a.installation_id, (a.user_email || '').trim()].filter(Boolean)))
          companies.forEach((ent) => {
            const ids = (ent.instances || []).map(i => i.installation_id)
            const adminInstId = ids.find(id => adminByInst.has(id))
            if (adminInstId && adminByInst.get(adminInstId)) {
              ent.email_contact = adminByInst.get(adminInstId)
              const inst = ent.instances.find(i => i.installation_id === adminInstId)
              if (inst && inst.telephone) ent.telephone = inst.telephone
            }
          })
        }
      } catch (adminErr) {
        console.warn('[Admin] Info admins non disponible:', adminErr.message)
      }

      // 3. Compléter l'email de l'administrateur depuis les ACTIVITÉS
      // (MÊME LOGIQUE que le tableau "Activités récentes" : la colonne
      // user_email de activites_globales contient le VRAI email de connexion,
      // alors que utilisateurs_entreprise est souvent vide).
      // Pour chaque entreprise sans email fiable, on prend l'email de
      // l'activité la plus récente parmi toutes ses instances.
      try {
        const { data: acts } = await supabase
          .from('activites_globales')
          .select('installation_id, user_email, created_at')
          .order('created_at', { ascending: false })

        if (acts && acts.length > 0) {
          // Map : installation_id → email le plus récent (premier rencontré)
          const emailByInst = new Map()
          acts.forEach(a => {
            const email = (a.user_email || '').trim()
            if (email && a.installation_id && !emailByInst.has(a.installation_id)) {
              emailByInst.set(a.installation_id, email)
            }
          })
          companies.forEach((ent) => {
            const current = (ent.email_contact || '').trim()
            // On complète seulement si l'email est vide ou un nom par défaut
            const isUnreliable = !current || current.toLowerCase() === 'installation geolotis'
            if (!isUnreliable) return
            const ids = (ent.instances || []).map(i => i.installation_id)
            for (const iid of ids) {
              const email = emailByInst.get(iid)
              if (email) {
                ent.email_contact = email
                break
              }
            }
          })
        }
      } catch (actsErr) {
        console.warn('[Admin] Complétion emails depuis activités non disponible:', actsErr.message)
      }

      setInstallations(companies)
      setError(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchInstallations()
  }, [fetchInstallations])

  return { installations, loading, error, refetch: fetchInstallations }
}

export function useInstallation(id) {
  const [installation, setInstallation] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchInstallation = useCallback(async () => {
    if (!id) {
      setLoading(false)
      return
    }
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('installations')
        .select('*')
        .eq('installation_id', id)
        .single()
      if (error) {
        if (isTableMissingError(error)) {
          setInstallation(null)
          setError(null)
          return
        }
        throw error
      }
      setInstallation(data)
      setError(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchInstallation()
  }, [fetchInstallation])

  return { installation, loading, error, refetch: fetchInstallation }
}
