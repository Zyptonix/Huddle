import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' })
  
  const { id } = req.query
  const { organizer_id } = req.body

  try {
    // 1. Fetch Tournament & Teams
    const { data: tournament } = await supabaseAdmin.from('tournaments').select('*').eq('id', id).single()
    if (tournament.organizer_id !== organizer_id) return res.status(403).json({ message: 'Unauthorized' })

    const { data: teamsData } = await supabaseAdmin
        .from('tournament_teams')
        .select('team_id')
        .eq('tournament_id', id)
        .eq('status', 'approved')

    const { data: venues } = await supabaseAdmin.from('venues').select('*').eq('organizer_id', organizer_id)
    const safeVenues = venues && venues.length > 0 ? venues : [{ id: null, name: 'TBD' }]
    
    // Shuffle teams for randomness
    const teams = teamsData.map(t => t.team_id).sort(() => Math.random() - 0.5)
    let matches = []

    // --- LOGISTICS HELPER ---
    const usedSlots = new Set()
    const timeSlots = ['09:00', '11:00', '14:00', '16:00', '18:00', '20:00']
    
    const getLogistics = (dayOffset) => {
        const baseDate = new Date(tournament.start_date || Date.now())
        baseDate.setDate(baseDate.getDate() + dayOffset)
        const dateStr = baseDate.toISOString().split('T')[0]

        for (let i = 0; i < 50; i++) { 
            const venue = safeVenues[Math.floor(Math.random() * safeVenues.length)]
            const time = timeSlots[Math.floor(Math.random() * timeSlots.length)]
            const key = `${dateStr}_${time}_${venue.id || 'tbd'}`
            if (!usedSlots.has(key)) {
                usedSlots.add(key)
                return { venue_name: venue.name, match_time: time, date: baseDate }
            }
        }
        return { venue_name: 'TBD', match_time: '12:00', date: baseDate }
    }

    // --- KNOCKOUT LOGIC (Binary Tree) ---
    if (tournament.format === 'knockout') {
        const totalTeams = teams.length
        
        // 1. Create Round 1 Matches
        let round1Matches = []
        for (let i = 0; i < totalTeams; i += 2) {
            // Logic: Match 1 feeds into Next Round Match 1, Match 3 & 4 feed into Next Round Match 2...
            // Simple mapping: Match Index `i` feeds into Match Index `floor(i/2)` of next round
            const matchIndex = i / 2
            const nextRoundMatchIndex = Math.floor(matchIndex / 2)
            
            // If we have an odd team, they get a "Bye" (Auto-advance - handled manually or simply excluded here for simplicity)
            if (i + 1 < totalTeams) {
                round1Matches.push({
                    tournament_id: id,
                    team_a_id: teams[i],
                    team_b_id: teams[i+1],
                    round: 'Round 1',
                    status: 'scheduled',
                    knockout_node: `R1_M${matchIndex}`, // Current ID
                    next_node: `R2_M${nextRoundMatchIndex}`, // Where the winner goes
                    ...getLogistics(0)
                })
            }
        }
        matches = [...round1Matches]

        // 2. Create Placeholder Matches for Future Rounds (Empty Teams)
        // We calculate how many rounds needed: log2(teams)
        let rounds = Math.ceil(Math.log2(totalTeams))
        let activeMatchCount = round1Matches.length // Start with R1 count

        for (let r = 2; r <= rounds; r++) {
            activeMatchCount = Math.ceil(activeMatchCount / 2) // Half the matches each round
            for (let m = 0; m < activeMatchCount; m++) {
                const nextNodeIndex = Math.floor(m / 2)
                matches.push({
                    tournament_id: id,
                    team_a_id: null, // Waiting for winner
                    team_b_id: null, // Waiting for winner
                    round: `Round ${r}`,
                    status: 'scheduled', // Pending
                    knockout_node: `R${r}_M${m}`,
                    next_node: r === rounds ? 'FINAL' : `R${r+1}_M${nextNodeIndex}`,
                    ...getLogistics(r - 1) // Next day
                })
            }
        }
    } 
    
    // --- LEAGUE LOGIC (Round Robin) ---
    else {
        let matchCount = 0
        for (let i = 0; i < teams.length; i++) {
            for (let j = i + 1; j < teams.length; j++) {
                matches.push({
                    tournament_id: id,
                    team_a_id: teams[i],
                    team_b_id: teams[j],
                    round: `Week ${Math.floor(matchCount/2) + 1}`,
                    status: 'scheduled',
                    ...getLogistics(Math.floor(matchCount/4))
                })
                matchCount++
            }
        }
    }

    // Insert
    const { error } = await supabaseAdmin.from('matches').insert(matches)
    if (error) throw error

    await supabaseAdmin.from('tournaments').update({ status: 'live' }).eq('id', id)
    return res.status(200).json({ message: 'Schedule generated', matches: matches.length })

  } catch (error) {
    console.error(error)
    return res.status(500).json({ message: error.message })
  }
}