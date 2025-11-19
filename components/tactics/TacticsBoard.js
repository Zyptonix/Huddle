import { useState, useRef, useEffect } from 'react'
import { 
  Move, PenTool, Circle, Trash2, Save, 
  RotateCcw, Users, Shield, Swords 
} from 'lucide-react'

export default function TacticsBoard({ initialData, onSave }) {
  // Tools: 'move' | 'draw' | 'delete'
  const [tool, setTool] = useState('move')
  // Mode: 'attack' | 'defense' (just for visual flair/organization)
  const [mode, setMode] = useState('attack')
  
  // Board State
  const [players, setPlayers] = useState(initialData?.players || [
    // Default Formation (4-4-2ish)
    { id: 1, x: 50, y: 90, color: 'blue', label: 'GK' },
    { id: 2, x: 20, y: 70, color: 'blue', label: 'LB' },
    { id: 3, x: 40, y: 75, color: 'blue', label: 'CB' },
    { id: 4, x: 60, y: 75, color: 'blue', label: 'CB' },
    { id: 5, x: 80, y: 70, color: 'blue', label: 'RB' },
    { id: 6, x: 30, y: 50, color: 'blue', label: 'LM' },
    { id: 7, x: 45, y: 55, color: 'blue', label: 'CM' },
    { id: 8, x: 55, y: 55, color: 'blue', label: 'CM' },
    { id: 9, x: 70, y: 50, color: 'blue', label: 'RM' },
    { id: 10, x: 40, y: 30, color: 'blue', label: 'ST' },
    { id: 11, x: 60, y: 30, color: 'blue', label: 'ST' },
  ])
  
  const [lines, setLines] = useState(initialData?.lines || [])
  
  // Interaction State
  const [draggingId, setDraggingId] = useState(null)
  const [drawingLine, setDrawingLine] = useState(null)
  const boardRef = useRef(null)

  // --- HELPERS ---
  const getCoordinates = (e) => {
    const rect = boardRef.current.getBoundingClientRect()
    // Calculate percentage coordinates (0-100) for responsiveness
    return {
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100
    }
  }

  // --- EVENT HANDLERS ---

  const handleMouseDown = (e) => {
    const coords = getCoordinates(e)
    
    if (tool === 'move') {
      // Check if clicking a player (simple distance check)
      // We use % distance, approximate radius is 3%
      const clickedPlayer = players.find(p => {
        const dx = p.x - coords.x
        const dy = p.y - coords.y
        return Math.sqrt(dx*dx + dy*dy) < 3
      })
      
      if (clickedPlayer) {
        setDraggingId(clickedPlayer.id)
      }
    } 
    else if (tool === 'draw') {
      setDrawingLine({ start: coords, end: coords, color: mode === 'attack' ? '#fcd34d' : '#f87171' }) // Yellow for attack, Red for lines
    }
  }

  const handleMouseMove = (e) => {
    const coords = getCoordinates(e)

    if (draggingId) {
      setPlayers(prev => prev.map(p => 
        p.id === draggingId ? { ...p, x: coords.x, y: coords.y } : p
      ))
    }
    else if (drawingLine) {
      setDrawingLine(prev => ({ ...prev, end: coords }))
    }
  }

  const handleMouseUp = () => {
    if (draggingId) {
      setDraggingId(null)
    }
    else if (drawingLine) {
      // Only add if line has length
      const dx = drawingLine.start.x - drawingLine.end.x
      const dy = drawingLine.start.y - drawingLine.end.y
      if (Math.sqrt(dx*dx + dy*dy) > 2) {
        setLines(prev => [...prev, drawingLine])
      }
      setDrawingLine(null)
    }
  }

  const handleAddOpponent = () => {
    const newId = Date.now()
    setPlayers(prev => [...prev, { 
      id: newId, 
      x: 50, 
      y: 50, 
      color: 'red', 
      label: 'OPP' 
    }])
  }

  const handleAddPlayer = () => {
    const newId = Date.now()
    setPlayers(prev => [...prev, { 
      id: newId, 
      x: 50, 
      y: 50, 
      color: 'blue', 
      label: '?' 
    }])
  }

  const handleClearLines = () => setLines([])
  const handleReset = () => {
    if(confirm("Reset board?")) {
        setLines([])
        // Reset players to roughly default positions? Or just leave them.
    }
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-full">
      {/* --- TOOLBAR (Left) --- */}
      <div className="lg:w-20 flex lg:flex-col gap-2 bg-gray-900 p-3 rounded-xl border border-gray-800 shadow-2xl z-10">
        
        {/* Mode Switcher */}
        <button 
          onClick={() => setMode('attack')}
          className={`p-3 rounded-lg transition-all ${mode === 'attack' ? 'bg-yellow-500 text-black shadow-[0_0_15px_rgba(234,179,8,0.5)]' : 'text-gray-400 hover:bg-gray-800'}`}
          title="Attack Mode"
        >
          <Swords size={24} />
        </button>
        <button 
          onClick={() => setMode('defense')}
          className={`p-3 rounded-lg transition-all ${mode === 'defense' ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.5)]' : 'text-gray-400 hover:bg-gray-800'}`}
          title="Defense Mode"
        >
          <Shield size={24} />
        </button>
        
        <div className="h-px bg-gray-700 my-1"></div>

        {/* Tools */}
        <button 
          onClick={() => setTool('move')}
          className={`p-3 rounded-lg transition-all ${tool === 'move' ? 'bg-white text-black' : 'text-gray-400 hover:bg-gray-800'}`}
          title="Move Players"
        >
          <Move size={24} />
        </button>
        <button 
          onClick={() => setTool('draw')}
          className={`p-3 rounded-lg transition-all ${tool === 'draw' ? 'bg-white text-black' : 'text-gray-400 hover:bg-gray-800'}`}
          title="Draw Tactics"
        >
          <PenTool size={24} />
        </button>
        
        <div className="h-px bg-gray-700 my-1"></div>

        {/* Add Tokens */}
        <button onClick={handleAddPlayer} className="p-3 text-blue-400 hover:bg-gray-800 rounded-lg" title="Add Player">
          <Users size={24} />
        </button>
        <button onClick={handleAddOpponent} className="p-3 text-red-500 hover:bg-gray-800 rounded-lg" title="Add Opponent">
          <Circle size={24} />
        </button>
        
        <div className="flex-grow"></div>

        <button onClick={handleClearLines} className="p-3 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg" title="Clear Lines">
          <RotateCcw size={24} />
        </button>
        <button onClick={() => onSave({ players, lines })} className="p-3 bg-green-600 text-white rounded-lg hover:bg-green-500 shadow-lg animate-pulse" title="Save Tactic">
          <Save size={24} />
        </button>
      </div>

      {/* --- THE PITCH (Center) --- */}
      <div className="flex-grow relative aspect-[2/3] lg:aspect-[4/3] bg-green-800 rounded-xl overflow-hidden border-4 border-gray-900 shadow-2xl select-none">
        
        {/* Field Graphics (CSS) */}
        <div className="absolute inset-0 pointer-events-none">
           {/* Grass Gradient */}
           <div className="absolute inset-0 bg-gradient-to-b from-green-800 to-green-900"></div>
           {/* Stripes */}
           <div className="absolute inset-0" style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 50px, rgba(0,0,0,0.05) 50px, rgba(0,0,0,0.05) 100px)' }}></div>
           
           {/* Lines (White) */}
           <div className="absolute top-4 bottom-4 left-4 right-4 border-2 border-white/60 rounded-sm"></div> {/* Touchline */}
           <div className="absolute top-1/2 left-4 right-4 h-px bg-white/60"></div> {/* Halfway line */}
           <div className="absolute top-1/2 left-1/2 w-24 h-24 border-2 border-white/60 rounded-full -translate-x-1/2 -translate-y-1/2"></div> {/* Center Circle */}
           
           {/* Penalty Areas */}
           <div className="absolute top-4 left-1/2 w-64 h-32 border-2 border-white/60 border-t-0 -translate-x-1/2 bg-white/5"></div>
           <div className="absolute bottom-4 left-1/2 w-64 h-32 border-2 border-white/60 border-b-0 -translate-x-1/2 bg-white/5"></div>
        </div>

        {/* Interactive Layer */}
        <div 
          ref={boardRef}
          className="absolute inset-0 cursor-crosshair z-10"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <svg className="w-full h-full pointer-events-none">
            {/* Arrow Marker Definition */}
            <defs>
              <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                <polygon points="0 0, 10 3.5, 0 7" fill="#fcd34d" />
              </marker>
              <marker id="arrowhead-red" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                <polygon points="0 0, 10 3.5, 0 7" fill="#f87171" />
              </marker>
            </defs>

            {/* Drawn Lines */}
            {lines.map((line, i) => (
              <path 
                key={i}
                d={`M ${line.start.x}% ${line.start.y}% Q ${line.start.x}% ${line.end.y}%, ${line.end.x}% ${line.end.y}%`}
                stroke={line.color} 
                strokeWidth="3" 
                fill="none"
                markerEnd={line.color === '#fcd34d' ? "url(#arrowhead)" : "url(#arrowhead-red)"}
                strokeDasharray="5,5"
                className="drop-shadow-md"
              />
            ))}
            
            {/* Current Drawing Line */}
            {drawingLine && (
              <path 
                d={`M ${drawingLine.start.x}% ${drawingLine.start.y}% L ${drawingLine.end.x}% ${drawingLine.end.y}%`}
                stroke={drawingLine.color} 
                strokeWidth="3" 
                fill="none"
                className="opacity-70"
              />
            )}
          </svg>

          {/* Players (Tokens) */}
          {players.map(p => (
            <div
              key={p.id}
              className={`absolute w-8 h-8 -ml-4 -mt-4 rounded-full flex items-center justify-center font-bold text-xs border-2 shadow-lg transition-transform cursor-grab active:cursor-grabbing active:scale-110
                ${p.color === 'blue' 
                  ? 'bg-blue-600 border-white text-white' 
                  : 'bg-red-600 border-white text-white'
                }`}
              style={{ left: `${p.x}%`, top: `${p.y}%`, pointerEvents: tool === 'move' ? 'auto' : 'none' }}
            >
              {p.label}
              {/* Selection Ring */}
              {draggingId === p.id && (
                <div className="absolute -inset-2 border-2 border-yellow-400 rounded-full animate-ping opacity-75"></div>
              )}
            </div>
          ))}

        </div>
      </div>
    </div>
  )
}