import { useEffect, useState } from "react";
import Layout from "../components/ui/Layout";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../context/AuthContext";

export default function Training() {
  const { user } = useAuth();
  const [teamId, setTeamId] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [form, setForm] = useState({
    title: "",
    description: "",
    start_time: "",
    end_time: "",
    location: "",
  });

  useEffect(() => {
    loadTeam();
  }, []);

  const loadTeam = async () => {
    const { data } = await supabase
      .from("team_members")
      .select("team_id")
      .eq("user_id", user.id)
      .single();

    if (data) {
      setTeamId(data.team_id);
      loadSessions(data.team_id);
    }
  };

  const loadSessions = async (team) => {
    const { data } = await supabase
      .from("training_sessions")
      .select("*")
      .eq("team_id", team)
      .order("start_time", { ascending: true });

    if (data) setSessions(data);
  };

  const submit = async (e) => {
    e.preventDefault();

    const payload = {
      ...form,
      team_id: teamId,
      coach_id: user.id,
    };

    const { error } = await supabase
      .from("training_sessions")
      .insert(payload);

    if (!error) {
      alert("Training session added!");
      setForm({ title: "", description: "", start_time: "", end_time: "", location: "" });
      loadSessions(teamId);
    }
  };

  return (
    <Layout title="Training Planner">
      <div className="p-6 max-w-3xl mx-auto space-y-8">

        <h1 className="text-2xl font-bold">Training Planner</h1>

        <form className="space-y-4 border rounded p-4" onSubmit={submit}>
          <input
            className="w-full border p-2"
            placeholder="Title"
            required
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />

          <textarea
            className="w-full border p-2"
            placeholder="Description"
            value={form.description}
            onChange={(e) =>
              setForm({ ...form, description: e.target.value })
            }
          />

          <input
            className="w-full border p-2"
            type="datetime-local"
            required
            value={form.start_time}
            onChange={(e) => setForm({ ...form, start_time: e.target.value })}
          />

          <input
            className="w-full border p-2"
            type="datetime-local"
            value={form.end_time}
            onChange={(e) => setForm({ ...form, end_time: e.target.value })}
          />

          <input
            className="w-full border p-2"
            placeholder="Location"
            value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
          />

          <button className="bg-blue-600 text-white px-4 py-2 rounded">
            Add Training
          </button>
        </form>

        <h2 className="text-xl font-semibold">Upcoming Sessions</h2>
        <div className="space-y-4">
          {sessions.map((s) => (
            <div key={s.id} className="border p-4 rounded">
              <h3 className="font-semibold">{s.title}</h3>
              <p>{new Date(s.start_time).toLocaleString()}</p>
              {s.end_time && <p>Ends: {new Date(s.end_time).toLocaleString()}</p>}
              {s.location && <p>📍 {s.location}</p>}
              <p>{s.description}</p>
            </div>
          ))}
        </div>

      </div>
    </Layout>
  );
}

