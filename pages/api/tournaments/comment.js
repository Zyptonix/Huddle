import { createPagesServerClient } from '@supabase/auth-helpers-nextjs'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const supabase = createPagesServerClient({ req, res })
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return res.status(401).json({ error: 'Unauthorized' })

  const { announcementId, content } = req.body

  const { data, error } = await supabase
    .from('comments')
    .insert([{ announcement_id: announcementId, content, user_id: user.id }])
    .select(`*, profiles(username, avatar_url)`) // Return profile info for UI
    .single()

  if (error) return res.status(500).json({ error: error.message })
  return res.status(201).json(data)
}