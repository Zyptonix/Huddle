import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { ArrowLeft, Plus, Trash2, FileText, ChevronDown } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabaseClient'
import Layout from '../../components/ui/Layout'
import TacticsBoard from '../../components/tactics/TacticsBoard'

// Updated Thumbnail to handle backgrounds
const TacticsThumbnail = ({ data, sport = 'football' }) => {
  const getBg = () => {
    if (sport === 'basketball') return 'bg-orange-200'
    if (sport === 'cricket') return 'bg-green-600'
    return 'bg-emerald-700'
  }

  if (!data?.players) return <div className={`w-full h-full ${getBg()} opacity-50`} />
  
  return (
    <div className={`w-full h-full relative ${getBg()} overflow-hidden border border-black/10`}>
       {/* Simple representation of the field */}
       {sport === 'basketball' && <div className="absolute inset-x-0 top-1/2 h-px bg-orange-900/30"></div>}
       {sport !== 'basketball' && <div className="absolute inset-x-0 top-1/2 h-px bg-white/30"></div>}
       
       {data.players.map(p => (
        <div key={p.id} 
          className={`absolute w-1.5 h-1.5 rounded-full border-[0.5px] border-white shadow-sm ${p.color === 'blue' ? 'bg-blue-600' : 'bg-red-600'}`}
          style={{ left: `${p.x}%`, top: `${p.y}%`, transform: 'translate(-50%, -50%)' }} 
        />
      ))}
    </div>
  )
}

