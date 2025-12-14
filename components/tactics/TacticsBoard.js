import { useState, useRef, useEffect } from 'react'
import { 
  Move, PenTool, Circle, Trash2, Save, 
  RotateCcw, Undo2, ArrowRight, Activity, 
  Pencil, Minus, Eraser, Loader2, Layout, 
  ChevronDown 
} from 'lucide-react'

// --- 1. CONFIG & CONSTANTS ---
const COLORS = [
  { name: 'Yellow', hex: '#fcd34d', class: 'bg-yellow-400' },
  { name: 'Red', hex: '#ef4444', class: 'bg-red-500' },
  { name: 'Blue', hex: '#3b82f6', class: 'bg-blue-600' },
  { name: 'Black', hex: '#000000', class: 'bg-black' },
  { name: 'White', hex: '#ffffff', class: 'bg-white border border-gray-300' },
]

const SPORT_CONFIG = {
  football: {
    label: "Football",
    bg: "bg-emerald-700",
    aspect: "aspect-[16/9]",
    defaultPlayers: [
       { id: 1, x: 10, y: 50, label: 'GK' }, { id: 2, x: 25, y: 20, label: 'LB' },
       { id: 3, x: 25, y: 40, label: 'CB' }, { id: 4, x: 25, y: 60, label: 'CB' },
       { id: 5, x: 25, y: 80, label: 'RB' }, { id: 6, x: 50, y: 50, label: 'CM' }
    ]
  },
  basketball: {
    label: "Basketball",
    bg: "bg-orange-100", 
    aspect: "aspect-[16/9]", 
    defaultPlayers: [
      { id: 1, x: 10, y: 50, label: 'PG' }, { id: 2, x: 25, y: 25, label: 'SG' },
      { id: 3, x: 25, y: 75, label: 'SF' }, { id: 4, x: 40, y: 60, label: 'PF' },
      { id: 5, x: 40, y: 40, label: 'C' }
    ]
  },
  cricket: {
    label: "Cricket",
    bg: "bg-green-600",
    aspect: "aspect-video", 
    defaultPlayers: [
      { id: 1, x: 50, y: 45, label: 'WK' }, { id: 2, x: 50, y: 55, label: 'BWL' },
      { id: 3, x: 20, y: 50, label: 'Long' }, { id: 4, x: 80, y: 50, label: 'Deep' }
    ]
  }
}

// --- 2. FIELD BACKGROUND ---
const FieldBackground = ({ sport, showGrid }) => {
  const config = SPORT_CONFIG[sport] || SPORT_CONFIG.football
  const svgProps = { className: "absolute inset-0 w-full h-full pointer-events-none opacity-80" }

  const GridOverlay = () => (
    showGrid ? (
      <div className="absolute inset-0 pointer-events-none" 
           style={{ 
             backgroundImage: `linear-gradient(to right, rgba(255,255,255,0.1) 1px, transparent 1px), 
                               linear-gradient(to bottom, rgba(255,255,255,0.1) 1px, transparent 1px)`,
             backgroundSize: '10% 10%' 
           }}>
      </div>
    ) : null
  )

  if (sport === 'basketball') {
    return (
      <div className={`absolute inset-0 ${config.bg} overflow-hidden`}>
         <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, #000 10px, #000 11px)' }}></div>
         <GridOverlay />
         <svg viewBox="0 0 100 50" preserveAspectRatio="none" {...svgProps}>
            <rect x="2" y="2" width="96" height="46" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-orange-900"/>
            <line x1="50" y1="2" x2="50" y2="48" stroke="currentColor" strokeWidth="0.5" className="text-orange-900"/>
            <circle cx="50" cy="25" r="6" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-orange-900"/>
            <path d="M 2,17 L 15,17 L 15,33 L 2,33" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-orange-900"/>
            <path d="M 2,5 Q 25,5 25,25 Q 25,45 2,45" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-orange-900"/>
            <circle cx="5" cy="25" r="1.5" stroke="currentColor" strokeWidth="0.5" fill="none" className="text-orange-900"/>
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
         <GridOverlay />
         <svg viewBox="0 0 100 100" preserveAspectRatio="none" {...svgProps}>
            <ellipse cx="50" cy="50" rx="45" ry="45" fill="none" stroke="white" strokeWidth="0.5" strokeDasharray="2,2"/>
            <ellipse cx="50" cy="50" rx="25" ry="25" fill="none" stroke="white" strokeWidth="0.5" opacity="0.5"/>
            <rect x="42" y="35" width="16" height="30" fill="#eecfa1" rx="2" /> 
            <rect x="44" y="38" width="12" height="0.5" fill="white" />
            <rect x="44" y="62" width="12" height="0.5" fill="white" />
         </svg>
      </div>
    )
  }

  // Football (Default)
  return (
    <div className={`absolute inset-0 ${config.bg}`}>
       <div className="absolute inset-0" style={{ background: 'repeating-linear-gradient(90deg, transparent, transparent 5%, rgba(0,0,0,0.05) 5%, rgba(0,0,0,0.05) 10%)' }}></div>
       <GridOverlay />
       <svg viewBox="0 0 100 60" preserveAspectRatio="none" {...svgProps}>
          <rect x="0" y="0" width="100" height="60" fill="none" stroke="white" strokeWidth="0.5" />
          <line x1="50" y1="0" x2="50" y2="60" stroke="white" strokeWidth="0.5" />
          <circle cx="50" cy="30" r="8" fill="none" stroke="white" strokeWidth="0.5" />
          <rect x="0" y="15" width="15" height="30" fill="none" stroke="white" strokeWidth="0.5" />
          <rect x="0" y="22" width="5" height="16" fill="none" stroke="white" strokeWidth="0.5" />
          <rect x="85" y="15" width="15" height="30" fill="none" stroke="white" strokeWidth="0.5" />
          <rect x="95" y="22" width="5" height="16" fill="none" stroke="white" strokeWidth="0.5" />
       </svg>
    </div>
  )
}

