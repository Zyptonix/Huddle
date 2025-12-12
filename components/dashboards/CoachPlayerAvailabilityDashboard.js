import React, { useState, useEffect } from 'react';
import { Users, UserCheck, UserX, Search, RefreshCw, Trophy, UserPlus, Shield, AlertCircle } from 'lucide-react';

export default function CoachPlayerAvailabilityDashboard() {
  const [availablePlayers, setAvailablePlayers] = useState([]);
  const [unavailablePlayers, setUnavailablePlayers] = useState([]);
  const [myTeams, setMyTeams] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sportFilter, setSportFilter] = useState('');
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [message, setMessage] = useState(null);
  const [accessDenied, setAccessDenied] = useState(false);

  useEffect(() => {
    checkAccessAndFetchData();
  }, []);

  useEffect(() => {
    if (currentUser && !accessDenied) {
      fetchPlayers();
    }
  }, [sportFilter, currentUser, accessDenied]);

  const checkAccessAndFetchData = async () => {
    setLoading(true);
    try {
      // Check current user's role
      const userRes = await fetch('/api/players/availability');
      const userData = await userRes.json();
      
      setCurrentUser(userData.player);

      // Only coaches can access this page
      if (userData.player.role !== 'coach') {
        setAccessDenied(true);
        setLoading(false);
        return;
      }

      // Fetch coach's teams
      const teamsRes = await fetch('/api/teams/created');
      const teamsData = await teamsRes.json();
      setMyTeams(teamsData);

      // Select first team by default
      if (teamsData.length > 0) {
        setSelectedTeam(teamsData[0].id);
      }

      await fetchPlayers();
    } catch (error) {
      console.error('Error checking access:', error);
      showMessage('Error loading data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchPlayers = async () => {
    try {
      const playersUrl = sportFilter 
        ? `/api/players/available-players?sport=${sportFilter}`
        : '/api/players/available-players';
      const playersRes = await fetch(playersUrl);
      const playersData = await playersRes.json();
      
      setAvailablePlayers(playersData.available || []);
      setUnavailablePlayers(playersData.unavailable || []);
    } catch (error) {
      console.error('Error fetching players:', error);
      showMessage('Error loading players', 'error');
    }
  };

  const handleAddPlayerToTeam = async (playerId) => {
    if (!selectedTeam) {
      showMessage('Please select a team first', 'error');
      return;
    }

    try {
      // Get the team's join code
      const team = myTeams.find(t => t.id === selectedTeam);
      if (!team) {
        showMessage('Team not found', 'error');
        return;
      }

      const player = availablePlayers.find(p => p.id === playerId);
      
      // Send invitation notification to player
      const invitationRes = await fetch('/api/teams/invite-player', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerId: playerId,
          teamId: selectedTeam,
          teamName: team.name,
          joinCode: team.join_code,
          coachName: currentUser.username
        })
      });

      // Check if response is JSON
      const contentType = invitationRes.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await invitationRes.text();
        console.error('Non-JSON response:', text);
        showMessage('Server error - check console for details', 'error');
        return;
      }

      const data = await invitationRes.json();

      if (invitationRes.ok) {
        showMessage(`Invitation message sent to ${player.username}! They will receive it in their messages.`, 'success');
        // Don't show the modal anymore since we're sending a message
      } else {
        showMessage(data.error || 'Failed to send invitation', 'error');
      }
      
    } catch (error) {
      console.error('Error sending invitation:', error);
      showMessage(`Error: ${error.message}`, 'error');
    }
  };

  const showMessage = (text, type) => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 4000);
  };

  const filteredAvailable = availablePlayers.filter(player =>
    player.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredUnavailable = unavailablePlayers.filter(player =>
    player.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    total: availablePlayers.length + unavailablePlayers.length,
    available: availablePlayers.length,
    unavailable: unavailablePlayers.length
  };

  // Access Denied Screen
  if (accessDenied) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md text-center">
          <AlertCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Access Denied</h1>
          <p className="text-gray-600 mb-4">
            This page is only accessible to coaches. Players cannot view this dashboard.
          </p>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-left">
            <p className="text-sm text-red-800 font-semibold mb-1">Your Role: Player</p>
            <p className="text-xs text-red-600">You need coach privileges to access the player availability system.</p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 text-indigo-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading player data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-4xl font-bold text-gray-800 flex items-center gap-3">
              <Shield className="w-10 h-10 text-indigo-600" />
              Coach Dashboard
            </h1>
            <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg shadow">
              <Users className="w-5 h-5 text-indigo-600" />
              <span className="font-semibold text-gray-800">{currentUser?.username}</span>
              <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full">Coach</span>
            </div>
          </div>
          <p className="text-gray-600">Recruit available players to your teams</p>
        </div>

        {/* Message Banner */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {message.text}
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Total Players</p>
                <p className="text-3xl font-bold text-gray-800">{stats.total}</p>
              </div>
              <Users className="w-12 h-12 text-blue-500 opacity-20" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Available for Recruitment</p>
                <p className="text-3xl font-bold text-green-600">{stats.available}</p>
              </div>
              <UserCheck className="w-12 h-12 text-green-500 opacity-20" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Already in Teams</p>
                <p className="text-3xl font-bold text-red-600">{stats.unavailable}</p>
              </div>
              <UserX className="w-12 h-12 text-red-500 opacity-20" />
            </div>
          </div>
        </div>

        {/* Team Selection & Filters */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Select Your Team</h3>
          <div className="flex flex-col md:flex-row gap-4">
            <select
              value={selectedTeam || ''}
              onChange={(e) => setSelectedTeam(e.target.value)}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-indigo-50 text-gray-800"
            >
              <option value="">Select a team to add players...</option>
              {myTeams.map((team) => (
                <option key={team.id} value={team.id}>
                  {team.name} - {team.sport}
                </option>
              ))}
            </select>
          </div>
          {myTeams.length === 0 && (
            <p className="text-amber-600 text-sm mt-2">You haven't created any teams yet. Create a team first to recruit players.</p>
          )}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-800 w-5 h-5" />
              <input
                type="text"
                placeholder="Search players..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-800"
              />
            </div>
            <select
              value={sportFilter}
              onChange={(e) => setSportFilter(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-800"
            >
              <option value="">All Sports</option>
              <option value="football">Football</option>
              <option value="basketball">Basketball</option>
              <option value="cricket">Cricket</option>
              <option value="volleyball">Volleyball</option>
            </select>
            <button
              onClick={fetchPlayers}
              className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
            >
              <RefreshCw className="w-5 h-5" />
              Refresh
            </button>
          </div>
        </div>

        {/* Available Players */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <UserCheck className="w-6 h-6 text-green-600" />
            Available Players ({filteredAvailable.length})
          </h2>
          <p className="text-gray-600 mb-4">These players are not part of any team and can be recruited</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAvailable.map((player) => (
              <div key={player.id} className="bg-green-50 border-2 border-green-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 mb-3">
                  {player.avatar_url ? (
                    <img src={player.avatar_url} alt={player.username} className="w-12 h-12 rounded-full" />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-green-200 flex items-center justify-center">
                      <Users className="w-6 h-6 text-green-700" />
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="font-semibold text-gray-800">{player.username}</p>
                    <p className="text-sm text-gray-500">Height: {player.height || 'N/A'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm mb-3">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  <span className="text-green-700 font-medium">Available</span>
                </div>
                <button
                  onClick={() => handleAddPlayerToTeam(player.id)}
                  disabled={!selectedTeam}
                  className={`w-full py-2 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2 ${
                    selectedTeam
                      ? 'bg-green-600 text-white hover:bg-green-700'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  <UserPlus className="w-4 h-4" />
                  Invite to Team
                </button>
              </div>
            ))}
            {filteredAvailable.length === 0 && (
              <div className="col-span-full text-center py-8 text-gray-500">
                No available players found
              </div>
            )}
          </div>
        </div>

        {/* Unavailable Players */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <UserX className="w-6 h-6 text-red-600" />
            Unavailable Players ({filteredUnavailable.length})
          </h2>
          <p className="text-gray-600 mb-4">These players are already part of other teams and cannot be recruited</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredUnavailable.map((player) => (
              <div key={player.id} className="bg-red-50 border-2 border-red-200 rounded-lg p-4 opacity-75">
                <div className="flex items-center gap-3 mb-3">
                  {player.avatar_url ? (
                    <img src={player.avatar_url} alt={player.username} className="w-12 h-12 rounded-full grayscale" />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-red-200 flex items-center justify-center">
                      <Users className="w-6 h-6 text-red-700" />
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="font-semibold text-gray-800">{player.username}</p>
                    <p className="text-sm text-gray-500">Height: {player.height || 'N/A'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm mb-2">
                  <div className="w-2 h-2 rounded-full bg-red-500"></div>
                  <span className="text-red-700 font-medium">Already in team</span>
                </div>
                {player.sports && player.sports.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {player.sports.map((sport, idx) => (
                      <span key={idx} className="px-2 py-1 bg-red-200 text-red-800 text-xs rounded-full">
                        {sport}
                      </span>
                    ))}
                  </div>
                )}
                <button
                  disabled
                  className="w-full py-2 rounded-lg font-semibold bg-gray-300 text-gray-500 cursor-not-allowed"
                >
                  Cannot Add
                </button>
              </div>
            ))}
            {filteredUnavailable.length === 0 && (
              <div className="col-span-full text-center py-8 text-gray-500">
                No unavailable players found
              </div>
            )}
          </div>
        </div>

        {/* Add Player Modal */}
        {selectedPlayer && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl p-6 max-w-md w-full">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Invite Player to Team</h3>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-gray-700 mb-2">
                  Share this join code with <strong>{selectedPlayer.username}</strong>:
                </p>
                <div className="bg-white border-2 border-blue-400 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-blue-600 tracking-wider">{selectedPlayer.joinCode}</p>
                </div>
                <p className="text-xs text-gray-600 mt-2">
                  Team: <strong>{selectedPlayer.teamName}</strong>
                </p>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                The player needs to use this code to join your team. You can share it via message, email, or in person.
              </p>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(selectedPlayer.joinCode);
                  showMessage('Join code copied to clipboard!', 'success');
                }}
                className="w-full mb-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Copy Join Code
              </button>
              <button
                onClick={() => setSelectedPlayer(null)}
                className="w-full px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}