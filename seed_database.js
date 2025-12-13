// Run this with: node seed_database.js
require('dotenv').config({ path: '.env.local' }); 
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; 

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seed() {
  console.log('🌱 Starting Database Seed...');

  // 1. Get Owner ID
  const { data: users } = await supabase.auth.admin.listUsers();
  let ownerId = users.users[0]?.id;

  if (!ownerId) {
    console.log('⚠️ No users found. Please sign up at least one user in your app first.');
    return;
  }
  console.log(`👤 Using User ID: ${ownerId}`);

  // --- CLEANUP (Optional: Deletes previous test data to avoid duplicates) ---
  console.log('🧹 Cleaning up previous test data...');
  await supabase.from('matches').delete().neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
  await supabase.from('teams').delete().neq('id', '00000000-0000-0000-0000-000000000000'); 
  await supabase.from('tournaments').delete().neq('id', '00000000-0000-0000-0000-000000000000');

  // --- 2. Create Tournaments ---
  const tournamentsData = [
    { name: 'Winter Cup 2024', sport: 'football', format: 'league', organizer_id: ownerId, status: 'ongoing' },
    { name: 'City Slam Dunk', sport: 'basketball', format: 'knockout', organizer_id: ownerId, status: 'ongoing' },
    { name: 'Super Sixes Cricket', sport: 'cricket', format: 'league', organizer_id: ownerId, status: 'ongoing' }
  ];

  const { data: tournaments, error: tourError } = await supabase
    .from('tournaments')
    .insert(tournamentsData)
    .select();

  if (tourError) return console.error('Error creating tournaments:', tourError);
  console.log(`🏆 Created ${tournaments.length} Tournaments`);

  // --- 3. Create Teams ---
  const teamsData = [
    // Football
    { name: 'Red Dragons FC', sport: 'football', owner_id: ownerId, logo_url: 'https://placehold.co/100x100/red/white?text=RD' },
    { name: 'Blue Thunder FC', sport: 'football', owner_id: ownerId, logo_url: 'https://placehold.co/100x100/blue/white?text=BT' },
    // Basketball
    { name: 'Downtown Dunkers', sport: 'basketball', owner_id: ownerId, logo_url: 'https://placehold.co/100x100/orange/black?text=DD' },
    { name: 'Net Rippers', sport: 'basketball', owner_id: ownerId, logo_url: 'https://placehold.co/100x100/black/white?text=NR' },
    // Cricket
    { name: 'Willow Warriors', sport: 'cricket', owner_id: ownerId, logo_url: 'https://placehold.co/100x100/green/white?text=WW' },
    { name: 'Spin Kings', sport: 'cricket', owner_id: ownerId, logo_url: 'https://placehold.co/100x100/yellow/black?text=SK' }
  ];

  const { data: teams, error: teamError } = await supabase
    .from('teams')
    .insert(teamsData)
    .select();

  if (teamError) return console.error('Error creating teams:', teamError);
  console.log(`👕 Created ${teams.length} Teams`);

  // --- 4. Create Matches ---
  // Helper to find ID by name
  const getTourney = (sport) => tournaments.find(t => t.sport === sport).id;
  const getTeam = (name) => teams.find(t => t.name === name).id;

  const matchesData = [
    {
      tournament_id: getTourney('football'),
      team_a_id: getTeam('Red Dragons FC'),
      team_b_id: getTeam('Blue Thunder FC'),
      // REMOVED 'sport_type' because it's not in your schema
      score_a: 1,
      score_b: 0,
      status: 'live',
      current_period: '1H',
      game_clock: '15:30',
      match_time: new Date().toISOString()
    },
    {
      tournament_id: getTourney('basketball'),
      team_a_id: getTeam('Downtown Dunkers'),
      team_b_id: getTeam('Net Rippers'),
      score_a: 24,
      score_b: 22,
      status: 'live',
      current_period: 'Q2',
      game_clock: '04:12',
      match_time: new Date().toISOString()
    },
    {
      tournament_id: getTourney('cricket'),
      team_a_id: getTeam('Willow Warriors'),
      team_b_id: getTeam('Spin Kings'),
      score_a: 120,
      score_b: 0,
      status: 'live',
      current_period: 'Over 14',
      game_clock: '14.2',
      details: { wickets_a: 3, wickets_b: 0 }, 
      match_time: new Date().toISOString()
    }
  ];

  const { data: matches, error: matchError } = await supabase
    .from('matches')
    .insert(matchesData)
    .select();

  if (matchError) return console.error('Error creating matches:', matchError);
  console.log(`⚔️ Created ${matches.length} Matches`);

  console.log('✅ Database Seeded Successfully!');
  console.log('-----------------------------------');
  console.log('Use these Match IDs to test:');
  
  // Need to manually map sport for display since we removed it from the table
  const getSport = (tid) => tournaments.find(t => t.id === tid)?.sport.toUpperCase();

  matches.forEach(m => {
    console.log(`👉 ${getSport(m.tournament_id)}: http://localhost:3000/match/${m.id}/operator`);
  });
}

seed();