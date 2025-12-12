import { createPagesServerClient } from '@supabase/auth-helpers-nextjs'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()
  const supabase = createPagesServerClient({ req, res })
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return res.status(401).json({ error: 'Login required' })

  const { profileId, content } = req.body
  const { data, error } = await supabase
    .from('profile_comments')
    .insert([{ profile_id: profileId, author_id: user.id, content }])
    .select('*, profiles:author_id(username, avatar_url)').single()

  if (error) return res.status(500).json({ error: error.message })
  return res.status(201).json(data)
}