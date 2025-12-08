import { useState, useRef, useEffect } from 'react'
import { 
  Move, PenTool, Circle, Trash2, Save, 
  RotateCcw, Users, Shield, Swords, Undo2,
  ArrowRight, Activity, Pencil, Minus
} from 'lucide-react'

export default function TacticsBoard({ initialData, onSave }) {
  // Tools: 'move' | 'draw' | 'delete'
  const [tool, setTool] = useState('move')
  
  // Drawing Settings
  const [drawMode, setDrawMode] = useState('arrow') // 'arrow' | 'freehand'
  const [lineType, setLineType] = useState('solid') // 'solid' | 'dashed'
  const [strokeWidth, setStrokeWidth] = useState(2) // Default thinner line
  
  // Board Mode: 'attack' (Yellow) | 'defense' (Red)
  const [mode, setMode] = useState('attack')
  
  // --- STATE WITH HISTORY ---
  // Default positions rotated for Horizontal View (Left = Defense, Right = Attack)
  const [players, setPlayers] = useState(initialData?.players || [
    { id: 1, x: 10, y: 50, color: 'blue', label: 'GK' },
    { id: 2, x: 25, y: 20, color: 'blue', label: 'LB' },
    { id: 3, x: 25, y: 40, color: 'blue', label: 'CB' },
    { id: 4, x: 25, y: 60, color: 'blue', label: 'CB' },
    { id: 5, x: 25, y: 80, color: 'blue', label: 'RB' },
    { id: 6, x: 50, y: 20, color: 'blue', label: 'LM' },
    { id: 7, x: 45, y: 40, color: 'blue', label: 'CM' },
    { id: 8, x: 45, y: 60, color: 'blue', label: 'CM' },
    { id: 9, x: 50, y: 80, color: 'blue', label: 'RM' },
    { id: 10, x: 70, y: 40, color: 'blue', label: 'ST' },
    { id: 11, x: 70, y: 60, color: 'blue', label: 'ST' },
  ])
  const [lines, setLines] = useState(initialData?.lines || [])
  const [history, setHistory] = useState([]) 

  // Interaction State
  const [draggingId, setDraggingId] = useState(null)
  const [drawingLine, setDrawingLine] = useState(null)
  const boardRef = useRef(null)

  // --- ACTIONS ---

  const saveToHistory = () => {
    setHistory(prev => [...prev.slice(-19), { players: JSON.parse(JSON.stringify(players)), lines: JSON.parse(JSON.stringify(lines)) }])
  }

  const handleUndo = () => {
    if (history.length === 0) return
    const previous = history[history.length - 1]
    setPlayers(previous.players)
    setLines(previous.lines)
    setHistory(prev => prev.slice(0, -1))
  }

  const handleClearLines = () => {
    if (lines.length === 0) return;
    if (confirm("Clear all drawn lines?")) {
      saveToHistory()
      setLines([])
    }
  }

  const handleAddToken = (color, label) => {
    saveToHistory()
    const newId = Date.now()
    setPlayers(prev => [...prev, { 
      id: newId, 
      x: 50, 
      y: 50, 
      color, 
      label 
    }])
  }

  // --- POINTER EVENTS (Works for Mouse & Touch) ---

  const getCoordinates = (e) => {
    const rect = boardRef.current.getBoundingClientRect()
    return {
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100
    }
  }

  const handlePointerDown = (e) => {
    e.target.setPointerCapture(e.pointerId)
    const coords = getCoordinates(e)
    
    if (tool === 'move') {
      // Find clicked player (approx 3% radius)
      const clickedPlayer = players.find(p => {
        const dx = p.x - coords.x
        const dy = p.y - coords.y
        return Math.sqrt(dx*dx + dy*dy) < 3
      })
      
      if (clickedPlayer) {
        saveToHistory() 
        setDraggingId(clickedPlayer.id)
      }
    } 
    else if (tool === 'draw') {
      saveToHistory()
      setDrawingLine({
        start: coords,
        end: coords,
        points: [coords],
        color: mode === 'attack' ? '#fcd34d' : '#f87171',
        type: lineType,
        width: strokeWidth,
        isFreehand: drawMode === 'freehand'
      })
    }
    else if (tool === 'delete') {
      const clickedPlayer = players.find(p => {
        const dx = p.x - coords.x
        const dy = p.y - coords.y
        return Math.sqrt(dx*dx + dy*dy) < 3
      })
      if(clickedPlayer) {
        saveToHistory()
        setPlayers(prev => prev.filter(p => p.id !== clickedPlayer.id))
      }
    }
  }

  const handlePointerMove = (e) => {
    if (!draggingId && !drawingLine) return
    e.preventDefault() 
    
    const coords = getCoordinates(e)

    if (draggingId) {
      setPlayers(prev => prev.map(p => 
        p.id === draggingId ? { ...p, x: coords.x, y: coords.y } : p
      ))
    }
    else if (drawingLine) {
      if (drawingLine.isFreehand) {
        setDrawingLine(prev => ({ ...prev, points: [...prev.points, coords] }))
      } else {
        setDrawingLine(prev => ({ ...prev, end: coords }))
      }
    }
  }

  const handlePointerUp = (e) => {
    e.target.releasePointerCapture(e.pointerId)
    setDraggingId(null)
    
    if (drawingLine) {
      if (drawingLine.isFreehand) {
        if (drawingLine.points.length > 5) {
          setLines(prev => [...prev, drawingLine])
        }
      } else {
        const dx = drawingLine.start.x - drawingLine.end.x
        const dy = drawingLine.start.y - drawingLine.end.y
        if (Math.sqrt(dx*dx + dy*dy) > 2) {
          setLines(prev => [...prev, drawingLine])
        }
      }
      setDrawingLine(null)
    }
  }

  const handleDoubleClick = (e) => {
    const coords = getCoordinates(e)
    const clickedPlayer = players.find(p => {
      const dx = p.x - coords.x
      const dy = p.y - coords.y
      return Math.sqrt(dx*dx + dy*dy) < 3
    })

    if (clickedPlayer) {
      const newLabel = prompt("Enter player label (e.g. 10, LB, Name):", clickedPlayer.label)
      if (newLabel) {
        saveToHistory()
        setPlayers(prev => prev.map(p => p.id === clickedPlayer.id ? { ...p, label: newLabel.substring(0, 4) } : p))
      }
    }
  }

  const renderLine = (line, i, isLive = false) => {
    const color = line.color
    const width = line.width || 2
    const dashArray = line.type === 'dashed' ? `${width * 2},${width * 1.5}` : 'none'

    if (line.isFreehand) {
      const points = line.points
      const d = points.map((p, idx) => (idx === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`)).join(' ')
      return (
        <path 
          key={i}
          d={d}
          stroke={color}
          strokeWidth={width}
          strokeDasharray={dashArray}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={isLive ? "opacity-60" : ""}
        />
      )
    } else {
      return (
        <path 
          key={i}
          d={`M ${line.start.x} ${line.start.y} Q ${line.start.x} ${line.end.y}, ${line.end.x} ${line.end.y}`}
          stroke={color} 
          strokeWidth={width}
          strokeDasharray={dashArray}
          fill="none"
          vectorEffect="non-scaling-stroke"
          markerEnd={!isLive && color.includes('fcd34d') ? "url(#arrow-yellow)" : !isLive ? "url(#arrow-red)" : ""}
          className={isLive ? "opacity-60" : ""}
        />
      )
    }
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-full select-none bg-gray-50 rounded-xl p-4 border border-gray-200">
      
      {/* --- TOOLBAR (Left - Light Theme) --- */}
      <div className="lg:w-24 flex lg:flex-col gap-2 bg-white p-3 rounded-xl border border-gray-200 shadow-sm z-10 shrink-0 overflow-y-auto">
        
        {/* Mode Switcher */}
        <div className="flex flex-col gap-1 pb-3 border-b border-gray-100">
          <button onClick={() => setMode('attack')} className={`p-2 rounded-lg transition-all text-xs font-bold flex flex-col items-center ${mode === 'attack' ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' : 'text-gray-500 hover:bg-gray-50'}`}>
            <Swords size={20} className="mb-1" /> Attack
          </button>
          <button onClick={() => setMode('defense')} className={`p-2 rounded-lg transition-all text-xs font-bold flex flex-col items-center ${mode === 'defense' ? 'bg-red-100 text-red-800 border border-red-200' : 'text-gray-500 hover:bg-gray-50'}`}>
            <Shield size={20} className="mb-1" /> Defense
          </button>
        </div>

        {/* Main Tools */}
        <div className="flex flex-col gap-1 py-3 border-b border-gray-100">
          <button onClick={() => setTool('move')} className={`p-2 rounded-lg transition-all flex flex-col items-center text-xs ${tool === 'move' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}>
            <Move size={20} className="mb-1" /> Move
          </button>
          <button onClick={() => setTool('draw')} className={`p-2 rounded-lg transition-all flex flex-col items-center text-xs ${tool === 'draw' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}>
            <PenTool size={20} className="mb-1" /> Draw
          </button>
          <button onClick={() => setTool('delete')} className={`p-2 rounded-lg transition-all flex flex-col items-center text-xs ${tool === 'delete' ? 'bg-red-100 text-red-600 border border-red-200' : 'text-gray-500 hover:bg-gray-50'}`}>
            <Trash2 size={20} className="mb-1" /> Delete
          </button>
        </div>

        {/* Drawing Settings */}
        {tool === 'draw' && (
          <div className="flex flex-col gap-2 py-3 border-b border-gray-100 animate-in fade-in slide-in-from-left-2 duration-200">
             <p className="text-[10px] text-gray-400 font-bold text-center uppercase">Draw Style</p>
             
             {/* Draw Mode */}
             <div className="flex gap-1">
               <button onClick={() => setDrawMode('arrow')} className={`flex-1 p-2 rounded-md border ${drawMode === 'arrow' ? 'bg-gray-100 border-gray-300 text-gray-900' : 'bg-white border-transparent text-gray-400'}`} title="Arrow">
                 <ArrowRight size={18} className="mx-auto" />
               </button>
               <button onClick={() => setDrawMode('freehand')} className={`flex-1 p-2 rounded-md border ${drawMode === 'freehand' ? 'bg-gray-100 border-gray-300 text-gray-900' : 'bg-white border-transparent text-gray-400'}`} title="Freehand">
                 <Pencil size={18} className="mx-auto" />
               </button>
             </div>

             {/* Line Type */}
             <div className="flex gap-1">
               <button onClick={() => setLineType('solid')} className={`flex-1 p-2 rounded-md border ${lineType === 'solid' ? 'bg-gray-100 border-gray-300 text-gray-900' : 'bg-white border-transparent text-gray-400'}`} title="Solid">
                 <Minus size={18} className="mx-auto" />
               </button>
               <button onClick={() => setLineType('dashed')} className={`flex-1 p-2 rounded-md border ${lineType === 'dashed' ? 'bg-gray-100 border-gray-300 text-gray-900' : 'bg-white border-transparent text-gray-400'}`} title="Dashed">
                 <Activity size={18} className="mx-auto" />
               </button>
             </div>

             {/* Width Slider */}
             <div className="px-1 pt-1">
               <input 
                 type="range" 
                 min="1" max="8" step="0.5" 
                 value={strokeWidth} 
                 onChange={(e) => setStrokeWidth(Number(e.target.value))}
                 className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
               />
             </div>
          </div>
        )}

        {/* Tokens */}
        <div className="flex flex-col gap-1 py-2">
          <button onClick={() => handleAddToken('blue', '?')} className="p-3 text-blue-600 hover:bg-blue-50 rounded-lg flex justify-center border border-transparent hover:border-blue-100" title="Add Player">
            <Users size={24} />
          </button>
          <button onClick={() => handleAddToken('red', 'OPP')} className="p-3 text-red-600 hover:bg-red-50 rounded-lg flex justify-center border border-transparent hover:border-red-100" title="Add Opponent">
            <Circle size={24} />
          </button>
        </div>
        
        <div className="flex-grow"></div>

        {/* Bottom Actions */}
        <div className="flex justify-between px-1">
          <button onClick={handleUndo} disabled={history.length === 0} className="p-2 text-gray-400 hover:text-gray-700 disabled:opacity-30" title="Undo">
            <Undo2 size={20} />
          </button>
          <button onClick={handleClearLines} className="p-2 text-gray-400 hover:text-red-600" title="Clear All Lines">
            <RotateCcw size={20} />
          </button>
        </div>
        
        <button onClick={() => onSave({ players, lines })} className="w-full py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 shadow-sm mt-2 font-bold text-xs transition-colors">
          SAVE
        </button>
      </div>

      {/* --- THE PITCH (Horizontal) --- */}
      {/* Aspect Ratio 16/9 for Landscape */}
      <div className="flex-grow relative aspect-[16/9] bg-emerald-700 rounded-xl overflow-hidden border-4 border-gray-300 shadow-inner">
        
        {/* Field Graphics (Pure CSS - Horizontal Layout) */}
        <div className="absolute inset-0 pointer-events-none opacity-90">
           {/* Grass Texture */}
           <div className="absolute inset-0 bg-gradient-to-br from-emerald-600 to-green-800"></div>
           {/* Mowing Stripes (Vertical for horizontal field) */}
           <div className="absolute inset-0" style={{ background: 'repeating-linear-gradient(90deg, transparent, transparent 5%, rgba(0,0,0,0.05) 5%, rgba(0,0,0,0.05) 10%)' }}></div>
           
           {/* -- Lines (White) -- */}
           
           {/* Outer Boundary */}
           <div className="absolute top-4 bottom-4 left-4 right-4 border-2 border-white/70"></div>
           
           {/* Halfway Line (Vertical) */}
           <div className="absolute top-4 bottom-4 left-1/2 w-px bg-white/70"></div>
           
           {/* Center Circle */}
           <div className="absolute top-1/2 left-1/2 w-24 h-24 border-2 border-white/70 rounded-full -translate-x-1/2 -translate-y-1/2"></div>
           
           {/* -- Left Goal (Defenders) -- */}
           {/* Goal Area (Small box) */}
           <div className="absolute top-1/2 left-4 w-12 h-24 border-2 border-white/70 border-l-0 -translate-y-1/2"></div>
           {/* Penalty Box (Big box) */}
           <div className="absolute top-1/2 left-4 w-32 h-56 border-2 border-white/70 border-l-0 -translate-y-1/2"></div>
           {/* Penalty Arc (Simple approximation) */}
           <div className="absolute top-1/2 left-[9rem] w-12 h-24 border-2 border-white/70 border-l-0 rounded-r-full -translate-y-1/2 clip-path-arc"></div>

           {/* -- Right Goal (Attackers) -- */}
           {/* Goal Area */}
           <div className="absolute top-1/2 right-4 w-12 h-24 border-2 border-white/70 border-r-0 -translate-y-1/2"></div>
           {/* Penalty Box */}
           <div className="absolute top-1/2 right-4 w-32 h-56 border-2 border-white/70 border-r-0 -translate-y-1/2"></div>
        </div>

        {/* Interactive Layer */}
        <div 
          ref={boardRef}
          className={`absolute inset-0 z-10 ${tool === 'move' ? 'cursor-default' : tool === 'draw' || tool === 'freehand' ? 'cursor-crosshair' : 'cursor-not-allowed'}`}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
          onDoubleClick={handleDoubleClick}
        >
          <svg className="w-full h-full pointer-events-none filter drop-shadow-sm" viewBox="0 0 100 100" preserveAspectRatio="none">
            <defs>
              <marker id="arrow-yellow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                <path d="M0,0 L0,6 L6,3 z" fill="#fbbf24" />
              </marker>
              <marker id="arrow-red" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                <path d="M0,0 L0,6 L6,3 z" fill="#ef4444" />
              </marker>
            </defs>

            {lines.map((line, i) => renderLine(line, i))}
            {drawingLine && renderLine(drawingLine, 'live', true)}
          </svg>

          {players.map(p => (
            <div
              key={p.id}
              className={`absolute w-10 h-10 -ml-5 -mt-5 rounded-full flex items-center justify-center font-bold text-xs border-2 shadow-md transition-transform touch-none
                ${p.color === 'blue' ? 'bg-blue-600 border-white text-white' : 'bg-red-600 border-white text-white'} 
                ${tool === 'move' ? 'cursor-grab active:cursor-grabbing hover:scale-110' : ''}`}
              style={{ left: `${p.x}%`, top: `${p.y}%`, pointerEvents: tool === 'move' || tool === 'delete' ? 'auto' : 'none' }}
            >
              {p.label}
              {draggingId === p.id && <div className="absolute -inset-1 border-2 border-yellow-400 rounded-full animate-ping opacity-75"></div>}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}