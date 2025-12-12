// pages/api/tournaments/all.js
import { createClient } from '@supabase/supabase-js'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET'])
    return res.status(405).end(`Method ${req.method} Not Allowed`)
  }

  // Use a standard client for public data fetching to avoid cookie issues
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
      )
    `)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Supabase Error:', error) // Check your server console!
    return res.status(500).json({ error: error.message })
  }

  return res.status(200).json(data)
}