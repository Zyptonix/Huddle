import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { 
  Users, Plus, Search, Hash, Shield, 
  ArrowRight, Briefcase, UserCheck, Lock, Globe, X, AlertCircle
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabaseClient' // Ensure this path is correct!
import Layout from '../components/ui/Layout'
import Loading from '../components/ui/Loading'

export default function TeamPortal() {
  const { user, profile } = useAuth()
  const router = useRouter()
  
  // Tabs: 'my-teams' or 'all-teams'
  const [activeTab, setActiveTab] = useState('my-teams') 
  
  const [data, setData] = useState({ myTeams: [], allTeams: [] })
  const [loading, setLoading] = useState(true)
  const [joinCode, setJoinCode] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [errorMsg, setErrorMsg] = useState(null) // New error state

  useEffect(() => {
    if (user) fetchPortalData()
  }, [user]) 

  const fetchPortalData = async () => {
    try {
      console.log("--- STARTING FETCH PORTAL DATA ---");
      setErrorMsg(null);

      // 1. GET SESSION TOKEN
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) {
          console.warn("No active session token found via Supabase client.");
          // We don't return here, we try fetching anyway in case cookies handle it
      }

      // 2. PREPARE OPTIONS (Header + Credentials)
      const options = {
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }) // Attach token if exists
        },
        credentials: 'include' // <--- CRITICAL: Sends cookies to the server
      };

      // 3. EXECUTE REQUESTS
      const [joinedRes, managedRes, publicRes] = await Promise.all([
        fetch('/api/teams/joined', options),
        fetch('/api/teams/created', options), 
        fetch('/api/teams/public', options) 
      ])

      // 4. HANDLE 401 UNAUTHORIZED SPECIFICALLY
      if (joinedRes.status === 401 || managedRes.status === 401) {
          const errText = await joinedRes.text(); // Read the server error message
          console.error("401 ERROR DETAIL:", errText);
          throw new Error("Unauthorized: Please try logging out and logging back in.");
      }

      // 5. PARSE DATA
      const joined = joinedRes.ok ? await joinedRes.json() : []
      const managed = managedRes.ok ? await managedRes.json() : []
      const publicTeams = publicRes.ok ? await publicRes.json() : []

      // --- PROCESS LISTS ---
      const myTeamIds = new Set()
      const combinedMyTeams = []

      // Add Managed teams
      managed.forEach(team => {
        myTeamIds.add(team.id)
        combinedMyTeams.push({ ...team, relation: 'manager' })
      })

      // Add Joined teams
      joined.forEach(team => {
        if (!myTeamIds.has(team.id)) {
          myTeamIds.add(team.id)
          combinedMyTeams.push({ ...team, relation: 'member' })
        }
      })

      const filteredPublic = publicTeams.filter(team => !myTeamIds.has(team.id))

      setData({
        myTeams: combinedMyTeams,
        allTeams: filteredPublic
      })

    } catch (error) {
      console.error("Portal load error:", error)
      setErrorMsg(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleJoinByCode = async (e) => {
    e.preventDefault(); 
    if (!joinCode) return; 

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch('/api/teams/join', {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({ userId: user.id, joinCode: joinCode }),
      });

      const resData = await response.json();

      if (!response.ok) {
        alert(`Failed: ${resData.error || 'Could not join team'}`); 
        return;
      }

      alert("Success! You have joined the team.");
      fetchPortalData(); 
      setJoinCode(''); 
      setActiveTab('my-teams'); 
      
    } catch (err) {
      console.error("Network Error:", err);
      alert("Network error. Check console.");
    }
  };

  if (loading) return <Loading message="Scouting teams..." />

  const isPlayer = profile?.role === 'player';
  const isCoach = profile?.role === 'coach' || profile?.role === 'organizer';

  // --- FILTERING LOGIC ---
  let currentList = activeTab === 'my-teams' ? data.myTeams : data.allTeams;

  // Apply Search Filter
  if (searchQuery.trim()) {
    currentList = currentList.filter(team => 
        team.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }

  return (
    <Layout title="Team Portal - Huddle">
      {/* HERO SECTION */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl p-8 mb-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 opacity-10 transform translate-x-10 -translate-y-10">
           <Shield size={200} />
        </div>
        
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
           <div>
              <h1 className="text-3xl font-black italic uppercase tracking-wider mb-2">Team Portal</h1>
              <p className="text-slate-300 max-w-lg">
                  Manage your career, scout for new clubs, or build your own dynasty.
              </p>
           </div>
           
           <div className="flex gap-3 w-full md:w-auto items-center">
              {isPlayer && (
                  <form onSubmit={handleJoinByCode} className="flex bg-white/10 rounded-lg backdrop-blur-sm border border-white/20 p-1 flex-1 md:flex-none">
                      <div className="pl-2 flex items-center text-slate-400"><Hash size={16} /></div>
                      <input 
                        type="text" 
                        placeholder="Enter Team Code" 
                        value={joinCode}
                        onChange={(e) => setJoinCode(e.target.value)}
                        className="bg-transparent border-none text-white placeholder-slate-400 text-sm focus:ring-0 w-full md:w-32"
                      />
                      <button type="submit" className="bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-1 rounded-md text-xs font-bold transition-colors">
                        JOIN
                      </button>
                  </form>
              )}
              
              {isCoach && (
                  <Link href="/teams/create" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 shadow-lg transition-transform hover:scale-105 whitespace-nowrap">
                      <Plus size={18} /> Create Team
                  </Link>
              )}
           </div>
        </div>
      </div>

      {/* ERROR MESSAGE DISPLAY */}
      {errorMsg && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6 flex items-center gap-3">
              <AlertCircle size={20} />
              <div>
                  <p className="font-bold">Connection Issue</p>
                  <p className="text-sm">{errorMsg}</p>
              </div>
          </div>
      )}

      {/* TABS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-gray-200 mb-6 gap-4">
         <div className="flex">
             <button 
                onClick={() => { setActiveTab('my-teams'); setSearchQuery(''); }} 
                className={`pb-3 px-6 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'my-teams' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
             >
                <Shield size={18} /> My Teams
                <span className="bg-gray-100 text-gray-600 py-0.5 px-2 rounded-full text-xs ml-1">{data.myTeams.length}</span>
             </button>
             
             <button 
                onClick={() => { setActiveTab('all-teams'); setSearchQuery(''); }} 
                className={`pb-3 px-6 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'all-teams' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
             >
                <Globe size={18} /> All Teams
             </button>
         </div>

         {/* SEARCH BAR (Visible only on All Teams tab) */}
         {activeTab === 'all-teams' && (
             <div className="relative w-full md:w-64 mb-2 md:mb-0">
                 <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                     <Search size={16} className="text-gray-400" />
                 </div>
                 <input
                     type="text"
                     placeholder="Search teams..."
                     value={searchQuery}
                     onChange={(e) => setSearchQuery(e.target.value)}
                     className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-emerald-500 focus:border-emerald-500 w-full"
                 />
                 {searchQuery && (
                     <button onClick={() => setSearchQuery('')} className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600">
                         <X size={14} />
                     </button>
                 )}
             </div>
         )}
      </div>

      {/* CONTENT GRID */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
         
         {/* EMPTY STATE: MY TEAMS */}
         {activeTab === 'my-teams' && currentList.length === 0 && !searchQuery && (
            <div className="col-span-full py-12 text-center bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
               <Briefcase size={48} className="mx-auto text-gray-300 mb-3" />
               <h3 className="text-gray-900 font-bold">No Active Teams</h3>
               <p className="text-gray-500 text-sm mt-1">You aren't part of any squads yet.</p>
               
               <div className="flex justify-center gap-4 mt-4">
                  {isCoach && <Link href="/teams/create" className="text-blue-600 hover:underline text-sm font-bold">Create a Club</Link>}
                  <button onClick={() => setActiveTab('all-teams')} className="text-emerald-600 hover:underline text-sm font-bold">Scout the Market</button>
               </div>
            </div>
         )}

         {/* EMPTY STATE: ALL TEAMS / SEARCH */}
         {currentList.length === 0 && (activeTab === 'all-teams' || searchQuery) && (
            <div className="col-span-full py-12 text-center bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
               <Search size={48} className="mx-auto text-gray-300 mb-3" />
               <h3 className="text-gray-900 font-bold">No Teams Found</h3>
               <p className="text-gray-500 text-sm mt-1">
                   {searchQuery ? `No teams match "${searchQuery}"` : "There are no other public teams available right now."}
               </p>
            </div>
         )}

         {/* RENDER CARDS */}
         {currentList.map((team) => (
            <Link key={team.id} href={`/teams/${team.id}`} className="group bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-xl hover:border-blue-300 transition-all duration-300">
               {/* Card Banner */}
               <div className={`h-24 relative ${team.sport === 'football' ? 'bg-green-600' : team.sport === 'basketball' ? 'bg-orange-500' : 'bg-blue-600'}`}>
                  <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
                  <div className="absolute -bottom-6 left-6">
                      <div className="w-16 h-16 rounded-xl bg-white p-1 shadow-md">
                         <div className="w-full h-full bg-gray-100 rounded-lg flex items-center justify-center text-xl font-black text-gray-400 uppercase">
                            {team.logo_url ? <img src={team.logo_url} className="w-full h-full object-cover rounded" /> : team.name.substring(0, 2)}
                         </div>
                      </div>
                  </div>
                  <span className="absolute top-3 right-3 bg-black/30 backdrop-blur-md text-white text-[10px] font-bold px-2 py-1 rounded uppercase">
                      {team.sport}
                  </span>
               </div>
               
               <div className="pt-8 pb-5 px-6">
                  <h3 className="font-bold text-gray-900 text-lg group-hover:text-blue-600 transition-colors truncate">{team.name}</h3>
                  
                  {/* BADGES */}
                  {activeTab === 'all-teams' ? (
                      <div className="mt-3 flex items-center gap-2">
                         {team.is_recruiting ? (
                             <div className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-1 rounded flex items-center gap-1">
                                <UserCheck size={14} /> Recruiting
                             </div>
                         ) : (
                             <div className="text-xs font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded flex items-center gap-1">
                                <Lock size={14} /> Not Recruiting
                             </div>
                         )}
                      </div>
                  ) : (
                      <div className="mt-3">
                         <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded ${team.relation === 'manager' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                            {team.relation === 'manager' ? 'Manager' : 'Player'}
                         </span>
                      </div>
                  )}

                  <p className="text-sm text-gray-500 mt-3 line-clamp-2 min-h-[40px]">{team.description || "No team bio available."}</p>

                  <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center text-xs text-gray-400 font-medium">
                      <span className="flex items-center gap-1"><Users size={14} /> {team.member_count || 0} Members</span>
                      <span className="flex items-center gap-1 text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
                        Visit Headquarters <ArrowRight size={12} />
                      </span>
                  </div>
               </div>
            </Link>
         ))}

      </div>
    </Layout>
  )
}