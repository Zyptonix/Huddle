import { createPagesServerClient } from '@supabase/auth-helpers-nextjs'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const supabase = createPagesServerClient({ req, res })
  const { id } = req.query // team id
  const { userId } = req.body

  try {
    // Prevent the owner from leaving (they must delete the team or transfer ownership)
    const { data: member } = await supabase
      .from('team_members')
      .select('role')
      .eq('team_id', id)
      .eq('user_id', userId)
      .single()

    if (member?.role === 'owner') {
      return res.status(400).json({ error: "Owners cannot leave their own team. You must delete the team instead." })
    }

    // Delete the membership
    const { error } = await supabase
      .from('team_members')
      .delete()
      .eq('team_id', id)
      .eq('user_id', userId)

    if (error) throw error

    return res.status(200).json({ success: true })
  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
}