export default function TacticsBoard({ initialData, sport: initialSport = 'football', onSave, isSaving }) {
  // Tools & State
  const [selectedSport, setSelectedSport] = useState(initialData?.sport || initialSport)
  const [tool, setTool] = useState('move')
  
  // FIX 1: Default drawMode changed from 'arrow' to 'freehand'
  const [drawMode, setDrawMode] = useState('freehand')
  
  const [lineType, setLineType] = useState('solid')
  const [strokeWidth, setStrokeWidth] = useState(2) 
  const [drawColor, setDrawColor] = useState(COLORS[0].hex)
  const [showGrid, setShowGrid] = useState(false)
  const [tacticName, setTacticName] = useState(initialData?.name || '')

  // Data State
  const [players, setPlayers] = useState([])
  const [lines, setLines] = useState([])
  const [history, setHistory] = useState([]) 

  // --- INITIALIZATION EFFECT ---
  useEffect(() => {
    if (initialData) {
      // FIX 2: If players array exists but is empty (New Tactic), load defaults
      if (initialData.players && initialData.players.length > 0) {
        setPlayers(initialData.players)
      } else {
        // Load defaults based on the sport in initialData or current selection
        const sportToUse = initialData.sport || selectedSport
        const config = SPORT_CONFIG[sportToUse] || SPORT_CONFIG.football
        setPlayers(config.defaultPlayers.map(p => ({ ...p, color: 'blue' })))
      }

      setLines(initialData.lines || [])
      setTacticName(initialData.name || '')
      if (initialData.sport) {
        setSelectedSport(initialData.sport)
      }
    } else {
      loadDefaultPlayers(selectedSport)
    }
    setHistory([])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialData]) 

  // Helper to load defaults (used in Init and Sport Change)
  const loadDefaultPlayers = (sportKey) => {
    const defaultConfig = SPORT_CONFIG[sportKey] || SPORT_CONFIG.football
    const defaults = defaultConfig.defaultPlayers.map(p => ({ ...p, color: 'blue' }))
    setPlayers(defaults)
    setLines([])
  }

  // Interaction State
  const [draggingId, setDraggingId] = useState(null)
  const [drawingLine, setDrawingLine] = useState(null)
  const boardRef = useRef(null)

  // --- ACTIONS ---
  const saveToHistory = () => {
    setHistory(prev => [...prev.slice(-19), { players: JSON.parse(JSON.stringify(players)), lines: JSON.parse(JSON.stringify(lines)) }])
  }

  const handleSportChange = (e) => {
    const newSport = e.target.value
    // If we have data on the board, warn the user
    if (lines.length > 0 || players.length > 8) {
        if(!confirm("Changing sport will reset the board. Continue?")) return
    }
    
    // Explicitly handle the sport change logic here
    setSelectedSport(newSport)
    loadDefaultPlayers(newSport)
    saveToHistory()
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

  const handleAddToken = (color, label, type = 'player') => {
    saveToHistory()
    const newId = Date.now()
    const isBall = type === 'ball'
    setPlayers(prev => [...prev, { 
        id: newId, 
        x: 50, 
        y: 50, 
        color: isBall ? 'white' : color, 
        label: isBall ? '' : label,
        type: type 
    }])
  }

  const handleEraseLine = (index) => {
    if (tool === 'eraser') {
      saveToHistory()
      setLines(prev => prev.filter((_, i) => i !== index))
    }
  }

  const handleSave = () => {
    if (!tacticName.trim()) return alert("Please enter a name for this tactic.")
    
    // Explicitly send current state values
    const tacticData = {
        name: tacticName,
        sport: selectedSport, // Send the currently selected sport
        players: players,
        lines: lines
    }
    onSave(tacticData)
  }

  // --- POINTER EVENTS ---
  const getCoordinates = (e) => {
    if (!boardRef.current) return { x: 0, y: 0 }
    const rect = boardRef.current.getBoundingClientRect()
    return {
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100
    }
  }

  const handlePointerDown = (e) => {
    if (tool !== 'eraser') {
        try { e.target.setPointerCapture(e.pointerId) } catch(err) {}
    }
    const coords = getCoordinates(e)
    
    if (tool === 'move') {
      const clickedPlayer = players.find(p => {
        const dx = p.x - coords.x
        const dy = p.y - coords.y
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
        color: drawColor, 
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
    if (tool !== 'eraser' && e.target.hasPointerCapture) {
       try { e.target.releasePointerCapture(e.pointerId) } catch(err) {}
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
    const clickedPlayer = players.find(p => Math.sqrt(Math.pow(p.x - coords.x, 2) + Math.pow(p.y - coords.y, 2)) < 4)

    if (clickedPlayer && clickedPlayer.type !== 'ball') {
      const newLabel = prompt("Enter player label:", clickedPlayer.label)
      if (newLabel) {
        saveToHistory()
        setPlayers(prev => prev.map(p => p.id === clickedPlayer.id ? { ...p, label: newLabel.substring(0, 4) } : p))
      }
    }
  }

  // --- RENDER HELPERS ---
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
      const markerId = `arrow-${color.replace('#', '')}`
      return (
        <g key={i}>
           <defs>
             <marker id={markerId} markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                <path d="M0,0 L0,6 L6,3 z" fill={color} />
             </marker>
           </defs>
           <path d={d} fill="none" stroke="transparent" {...interactiveProps} />
           <path d={d} {...visualProps} pointerEvents="none" markerEnd={!isLive ? `url(#${markerId})` : ""} />
        </g>
      )
    }
  }

  return (
    <div className="flex flex-col h-full gap-4 p-1">
        
      {/* HEADER: Name, Sports Selector, Save */}
      <div className="bg-white p-3 md:p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center shrink-0">
         
         <div className="w-full md:flex-1 flex flex-col gap-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Tactic Name</label>
            <input 
                type="text"
                value={tacticName}
                onChange={(e) => setTacticName(e.target.value)}
                placeholder="Name your tactic..."
                className="w-full text-base md:text-lg font-bold text-gray-900 placeholder:text-gray-300 border-b-2 border-transparent focus:border-blue-600 outline-none transition-colors"
            />
         </div>

         <div className="w-full md:w-auto flex items-center gap-3">
             <div className="relative group">
                <select 
                    value={selectedSport}
                    onChange={handleSportChange}
                    className="appearance-none bg-gray-50 border border-gray-200 text-gray-700 font-medium py-2 pl-4 pr-10 rounded-lg cursor-pointer hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all"
                >
                    {Object.entries(SPORT_CONFIG).map(([key, conf]) => (
                        <option key={key} value={key}>{conf.label}</option>
                    ))}
                </select>
                <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none group-hover:text-blue-500" />
             </div>

             <button 
                onClick={handleSave} 
                disabled={isSaving} 
                className="flex-1 md:flex-none py-2 px-5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 whitespace-nowrap disabled:opacity-70 disabled:cursor-not-allowed"
             >
                {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />} 
                <span className="hidden md:inline">Save</span>
             </button>
         </div>
      </div>

      {/* MAIN LAYOUT */}
      <div className="flex flex-col lg:flex-row gap-4 flex-1 min-h-0 bg-gray-50 rounded-xl p-2 md:p-4 border border-gray-200 shadow-inner overflow-hidden">
        
        {/* TOOLBAR */}
        <div className="lg:w-28 w-full flex lg:flex-col gap-2 bg-white p-2 rounded-xl border border-gray-200 shadow-sm z-10 shrink-0 overflow-x-auto lg:overflow-y-auto no-scrollbar">
          
          <div className="flex lg:flex-col gap-1 pr-2 lg:pr-0 lg:pb-3 lg:border-b border-gray-100 border-r lg:border-r-0">
            <button onClick={() => setTool('move')} className={`p-2 rounded-lg text-xs flex flex-col items-center min-w-[3rem] transition-all ${tool === 'move' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}><Move size={20} className="mb-1" /> Move</button>
            <button onClick={() => setTool('draw')} className={`p-2 rounded-lg text-xs flex flex-col items-center min-w-[3rem] transition-all ${tool === 'draw' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}><PenTool size={20} className="mb-1" /> Draw</button>
            <button onClick={() => setTool('eraser')} className={`p-2 rounded-lg text-xs flex flex-col items-center min-w-[3rem] transition-all ${tool === 'eraser' ? 'bg-red-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}><Eraser size={20} className="mb-1" /> Erase</button>
            <button onClick={() => setTool('delete')} className={`p-2 rounded-lg text-xs flex flex-col items-center min-w-[3rem] transition-all ${tool === 'delete' ? 'bg-red-100 text-red-600 border border-red-200' : 'text-gray-500 hover:bg-gray-50'}`}><Trash2 size={20} className="mb-1" /> Del</button>
          </div>
          
          {tool === 'draw' && (
            <div className="flex lg:flex-col gap-2 px-2 lg:px-0 lg:py-3 lg:border-b border-gray-100 items-center lg:items-stretch animate-in fade-in zoom-in-95">
              <div className="flex flex-wrap gap-1.5 justify-center mb-1">
                 {COLORS.map(c => (
                     <button 
                        key={c.name}
                        onClick={() => setDrawColor(c.hex)}
                        className={`w-5 h-5 rounded-full border border-gray-200 ${c.class} ${drawColor === c.hex ? 'ring-2 ring-offset-1 ring-gray-400 scale-110' : ''}`}
                        title={c.name}
                     />
                 ))}
              </div>
              <div className="flex gap-1 w-full">
                <button onClick={() => setDrawMode('arrow')} className={`flex-1 p-1.5 rounded-md border transition-colors ${drawMode === 'arrow' ? 'bg-blue-50 border-blue-200 text-blue-600' : 'bg-white border-transparent text-gray-500'}`} ><ArrowRight size={18} className="mx-auto" /></button>
                <button onClick={() => setDrawMode('freehand')} className={`flex-1 p-1.5 rounded-md border transition-colors ${drawMode === 'freehand' ? 'bg-blue-50 border-blue-200 text-blue-600' : 'bg-white border-transparent text-gray-500'}`} ><Pencil size={18} className="mx-auto" /></button>
              </div>
              <div className="flex gap-1 w-full">
                <button onClick={() => setLineType('solid')} className={`flex-1 p-1.5 rounded-md border transition-colors ${lineType === 'solid' ? 'bg-blue-50 border-blue-200 text-blue-600' : 'bg-white border-transparent text-gray-500'}`} ><Minus size={18} className="mx-auto" /></button>
                <button onClick={() => setLineType('dashed')} className={`flex-1 p-1.5 rounded-md border transition-colors ${lineType === 'dashed' ? 'bg-blue-50 border-blue-200 text-blue-600' : 'bg-white border-transparent text-gray-500'}`} ><Activity size={18} className="mx-auto" /></button>
              </div>
              <div className="w-full px-1"><input type="range" min="1" max="8" step="0.5" value={strokeWidth} onChange={(e) => setStrokeWidth(Number(e.target.value))} className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600" /></div>
            </div>
          )}

          <div className="flex lg:flex-col gap-2 lg:py-3 items-center lg:items-stretch pl-2 lg:pl-0 border-l lg:border-l-0 border-gray-100">
             <label className="hidden lg:block text-[10px] font-bold text-gray-400 uppercase text-center">Tokens</label>
             <button onClick={() => handleAddToken('blue', '?')} className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 font-bold text-xs whitespace-nowrap">Blue</button>
             <button onClick={() => handleAddToken('red', 'X')} className="p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg border border-red-200 font-bold text-xs whitespace-nowrap">Red</button>
             <button onClick={() => handleAddToken('white', '', 'ball')} className="p-2 text-gray-700 bg-white hover:bg-gray-50 rounded-lg border border-gray-300 font-bold text-xs flex items-center justify-center gap-1 shadow-sm whitespace-nowrap">
                <div className="w-3.5 h-3.5 rounded-full border border-black flex items-center justify-center bg-white"><div className="w-full h-[1px] bg-black rotate-45"></div></div> Ball
             </button>
          </div>

          <div className="lg:flex-grow"></div>
          
          <div className="flex lg:flex-col gap-1 items-center">
             <button onClick={() => setShowGrid(!showGrid)} className={`p-2 rounded flex-1 w-full ${showGrid ? 'bg-indigo-100 text-indigo-700' : 'text-gray-400 hover:bg-gray-100'}`} title="Toggle Grid"><Layout size={20} className="mx-auto"/></button>
             <button onClick={handleUndo} disabled={history.length === 0} className="p-2 text-gray-400 disabled:opacity-30 hover:bg-gray-100 rounded flex-1 w-full"><Undo2 size={20} className="mx-auto"/></button>
             <button onClick={handleClearLines} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded flex-1 w-full"><RotateCcw size={20} className="mx-auto"/></button>
          </div>
        </div>

        {/* BOARD AREA */}
        <div className="flex-1 min-h-0 flex flex-col gap-2 relative">
            <div className="flex-1 relative min-h-0 w-full flex items-center justify-center bg-gray-200/50 rounded-xl overflow-hidden border border-gray-300">
                <div className={`relative w-full max-h-full max-w-full ${SPORT_CONFIG[selectedSport]?.aspect} shadow-2xl`}>
                    
                    <FieldBackground sport={selectedSport} showGrid={showGrid} />

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
                            {lines.map((line, i) => renderLine(line, i))}
                            {drawingLine && renderLine(drawingLine, 'live', true)}
                        </svg>

                        {players.map(p => (
                            <div
                                key={p.id}
                                className={`absolute rounded-full flex items-center justify-center font-bold border-2 shadow-md touch-none transition-transform select-none
                                    ${p.type === 'ball' ? 'w-4 h-4 md:w-5 md:h-5 bg-white border-black text-black -ml-2 -mt-2' : 'w-6 h-6 md:w-8 md:h-8 lg:w-10 lg:h-10 -ml-3 -mt-3 md:-ml-4 md:-mt-4 lg:-ml-5 lg:-mt-5 text-[10px] md:text-xs'}
                                    ${p.type !== 'ball' && p.color === 'blue' ? 'bg-blue-600 border-white text-white' : ''} 
                                    ${p.type !== 'ball' && p.color === 'red' ? 'bg-red-600 border-white text-white' : ''} 
                                    ${tool === 'move' ? 'cursor-grab active:cursor-grabbing hover:scale-110' : ''}`}
                                style={{ left: `${p.x}%`, top: `${p.y}%`, pointerEvents: tool === 'move' || tool === 'delete' ? 'auto' : 'none' }}
                            >
                                {p.type !== 'ball' && p.label}
                                {p.type === 'ball' && <Circle size={12} className="fill-current text-black opacity-80" />}
                                {draggingId === p.id && <div className="absolute -inset-1 border-2 border-yellow-400 rounded-full animate-ping opacity-75"></div>}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            
            <div className="text-center text-xs text-gray-400 font-medium italic shrink-0">
                Tip: Double-click a player to rename. Drag tokens from the toolbar.
            </div>
        </div>
      </div>
    </div>
  )
}