export default function TacticsManager() {
  const { user, profile, loading: authLoading } = useAuth()
  
  // State
  const [currentTactic, setCurrentTactic] = useState({ id: null, name: 'New Tactic', sport: 'football', data: null })
  const [savedTactics, setSavedTactics] = useState([])
  const [saving, setSaving] = useState(false)
  const [loadingList, setLoadingList] = useState(true)

  useEffect(() => {
    if (user) fetchSavedTactics()
  }, [user])

  const fetchSavedTactics = async () => {
    try {
      const { data, error } = await supabase
        .from('tactics')
        .select('id, name, sport, data, created_at') // Added 'sport'
        .eq('creator_id', user.id)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      setSavedTactics(data || [])
    } catch (e) {
      console.error("Error fetching tactics:", e)
    } finally {
      setLoadingList(false)
    }
  }

  const handleSave = async (tacticData) => {
    if (!currentTactic.name) return alert("Please name your tactic")
    setSaving(true)

    try {
      if (currentTactic.id) {
        // UPDATE
        const { error } = await supabase
          .from('tactics')
          .update({ 
            name: currentTactic.name, 
            data: tacticData,
            sport: currentTactic.sport // Update sport if it changed
          })
          .eq('id', currentTactic.id)
        if (error) throw error
      } else {
        // INSERT
        const { data, error } = await supabase
          .from('tactics')
          .insert([{ 
            name: currentTactic.name, 
            sport: currentTactic.sport, 
            creator_id: user.id, 
            data: tacticData, 
            is_public: false 
          }])
          .select().single()

        if (error) throw error
        setCurrentTactic(prev => ({ ...prev, id: data.id })) 
      }
      await fetchSavedTactics()
    } catch (error) {
      alert('Error saving: ' + error.message)
    } finally {
      setSaving(false)
    }
  }

  const handleLoad = (tactic) => {
    if (confirm("Load this tactic? Unsaved changes will be lost.")) {
      setCurrentTactic({ 
        id: tactic.id, 
        name: tactic.name, 
        sport: tactic.sport || 'football', // Default to football if null
        data: tactic.data 
      })
    }
  }

  const handleDelete = async (e, id) => {
    e.stopPropagation()
    if (!confirm("Delete this tactic permanently?")) return
    const { error } = await supabase.from('tactics').delete().eq('id', id)
    if (!error) {
      fetchSavedTactics()
      if (currentTactic.id === id) handleNew()
    }
  }

  const handleNew = () => {
    // Reset to default
    setCurrentTactic({ id: null, name: 'New Tactic', sport: 'football', data: null })
  }

  if (authLoading) return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  
  if (profile?.role !== 'coach') return <Layout><div className="p-10 text-center">Coaches only.</div></Layout>

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans h-screen overflow-hidden">
      
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between shadow-sm z-20 shrink-0">
         <div className="flex items-center gap-4 w-full">
            <Link href="/dashboard" className="text-gray-500 hover:text-blue-600 flex items-center gap-2 shrink-0">
               <ArrowLeft size={20} /> <span className="text-sm font-bold">Exit</span>
            </Link>
            <div className="h-6 w-px bg-gray-300"></div>
            
            {/* Name Input */}
            <input 
              type="text" 
              value={currentTactic.name}
              onChange={(e) => setCurrentTactic(prev => ({ ...prev, name: e.target.value }))}
              className="bg-transparent text-xl font-bold text-gray-900 focus:outline-none focus:border-b-2 focus:border-blue-500 px-2 w-full max-w-sm"
              placeholder="Tactic Name"
            />

            {/* Sport Selector - Segmented Control */}
            <div className="bg-gray-100 p-1 rounded-lg border border-gray-200 flex items-center gap-1">
              {[
                { id: 'football', label: 'Football', icon: '⚽' },
                { id: 'basketball', label: 'Basket', icon: '🏀' },
                { id: 'cricket', label: 'Cricket', icon: '🏏' }
              ].map((sportOption) => (
                <button
                  key={sportOption.id}
                  onClick={() => {
                    if (currentTactic.sport !== sportOption.id) {
                      if (confirm(`Switch to ${sportOption.label}? This will reset the board.`)) {
                        setCurrentTactic(prev => ({ ...prev, sport: sportOption.id, data: null }))
                      }
                    }
                  }}
                  className={`
                    px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5
                    ${currentTactic.sport === sportOption.id 
                      ? 'bg-white text-blue-600 shadow-sm ring-1 ring-black/5' 
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'}
                  `}
                >
                  <span>{sportOption.icon}</span>
                  <span className="hidden md:inline">{sportOption.label}</span>
                </button>
              ))}
            </div>
         </div>
      </div>

      <div className="flex flex-grow overflow-hidden">
        
        {/* Sidebar */}
        <div className="w-64 bg-white border-r border-gray-200 flex flex-col shrink-0">
           <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-gray-700 text-sm uppercase tracking-wide">My Tactics</h3>
              <button onClick={handleNew} className="p-1.5 hover:bg-white hover:shadow-sm rounded-md text-blue-600" title="New">
                 <Plus size={20} />
              </button>
           </div>
           
           <div className="overflow-y-auto flex-grow p-3 space-y-3">
              {loadingList ? <div className="text-center p-4">Loading...</div> : savedTactics.map(t => (
                <div 
                  key={t.id} 
                  onClick={() => handleLoad(t)}
                  className={`p-2 rounded-xl border cursor-pointer hover:shadow-md transition-all group flex gap-3 items-center ${currentTactic.id === t.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white'}`}
                >
                   <div className="w-12 h-16 rounded-lg overflow-hidden shrink-0 border border-gray-200">
                      <TacticsThumbnail data={t.data} sport={t.sport} />
                   </div>
                   <div className="flex-grow min-w-0">
                      <p className="font-bold text-sm truncate">{t.name}</p>
                      <p className="text-[10px] text-gray-400 capitalize">{t.sport}</p>
                   </div>
                   <button onClick={(e) => handleDelete(e, t.id)} className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100"><Trash2 size={14} /></button>
                </div>
              ))}
           </div>
        </div>

        {/* Main Board */}
        <div className="flex-grow p-4 lg:p-6 overflow-hidden bg-gray-100 flex items-center justify-center">
           <div className="w-full h-full max-w-[1600px] flex flex-col">
              <TacticsBoard 
                initialData={currentTactic.data} 
                sport={currentTactic.sport} 
                onSave={handleSave} 
                isSaving={saving} 
                // We add sport to key to force re-render when switching sports to load new default positions
                key={`${currentTactic.id || 'new'}-${currentTactic.sport}`} 
              />
           </div>
        </div>
      </div>
    </div>
  )
}