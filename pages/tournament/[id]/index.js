import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { useAuth } from '../../../context/AuthContext'
import { supabase } from '../../../lib/supabaseClient'
import Layout from '../../../components/ui/Layout'
import LeagueTable from '../../../components/tournaments/LeagueTable'
import KnockoutBracket from '@/components/tournaments/KnockoutBracket'
import { generateBracket } from '@/lib/BracketGenerator'
import { 
  Trophy, Calendar, Users, MapPin, 
  Clock, Activity, Tv, Edit3, Loader, Share2, 
  Settings, Plus, Play, CheckCircle, X, List, Shield, MessageSquare, Send, Trash2
} from 'lucide-react'

// Helper for dates
const formatDate = (dateString) => {
  if (!dateString) return 'TBD'
  return new Date(dateString).toLocaleDateString('en-US', { 
    weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
  })
}

export default function TournamentDashboard() {
  const router = useRouter()
  const { id } = router.query
  const { user, profile } = useAuth()

  // Data State
  const [tournament, setTournament] = useState(null)
  const [matches, setMatches] = useState([])
  const [teams, setTeams] = useState([])
  const [venues, setVenues] = useState([])
  const [loading, setLoading] = useState(true)
  
  // UI State
  const [activeTab, setActiveTab] = useState('overview')
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({})
  const [newVenue, setNewVenue] = useState('')

  // --- NEW: Multi-Team Selector State ---
  const [showTeamSelector, setShowTeamSelector] = useState(false)
  const [teamsToSelect, setTeamsToSelect] = useState([])

  // Permissions
  const isOrganizer = tournament?.organizer_id === user?.id
  const isCoach = profile?.role === 'coach'
    //Announcements
    // --- FEED STATE ---
  const [announcements, setAnnouncements] = useState([])
  const [newAnnouncement, setNewAnnouncement] = useState('')
  const [commentInputs, setCommentInputs] = useState({})

  useEffect(() => {
    if (id) fetchTournamentData()
  }, [id])

  const fetchTournamentData = async () => {
    try {
      // 1. Tournament Info
      const { data: t } = await supabase.from('tournaments').select('*').eq('id', id).single()
      if (!t) throw new Error("Tournament not found")
      setTournament(t)
      setEditForm(t)

      // 2. Registered Teams
      const { data: teamData } = await supabase
        .from('tournament_teams')
        .select('*, teams(*)')
        .eq('tournament_id', id)
      
      setTeams(teamData ? teamData.map(item => ({ ...item.teams, status: item.status })) : [])

      // 3. Matches
      const { data: matchData } = await supabase
        .from('matches')
        .select(`*, teams_a:team_a_id(name), teams_b:team_b_id(name)`)
        .eq('tournament_id', id)
        .order('date', { ascending: true })
      setMatches(matchData || [])

      // 4. Venues
      if (t.organizer_id) {
        const { data: venueData } = await supabase.from('venues').select('*').eq('organizer_id', t.organizer_id)
        setVenues(venueData || [])
      }
      // 5. Get Announcements (Feed)
      const { data: feedData } = await supabase
        .from('announcements')
        .select(`
          *,
          profiles:author_id(username, avatar_url),
          announcement_comments(
            *,
            profiles:user_id(username, avatar_url)
          )
        `)
        .eq('tournament_id', id)
        .order('created_at', { ascending: false })
        
      // Sort comments oldest to newest
      const sortedFeed = feedData?.map(post => ({
        ...post,
        announcement_comments: post.announcement_comments.sort((a,b) => new Date(a.created_at) - new Date(b.created_at))
      })) || [];
      
      setAnnouncements(sortedFeed)

    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  // --- ACTIONS ---

  const handleUpdateTournament = async (e) => {
    e.preventDefault()
    const { error } = await supabase.from('tournaments').update(editForm).eq('id', id)
    if (!error) {
        setTournament(editForm)
        setIsEditing(false)
    }
  }

  const handleTeamAction = async (teamId, action) => {
    try {
      const { error } = await supabase
        .from('tournament_teams')
        .update({ status: action })
        .eq('tournament_id', id)
        .eq('team_id', teamId)

      if (error) throw error
      fetchTournamentData()
      
    } catch (error) {
      console.error("Error updating team:", error)
      alert("Failed to update status")
    }
  }

  // --- FIXED JOIN LOGIC ---

  // 1. The actual database insert (separated from the check)
  const registerTeam = async (teamId) => {
    const { error } = await supabase.from('tournament_teams').insert({
        tournament_id: id,
        team_id: teamId,
        status: 'pending'
    })
    
    if (error) {
        // Handle duplicate join error nicely
        if (error.code === '23505') alert("This team is already registered!")
        else alert(error.message)
    } else {
        alert("Request sent! Waiting for organizer approval.")
        setShowTeamSelector(false) // Close modal if open
        fetchTournamentData() // Refresh list
    }
  }


// 2. The check (Determines if we need the modal)
  const handleJoinTournament = async () => {
    // Select ALL teams, make sure to include 'sport'
    const { data: myTeams } = await supabase
        .from('teams')
        .select('id, name, logo_url, sport') // <--- Added 'sport'
        .eq('owner_id', user.id)

    if (!myTeams || myTeams.length === 0) {
        return alert("You need to create a team first!")
    }

    // --- SPORT CHECK FILTER ---
    // Only keep teams that match this tournament's sport
    const eligibleTeams = myTeams.filter(t => 
        t.sport && t.sport.toLowerCase() === tournament.sport.toLowerCase()
    );

    // If they have teams, but none match the sport:
    if (eligibleTeams.length === 0) {
        return alert(`You cannot join a ${tournament.sport} tournament because you only have ${myTeams[0].sport} teams.`)
    }
    // --------------------------

    if (eligibleTeams.length === 1) {
        // If user has only 1 eligible team, join immediately
        registerTeam(eligibleTeams[0].id)
    } else {
        // If user has multiple eligible teams, show the selector with ONLY those teams
        setTeamsToSelect(eligibleTeams)
        setShowTeamSelector(true)
    }
  }
  

  const handleAddVenue = async () => {
    if (!newVenue) return
    const { error } = await supabase.from('venues').insert({
        name: newVenue, location: 'Local', organizer_id: user.id
    })
    if (!error) {
        setNewVenue('')
        fetchTournamentData()
    }
  }

  // --- FEED HANDLERS ---
  const handlePostAnnouncement = async () => {
    if (!newAnnouncement.trim()) return;

    const { error } = await supabase.from('announcements').insert({
      tournament_id: id,
      author_id: user.id,
      content: newAnnouncement
    });

    if (!error) {
      setNewAnnouncement('');
      // Quick refresh to show new post
      window.location.reload(); 
    } else {
      alert("Error: " + error.message);
    }
  }

  const handlePostComment = async (announcementId) => {
    const text = commentInputs[announcementId];
    if (!text?.trim()) return;

    const { error } = await supabase.from('announcement_comments').insert({
      announcement_id: announcementId,
      user_id: user.id,
      content: text
    });

    if (!error) {
      setCommentInputs(prev => ({ ...prev, [announcementId]: '' }));
      window.location.reload(); 
    }
  }

  const handleDeleteAnnouncement = async (postId) => {
    if(!confirm("Delete this post?")) return;
    await supabase.from('announcements').delete().eq('id', postId);
    setAnnouncements(prev => prev.filter(a => a.id !== postId));
  }



  const handleGenerateSchedule = async () => {
    if (teams.length < 2) return alert("You need at least 2 teams to generate a bracket.");
    
    const log2 = Math.log2(teams.length);
    if (tournament.format === 'knockout' && log2 % 1 !== 0) {
        return alert(`For a proper knockout bracket, you need 4, 8, 16, or 32 teams. You currently have ${teams.length}. Please add dummy/bye teams.`);
    }

    if (!confirm("Generate schedule? This will create a new bracket structure.")) return;
    
    setLoading(true);

    try {
        const { error: deleteError } = await supabase
            .from('matches')
            .delete()
            .eq('tournament_id', id);
            
        if (deleteError) throw deleteError;

        if (tournament.format === 'knockout') {
            const approvedTeams = teams.filter(t => t.status === 'approved');
            
            if(approvedTeams.length !== teams.length) {
               if(!confirm(`Only ${approvedTeams.length} teams are approved. Generate bracket with only these?`)) {
                   setLoading(false); 
                   return;
               }
            }

            await generateBracket(id, approvedTeams);
            alert("Knockout Bracket Generated Successfully! 🏆");
        
        } else {
            const res = await fetch(`/api/tournaments/${id}/generate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ organizer_id: user.id })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            alert(`Success! Generated league schedule.`);
        }

        fetchTournamentData();
        setActiveTab('matches');

    } catch (error) {
        console.error(error);
        alert("Error generating schedule: " + error.message);
    } finally {
        setLoading(false);
    }
  }

  if (loading) return (
    <Layout>
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <Loader className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    </Layout>
  )

  if (!tournament) return <Layout><div className="p-10 text-center">Tournament Not Found</div></Layout>

  // Derived State for UI
// Derived State for UI
// FIX: Include 'paused' so these games stay in the "Live" queue
    const liveMatches = matches.filter(m => m.status === 'live' || m.status === 'paused')
    const upcomingMatches = matches.filter(m => m.status === 'scheduled')
  const finishedMatches = matches.filter(m => m.status === 'finished' || m.status === 'completed')
  const featuredMatch = liveMatches.length > 0 ? liveMatches[0] : upcomingMatches[0]

  return (
    <Layout title={tournament.name}>
       <div className="min-h-screen bg-gray-50 p-4 md:p-8">
          <div className="max-w-7xl mx-auto space-y-8">
            
            {/* === TEAM SELECTOR MODAL (New) === */}
            {showTeamSelector && (
              <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
                <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden">
                  <div className="bg-indigo-900 p-4 flex justify-between items-center">
                    <h3 className="text-white font-bold text-lg">Select Team to Join</h3>
                    <button onClick={() => setShowTeamSelector(false)} className="text-indigo-200 hover:text-white"><X size={20}/></button>
                  </div>
                  <div className="p-4 max-h-[60vh] overflow-y-auto space-y-3">
                    <p className="text-sm text-gray-500 mb-2">Which team are you registering for this tournament?</p>
                    {teamsToSelect.map((team) => (
                      <button
                        key={team.id}
                        onClick={() => registerTeam(team.id)}
                        className="w-full flex items-center gap-4 p-3 rounded-lg border border-gray-200 hover:border-indigo-500 hover:bg-indigo-50 transition-all text-left group"
                      >
                        <div className="w-10 h-10 rounded bg-gray-200 flex items-center justify-center overflow-hidden">
                           {team.logo_url ? <img src={team.logo_url} className="w-full h-full object-cover"/> : <Shield size={16} className="text-gray-400"/>}
                        </div>
                        <div>
                          <span className="block font-bold text-gray-900 group-hover:text-indigo-700">{team.name}</span>
                          <span className="text-xs text-gray-400">Select this team</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* === EDIT MODAL === */}
            {isEditing && (
                <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <h3 className="font-bold text-lg">Tournament Settings</h3>
                            <button onClick={() => setIsEditing(false)} className="text-gray-400 hover:text-gray-600"><X size={20}/></button>
                        </div>
                        <form onSubmit={handleUpdateTournament} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Name</label>
                                <input className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Status</label>
                                <select className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none" value={editForm.status} onChange={e => setEditForm({...editForm, status: e.target.value})}>
                                    <option value="upcoming">Upcoming</option>
                                    <option value="live">Live</option>
                                    <option value="completed">Completed</option>
                                </select>
                            </div>
                            <button className="w-full bg-indigo-600 text-white font-bold py-2.5 rounded-lg hover:bg-indigo-700 transition-colors">Save Changes</button>
                        </form>
                    </div>
                </div>
            )}

            {/* === HEADER === */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
               <div>
                  <div className="flex items-center gap-2 mb-2">
                      <span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest border border-indigo-200">
                         {tournament.sport} {tournament.format}
                      </span>
                      {tournament.status === 'live' && (
                         <span className="bg-red-100 text-red-600 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest border border-red-200 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse"></span> Live
                         </span>
                      )}
                  </div>
                  <h1 className="text-3xl md:text-4xl font-black text-gray-900">{tournament.name}</h1>
               </div>
               
               <div className="flex gap-2">
                   {isOrganizer && (
                      <button onClick={() => setIsEditing(true)} className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-bold shadow-sm hover:bg-gray-50 transition-colors flex items-center gap-2">
                          <Settings size={16}/> Manage Settings
                      </button>
                   )}
                   {isCoach && tournament.status === 'upcoming' && (
                      <button onClick={handleJoinTournament} className="bg-indigo-600 text-white px-5 py-2 rounded-lg text-sm font-bold shadow-md hover:bg-indigo-700 transition-colors flex items-center gap-2">
                          <Plus size={16}/> Join Tournament
                      </button>
                   )}
               </div>
            </div>

            {/* === STATS ROW === */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
               <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
                  <div className="p-3 bg-blue-50 text-blue-600 rounded-lg"><Users size={20} /></div>
                  <div><p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Teams</p><p className="text-xl font-bold text-gray-900">{teams.length}</p></div>
               </div>
               <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
                  <div className="p-3 bg-red-50 text-red-600 rounded-lg"><Activity size={20} /></div>
                  <div><p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Live Now</p><p className="text-xl font-bold text-gray-900">{liveMatches.length}</p></div>
               </div>
               <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
                  <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg"><Calendar size={20} /></div>
                  <div><p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Start Date</p><p className="text-lg font-bold text-gray-900 leading-tight">{new Date(tournament.start_date).toLocaleDateString()}</p></div>
               </div>
               <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
                  <div className="p-3 bg-gray-100 text-gray-600 rounded-lg"><Trophy size={20} /></div>
                  <div><p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Completed</p><p className="text-xl font-bold text-gray-900">{finishedMatches.length}</p></div>
               </div>
            </div>

            {/* === TABS NAVIGATION === */}
            <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8">
                    {['overview', 'feed','matches', 'teams', 'venues'].map((tab) => (
                        (tab !== 'venues' || isOrganizer) && (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`
                                    whitespace-nowrap pb-4 px-1 border-b-2 font-bold text-sm capitalize transition-colors
                                    ${activeTab === tab ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
                                `}
                            >
                                {tab}
                            </button>
                        )
                    ))}
                </nav>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
               
               {/* === LEFT CONTENT (2 Columns) === */}
               <div className="lg:col-span-2 space-y-8">
                  
                  {/* TAB: OVERVIEW */}
                  {activeTab === 'overview' && (
                      <>
                        {/* FEATURED MATCH CARD */}
                        <div>
                            <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2 mb-4"><Clock size={18} className="text-indigo-600" /> Match Center</h3>
                            {featuredMatch ? (
                                <div className={`
                                    bg-white rounded-2xl border shadow-sm overflow-hidden transition-all
                                    ${featuredMatch.status === 'live' ? 'border-red-200 ring-4 ring-red-50 shadow-red-100' : 
                                    featuredMatch.status === 'paused' ? 'border-orange-200 ring-4 ring-orange-50 shadow-orange-100' : 
                                    'border-gray-200'}
                                `}>
                                    <div className="bg-gray-50 border-b border-gray-100 p-3 flex justify-between items-center text-xs text-gray-500 font-medium">
                                       <span className="flex items-center gap-1">
                                            <Calendar size={12}/> 
                                            {/* Combine the date object with the raw time string */}
                                            {new Date(featuredMatch.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} 
                                            {' • '} 
                                            {featuredMatch.match_time.slice(0, 5)}
                                        </span>
                                        {featuredMatch.status === 'live' ? (
                                            <span className="flex items-center gap-1 text-red-600 font-bold animate-pulse">● LIVE NOW</span>
                                        ) : featuredMatch.status === 'paused' ? (
                                            <span className="flex items-center gap-1 text-orange-500 font-bold">⏸ PAUSED</span>
                                        ) : (
                                            <span className="text-gray-400 font-bold tracking-wider">UPCOMING</span>
                                        )}
                                    </div>
                                    <div className="p-6 flex flex-col md:flex-row items-center justify-between gap-6">
                                        <div className="flex-1 text-center">
                                            <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto mb-3 flex items-center justify-center text-xl font-bold text-gray-600 border border-gray-200">{featuredMatch.teams_a?.name?.[0] || 'A'}</div>
                                            <h4 className="font-bold text-gray-900 text-lg">{featuredMatch.teams_a?.name || 'TBD'}</h4>
                                        </div>
                                        <div className="px-6 flex flex-col items-center min-w-[120px]">
                                            {featuredMatch.status === 'live' || featuredMatch.status === 'finished' ? 
                                                <div className="text-4xl font-mono font-black text-gray-900 tracking-widest">{featuredMatch.score_a} - {featuredMatch.score_b}</div> : 
                                                <div className="text-3xl font-black text-gray-200 italic">VS</div>
                                            }
                                            <div className="mt-6 flex gap-2 w-full">
                                                <Link href={`/match/${featuredMatch.id}`} className="flex-1 bg-gray-900 hover:bg-gray-800 text-white text-xs font-bold py-2.5 px-3 rounded-lg text-center flex items-center justify-center gap-2 shadow-md transition-all"><Tv size={14} /> Watch</Link>
                                                {isOrganizer && featuredMatch.status !== 'finished' && <Link href={`/match/${featuredMatch.id}/operator`} className="flex-1 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 text-xs font-bold py-2.5 px-3 rounded-lg text-center flex items-center justify-center gap-2 transition-all"><Edit3 size={14} /> Manage</Link>}
                                            </div>
                                        </div>
                                        <div className="flex-1 text-center">
                                            <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto mb-3 flex items-center justify-center text-xl font-bold text-gray-600 border border-gray-200">{featuredMatch.teams_b?.name?.[0] || 'B'}</div>
                                            <h4 className="font-bold text-gray-900 text-lg">{featuredMatch.teams_b?.name || 'TBD'}</h4>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-white rounded-xl p-10 text-center border-2 border-dashed border-gray-200"><Trophy className="mx-auto h-12 w-12 text-gray-300 mb-3" /><p className="text-gray-500 font-medium">No matches scheduled yet.</p></div>
                            )}
                        </div>

                        {/* Recent Results */}
                        {finishedMatches.length > 0 && (
                            <div>
                                <h3 className="font-bold text-gray-400 text-xs uppercase mb-3 mt-8 tracking-wider">Recent Results</h3>
                                <div className="space-y-3">
                                    {finishedMatches.slice(0, 5).map(m => (
                                        <div key={m.id} className="bg-white p-3 rounded-xl border border-gray-200 flex justify-between items-center hover:shadow-md transition-shadow">
                                            <div className="flex items-center gap-4">
                                                <span className="text-gray-400 text-xs font-mono w-16">{new Date(m.date).toLocaleDateString(undefined, {month:'short', day:'numeric'})}</span>
                                                <div className="flex items-center gap-3 text-sm">
                                                    <span className="font-semibold text-gray-900 text-right w-24 truncate">{m.teams_a?.name}</span>
                                                    <span className="bg-gray-100 px-2 py-1 rounded text-gray-700 font-mono font-bold text-xs border border-gray-200">{m.score_a} - {m.score_b}</span>
                                                    <span className="font-semibold text-gray-900 w-24 truncate">{m.teams_b?.name}</span>
                                                </div>
                                            </div>
                                            <Link href={`/match/${m.id}`} className="text-xs text-indigo-600 hover:text-indigo-800 font-bold px-3 py-1 bg-indigo-50 rounded-full hover:bg-indigo-100 transition-colors">Report</Link>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                      </>
                  )}

                  {/* TAB: MATCHES (Schedule & Brackets) */}
                  {activeTab === 'matches' && (
                      <div className="space-y-8">
                          <div className="flex justify-between items-center">
                              <h2 className="text-lg font-bold text-gray-900">Schedule & Results</h2>
                              {isOrganizer && matches.length === 0 && (
                                  <button onClick={handleGenerateSchedule} className="bg-emerald-600 text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 hover:bg-emerald-700 shadow-md transition-colors"><Play size={16}/> Generate Schedule</button>
                              )}
                          </div>

                          {/* Visualization Area */}
                          {matches.length > 0 && (
                              <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm overflow-x-auto">
                                  {tournament.format === 'knockout' ? <KnockoutBracket matches={matches} /> : <LeagueTable matches={matches} teams={teams} />}
                              </div>
                          )}

                          {/* Full Match List */}
                          <div className="grid md:grid-cols-2 gap-4">
                              {matches.length === 0 ? <p className="text-gray-500 italic p-4 text-center w-full">No matches generated yet.</p> : matches.map(m => (
                                  <div key={m.id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between hover:border-indigo-200 transition-colors">
                                      <div className="flex flex-col">
                                          <span className="text-xs font-bold text-gray-400 uppercase mb-1">{new Date(m.date).toLocaleDateString()} • {m.match_time}</span>
                                          <span className="text-xs font-bold text-indigo-600 mb-2 flex items-center gap-1"><MapPin size={10}/> {m.venue_name}</span>
                                          <div className="font-bold text-gray-900 text-sm">{m.teams_a?.name || 'TBD'} <span className="text-gray-400 mx-1 font-normal">vs</span> {m.teams_b?.name || 'TBD'}</div>
                                      </div>
                                      <div className="bg-gray-50 px-3 py-1.5 rounded-lg font-mono font-bold text-gray-700 text-sm border border-gray-100">
                                          {m.score_a} - {m.score_b}
                                      </div>
                                  </div>
                              ))}
                          </div>
                      </div>
                  )}

{/* TAB: FEED */}
                   {activeTab === 'feed' && (
                     <div className="space-y-6">
                        {/* Organizer Post Box */}
                        {isOrganizer && (
                           <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                              <h3 className="text-sm font-bold text-gray-900 mb-3">Post Announcement</h3>
                              <textarea
                                 value={newAnnouncement}
                                 onChange={(e) => setNewAnnouncement(e.target.value)}
                                 placeholder="What's happening in the tournament?"
                                 className="w-full border border-gray-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none mb-3 resize-none h-24 bg-gray-50"
                              />
                              <div className="flex justify-end">
                                 <button 
                                    onClick={handlePostAnnouncement}
                                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-indigo-700 transition-colors"
                                 >
                                    <Send size={14} /> Post
                                 </button>
                              </div>
                           </div>
                        )}

                        {/* Feed Stream */}
                        <div className="space-y-6">
                           {announcements.length === 0 ? (
                              <div className="text-center py-10 text-gray-400 italic">No announcements yet.</div>
                           ) : (
                              announcements.map((post) => (
                                 <div key={post.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                                    {/* Post Header */}
                                    <div className="p-4 flex items-start gap-3">
                                       <div className="w-10 h-10 bg-gray-200 rounded-full overflow-hidden">
                                          {post.profiles?.avatar_url ? (
                                             <img src={post.profiles.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                                          ) : (
                                             <div className="w-full h-full flex items-center justify-center text-gray-500"><Users size={16} /></div>
                                          )}
                                       </div>
                                       <div className="flex-1">
                                          <div className="flex justify-between items-start">
                                             <div>
                                                <h4 className="font-bold text-gray-900 text-sm">{post.profiles?.username || 'Organizer'}</h4>
                                                <span className="text-xs text-gray-400">{new Date(post.created_at).toLocaleDateString()} at {new Date(post.created_at).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                                             </div>
                                             {isOrganizer && (
                                                <button onClick={() => handleDeleteAnnouncement(post.id)} className="text-gray-400 hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
                                             )}
                                          </div>
                                          <div className="mt-3 text-gray-800 text-sm leading-relaxed whitespace-pre-wrap">
                                             {post.content}
                                          </div>
                                       </div>
                                    </div>

                                    {/* Comments Section */}
                                    <div className="bg-gray-50 p-4 border-t border-gray-100">
                                       <h5 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-2">
                                          <MessageSquare size={12} /> Comments ({post.announcement_comments.length})
                                       </h5>
                                       
                                       <div className="space-y-3 mb-4">
                                          {post.announcement_comments.map(comment => (
                                             <div key={comment.id} className="flex gap-2">
                                                <div className="w-6 h-6 bg-gray-200 rounded-full flex-shrink-0 mt-0.5 overflow-hidden">
                                                   {comment.profiles?.avatar_url && <img src={comment.profiles.avatar_url} className="w-full h-full object-cover"/>}
                                                </div>
                                                <div className="bg-white border border-gray-200 rounded-tr-lg rounded-br-lg rounded-bl-lg p-2.5 shadow-sm text-sm">
                                                   <span className="font-bold text-gray-900 mr-2 text-xs">{comment.profiles?.username || 'User'}</span>
                                                   <span className="text-gray-700">{comment.content}</span>
                                                </div>
                                             </div>
                                          ))}
                                       </div>

                                       {/* Comment Input */}
                                       {user && (
                                          <div className="flex gap-2">
                                             <input 
                                                type="text" 
                                                placeholder="Write a comment..." 
                                                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
                                                value={commentInputs[post.id] || ''}
                                                onChange={(e) => setCommentInputs(prev => ({...prev, [post.id]: e.target.value}))}
                                                onKeyDown={(e) => e.key === 'Enter' && handlePostComment(post.id)}
                                             />
                                             <button onClick={() => handlePostComment(post.id)} className="text-indigo-600 hover:bg-indigo-50 p-2 rounded-lg transition-colors">
                                                <Send size={16} />
                                             </button>
                                          </div>
                                       )}
                                    </div>
                                 </div>
                              ))
                           )}
                        </div>
                     </div>
                   )}



                 {/* TAB: TEAMS */}
                  {activeTab === 'teams' && (
                      <div className="grid md:grid-cols-2 gap-4">
                          {teams.map(t => (
                              <div key={t.id} className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between hover:shadow-md transition-all">
                                  {/* Team Info */}
                                  <div className="flex items-center gap-4">
                                      <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center overflow-hidden border border-gray-200">
                                          {t.logo_url ? <img src={t.logo_url} className="w-full h-full object-cover"/> : <Shield className="text-gray-300"/>}
                                      </div>
                                      <div>
                                          <h3 className="font-bold text-gray-900">{t.name}</h3>
                                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wide mt-1 inline-block ${t.status === 'approved' ? 'bg-green-100 text-green-700' : t.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                                              {t.status}
                                          </span>
                                      </div>
                                  </div>

                                  {/* ORGANIZER ACTIONS (Only visible for Pending teams) */}
                                  {isOrganizer && t.status === 'pending' && (
                                      <div className="flex flex-col gap-2">
                                          <button 
                                            onClick={() => handleTeamAction(t.id, 'approved')}
                                            className="bg-green-100 text-green-700 p-2 rounded-lg hover:bg-green-200 transition-colors" 
                                            title="Approve"
                                          >
                                              <CheckCircle size={20} />
                                          </button>
                                          <button 
                                            onClick={() => handleTeamAction(t.id, 'rejected')}
                                            className="bg-red-50 text-red-600 p-2 rounded-lg hover:bg-red-100 transition-colors" 
                                            title="Reject"
                                          >
                                              <X size={20} />
                                          </button>
                                      </div>
                                  )}
                              </div>
                          ))}
                          {teams.length === 0 && <p className="text-gray-500 italic p-4">No teams registered yet.</p>}
                      </div>
                  )}


                    




                  {/* TAB: VENUES (Organizer Only) */}
                  {activeTab === 'venues' && isOrganizer && (
                      <div className="space-y-6">
                          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><Plus size={18}/> Add Venue</h3>
                              <div className="flex gap-2">
                                  <input className="flex-1 border border-gray-300 rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500 transition-all" placeholder="Venue Name (e.g. Court 1)" value={newVenue} onChange={e => setNewVenue(e.target.value)} />
                                  <button onClick={handleAddVenue} className="bg-indigo-600 text-white px-6 py-2.5 rounded-lg font-bold hover:bg-indigo-700 transition-colors shadow-md">Add</button>
                              </div>
                              <p className="text-xs text-gray-500 mt-3 flex items-center gap-1"><CheckCircle size={12} className="text-green-500"/> Venues are used for automatic scheduling.</p>
                          </div>
                          <div className="space-y-3">
                              <h3 className="font-bold text-gray-900 text-sm uppercase tracking-wide">Available Venues</h3>
                              {venues.map(v => (
                                  <div key={v.id} className="bg-white p-4 rounded-xl border border-gray-200 flex justify-between items-center">
                                      <span className="font-bold text-gray-700 flex items-center gap-2"><MapPin size={16} className="text-gray-400"/> {v.name}</span>
                                      <span className="text-xs bg-green-100 text-green-700 font-bold px-2 py-1 rounded">Active</span>
                                  </div>
                              ))}
                              {venues.length === 0 && <p className="text-gray-500 italic">No venues added yet.</p>}
                          </div>
                      </div>
                  )}
               </div>

               {/* === RIGHT SIDEBAR (Sticky) === */}
               <div className="space-y-6">
                  {/* Rules Card */}
                  <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                      <h3 className="font-bold text-gray-900 mb-4">Tournament Info</h3>
                      <ul className="space-y-4 text-sm text-gray-600">
                          <li className="flex items-start gap-3"><div className="min-w-[4px] h-4 bg-indigo-500 rounded-full mt-0.5"></div><span>Format: <span className="font-semibold text-gray-900 capitalize">{tournament.format}</span></span></li>
                          <li className="flex items-start gap-3"><div className="min-w-[4px] h-4 bg-blue-500 rounded-full mt-0.5"></div><span>Sport: <span className="font-semibold text-gray-900 capitalize">{tournament.sport}</span></span></li>
                          <li className="flex items-start gap-3"><div className="min-w-[4px] h-4 bg-emerald-500 rounded-full mt-0.5"></div><span>Max Teams: <span className="font-semibold text-gray-900">{tournament.max_teams || 'Unlimited'}</span></span></li>
                      </ul>
                  </div>

                  {/* Share Card */}
                  <div className="bg-gradient-to-br from-indigo-600 to-blue-600 p-6 rounded-xl shadow-lg text-center text-white relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -mr-10 -mt-10"></div>
                      <div className="relative z-10">
                          <Share2 className="mx-auto w-8 h-8 mb-3 opacity-80" />
                          <h3 className="font-bold text-lg mb-2">Invite Players</h3>
                          <p className="text-xs text-indigo-100 mb-6 px-4">Share this tournament link with team captains to get them registered.</p>
                          <button onClick={() => {navigator.clipboard.writeText(window.location.href); alert("Link Copied!")}} className="bg-white text-indigo-600 px-6 py-2.5 rounded-lg text-sm font-bold hover:bg-indigo-50 transition-colors w-full shadow-sm">Copy Link</button>
                      </div>
                  </div>
               </div>

            </div>
          </div>
       </div>
    </Layout>
  )
}