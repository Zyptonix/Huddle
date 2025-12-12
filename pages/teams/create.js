import { useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { Shield, ArrowLeft, Check, Upload, Hash } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import Layout from '../../components/ui/Layout'

export default function CreateTeam() {
  const router = useRouter()
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    sport: 'football',
    description: '',
    is_recruiting: true,
    logo_url: '' // In a real app, you'd use a file uploader here
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.name) return alert("Team name is required")
    
    setLoading(true)

    try {
      const res = await fetch('/api/teams/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          ...formData, 
          owner_id: user.id 
        })
      })

      const data = await res.json()

      if (res.ok) {
        // Redirect to the new team dashboard
        router.push(`/teams/${data.teamId}`)
      } else {
        alert(data.error || "Failed to create team")
      }
    } catch (error) {
      console.error(error)
      alert("An error occurred")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout title="Create Team - Huddle">
      <div className="max-w-2xl mx-auto">
        <Link href="/team_portal" className="flex items-center text-gray-500 hover:text-gray-900 mb-6 font-medium">
           <ArrowLeft size={18} className="mr-1" /> Back to Portal
        </Link>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
           
           {/* Header */}
           <div className="bg-gradient-to-r from-blue-900 to-indigo-900 p-8 text-white">
              <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mb-4 backdrop-blur-sm border border-white/20">
                 <Shield size={32} />
              </div>
              <h1 className="text-2xl font-black uppercase tracking-wide">Register New Club</h1>
              <p className="text-blue-200 text-sm mt-1">Start your journey. Manage rosters, tactics, and tournaments.</p>
           </div>

           {/* Form */}
           <form onSubmit={handleSubmit} className="p-8 space-y-6">
              
              {/* Team Name */}
              <div>
                 <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Club Name</label>
                 <input 
                   type="text" 
                   value={formData.name} 
                   onChange={e => setFormData({...formData, name: e.target.value})}
                   className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder-gray-400"
                   placeholder="e.g. Dhaka Dynamos"
                 />
              </div>

              {/* Sport Selector */}
              <div>
                 <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Sport Discipline</label>
                 <div className="grid grid-cols-3 gap-3">
                    {[
                      { id: 'football', label: 'Football', icon: '⚽' },
                      { id: 'basketball', label: 'Basketball', icon: '🏀' },
                      { id: 'cricket', label: 'Cricket', icon: '🏏' }
                    ].map(sport => (
                       <button 
                         type="button"
                         key={sport.id}
                         onClick={() => setFormData({...formData, sport: sport.id})}
                         className={`py-3 rounded-xl border-2 font-bold text-sm flex flex-col items-center gap-1 transition-all
                           ${formData.sport === sport.id 
                             ? 'border-blue-600 bg-blue-50 text-blue-700' 
                             : 'border-transparent bg-gray-50 text-gray-500 hover:bg-gray-100'}`}
                       >
                          <span className="text-xl">{sport.icon}</span>
                          {sport.label}
                       </button>
                    ))}
                 </div>
              </div>

              {/* Description */}
              <div>
                 <label className="block text-xs font-bold text-gray-500 uppercase mb-2">About the Team</label>
                 <textarea 
                   rows="3"
                   value={formData.description} 
                   onChange={e => setFormData({...formData, description: e.target.value})}
                   className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                   placeholder="Motto, history, or what you are looking for..."
                 />
              </div>

              {/* Settings Row */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                 <div className="flex items-center gap-3">
                    <div className="bg-white p-2 rounded-full text-emerald-600 shadow-sm">
                       <Hash size={18} />
                    </div>
                    <div>
                       <p className="font-bold text-gray-900 text-sm">Public Recruiting</p>
                       <p className="text-xs text-gray-500">Allow players to find you in the Transfer Market.</p>
                    </div>
                 </div>
                 <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={formData.is_recruiting}
                      onChange={e => setFormData({...formData, is_recruiting: e.target.checked})}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                 </label>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-200 hover:bg-blue-700 hover:scale-[1.01] transition-all flex items-center justify-center gap-2"
              >
                {loading ? 'Creating Club...' : 'Create Team & Get Invite Code'}
                {!loading && <ArrowLeft className="rotate-180" size={20} />}
              </button>

           </form>
        </div>
      </div>
    </Layout>
  )
}