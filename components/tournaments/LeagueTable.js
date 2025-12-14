import React from 'react';

// --- IMPORTANT: Use 'export default' to fix your original error ---
export default function LeagueTable({ matches, teams }) {
    // 1. Initialize the Table structure
    // teams prop is the list of approved teams (from TournamentDashboard)
    const standings = teams.reduce((acc, team) => {
        acc[team.id] = {
            id: team.id,
            name: team.name,
            played: 0,
            wins: 0,
            draws: 0,
            losses: 0,
            goalsFor: 0,
            goalsAgainst: 0,
            goalDifference: 0,
            points: 0,
        };
        return acc;
    }, {});

    // 2. Process all FINISHED matches to calculate stats
    const finishedMatches = matches.filter(m => m.status === 'finished' || m.status === 'completed');

    finishedMatches.forEach(match => {
        const teamAId = match.team_a_id;
        const teamBId = match.team_b_id;
        const scoreA = match.score_a || 0;
        const scoreB = match.score_b || 0;

        // Skip if team data is missing or match is invalid
        if (!standings[teamAId] || !standings[teamBId]) return;

        // Update stats for Team A
        standings[teamAId].played += 1;
        standings[teamAId].goalsFor += scoreA;
        standings[teamAId].goalsAgainst += scoreB;

        // Update stats for Team B
        standings[teamBId].played += 1;
        standings[teamBId].goalsFor += scoreB;
        standings[teamBId].goalsAgainst += scoreA;
        
        // Calculate Match Result and Points (3 points for Win, 1 for Draw)
        if (scoreA > scoreB) {
            // Team A Wins
            standings[teamAId].wins += 1;
            standings[teamAId].points += 3;
            standings[teamBId].losses += 1;
        } else if (scoreB > scoreA) {
            // Team B Wins
            standings[teamBId].wins += 1;
            standings[teamBId].points += 3;
            standings[teamAId].losses += 1;
        } else {
            // Draw
            standings[teamAId].draws += 1;
            standings[teamBId].draws += 1;
            standings[teamAId].points += 1;
            standings[teamBId].points += 1;
        }
    });

    // 3. Finalize calculations and convert to array for sorting
    const finalStandings = Object.values(standings).map(team => ({
        ...team,
        goalDifference: team.goalsFor - team.goalsAgainst,
    }));

    // 4. Sort the table: 
    // Primary: Points (desc)
    // Secondary: Goal Difference (desc)
    // Tertiary: Goals For (desc)
    finalStandings.sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
        return b.goalsFor - a.goalsFor;
    });

    return (
        <div className="overflow-x-auto min-w-full">
            <table className="w-full text-sm text-left text-gray-500 rounded-xl overflow-hidden">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b border-gray-200">
                    <tr>
                        <th scope="col" className="px-6 py-3 sticky left-0 bg-gray-50 z-10">#</th>
                        <th scope="col" className="px-6 py-3 sticky left-0 bg-gray-50 z-10">Team</th>
                        <th scope="col" className="px-6 py-3 text-center">P</th>
                        <th scope="col" className="px-6 py-3 text-center">W</th>
                        <th scope="col" className="px-6 py-3 text-center">D</th>
                        <th scope="col" className="px-6 py-3 text-center">L</th>
                        <th scope="col" className="px-6 py-3 text-center">GF</th>
                        <th scope="col" className="px-6 py-3 text-center">GA</th>
                        <th scope="col" className="px-6 py-3 text-center">GD</th>
                        <th scope="col" className="px-6 py-3 text-center font-extrabold text-gray-900">Pts</th>
                    </tr>
                </thead>
                <tbody>
                    {finalStandings.map((team, index) => (
                        <tr key={team.id} className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} border-b hover:bg-indigo-50 transition-colors`}>
                            <td className="px-6 py-3 font-medium text-gray-900 sticky left-0 bg-inherit z-10">{index + 1}</td>
                            <th scope="row" className="px-6 py-3 font-bold text-gray-900 whitespace-nowrap sticky left-0 bg-inherit z-10">
                                {team.name}
                            </th>
                            <td className="px-6 py-3 text-center">{team.played}</td>
                            <td className="px-6 py-3 text-center text-green-600">{team.wins}</td>
                            <td className="px-6 py-3 text-center text-yellow-600">{team.draws}</td>
                            <td className="px-6 py-3 text-center text-red-600">{team.losses}</td>
                            <td className="px-6 py-3 text-center">{team.goalsFor}</td>
                            <td className="px-6 py-3 text-center">{team.goalsAgainst}</td>
                            <td className="px-6 py-3 text-center font-mono">{team.goalDifference}</td>
                            <td className="px-6 py-3 text-center font-extrabold text-lg text-indigo-600">{team.points}</td>
                        </tr>
                    ))}
                    {finalStandings.length === 0 && (
                        <tr>
                            <td colSpan="10" className="text-center p-8 text-gray-500 italic">
                                No teams or finished matches to display in the league table.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}