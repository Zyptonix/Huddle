import { useEffect, useState } from "react";
import Layout from "../components/ui/Layout";
import { supabase } from "../lib/supabaseClient";

export default function LeaderboardsPage() {
  const [tournaments, setTournaments] = useState([]);
  const [selected, setSelected] = useState(null);
  const [standings, setStandings] = useState([]);
  const [scorers, setScorers] = useState([]);

  useEffect(() => {
    loadTournaments();
  }, []);

  const loadTournaments = async () => {
    const { data, error } = await supabase
      .from("tournaments")
      .select("id, name")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setTournaments(data);
      if (data.length > 0) setSelected(data[0].id);
    }
  };

  useEffect(() => {
    if (selected) loadLeaderboardData();
  }, [selected]);

  const loadLeaderboardData = async () => {
    const { data: matches } = await supabase
      .from("matches")
      .select("*")
      .eq("tournament_id", selected);

    const { data: stats } = await supabase
      .from("match_stats")
      .select("*")
      .eq("tournament_id", selected);

    computeStandings(matches || []);
    computeTopScorers(stats || []);
  };

  const computeStandings = (matches) => {
    const table = {};

    matches.forEach((m) => {
      // init teams
      table[m.home_team_id] = table[m.home_team_id] || { played: 0, won: 0, drawn: 0, lost: 0, points: 0 };
      table[m.away_team_id] = table[m.away_team_id] || { played: 0, won: 0, drawn: 0, lost: 0, points: 0 };

      table[m.home_team_id].played++;
      table[m.away_team_id].played++;

      if (m.home_score > m.away_score) {
        table[m.home_team_id].won++;
        table[m.home_team_id].points += 3;
        table[m.away_team_id].lost++;
      } else if (m.home_score < m.away_score) {
        table[m.away_team_id].won++;
        table[m.away_team_id].points += 3;
        table[m.home_team_id].lost++;
      } else {
        table[m.home_team_id].drawn++;
        table[m.away_team_id].drawn++;
        table[m.home_team_id].points++;
        table[m.away_team_id].points++;
      }
    });

    const arr = Object.entries(table).map(([teamId, stats]) => ({
      teamId,
      ...stats,
    }));

    arr.sort((a, b) => b.points - a.points);

    setStandings(arr);
  };

  const computeTopScorers = (stats) => {
    const scorerMap = {};

    stats.forEach((s) => {
      if (!scorerMap[s.player_id]) scorerMap[s.player_id] = { goals: 0 };
      scorerMap[s.player_id].goals += s.goals || 0;
    });

    const arr = Object.entries(scorerMap).map(([playerId, data]) => ({
      playerId,
      ...data,
    }));

    arr.sort((a, b) => b.goals - a.goals);
    setScorers(arr);
  };

  return (
    <Layout title="Leaderboards">
      <div className="p-6 max-w-4xl mx-auto space-y-10">
        <h1 className="text-2xl font-bold">Leaderboards</h1>

        <select
          className="border p-2 rounded"
          value={selected || ""}
          onChange={(e) => setSelected(e.target.value)}
        >
          {tournaments.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>

        {/* Standings */}
        <div>
          <h2 className="text-xl font-semibold mb-2">Standings</h2>
          <table className="w-full border text-left">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-2">Team ID</th>
                <th className="p-2">P</th>
                <th className="p-2">W</th>
                <th className="p-2">D</th>
                <th className="p-2">L</th>
                <th className="p-2">Pts</th>
              </tr>
            </thead>
            <tbody>
              {standings.map((s, idx) => (
                <tr key={idx} className="border-t">
                  <td className="p-2">{s.teamId}</td>
                  <td className="p-2">{s.played}</td>
                  <td className="p-2">{s.won}</td>
                  <td className="p-2">{s.drawn}</td>
                  <td className="p-2">{s.lost}</td>
                  <td className="p-2 font-bold">{s.points}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Top Scorers */}
        <div>
          <h2 className="text-xl font-semibold mb-2">Top Scorers</h2>
          <table className="w-full border text-left">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-2">Player ID</th>
                <th className="p-2">Goals</th>
              </tr>
            </thead>
            <tbody>
              {scorers.map((s, idx) => (
                <tr key={idx} className="border-t">
                  <td className="p-2">{s.playerId}</td>
                  <td className="p-2">{s.goals}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
}

