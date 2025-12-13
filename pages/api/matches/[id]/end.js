import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' })
  
  const { id } = req.query // Match ID
  
  try {
    // 1. Get the current match to see scores and next node
    const { data: match } = await supabaseAdmin
        .from('matches')
        .select('*')
        .eq('id', id)
        .single()

    if (!match) return res.status(404).json({ message: 'Match not found' })

    // 2. Determine Winner
    let winnerId = null
    if (match.score_a > match.score_b) winnerId = match.team_a_id
    else if (match.score_b > match.score_a) winnerId = match.team_b_id
    else {
        // DRAW in Knockout? Forbidden.
        if (match.next_node) {
            return res.status(400).json({ message: 'Knockout matches cannot end in a draw. Please add penalties/OT score.' })
        }
    }

    // 3. Update Current Match (Status: Finished, Winner Set)
    const { error: updateError } = await supabaseAdmin
        .from('matches')
        .update({ status: 'finished', winner_id: winnerId, game_clock: 'FT' })
        .eq('id', id)
    
    if (updateError) throw updateError

    // 4. PROGRESSION LOGIC (Only if next_node exists)
    if (match.next_node && match.next_node !== 'FINAL' && winnerId) {
        
        // Find the next match
        const { data: nextMatch } = await supabaseAdmin
            .from('matches')
            .select('*')
            .eq('tournament_id', match.tournament_id)
            .eq('knockout_node', match.next_node)
            .single()

        if (nextMatch) {
            // Check if slot A is empty, if so take it. Else take slot B.
            // But we must be careful not to overwrite an existing team if this is a re-run
            const updatePayload = {}
            if (!nextMatch.team_a_id) updatePayload.team_a_id = winnerId
            else if (!nextMatch.team_b_id) updatePayload.team_b_id = winnerId
            else {
                // Both slots full? Logic error or manual intervention needed.
                // For simplicity, we assume the schedule generation logic holds up.
                console.log("Next match already has 2 teams.")
            }

            if (Object.keys(updatePayload).length > 0) {
                await supabaseAdmin
                    .from('matches')
                    .update(updatePayload)
                    .eq('id', nextMatch.id)
            }
        }
    }

    return res.status(200).json({ message: 'Match ended and tournament updated.' })

  } catch (error) {
    console.error(error)
    return res.status(500).json({ message: error.message })
  }
}