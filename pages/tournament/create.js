import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { useAuth } from '../../context/AuthContext'
import Layout from '../../components/ui/Layout'
import { 
  Trophy, Calendar, MapPin, Users, Activity, 
  ChevronLeft, Save, AlertCircle, CheckCircle 
} from 'lucide-react'

export default function CreateTournament() {
  const router = useRouter()
  const { user, profile, loading: authLoading } = useAuth()
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    sport: 'football',
    format: 'league', // league, knockout, group_knockout
    start_date: '',
    venue: '',
    max_teams: 16,
    description: ''
  })

  // --- 1. Protect Route (Organizers Only) ---
  useEffect(() => {
    if (!authLoading && profile) {
      if (profile.role !== 'organizer') {
        router.push('/tournaments') // Kick non-organizers out
      }
    }
  }, [profile, authLoading, router])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // API call to create tournament
      // Ensure you are sending organizer_id from the authenticated user
      const payload = {
        ...formData,
        organizer_id: user.id
      }

      const res = await fetch('/api/tournaments/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const data = await res.json()

      if (!res.ok) throw new Error(data.message || 'Failed to create tournament')

      // Redirect to the new tournament dashboard
      router.push(`/tournament/${data.id || data.data.id}`)

    } catch (err) {
      console.error(err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (authLoading) return <Layout><div className="p-10 text-center">Loading...</div></Layout>
  // Prevent flash of content for non-organizers
  if (profile?.role !== 'organizer') return null 

  return (
    <Layout title="Create Tournament">
      <div className="min-h-screen bg-gray-50 p-4 md:p-8">
        <div className="max-w-3xl mx-auto">
          
          {/* Header */}
          <div className="mb-6 flex items-center justify-between">
            <div>
                <Link href="/tournaments" className="text-gray-500 hover:text-gray-900 flex items-center gap-1 text-sm font-bold mb-2">
                    <ChevronLeft size={16} /> Back to Portal
                </Link>
                <h1 className="text-3xl font-black text-gray-900 tracking-tight">Host a Tournament</h1>
                <p className="text-gray-500 mt-1">Set up your league, knockout, or cup competition.</p>
            </div>
          </div>

          {/* Form Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            
            {/* Form Header Decoration */}
            <div className="h-2 bg-gradient-to-r from-indigo-500 to-purple-600"></div>

            <form onSubmit={handleSubmit} className="p-8 space-y-8">
                
                {error && (
                    <div className="bg-red-50 text-red-600 p-4 rounded-xl flex items-center gap-3 border border-red-100">
                        <AlertCircle size={20} />
                        <span className="text-sm font-bold">{error}</span>
                    </div>
                )}

                {/* Section 1: Basic Info */}
                <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Tournament Name</label>
                        <div className="relative">
                            <Trophy className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input 
                                type="text"
                                name="name"
                                required
                                value={formData.name}
                                onChange={handleChange}
                                placeholder="e.g. Summer Championship 2024"
                                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium"
                            />
                        </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Sport</label>
                            <div className="relative">
                                <Activity className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <select 
                                    name="sport"
                                    value={formData.sport}
                                    onChange={handleChange}
                                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none appearance-none font-medium capitalize"
                                >
                                    <option value="football">Football</option>
                                    <option value="basketball">Basketball</option>
                                    <option value="cricket">Cricket</option>
                      
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Format</label>
                            <select 
                                name="format"
                                value={formData.format}
                                onChange={handleChange}
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium"
                            >
                                <option value="league">League Table</option>
                                <option value="knockout">Knockout Bracket</option>
                                <option value="group_knockout">Groups + Knockout</option>
                            </select>
                        </div>
                    </div>
                </div>

                <hr className="border-gray-100" />

                {/* Section 2: Logistics */}
                <div className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Start Date</label>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input 
                                    type="datetime-local"
                                    name="start_date"
                                    required
                                    value={formData.start_date}
                                    onChange={handleChange}
                                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium"
                                />
                            </div>
                        </div>

                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Max Teams</label>
                        <div className="relative">
                            <Users className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input 
                                type="number"
                                name="max_teams"
                                min="2"
                                max="64"
                                value={formData.max_teams}
                                onChange={handleChange}
                                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium"
                            />
                        </div>
                        <p className="text-xs text-gray-500 mt-2 ml-1">Limit the number of teams that can register.</p>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="pt-4 flex items-center justify-end gap-4">
                    <Link href="/tournaments">
                        <button type="button" className="px-6 py-3 text-gray-600 font-bold hover:bg-gray-50 rounded-xl transition-colors">
                            Cancel
                        </button>
                    </Link>
                    <button 
                        type="submit" 
                        disabled={loading}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-md shadow-indigo-200 flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Creating...' : (
                            <>
                                <Save size={18} /> Publish Tournament
                            </>
                        )}
                    </button>
                </div>

            </form>
          </div>
        </div>
      </div>
    </Layout>
  )
}