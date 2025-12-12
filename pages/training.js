import { useEffect, useState } from "react";
import Layout from "../components/ui/Layout";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../context/AuthContext";
import { 
  Calendar, 
  MapPin, 
  Clock, 
  Plus, 
  ClipboardList, 
  AlignLeft, 
  Zap,
  TrendingUp,
  ChevronRight
} from "lucide-react";

export default function Training() {
  const { user } = useAuth();
  const [teamId, setTeamId] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [form, setForm] = useState({
    title: "",
    description: "",
    start_time: "",
    end_time: "",
    location: "",
  });

  useEffect(() => {
    if (user) loadTeam();
  }, [user]);

  const loadTeam = async () => {
    try {
      const { data } = await supabase
        .from("team_members")
        .select("team_id")
        .eq("user_id", user.id)
        .single();

      if (data) {
        setTeamId(data.team_id);
        loadSessions(data.team_id);
      } else {
        setLoading(false);
      }
    } catch (error) {
      console.error("Error loading team:", error);
      setLoading(false);
    }
  };

  const loadSessions = async (team) => {
    const { data } = await supabase
      .from("training_sessions")
      .select("*")
      .eq("team_id", team)
      .order("start_time", { ascending: true });

    if (data) setSessions(data);
    setLoading(false);
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!teamId) return alert("You must be part of a team.");

    const payload = { ...form, team_id: teamId, coach_id: user.id };
    const { error } = await supabase.from("training_sessions").insert(payload);

    if (!error) {
      alert("Session scheduled successfully!");
      setForm({ title: "", description: "", start_time: "", end_time: "", location: "" });
      loadSessions(teamId);
    } else {
      alert(error.message);
    }
  };

  const getDateBadge = (dateString) => {
    const date = new Date(dateString);
    return {
      month: date.toLocaleString('default', { month: 'short' }).toUpperCase(),
      day: date.getDate()
    };
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <Layout title="Training Planner">
      {/* 1. Subtle Gradient Background for the whole page */}
      <div className="min-h-screen bg-gray-50 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-100/40 via-gray-50 to-gray-50 pb-20">
        
        <div className="max-w-6xl mx-auto px-6 py-10">
          
          {/* 2. HEADER: Clean but with a pop of color icon */}
          <div className="mb-10 flex items-end justify-between">
            <div>
              <h1 className="text-4xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                <span className="bg-gradient-to-br from-violet-600 to-indigo-600 text-transparent bg-clip-text">
                  Training
                </span>
                Planner
              </h1>
              <p className="text-gray-500 mt-2 text-lg font-medium">
                Strategize, schedule, and dominate the next match.
              </p>
            </div>
            {/* Decorative Stat Pill (Optional) */}
            <div className="hidden md:flex items-center gap-2 bg-white px-4 py-2 rounded-full border border-gray-200 shadow-sm text-sm font-bold text-gray-600">
               <Zap className="text-yellow-500 fill-yellow-500" size={16} />
               <span>Team Intensity: High</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* === LEFT COLUMN: THE FORM CARD === */}
            <div className="lg:col-span-1">
              <div className="sticky top-8">
                <div className="bg-white rounded-3xl shadow-xl shadow-indigo-100/50 border border-gray-100 overflow-hidden relative group">
                  
                  {/* GRADIENT HEADER */}
                  <div className="bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 px-6 py-5 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-white opacity-10 rounded-full -mr-8 -mt-8 blur-xl"></div>
                    <div className="relative z-10 flex items-center justify-between">
                       <h2 className="text-white font-bold text-lg flex items-center gap-2">
                         <Plus className="bg-white/20 rounded-lg p-1" size={28} />
                         New Session
                       </h2>
                       <div className="w-2 h-2 rounded-full bg-green-400 shadow-[0_0_10px_rgba(74,222,128,0.8)] animate-pulse"></div>
                    </div>
                  </div>
                  
                  <form className="p-6 space-y-5" onSubmit={submit}>
                    
                    {/* Floating Label Style Inputs */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider ml-1">Title</label>
                      <div className="relative">
                        <input
                          className="w-full pl-4 pr-4 py-3 bg-gray-50 border-2 border-transparent rounded-xl focus:bg-white focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 transition-all outline-none font-bold text-gray-900 placeholder:text-gray-400 placeholder:font-medium"
                          placeholder="e.g. Endurance Training"
                          required
                          value={form.title}
                          onChange={(e) => setForm({ ...form, title: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider ml-1">Description</label>
                      <textarea
                        className="w-full px-4 py-3 bg-gray-50 border-2 border-transparent rounded-xl focus:bg-white focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 transition-all outline-none font-medium text-gray-700 placeholder:text-gray-400 min-h-[100px] resize-none"
                        placeholder="Drill details..."
                        value={form.description}
                        onChange={(e) => setForm({ ...form, description: e.target.value })}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                       <div className="space-y-1">
                          <label className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider ml-1">Start</label>
                          <input
                            className="w-full px-3 py-2.5 bg-gray-50 rounded-xl text-xs font-bold text-gray-700 border-2 border-transparent focus:bg-white focus:border-violet-500 transition-all outline-none"
                            type="datetime-local"
                            required
                            value={form.start_time}
                            onChange={(e) => setForm({ ...form, start_time: e.target.value })}
                          />
                       </div>
                       <div className="space-y-1">
                          <label className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider ml-1">End</label>
                          <input
                            className="w-full px-3 py-2.5 bg-gray-50 rounded-xl text-xs font-bold text-gray-700 border-2 border-transparent focus:bg-white focus:border-violet-500 transition-all outline-none"
                            type="datetime-local"
                            value={form.end_time}
                            onChange={(e) => setForm({ ...form, end_time: e.target.value })}
                          />
                       </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider ml-1">Location</label>
                      <div className="relative">
                        <MapPin size={16} className="absolute left-4 top-3.5 text-gray-400" />
                        <input
                          className="w-full pl-10 pr-4 py-3 bg-gray-50 border-2 border-transparent rounded-xl focus:bg-white focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 transition-all outline-none font-medium text-gray-900 placeholder:text-gray-400"
                          placeholder="Location..."
                          value={form.location}
                          onChange={(e) => setForm({ ...form, location: e.target.value })}
                        />
                      </div>
                    </div>

                    {/* Gradient Button */}
                    <button className="w-full mt-2 bg-gradient-to-r from-gray-900 to-gray-800 hover:from-black hover:to-gray-900 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-gray-900/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 group-hover:shadow-xl">
                      Schedule It
                      <TrendingUp size={18} className="text-violet-400" />
                    </button>
                  </form>
                </div>
              </div>
            </div>

            {/* === RIGHT COLUMN: LIST === */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* SECTION HEADER */}
              <div className="flex items-center gap-3 pb-2 border-b border-gray-200/50">
                 <div className="bg-blue-100 p-2 rounded-lg">
                    <Calendar className="text-blue-600" size={20} />
                 </div>
                 <h2 className="text-xl font-bold text-gray-800">Upcoming Sessions</h2>
              </div>

              {loading ? (
                 <div className="animate-pulse space-y-4">
                    {[1,2].map(i => <div key={i} className="h-24 bg-gray-100 rounded-2xl"></div>)}
                 </div>
              ) : sessions.length === 0 ? (
                
                // === UNIQUE GRADIENT EMPTY STATE ===
                <div className="relative overflow-hidden bg-gradient-to-br from-white to-indigo-50 rounded-3xl border border-indigo-100 p-12 text-center shadow-sm">
                   <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-b from-purple-200 to-transparent opacity-20 rounded-full blur-3xl -mr-16 -mt-16"></div>
                   
                   <div className="relative z-10 flex flex-col items-center">
                      <div className="w-20 h-20 bg-white rounded-2xl shadow-lg shadow-indigo-100 flex items-center justify-center mb-6 rotate-3">
                         <ClipboardList size={40} className="text-indigo-500" />
                      </div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-2">Rest Day?</h3>
                      <p className="text-gray-500 max-w-md mx-auto leading-relaxed">
                        There are no sessions scheduled for your team yet. Use the planner to set up your next practice or team meeting.
                      </p>
                   </div>
                </div>

              ) : (
                <div className="space-y-4">
                  {sessions.map((s, i) => {
                    const { month, day } = getDateBadge(s.start_time);
                    
                    return (
                      <div key={s.id} className="group relative bg-white rounded-2xl p-1 border border-gray-100 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                        {/* Decorative Gradient Line on Left */}
                        <div className="absolute left-0 top-6 bottom-6 w-1 bg-gradient-to-b from-violet-500 to-fuchsia-500 rounded-r-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        
                        <div className="flex gap-5 items-stretch p-4">
                           {/* Date Box */}
                           <div className="flex flex-col items-center justify-center w-20 bg-gray-50 rounded-xl border border-gray-100 group-hover:bg-gray-900 group-hover:text-white transition-colors duration-300">
                              <span className="text-xs font-bold uppercase tracking-wider opacity-60 group-hover:opacity-80">{month}</span>
                              <span className="text-2xl font-black">{day}</span>
                           </div>

                           <div className="flex-1 py-1">
                              <div className="flex justify-between items-start">
                                 <div>
                                   <h3 className="text-lg font-bold text-gray-900 group-hover:text-violet-600 transition-colors">{s.title}</h3>
                                   <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-gray-500 font-medium">
                                      <span className="flex items-center gap-1.5">
                                         <Clock size={14} className="text-blue-500" />
                                         {formatTime(s.start_time)}
                                      </span>
                                      {s.location && (
                                        <span className="flex items-center gap-1.5">
                                           <MapPin size={14} className="text-pink-500" />
                                           {s.location}
                                        </span>
                                      )}
                                   </div>
                                 </div>
                                 <ChevronRight className="text-gray-300 group-hover:text-violet-500 group-hover:translate-x-1 transition-all" />
                              </div>
                              
                              {s.description && (
                                <p className="mt-3 text-sm text-gray-500 leading-relaxed line-clamp-2">
                                  {s.description}
                                </p>
                              )}
                           </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            
          </div>
        </div>
      </div>
    </Layout>
  );
}
