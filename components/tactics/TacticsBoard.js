import { useState, useRef, useEffect } from 'react'
import { 
  Move, PenTool, Circle, Trash2, Save, 
  RotateCcw, Users, Shield, Swords, Undo2,
  ArrowRight, Activity, Pencil, Minus, Eraser, Loader2 // <--- Check these 3 are here!
} from 'lucide-react'

// --- 1. SPORT CONFIGURATION ---
const SPORT_CONFIG = {
  football: {
    bg: "bg-emerald-700",
    lineColor: "stroke-white/70",
    aspect: "aspect-[16/9]",
    defaultPlayers: [
       { id: 1, x: 10, y: 50, label: 'GK' }, { id: 2, x: 25, y: 20, label: 'LB' },
       { id: 3, x: 25, y: 40, label: 'CB' }, { id: 4, x: 25, y: 60, label: 'CB' },
       { id: 5, x: 25, y: 80, label: 'RB' }, { id: 6, x: 50, y: 50, label: 'CM' }
    ]
  },
  basketball: {
    bg: "bg-orange-100", // Wood floor look
    lineColor: "stroke-orange-900",
    aspect: "aspect-[16/9]", // Or 4/3
    defaultPlayers: [
      { id: 1, x: 10, y: 50, label: 'PG' }, { id: 2, x: 25, y: 25, label: 'SG' },
      { id: 3, x: 25, y: 75, label: 'SF' }, { id: 4, x: 40, y: 60, label: 'PF' },
      { id: 5, x: 40, y: 40, label: 'C' }
    ]
  },
  cricket: {
    bg: "bg-green-600",
    lineColor: "stroke-white/60",
    aspect: "aspect-video", // Oval fits inside
    defaultPlayers: [
      { id: 1, x: 50, y: 45, label: 'WK' }, { id: 2, x: 50, y: 55, label: 'BWL' },
      { id: 3, x: 20, y: 50, label: 'Long' }, { id: 4, x: 80, y: 50, label: 'Deep' }
    ]
  }
}

// --- 2. FIELD BACKGROUND COMPONENT ---
const FieldBackground = ({ sport }) => {
  const config = SPORT_CONFIG[sport] || SPORT_CONFIG.football
  const stroke = config.lineColor.replace('stroke-', '') // Extract color class is tricky in SVG, using inline for simplicity or class
  
  // Common SVG props
  const svgProps = { className: "absolute inset-0 w-full h-full pointer-events-none opacity-80" }

  if (sport === 'basketball') {
    return (
      <div className={`absolute inset-0 ${config.bg} overflow-hidden`}>
         {/* Wood Texture */}
         <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, #000 10px, #000 11px)' }}></div>
         <svg viewBox="0 0 100 50" preserveAspectRatio="none" {...svgProps}>
            {/* Main Border */}
            <rect x="2" y="2" width="96" height="46" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-orange-900"/>
            {/* Center Line */}
            <line x1="50" y1="2" x2="50" y2="48" stroke="currentColor" strokeWidth="0.5" className="text-orange-900"/>
            <circle cx="50" cy="25" r="6" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-orange-900"/>
            
            {/* Left Hoop Area */}
            <path d="M 2,17 L 15,17 L 15,33 L 2,33" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-orange-900"/>
            <path d="M 2,5 Q 25,5 25,25 Q 25,45 2,45" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-orange-900"/>
            <circle cx="5" cy="25" r="1.5" stroke="currentColor" strokeWidth="0.5" fill="none" className="text-orange-900"/>

            {/* Right Hoop Area */}
            <path d="M 98,17 L 85,17 L 85,33 L 98,33" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-orange-900"/>
            <path d="M 98,5 Q 75,5 75,25 Q 75,45 98,45" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-orange-900"/>
            <circle cx="95" cy="25" r="1.5" stroke="currentColor" strokeWidth="0.5" fill="none" className="text-orange-900"/>
         </svg>
      </div>
    )
  }

  if (sport === 'cricket') {
    return (
      <div className={`absolute inset-0 ${config.bg} flex items-center justify-center`}>
         <svg viewBox="0 0 100 100" preserveAspectRatio="none" {...svgProps}>
            {/* Boundary Oval */}
            <ellipse cx="50" cy="50" rx="45" ry="45" fill="none" stroke="white" strokeWidth="0.5" strokeDasharray="2,2"/>
            {/* 30 Yard Circle */}
            <ellipse cx="50" cy="50" rx="25" ry="25" fill="none" stroke="white" strokeWidth="0.5" opacity="0.5"/>
            {/* The Pitch */}
            <rect x="42" y="35" width="16" height="30" fill="#eecfa1" rx="2" /> 
            {/* Wickets */}
            <rect x="44" y="38" width="12" height="0.5" fill="white" />
            <rect x="44" y="62" width="12" height="0.5" fill="white" />
         </svg>
      </div>
    )
  }

  // Default: Football
  return (
    <div className={`absolute inset-0 ${config.bg}`}>
       <div className="absolute inset-0" style={{ background: 'repeating-linear-gradient(90deg, transparent, transparent 5%, rgba(0,0,0,0.05) 5%, rgba(0,0,0,0.05) 10%)' }}></div>
       <svg viewBox="0 0 100 60" preserveAspectRatio="none" {...svgProps}>
          <rect x="0" y="0" width="100" height="60" fill="none" stroke="white" strokeWidth="0.5" />
          <line x1="50" y1="0" x2="50" y2="60" stroke="white" strokeWidth="0.5" />
          <circle cx="50" cy="30" r="8" fill="none" stroke="white" strokeWidth="0.5" />
          {/* Left Penalty */}
          <rect x="0" y="15" width="15" height="30" fill="none" stroke="white" strokeWidth="0.5" />
          <rect x="0" y="22" width="5" height="16" fill="none" stroke="white" strokeWidth="0.5" />
          {/* Right Penalty */}
          <rect x="85" y="15" width="15" height="30" fill="none" stroke="white" strokeWidth="0.5" />
          <rect x="95" y="22" width="5" height="16" fill="none" stroke="white" strokeWidth="0.5" />
       </svg>
    </div>
  )
}

