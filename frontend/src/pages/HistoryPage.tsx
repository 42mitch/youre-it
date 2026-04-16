import { useState } from 'react';
import { useGameState } from '../hooks/useGameState';
import { formatTotalTime } from '../hooks/useLiveTimer';
import { ArchivedGame } from '../types';
import Avatar from '../components/Avatar';
import { RankBadge } from './LeaderboardPage';
import { ChevronDown, ChevronUp, Skull, Pause, Play, Tag, Flag, Scale } from 'lucide-react';

function HistoryEventRow({ event }: { event: any }) {
  const time = new Date(event.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  let icon: React.ReactNode;
  let label = '';

  if (event.type === 'tag') {
    icon = <Tag size={11} className="text-white/30 flex-shrink-0 mt-0.5" />;
    label = `${event.taggerName} → ${event.taggedName}`;
  } else if (event.type === 'pause') {
    icon = <Pause size={11} className="text-[#7baaff] flex-shrink-0 mt-0.5" />;
    label = `Paused by ${event.actorName}`;
  } else if (event.type === 'resume') {
    icon = <Play size={11} className="text-green-400 flex-shrink-0 mt-0.5" />;
    label = `Resumed by ${event.actorName}`;
  } else if (event.type === 'adjustment') {
    const ms = event.adjustmentMs ?? 0;
    const sign = ms > 0 ? '+' : '-';
    icon = <Scale size={11} className="text-amber-400 flex-shrink-0 mt-0.5" />;
    label = `${event.actorName} adjusted ${event.playerName}: ${sign}${formatTotalTime(Math.abs(ms))}`;
  } else if (event.type === 'start') {
    icon = <Flag size={11} className="text-green-400 flex-shrink-0 mt-0.5" />;
    label = `Game started — ${event.taggedName} first it`;
  } else if (event.type === 'end') {
    icon = <Flag size={11} className="text-white/20 flex-shrink-0 mt-0.5" />;
    label = 'Game ended';
  }

  return (
    <div className="flex items-start justify-between gap-3 py-1">
      <div className="flex items-start gap-1.5 min-w-0">
        {icon}
        <span className="text-white/50 text-xs truncate">{label}</span>
      </div>
      <span className="text-white/20 text-xs font-mono flex-shrink-0">{time}</span>
    </div>
  );
}

function GameCard({ game }: { game: ArchivedGame }) {
  const [expanded, setExpanded] = useState(false);
  const start = new Date(game.startTime);
  const end = new Date(game.endTime);
  const duration = game.endTime - game.startTime;
  const victim = game.finalStandings[0];

  const formatDate = (d: Date) =>
    d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <div className="bg-[#111118] border border-white/5 rounded-2xl overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-4 p-4 hover:bg-white/[0.02] transition-colors text-left"
      >
        <div className="flex-1 min-w-0">
          <p className="text-white/30 text-xs font-mono mb-1">
            {formatDate(start)} → {formatDate(end)}
          </p>
          <div className="flex items-center gap-2">
            <Skull size={14} className="text-[#ff3b3b] flex-shrink-0" strokeWidth={1.5} />
            <span className="text-white font-bold truncate">
              {victim?.name ?? '?'}
              <span className="text-white/40 font-normal"> — most time</span>
            </span>
          </div>
          <p className="text-white/20 text-xs font-mono mt-0.5">
            {formatTotalTime(duration)} total duration
          </p>
        </div>
        {expanded
          ? <ChevronUp size={15} className="text-white/20 flex-shrink-0" />
          : <ChevronDown size={15} className="text-white/20 flex-shrink-0" />}
      </button>

      {expanded && (
        <div className="border-t border-white/5 p-4">
          {/* Final standings */}
          <h3 className="text-white/30 text-xs font-mono uppercase tracking-widest mb-3">Final Standings</h3>
          <div className="flex flex-col gap-3 mb-6">
            {game.finalStandings.map((p, i) => (
              <div key={p.playerId} className="flex items-center gap-3">
                <RankBadge rank={i + 1} />
                <Avatar name={p.name} avatarColor={p.avatarColor} size="sm" />
                <span className="text-white text-sm font-bold flex-1 truncate">{p.name}</span>
                <span className="text-white/50 text-sm font-mono">{formatTotalTime(p.totalTimeMs)}</span>
              </div>
            ))}
          </div>

          {/* Event log */}
          <h3 className="text-white/30 text-xs font-mono uppercase tracking-widest mb-2">Event Log</h3>
          <div className="flex flex-col divide-y divide-white/[0.04] max-h-64 overflow-y-auto">
            {[...game.events].reverse().map((event, i) => (
              <HistoryEventRow key={i} event={event} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function HistoryPage() {
  const { archivedGames } = useGameState();

  return (
    <div className="w-full bg-[#0a0a0f] px-6 py-10">
      <div className="mb-8">
        <h1 className="font-display text-4xl font-black text-white tracking-tight">Hall of Records</h1>
        <p className="text-white/30 mt-1 text-sm">Every game, every tag, every punishment.</p>
      </div>

      {archivedGames.length === 0 ? (
        <div className="flex flex-col items-center justify-center mt-24 text-center">
          <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
            <Skull size={28} className="text-white/20" strokeWidth={1.5} />
          </div>
          <p className="text-white/30">No completed games yet.</p>
          <p className="text-white/20 text-sm mt-1">Finished games will appear here.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {archivedGames.map((game) => (
            <GameCard key={game.id} game={game} />
          ))}
        </div>
      )}
    </div>
  );
}