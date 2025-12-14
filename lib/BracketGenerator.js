// lib/bracketGenerator.js
import { supabase } from './supabaseClient';

export const generateBracket = async (tournamentId, teams) => {
  // 1. Validate Power of 2 (2, 4, 8, 16, 32...)
  const count = teams.length;
  if (Math.log2(count) % 1 !== 0) {
    throw new Error("Team count must be a power of 2 (e.g., 4, 8, 16). Please add Bye teams if needed.");
  }

  const rounds = Math.log2(count);
  let nextRoundMatches = []; // Holds the IDs of the matches we just created

  // 2. Loop BACKWARDS from Final (Round 1) to First Round
  // i = 1 is the Final, i = rounds is the first round
  for (let round = 1; round <= rounds; round++) {
    const isFinal = round === 1;
    const isFirstRound = round === rounds;
    const matchCount = Math.pow(2, round - 1); // 1 match for final, 2 for semis, etc.
    
    // Define Round Name
    let roundName = `Round ${round}`;
    if (isFinal) roundName = "Final";
    else if (round === 2) roundName = "Semi-Final";
    else if (round === 3) roundName = "Quarter-Final";

    const currentRoundMatches = [];

    // Create matches for this round
    for (let i = 0; i < matchCount; i++) {
      // Determine where the winner goes (Next Match)
      // Since we generate backwards, 'nextRoundMatches' contains the future games
      let nextMatchId = null;
      let nextMatchSlot = null;

      if (!isFinal) {
        // Example: If we are in Semis (2 matches), we link to Final (1 match)
        // Match 0 and 1 go to Parent Match 0. 
        // Even index (0) goes to Slot A, Odd index (1) goes to Slot B.
        const parentIndex = Math.floor(i / 2);
        nextMatchId = nextRoundMatches[parentIndex].id;
        nextMatchSlot = (i % 2 === 0) ? 'a' : 'b';
      }

      // Prepare Match Object
      const matchData = {
        tournament_id: tournamentId,
        round_name: roundName,
        status: 'scheduled',
        next_match_id: nextMatchId,
        next_match_slot: nextMatchSlot,
        team_a_id: null, // Will fill later if this is first round
        team_b_id: null  // Will fill later if this is first round
      };

      // If it's the First Round, Assign the Teams now
      if (isFirstRound) {
        matchData.team_a_id = teams[i * 2].id;
        matchData.team_b_id = teams[i * 2 + 1].id;
      }

      // Insert into DB
      const { data, error } = await supabase
        .from('matches')
        .insert(matchData)
        .select()
        .single();
        
      if (error) throw error;
      currentRoundMatches.push(data);
    }

    // Prepare for next loop (which is actually the 'previous' round in time)
    nextRoundMatches = currentRoundMatches;
  }

  return true;
};