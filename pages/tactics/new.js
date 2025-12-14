import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Plus, Trash2, FolderOpen } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabaseClient'
import TacticsBoard from '@/components/tactics/TacticsBoard'

// --- THUMBNAIL COMPONENT ---
const TacticsThumbnail = ({ data, sport = 'football' }) => {
  const getBg = () => {
    if (sport === 'basketball') return 'bg-orange-200'
    if (sport === 'cricket') return 'bg-green-600'
    return 'bg-emerald-700'
  }
  
  const players = data?.players || []

  return (
    <div className={`w-full h-full relative ${getBg()} overflow-hidden`}>
       {players.map(p => (
        <div key={p.id} 
          className={`absolute w-1.5 h-1.5 rounded-full border-[0.5px] border-white shadow-sm ${p.color === 'blue' ? 'bg-blue-600' : 'bg-red-600'}`}
          style={{ left: `${p.x}%`, top: `${p.y}%`, transform: 'translate(-50%, -50%)' }} 
        />
      ))}
    </div>
  )
}

// --- MAIN MANAGER COMPONENT ---
export default function TacticsManager() {
  const { user, loading: authLoading } = useAuth()
  
  // State
  const [currentTactic, setCurrentTactic] = useState({ 
      id: null, 
      name: 'New Tactic', 
      sport: 'football', 
      data: { players: [], lines: [] },
      sessionKey: Date.now() 
  })
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
        .select('*')
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

  // --- SAVE HANDLER ---
  const handleSave = async (boardState) => {
    setSaving(true)

    try {
      const payload = { 
          name: boardState.name, 
          sport: boardState.sport,
          data: { 
             players: boardState.players, 
             lines: boardState.lines 
          },
          creator_id: user.id
      }

      let savedId = currentTactic.id

      if (savedId) {
        // UPDATE EXISTING
        const { error } = await supabase
            .from('tactics')
            .update(payload)
            .eq('id', savedId)
        if (error) throw error
      } else {
        // INSERT NEW
        const { data, error } = await supabase
            .from('tactics')
            .insert([payload])
            .select()
            .single()
        
        if (error) throw error
        savedId = data.id
      }

      // Update local state (Assign ID, remove "Draft" status)
      setCurrentTactic(prev => ({
          ...prev,
          id: savedId,
          name: boardState.name,
          sport: boardState.sport,
          data: payload.data
      }))

      await fetchSavedTactics()

    } catch (error) {
      alert('Error saving: ' + error.message)
    } finally {
      setSaving(false)
    }
  }

  // --- ACTIONS ---

  const loadTactic = (tactic) => {
      setCurrentTactic({
          id: tactic.id,
          name: tactic.name,
          sport: tactic.sport,
          data: tactic.data || { players: [], lines: [] },
          sessionKey: Date.now() 
      })
  }

  const createNewTactic = () => {
      setCurrentTactic({ 
          id: null, // ID null triggers "Draft" mode
          name: 'New Tactic', 
          sport: 'football', 
          data: { players: [], lines: [] },
          sessionKey: Date.now() 
      })
  }

  const handleDelete = async (e, id) => {
    e.stopPropagation()
    if (confirm("Delete this tactic?")) {
        await supabase.from('tactics').delete().eq('id', id)
        await fetchSavedTactics()
        if (currentTactic.id === id) createNewTactic()
    }
  }
  
  // Callback to update local preview while typing in child
  const handlePreviewUpdate = (previewData) => {
    // Only update purely for the visual Thumbnail if needed, 
    // but usually, we just let the board handle it.
    // In this simplified version, we just let the board state handle the "Unsaved" text.
  }

  if (authLoading) return <div className="flex h-screen items-center justify-center">Loading...</div>

  return (
    <div className="h-screen flex bg-gray-100 overflow-hidden font-sans">
      
      {/* SIDEBAR */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col shrink-0 z-30">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between h-16">
            <Link href="/dashboard" className="text-gray-500 hover:text-black transition-colors">
                <ArrowLeft size={20} />
            </Link>
            <h3 className="font-bold text-black text-sm uppercase flex items-center gap-2">
                <FolderOpen size={16} /> Library
            </h3>
            
            <button 
                onClick={createNewTactic} 
                className="text-white bg-blue-600 hover:bg-blue-700 p-1.5 rounded shadow-sm transition-colors" 
                title="Create New Tactic"
            >
                <Plus size={20} />
            </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
             
             {/* --- DRAFT ITEM (THE FIX) --- */}
             {/* If ID is null, we show this placeholder at the top */}
             {!currentTactic.id && (
                <div className="p-2 rounded-lg border border-dashed border-blue-400 bg-blue-50 cursor-default flex items-center gap-3 animate-in fade-in slide-in-from-left-2 duration-300">
                    <div className="w-10 h-14 rounded overflow-hidden shrink-0 border border-blue-200 opacity-70">
                        {/* We pass the current sport so the thumbnail matches what you just picked */}
                        <TacticsThumbnail data={currentTactic.data} sport={currentTactic.sport} />
                    </div>
                    <div className="flex-grow min-w-0">
                        <div className="text-sm font-bold text-blue-900 italic truncate">New Tactic...</div>
                        <div className="text-[10px] text-blue-600 font-bold uppercase tracking-wide flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
                            Unsaved
                        </div>
                    </div>
                </div>
             )}
             {/* --------------------------- */}

             {loadingList ? (
                 <div className="text-center p-4 text-gray-400 text-xs">Loading tactics...</div>
             ) : (
                 savedTactics.map(t => (
                <div 
                    key={t.id} 
                    onClick={() => loadTactic(t)}
                    className={`group p-2 rounded-lg cursor-pointer border flex items-center gap-3 hover:bg-gray-50 transition-all
                        ${currentTactic.id === t.id ? 'bg-indigo-50 border-indigo-200 ring-1 ring-indigo-200' : 'border-transparent'}
                    `}
                >
                    <div className="w-10 h-14 rounded overflow-hidden shrink-0 border border-gray-200 bg-gray-100">
                        <TacticsThumbnail data={t.data} sport={t.sport} />
                    </div>
                    <div className="flex-grow min-w-0">
                        <div className="text-sm font-bold text-gray-900 truncate">{t.name}</div>
                        <div className="text-[10px] text-gray-500 uppercase font-medium tracking-wide">{t.sport}</div>
                    </div>
                    <button onClick={(e) => handleDelete(e, t.id)} className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-opacity p-1">
                        <Trash2 size={14} />
                    </button>
                </div>
             )))}
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col relative overflow-hidden">
         <TacticsBoard 
            key={`${currentTactic.id || 'new'}-${currentTactic.sessionKey}`} 
            initialData={{
                ...currentTactic.data,
                name: currentTactic.name,
                sport: currentTactic.sport
            }}
            onSave={handleSave}
            isSaving={saving}
         />
      </main>
    </div>
  )
}