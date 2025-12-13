import { createClient } from '@supabase/supabase-js'

// Create a new client specifically for this API route to ensure clean state
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // Use Service Role to bypass RLS for insertions
)

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  const { id } = req.query // Team ID (from URL)
  const { user_id } = req.body // User ID (from body)

  console.log(`[Join API] Request: User ${user_id} -> Team ${id}`)

  if (!user_id || !id) {
    console.error("[Join API] Missing ID")
    return res.status(400).json({ message: 'Missing User ID or Team ID' })
  }

  try {
    // 1. Check if they are already in the team (or have a pending request)
    const { data: existing, error: fetchError } = await supabase
      .from('team_members')
      .select('*')
      .eq('team_id', id)
      .eq('user_id', user_id)
      .maybeSingle() // Use maybeSingle to avoid 406 error if not found

    if (fetchError) {
      console.error("[Join API] Fetch Error:", fetchError)
      throw fetchError
    }

    if (existing) {
      console.log("[Join API] Request already exists")
      return res.status(400).json({ message: 'You are already a member or have a pending request.' })
    }

    // 2. Insert the Request
    const { data, error: insertError } = await supabase
      .from('team_members')
      .insert([
        { 
          team_id: id, 
          user_id: user_id, 
          role: 'player', 
          status: 'pending' // This requires the SQL fix above!
        }
      ])
      .select()

    if (insertError) {
      console.error("[Join API] Insert Error:", insertError)
      throw insertError
    }

    console.log("[Join API] Success:", data)
    return res.status(200).json({ message: 'Request sent successfully', data })

  } catch (error) {
    console.error("[Join API] Critical Failure:", error)
    return res.status(500).json({ message: error.message || 'Internal Server Error' })
  }
}