export default function TacticsBoard({ initialData, sport = 'football', onSave, isSaving }) {
  // Tools: 'move' | 'draw' | 'freehand' | 'delete' | 'eraser'
  const [tool, setTool] = useState('move')
  const [drawMode, setDrawMode] = useState('arrow')
  const [lineType, setLineType] = useState('solid')
  const [strokeWidth, setStrokeWidth] = useState(2) 
  const [mode, setMode] = useState('attack') // 'attack' (Yellow) | 'defense' (Red)
  
  // Initialize players based on Sport
  const [players, setPlayers] = useState([])
  const [lines, setLines] = useState([])
  const [history, setHistory] = useState([]) 

  // Reset board when new data is loaded
  useEffect(() => {
    if (initialData) {
      setPlayers(initialData.players || [])
      setLines(initialData.lines || [])
    } else {
      // Load default squad for the selected sport
      const defaultConfig = SPORT_CONFIG[sport] || SPORT_CONFIG.football
      // Map defaults to add color based on current mode preference if needed, or default blue
      const defaults = defaultConfig.defaultPlayers.map(p => ({ ...p, color: 'blue' }))
      setPlayers(defaults)
      setLines([])
    }
    setHistory([])
  }, [initialData, sport])

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
    setPlayers(prev => [...prev, { id: newId, x: 50, y: 50, color, label }])
  }

  const handleEraseLine = (index) => {
    if (tool === 'eraser') {
      saveToHistory()
      setLines(prev => prev.filter((_, i) => i !== index))
    }
  }

  // --- POINTER EVENTS (Unchanged mostly, just ensure coordinates are relative) ---
  const getCoordinates = (e) => {
    const rect = boardRef.current.getBoundingClientRect()
    return {
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100
    }
  }

  const handlePointerDown = (e) => {
    if (tool !== 'eraser') e.target.setPointerCapture(e.pointerId)
    const coords = getCoordinates(e)
    
    if (tool === 'move') {
      const clickedPlayer = players.find(p => {
        const dx = p.x - coords.x
        const dy = p.y - coords.y
        // Adjust hit radius based on sport aspect if needed, typically 3-4% is good
        return Math.sqrt(dx*dx + dy*dy) < 4 
      })
      if (clickedPlayer) {
        saveToHistory() 
        setDraggingId(clickedPlayer.id)
      }
    } else if (tool === 'draw') {
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
    } else if (tool === 'delete') {
      const clickedPlayer = players.find(p => {
        const dx = p.x - coords.x
        const dy = p.y - coords.y
        return Math.sqrt(dx*dx + dy*dy) < 4
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
      setPlayers(prev => prev.map(p => p.id === draggingId ? { ...p, x: coords.x, y: coords.y } : p))
    } else if (drawingLine) {
      if (drawingLine.isFreehand) {
        setDrawingLine(prev => ({ ...prev, points: [...prev.points, coords] }))
      } else {
        setDrawingLine(prev => ({ ...prev, end: coords }))
      }
    }
  }

  const handlePointerUp = (e) => {
    if (tool !== 'eraser' && e.target.hasPointerCapture && e.target.hasPointerCapture(e.pointerId)) {
       e.target.releasePointerCapture(e.pointerId)
    }
    setDraggingId(null)
    if (drawingLine) {
      if (drawingLine.isFreehand) {
        if (drawingLine.points.length > 5) setLines(prev => [...prev, drawingLine])
      } else {
        const dx = drawingLine.start.x - drawingLine.end.x
        const dy = drawingLine.start.y - drawingLine.end.y
        if (Math.sqrt(dx*dx + dy*dy) > 2) setLines(prev => [...prev, drawingLine])
      }
      setDrawingLine(null)
    }
  }

  const handleDoubleClick = (e) => {
    const coords = getCoordinates(e)
    const clickedPlayer = players.find(p => {
      const dx = p.x - coords.x
      const dy = p.y - coords.y
      return Math.sqrt(dx*dx + dy*dy) < 4
    })

    if (clickedPlayer) {
      const newLabel = prompt("Enter player label:", clickedPlayer.label)
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
    const interactiveProps = {
      pointerEvents: tool === 'eraser' ? 'visibleStroke' : 'none',
      cursor: tool === 'eraser' ? 'crosshair' : 'default',
      onPointerDown: (e) => {
        if (tool === 'eraser') { e.stopPropagation(); handleEraseLine(i); }
      },
      strokeWidth: tool === 'eraser' ? Math.max(width, 10) : width, 
    }
    const visualProps = {
      stroke: color, strokeWidth: width, strokeDasharray: dashArray,
      fill: "none", strokeLinecap: "round", strokeLinejoin: "round",
      vectorEffect: "non-scaling-stroke", className: isLive ? "opacity-60" : "transition-opacity hover:opacity-50", 
    }

    if (line.isFreehand) {
      const d = line.points.map((p, idx) => (idx === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`)).join(' ')
      return <g key={i}><path d={d} fill="none" stroke="transparent" {...interactiveProps} /><path d={d} {...visualProps} pointerEvents="none" /></g>
    } else {
      const d = `M ${line.start.x} ${line.start.y} Q ${line.start.x} ${line.end.y}, ${line.end.x} ${line.end.y}`
      return (
        <g key={i}>
           <path d={d} fill="none" stroke="transparent" {...interactiveProps} />
           <path d={d} {...visualProps} pointerEvents="none" markerEnd={!isLive && color.includes('fcd34d') ? "url(#arrow-yellow)" : !isLive ? "url(#arrow-red)" : ""} />
        </g>
      )
    }
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-full select-none bg-gray-50 rounded-xl p-4 border border-gray-200">
      
      {/* --- TOOLBAR --- */}
      <div className="lg:w-24 flex lg:flex-col gap-2 bg-white p-3 rounded-xl border border-gray-200 shadow-sm z-10 shrink-0 overflow-y-auto">
        {/* ... (Toolbar Buttons - kept identical to previous version, just reduced for brevity) ... */}
        <div className="flex flex-col gap-1 pb-3 border-b border-gray-100">
          <button onClick={() => setMode('attack')} className={`p-2 rounded-lg text-xs font-bold flex flex-col items-center ${mode === 'attack' ? 'bg-yellow-100 text-yellow-800' : 'text-gray-500'}`}><Swords size={20} className="mb-1" /> Att</button>
          <button onClick={() => setMode('defense')} className={`p-2 rounded-lg text-xs font-bold flex flex-col items-center ${mode === 'defense' ? 'bg-red-100 text-red-800' : 'text-gray-500'}`}><Shield size={20} className="mb-1" /> Def</button>
        </div>
        <div className="flex flex-col gap-1 py-3 border-b border-gray-100">
          <button onClick={() => setTool('move')} className={`p-2 rounded-lg text-xs flex flex-col items-center ${tool === 'move' ? 'bg-blue-600 text-white' : 'text-gray-500'}`}><Move size={20} className="mb-1" /> Move</button>
          <button onClick={() => setTool('draw')} className={`p-2 rounded-lg text-xs flex flex-col items-center ${tool === 'draw' ? 'bg-blue-600 text-white' : 'text-gray-500'}`}><PenTool size={20} className="mb-1" /> Draw</button>
          <button onClick={() => setTool('eraser')} className={`p-2 rounded-lg text-xs flex flex-col items-center ${tool === 'eraser' ? 'bg-red-600 text-white' : 'text-gray-500'}`}><Eraser size={20} className="mb-1" /> Erase</button>
          <button onClick={() => setTool('delete')} className={`p-2 rounded-lg text-xs flex flex-col items-center ${tool === 'delete' ? 'bg-red-100 text-red-600' : 'text-gray-500'}`}><Trash2 size={20} className="mb-1" /> Del</button>
        </div>
        
        {/* Inside the Toolbar... */}
        {tool === 'draw' && (
          <div className="flex flex-col gap-2 py-3 border-b border-gray-100 animate-in fade-in">
            
            {/* Line Style (Arrow vs Freehand) */}
            <div className="flex gap-1">
              <button 
                onClick={() => setDrawMode('arrow')} 
                className={`flex-1 p-1.5 rounded-md border transition-colors ${drawMode === 'arrow' ? 'bg-blue-50 border-blue-200 text-blue-600' : 'bg-white border-transparent text-gray-500 hover:bg-gray-50'}`} 
                title="Straight Arrow"
              >
                <ArrowRight size={18} className="mx-auto" />
              </button>
              <button 
                onClick={() => setDrawMode('freehand')} 
                className={`flex-1 p-1.5 rounded-md border transition-colors ${drawMode === 'freehand' ? 'bg-blue-50 border-blue-200 text-blue-600' : 'bg-white border-transparent text-gray-500 hover:bg-gray-50'}`} 
                title="Freehand Pencil"
              >
                <Pencil size={18} className="mx-auto" />
              </button>
            </div>

            {/* Line Type (Solid vs Dashed) */}
            <div className="flex gap-1">
              <button 
                onClick={() => setLineType('solid')} 
                className={`flex-1 p-1.5 rounded-md border transition-colors ${lineType === 'solid' ? 'bg-blue-50 border-blue-200 text-blue-600' : 'bg-white border-transparent text-gray-500 hover:bg-gray-50'}`} 
                title="Solid Line"
              >
                <Minus size={18} className="mx-auto" />
              </button>
              <button 
                onClick={() => setLineType('dashed')} 
                className={`flex-1 p-1.5 rounded-md border transition-colors ${lineType === 'dashed' ? 'bg-blue-50 border-blue-200 text-blue-600' : 'bg-white border-transparent text-gray-500 hover:bg-gray-50'}`} 
                title="Dashed Line"
              >
                <Activity size={18} className="mx-auto" />
              </button>
            </div>

            {/* Thickness Slider */}
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

        <div className="flex flex-col gap-1 py-2">
           <button onClick={() => handleAddToken('blue', '?')} className="p-3 text-blue-600 hover:bg-blue-50 rounded-lg border border-transparent hover:border-blue-100"><Users size={20} className="mx-auto" /></button>
           <button onClick={() => handleAddToken('red', 'X')} className="p-3 text-red-600 hover:bg-red-50 rounded-lg border border-transparent hover:border-red-100"><Circle size={20} className="mx-auto" /></button>
        </div>

        <div className="flex-grow"></div>
        <div className="flex justify-between px-1">
          <button onClick={handleUndo} disabled={history.length === 0} className="p-2 text-gray-400 disabled:opacity-30"><Undo2 size={20} /></button>
          <button onClick={handleClearLines} className="p-2 text-gray-400 hover:text-red-600"><RotateCcw size={20} /></button>
        </div>
        <button onClick={() => onSave({ players, lines })} disabled={isSaving} className="w-full py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-bold text-xs flex items-center justify-center gap-1">
          {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Save
        </button>
      </div>

      {/* --- THE PITCH --- */}
      <div className="flex-grow flex items-center justify-center bg-gray-200/50 rounded-xl overflow-hidden border border-gray-300">
        <div className={`relative w-full ${SPORT_CONFIG[sport]?.aspect || 'aspect-video'} max-h-full rounded-lg overflow-hidden border-2 border-black/10 shadow-xl`}>
          
          {/* Dynamic Background */}
          <FieldBackground sport={sport} />

          <div 
            ref={boardRef}
            className={`absolute inset-0 z-10 ${tool === 'move' ? 'cursor-default' : 'cursor-crosshair'}`}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
            onDoubleClick={handleDoubleClick}
          >
            <svg className="w-full h-full pointer-events-none filter drop-shadow-sm" viewBox="0 0 100 100" preserveAspectRatio="none">
              <defs>
                <marker id="arrow-yellow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L0,6 L6,3 z" fill="#fbbf24" /></marker>
                <marker id="arrow-red" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L0,6 L6,3 z" fill="#ef4444" /></marker>
              </defs>
              {lines.map((line, i) => renderLine(line, i))}
              {drawingLine && renderLine(drawingLine, 'live', true)}
            </svg>

            {players.map(p => (
              <div
                key={p.id}
                className={`absolute w-8 h-8 md:w-10 md:h-10 -ml-4 -mt-4 md:-ml-5 md:-mt-5 rounded-full flex items-center justify-center font-bold text-xs border-2 shadow-md touch-none
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
    </div>
  )
}