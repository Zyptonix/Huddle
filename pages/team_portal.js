import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { 
  Users, Plus, Search, Hash, Shield, 
  Trophy, ArrowRight, Briefcase, UserCheck 
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import Layout from '../components/ui/Layout'
import Loading from '../components/ui/Loading'

export default function TeamPortal() {
  const { user, profile } = useAuth()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('career') // 'career' | 'managed' | 'market'
  
  const [data, setData] = useState({ joined: [], managed: [], public: [] })
  const [loading, setLoading] = useState(true)
  const [joinCode, setJoinCode] = useState('')

  useEffect(() => {
    if (user) fetchPortalData()
  }, [user, activeTab])

  const fetchPortalData = async () => {
    try {
      // In a real app, these might be separate API calls depending on the tab
      const [joinedRes, managedRes, publicRes] = await Promise.all([
        fetch('/api/teams/joined'),
        fetch('/api/teams/created'), 
        fetch('/api/teams/public?recruiting=true')
      ])

      setData({
        joined: joinedRes.ok ? await joinedRes.json() : [],
        managed: managedRes.ok ? await managedRes.json() : [],
        public: publicRes.ok ? await publicRes.json() : []
      })
    } catch (error) {
      console.error("Portal load error", error)
    } finally {
      setLoading(false)
    }
  }

  const handleJoinByCode = async (e) => {
    e.preventDefault()
    if (!joinCode) return
    try {
      const res = await fetch('/api/teams/join-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: joinCode, userId: user.id })
      })
      const result = await res.json()
      if (res.ok) {
        alert("Welcome to the team! Redirecting...")
        router.push(`/teams/${result.teamId}`)
      } else {
        alert(result.error || "Invalid code")
      }
    } catch (err) {
      alert("Error joining team")
    }
  }

  if (loading) return <Loading message="Scouting teams..." />

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
           
           <div className="flex gap-3 w-full md:w-auto">
              {/* Join Code Input */}
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
              
              <Link href="/teams/create" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 shadow-lg transition-transform hover:scale-105 whitespace-nowrap">
                 <Plus size={18} /> Create Team
              </Link>
           </div>
        </div>
      </div>

      {/* TABS */}
      <div className="flex border-b border-gray-200 mb-6">
         <button onClick={() => setActiveTab('career')} className={`pb-3 px-6 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'career' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            <UserCheck size={18} /> My Career
         </button>
         <button onClick={() => setActiveTab('managed')} className={`pb-3 px-6 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'managed' ? 'border-purple-600 text-purple-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            <Briefcase size={18} /> Manager's Office
         </button>
         <button onClick={() => setActiveTab('market')} className={`pb-3 px-6 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'market' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            <Search size={18} /> Transfer Market
         </button>
      </div>

      {/* CONTENT GRID */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
         
         {activeTab === 'career' && data.joined.length === 0 && (
            <div className="col-span-full py-12 text-center bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
               <Users size={48} className="mx-auto text-gray-300 mb-3" />
               <h3 className="text-gray-900 font-bold">Free Agent?</h3>
               <p className="text-gray-500 text-sm mt-1">You haven't joined any teams yet.</p>
               <button onClick={() => setActiveTab('market')} className="mt-4 text-blue-600 hover:underline text-sm font-bold">Find a team &rarr;</button>
            </div>
         )}

         {activeTab === 'managed' && data.managed.length === 0 && (
            <div className="col-span-full py-12 text-center bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
               <Briefcase size={48} className="mx-auto text-gray-300 mb-3" />
               <h3 className="text-gray-900 font-bold">Start Your Dynasty</h3>
               <p className="text-gray-500 text-sm mt-1">Create a team to start managing rosters and joining tournaments.</p>
               <Link href="/teams/create" className="mt-4 inline-block bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-bold">Create Club</Link>
            </div>
         )}

         {/* RENDER CARDS */}
         {(activeTab === 'career' ? data.joined : activeTab === 'managed' ? data.managed : data.public).map((team) => (
            <Link key={team.id} href={`/teams/${team.id}`} className="group bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-xl hover:border-blue-300 transition-all duration-300">
               {/* Card Banner */}
               <div className={`h-24 relative ${team.sport === 'football' ? 'bg-green-600' : team.sport === 'basketball' ? 'bg-orange-500' : 'bg-blue-600'}`}>
                  <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
                  <div className="absolute -bottom-6 left-6">
                     <div className="w-16 h-16 rounded-xl bg-white p-1 shadow-md">
                        {/* Placeholder Logo */}
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
                  
                  {activeTab === 'market' ? (
                     <div className="mt-3 flex items-center gap-2 text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded w-fit">
                        <UserCheck size={14} /> Recruiting Publicly
                     </div>
                  ) : (
                     <p className="text-sm text-gray-500 mt-1 line-clamp-2">{team.description || "No team bio available."}</p>
                  )}

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