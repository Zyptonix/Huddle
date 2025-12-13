import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { 
  Trophy, XCircle, MinusCircle, Activity, Target, Shield, Percent 
} from 'lucide-react';

export default function TeamStats({ teamId }) {
  const [stats, setStats] = useState({
    played: 0,
    wins: 0,
    draws: 0,
    losses: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    cleanSheets: 0,
    winRate: 0,
    goalDiff: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      if(!teamId) return;

      // Fetch all COMPLETED matches where this team played
      const { data: matches, error } = await supabase
        .from('matches')
        .select('score_a, score_b, team_a_id, team_b_id')
        .or(`team_a_id.eq.${teamId},team_b_id.eq.${teamId}`)
        .eq('status', 'completed');

      if (error) {
        console.error("Error loading stats:", error);
        setLoading(false);
        return;
      }

      // Calculate Stats Logic
      let w = 0, d = 0, l = 0, gf = 0, ga = 0, cs = 0;

      matches.forEach(m => {
        const isTeamA = m.team_a_id === teamId;
        const myScore = isTeamA ? m.score_a : m.score_b;
        const opScore = isTeamA ? m.score_b : m.score_a;

        // Goals Scored / Conceded
        gf += myScore;
        ga += opScore;

        // Match Result
        if (myScore > opScore) w++;
        else if (myScore < opScore) l++;
        else d++;

        // Clean Sheet Check
        if (opScore === 0) cs++;
      });

      const totalPlayed = matches.length;
      const winRate = totalPlayed > 0 ? Math.round((w / totalPlayed) * 100) : 0;

      setStats({
        played: totalPlayed,
        wins: w,
        draws: d,
        losses: l,
        goalsFor: gf,
        goalsAgainst: ga,
        goalDiff: gf - ga,
        cleanSheets: cs,
        winRate: winRate
      });
      setLoading(false);
    }

    loadStats();
  }, [teamId]);

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-pulse">
         {[...Array(4)].map((_, i) => (
             <div key={i} className="h-24 bg-gray-100 rounded-xl border border-gray-200"></div>
         ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* 1. Main Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Matches Played */}
        <StatCard 
            label="Matches Played" 
            value={stats.played} 
            icon={<Activity size={18} className="text-gray-400"/>}
            bg="bg-white"
        />
        
        {/* Wins */}
        <StatCard 
            label="Wins" 
            value={stats.wins} 
            icon={<Trophy size={18} className="text-emerald-500"/>}
            bg="bg-emerald-50 border-emerald-100"
            text="text-emerald-700"
        />

        {/* Draws */}
        <StatCard 
            label="Draws" 
            value={stats.draws} 
            icon={<MinusCircle size={18} className="text-gray-400"/>}
            bg="bg-white"
        />

        {/* Losses */}
        <StatCard 
            label="Losses" 
            value={stats.losses} 
            icon={<XCircle size={18} className="text-red-500"/>}
            bg="bg-red-50 border-red-100"
            text="text-red-700"
        />
      </div>

      {/* 2. Secondary Detailed Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Goals Stats */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between">
           <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                 <Target size={20} />
              </div>
              <div>
                 <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">Goals (GF / GA)</div>
                 <div className="text-lg font-bold text-gray-900">
                    <span className="text-blue-600">{stats.goalsFor}</span> 
                    <span className="text-gray-300 mx-2">/</span>
                    <span className="text-red-500">{stats.goalsAgainst}</span>
                 </div>
              </div>
           </div>
           <div className={`text-sm font-bold px-2 py-1 rounded ${stats.goalDiff >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              {stats.goalDiff > 0 ? '+' : ''}{stats.goalDiff} GD
           </div>
        </div>

        {/* Defense / Clean Sheets */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between">
           <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
                 <Shield size={20} />
              </div>
              <div>
                 <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">Clean Sheets</div>
                 <div className="text-lg font-bold text-gray-900">{stats.cleanSheets}</div>
              </div>
           </div>
           <div className="flex flex-col items-end">
             <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Win Rate</div>
             <div className="flex items-center gap-1 text-sm font-bold text-gray-700 bg-gray-100 px-2 py-1 rounded">
                <Percent size={12} /> {stats.winRate}%
             </div>
           </div>
        </div>

      </div>
    </div>
  );
}

// Reusable Card Component
function StatCard({ label, value, icon, bg = "bg-white", text = "text-gray-900" }) {
  return (
    <div className={`${bg} p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between h-24`}>
      <div className="flex justify-between items-start">
        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{label}</span>
        {icon}
      </div>
      <div className={`text-3xl font-black ${text}`}>
        {value}
      </div>
    </div>
  );
}