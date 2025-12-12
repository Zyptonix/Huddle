import Link from 'next/link';
import { Calendar, Clock, MapPin, Edit3, ChevronRight, Trophy } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function MatchSchedule({ matches, isOrganizer }) {
  const { user } = useAuth();

  // Helper: Split date for the visual calendar box
  const getDateParts = (dateString) => {
    if (!dateString) return { month: 'TBD', day: '--', time: '--:--' };
    const date = new Date(dateString);
    return {
      month: date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase(),
      day: date.toLocaleDateString('en-US', { day: 'numeric' }),
      time: date.toLocaleDateString('en-US', { hour: '2-digit', minute: '2-digit' }),
      weekday: date.toLocaleDateString('en-US', { weekday: 'short' })
    };
  };

  // Helper: Status Badge Styling
  const getStatusBadge = (status) => {
    switch (status) {
      case 'live':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-50 border border-red-100 text-red-600 text-[10px] font-bold uppercase tracking-wider animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-red-600"></span> Live
          </span>
        );
      case 'finished':
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-gray-100 border border-gray-200 text-gray-500 text-[10px] font-bold uppercase tracking-wider">
            FT
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 text-[10px] font-bold uppercase tracking-wider">
            Upcoming
          </span>
        );
    }
  };

  if (matches.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-white border border-gray-200 border-dashed rounded-xl text-gray-400">
        <Calendar className="w-12 h-12 mb-3 opacity-20" />
        <p className="font-medium">No matches scheduled.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {matches.map((match) => {
        const { month, day, time, weekday } = getDateParts(match.match_time);
        
        return (
          <div 
            key={match.id} 
            className="group relative bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md hover:border-indigo-200 transition-all duration-300 overflow-hidden"
          >
            {/* --- 1. FULL CARD LINK (The Clickable Layer) --- */}
            <Link href={`/match/${match.id}`} className="absolute inset-0 z-0">
              <span className="sr-only">View Match</span>
            </Link>

            <div className="flex flex-col md:flex-row items-stretch">
              
              {/* --- 2. DATE COLUMN (Left) --- */}
              <div className="flex md:flex-col items-center justify-between md:justify-center p-4 bg-gray-50 border-b md:border-b-0 md:border-r border-gray-100 md:w-24 text-center">
                 <div className="flex items-center gap-2 md:block">
                    <span className="text-xs font-bold text-gray-400 uppercase block tracking-wider">{month}</span>
                    <span className="text-2xl font-black text-gray-800 block leading-none md:mt-1">{day}</span>
                 </div>
                 <div className="flex items-center gap-2 md:block md:mt-2">
                    <span className="text-xs font-medium text-indigo-600 block">{weekday}</span>
                    <span className="text-xs text-gray-500 block">{time}</span>
                 </div>
              </div>

              {/* --- 3. MATCH INFO (Center) --- */}
              <div className="flex-1 p-4 md:p-6 flex flex-col justify-center relative z-10 pointer-events-none"> 
                {/* pointer-events-none on container allows clicks to pass through to the Link behind it, 
                    but we re-enable pointer-events on buttons */}
                
                {/* Status & Venue Top Bar */}
                <div className="flex justify-between items-center mb-4">
                   {getStatusBadge(match.status)}
                   <div className="flex items-center gap-1 text-[10px] font-bold text-gray-400 uppercase tracking-wide">
                      <MapPin size={12} /> {match.venue || 'Main Stadium'}
                   </div>
                </div>

                {/* Teams Row */}
                <div className="flex items-center justify-between gap-4">
                   
                   {/* Team A */}
                   <div className="flex-1 flex items-center justify-end gap-3 text-right">
                      <span className="font-bold text-gray-900 text-sm md:text-lg leading-tight">
                        {match.team_a?.name || 'TBD'}
                      </span>
                      <div className="w-10 h-10 md:w-12 md:h-12 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center font-bold text-sm shadow-inner border border-indigo-100 flex-shrink-0">
                         {match.team_a?.name?.[0] || 'A'}
                      </div>
                   </div>

                   {/* VS / Score */}
                   <div className="flex flex-col items-center justify-center min-w-[60px] md:min-w-[80px]">
                      {match.status === 'scheduled' ? (
                        <span className="text-2xl font-black text-gray-200 italic">VS</span>
                      ) : (
                        <div className="bg-gray-900 text-white px-3 py-1 rounded-lg font-mono font-bold text-lg md:text-xl shadow-sm tracking-widest">
                           {match.score_a}-{match.score_b}
                        </div>
                      )}
                   </div>

                   {/* Team B */}
                   <div className="flex-1 flex items-center justify-start gap-3 text-left">
                      <div className="w-10 h-10 md:w-12 md:h-12 bg-gray-100 text-gray-600 rounded-full flex items-center justify-center font-bold text-sm shadow-inner border border-gray-200 flex-shrink-0">
                         {match.team_b?.name?.[0] || 'B'}
                      </div>
                      <span className="font-bold text-gray-900 text-sm md:text-lg leading-tight">
                        {match.team_b?.name || 'TBD'}
                      </span>
                   </div>

                </div>
              </div>

              {/* --- 4. ACTION COLUMN (Right) --- */}
              <div className="flex md:flex-col items-center justify-center p-4 border-t md:border-t-0 md:border-l border-gray-100 md:w-32 bg-white gap-2 relative z-20">
                 {/* Z-20 and pointer-events-auto ensures these buttons work independently of the card link */}
                 
                 {/* Hover Chevron (Visual hint) */}
                 <div className="hidden md:block absolute right-4 text-gray-300 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all duration-300">
                    <ChevronRight size={24} />
                 </div>

                 {/* Organizer Manage Button */}
                 {isOrganizer && (
                    <Link 
                      href={`/match/${match.id}/operator`}
                      className="pointer-events-auto w-full md:w-auto px-4 py-2 bg-white border border-gray-200 hover:border-indigo-300 hover:text-indigo-600 text-gray-600 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-sm z-30"
                    >
                       <Edit3 size={14} /> Manage
                    </Link>
                 )}
              </div>

            </div>
          </div>
        );
      })}
    </div>
  );
}