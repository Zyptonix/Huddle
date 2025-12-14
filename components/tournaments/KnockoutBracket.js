// components/tournaments/KnockoutBracket.js
import React from 'react';
import Link from 'next/link';

export default function KnockoutBracket({ matches }) {
  if (!matches || matches.length === 0) return null;

  // 1. Group matches by Round
  // We want to sort rounds based on match count (8 matches = Round 1, 4 matches = Round 2...)
  // Or simply by specific names if we have them.
  
  const roundsMap = matches.reduce((acc, match) => {
    const roundName = match.round_name || 'Unknown';
    if (!acc[roundName]) acc[roundName] = [];
    acc[roundName].push(match);
    return acc;
  }, {});

  // 2. Sort Rounds Order: We want the round with MOST matches first (Left side), Final last (Right side)
  const sortedRounds = Object.keys(roundsMap).sort((a, b) => {
    // Custom sort logic: bigger arrays come first (Round of 16 -> Quarters -> Semis)
    // Exception: 'Final' is always last.
    if (a === 'Final') return 1;
    if (b === 'Final') return -1;
    return roundsMap[b].length - roundsMap[a].length;
  });

  return (
    <div className="overflow-x-auto py-10">
      <div className="flex gap-16 min-w-max px-4">
        {sortedRounds.map((roundName, roundIndex) => (
          <div key={roundName} className="flex flex-col justify-around gap-8 relative">
            
            {/* Round Title */}
            <h3 className="absolute -top-8 left-0 w-full text-center text-xs font-bold text-gray-400 uppercase tracking-widest">
              {roundName}
            </h3>

            {/* Matches in this Round */}
            {roundsMap[roundName].map((match, i) => (
              <div key={match.id} className="relative flex flex-col justify-center">
                
                {/* Connector Lines (If not the last round) */}
                {roundIndex < sortedRounds.length - 1 && (
                   // This draws the line to the right
                   <div 
                     className={`absolute -right-8 h-full border-r-2 border-gray-300 top-1/2 
                     ${i % 2 === 0 ? 'rounded-tr-xl border-t-2 translate-y-px' : 'rounded-br-xl border-b-2 -translate-y-px'} 
                     w-8`} 
                     style={{ 
                       height: 'calc(100% + 2rem)', // Stretch to meet neighbor
                       top: i % 2 === 0 ? '50%' : '-50%',
                       display: i % 2 === 0 ? 'block' : 'block' // Logic can be complex for lines, simplified here
                     }}
                   />
                )}
                
                {/* Match Card */}
                <MatchCard match={match} />
                
                {/* Horizontal Connector to the right (Simple version) */}
                {roundIndex < sortedRounds.length - 1 && (
                   <div className={`absolute -right-16 top-1/2 w-8 h-0.5 bg-gray-300 ${i % 2 === 0 ? 'hidden' : 'block'}`}></div>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// Sub-component for individual match cards
function MatchCard({ match }) {
  const isWinnerA = match.score_a > match.score_b && match.status === 'completed';
  const isWinnerB = match.score_b > match.score_a && match.status === 'completed';

  return (
    <Link href={`/match/${match.id}`} className="block group">
      <div className="w-64 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md hover:border-indigo-300 transition-all overflow-hidden relative z-10">
        
        {/* Date Header */}
        <div className="bg-gray-50 px-3 py-1 text-[10px] text-gray-500 flex justify-between border-b border-gray-100">
          <span>Match #{match.id.substring(0,4)}</span>
          <span className={match.status === 'live' ? 'text-red-500 font-bold animate-pulse' : ''}>
             {match.status}
          </span>
        </div>

        {/* Team A */}
        <div className={`px-4 py-2 flex justify-between items-center ${isWinnerA ? 'bg-green-50' : ''}`}>
          <span className={`text-sm font-semibold truncate ${isWinnerA ? 'text-green-800' : 'text-gray-700'}`}>
            {match.teams_a?.name || <span className="text-gray-400 italic">Waiting...</span>}
          </span>
          <span className="font-mono font-bold text-gray-900">{match.score_a ?? '-'}</span>
        </div>

        {/* Team B */}
        <div className={`px-4 py-2 flex justify-between items-center border-t border-gray-100 ${isWinnerB ? 'bg-green-50' : ''}`}>
           <span className={`text-sm font-semibold truncate ${isWinnerB ? 'text-green-800' : 'text-gray-700'}`}>
            {match.teams_b?.name || <span className="text-gray-400 italic">Waiting...</span>}
          </span>
          <span className="font-mono font-bold text-gray-900">{match.score_b ?? '-'}</span>
        </div>
      </div>
    </Link>
  );
}