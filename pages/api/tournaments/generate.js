import { createPagesServerClient } from '@supabase/auth-helpers-nextjs'

// --- Helper Functions for Randomization ---

const getRandomElement = (arr) => arr[Math.floor(Math.random() * arr.length)];

const getRandomMatchTime = (startDate, endDate, possibleHours) => {
    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime();
    const randomTime = start + Math.random() * (end - start);

    const randomDate = new Date(randomTime);
    const randomHour = getRandomElement(possibleHours);
    
    randomDate.setHours(randomHour);
    randomDate.setMinutes(Math.random() < 0.5 ? 0 : 30);
    randomDate.setSeconds(0);
    randomDate.setMilliseconds(0);

    return randomDate.toISOString();
};

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }

    const supabase = createPagesServerClient({ req, res });
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const { tournamentId } = req.body;

    // 1. Verify Organizer & Get Approved Teams
    const { data: tournament, error: tError } = await supabase
        .from('tournaments')
        .select('id, organizer_id')
        .eq('id', tournamentId)
        .single();

    if (tError || !tournament) return res.status(404).json({ error: 'Tournament not found' });
    if (tournament.organizer_id !== user.id) return res.status(403).json({ error: 'Only the organizer can generate schedules.' });

    // 2. Get Approved Teams
    const { data: registrations } = await supabase
        .from('tournament_registrations')
        .select('team_id')
        .eq('tournament_id', tournamentId)

    if (!registrations || registrations.length < 2) {
        return res.status(400).json({ error: 'Need at least 2 teams to generate a schedule.' });
    }

    const teams = registrations.map(r => r.team_id);

    // 3. Define Generation Parameters
    const TODAY = new Date();
    const START_DATE = new Date(TODAY.setDate(TODAY.getDate() + 7)); 
    const END_DATE = new Date(TODAY.setDate(TODAY.getDate() + 30));   
    const POSSIBLE_HOURS = [10, 12, 14, 16, 18, 20]; 

    // 4. Fetch Available Venues
    // FIX: Changed 'const' to 'let' here so we can reassign it below if empty
    let { data: venuesData, error: venuesError } = await supabase
        .from('venues')
        .select('name');
        
    if (venuesError || !venuesData || venuesData.length === 0) {
        console.warn('No venues found. Using default "Main Arena".');
        venuesData = [{ name: 'Main Arena' }]; // This reassignment now works
    }
    const venues = venuesData.map(v => v.name);

    // 5. The Round Robin Algorithm with Random Data
    const matchesToInsert = [];
    
    for (let i = 0; i < teams.length; i++) {
        for (let j = i + 1; j < teams.length; j++) {
            const randomTime = getRandomMatchTime(START_DATE, END_DATE, POSSIBLE_HOURS);
            const randomVenue = getRandomElement(venues);

            matchesToInsert.push({
                tournament_id: tournamentId,
                team_a_id: teams[i],
                team_b_id: teams[j],
                status: 'scheduled',
                date: randomTime,
                venue: randomVenue, 
                round: 'Group Stage' 
            });
        }
    }

    // 6. Clear existing matches
    await supabase.from('matches').delete().eq('tournament_id', tournamentId);

    // 7. Insert new matches
    const { data, error } = await supabase
        .from('matches')
        .insert(matchesToInsert)
        .select();

    if (error) return res.status(500).json({ error: error.message });

    return res.status(200).json({ message: `Generated ${data.length} matches!`, matches: data });
}