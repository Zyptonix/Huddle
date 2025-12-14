// pages/api/tournaments/all.js
import { createClient } from '@supabase/supabase-js'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET'])
    return res.status(405).end(`Method ${req.method} Not Allowed`)
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )

  const { data, error } = await supabase
    .from('tournaments')
    .select(`
      *,
      profiles:organizer_id (
        username,
        avatar_url
      ),

      teams:tournament_teams (
        team_id
      )
    `)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Supabase Error:', error)
    return res.status(500).json({ error: error.message })
  }

  return res.status(200).json(data)
}