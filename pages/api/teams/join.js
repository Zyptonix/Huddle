import { createPagesServerClient } from '@supabase/auth-helpers-nextjs'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    return res.status(405).end(`Method ${req.method} Not Allowed`)
  }

  const supabaseServer = createPagesServerClient({ req, res })
  const { data: { user } } = await supabaseServer.auth.getUser()

  if (!user) return res.status(401).json({ error: 'Unauthorized' })

  const { joinCode } = req.body

  if (!joinCode) {
    return res.status(400).json({ error: 'Join code is required' })
  }

  // 1. Find the team by join code
  const { data: team, error: teamError } = await supabaseServer
    .from('teams')
    .select('id, name')
    .eq('join_code', joinCode)
    .single()

  if (teamError || !team) {
    return res.status(404).json({ error: 'Invalid join code. Team not found.' })
  }

  // 2. Check if already a member
  const { data: existingMember } = await supabaseServer
    .from('team_members')
    .select('id')
    .eq('team_id', team.id)
    .eq('player_id', user.id)
    .single()

  if (existingMember) {
    return res.status(400).json({ error: 'You are already in this team.' })
  }

  // 3. Add player to the team
  const { error: joinError } = await supabaseServer
    .from('team_members')
    .insert([
      {
        team_id: team.id,
        player_id: user.id
      }
    ])

  if (joinError) return res.status(500).json({ error: joinError.message })

  return res.status(200).json({ message: `Successfully joined ${team.name}!` })
}