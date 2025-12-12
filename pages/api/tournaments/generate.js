import { createPagesServerClient } from '@supabase/auth-helpers-nextjs'

// --- Helper Functions for Randomization ---

// 1. Get a random element from an array
const getRandomElement = (arr) => arr[Math.floor(Math.random() * arr.length)];

// 2. Generate a random timestamp within a date range
const getRandomMatchTime = (startDate, endDate, possibleHours) => {
    // Generate a random date between startDate and endDate
    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime();
    const randomTime = start + Math.random() * (end - start);

    const randomDate = new Date(randomTime);

    // Pick a random hour from the possible hours array
    const randomHour = getRandomElement(possibleHours);
    
    // Set the hour and a random minute (00 or 30)
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
        // .eq('status', 'approved') // Use this if you want to strictly use approved teams

    if (!registrations || registrations.length < 2) {
        return res.status(400).json({ error: 'Need at least 2 teams to generate a schedule.' });
    }

    const teams = registrations.map(r => r.team_id);

    // 3. Define Generation Parameters
    const TODAY = new Date();
    const START_DATE = new Date(TODAY.setDate(TODAY.getDate() + 7)); // Start 1 week from now
    const END_DATE = new Date(TODAY.setDate(TODAY.getDate() + 30));   // End 4 weeks from now
    const POSSIBLE_HOURS = [10, 12, 14, 16, 18, 20]; // Match start times (10:00, 12:00, etc.)

    // 4. Fetch Available Venues
    // ASSUMPTION: You have a 'venues' table with a 'name' field.
    const { data: venuesData, error: venuesError } = await supabase
        .from('venues')
        .select('name')
        // OPTIONAL: Filter venues by location/availability if needed
        
    if (venuesError || !venuesData || venuesData.length === 0) {
        // Fallback if no venues are found
        console.warn('No venues found. Using default "Main Arena".');
        venuesData = [{ name: 'Main Arena' }];
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
                // --- NEW RANDOM DATA FIELDS ---
                date: randomTime, // This inserts the generated date/time
                venue: randomVenue, // This inserts the random venue
                round: 'Group Stage' // Placeholder for round name
            });
        }
    }

    // 6. Clear existing matches (Safer to start fresh)
    await supabase.from('matches').delete().eq('tournament_id', tournamentId);

    // 7. Insert new matches
    const { data, error } = await supabase
        .from('matches')
        .insert(matchesToInsert)
        .select();

    if (error) return res.status(500).json({ error: error.message });

    return res.status(200).json({ message: `Generated ${data.length} matches!`, matches: data });
}