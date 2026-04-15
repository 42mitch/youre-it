import { useState, useEffect } from 'react';
import { useGameState } from '../hooks/useGameState';
import { useLiveTimer, formatTotalTime } from '../hooks/useLiveTimer';
import { Player, GameEvent } from '../types';
import Avatar from '../components/Avatar';
import { Pause, Play, Tag, Flag, Scale, ArrowRightLeft } from 'lucide-react';

// Shared rank badge — used on both leaderboard and history pages
export function RankBadge({ rank }: { rank: number }) {
  const styles: Record<number, string> = {
    1: 'text-amber-400 font-black',
    2: 'text-slate-300 font-black',
    3: 'text-amber-700 font-black',
  };
  return (
    <span className={`font-mono text-base w-7 text-center flex-shrink-0 ${styles[rank] ?? 'text-white/20 font-bold'}`}>
      {rank}
    </span>
  );
}

function LeaderboardRow({ player, rank, isIt, itStartTime, accumulatedItMs, isPaused }: {
  player: Player; rank: number; isIt: boolean;
  itStartTime: number | null; accumulatedItMs: number; isPaused: boolean;
}) {
  const liveExtra = useLiveTimer(isIt && !isPaused ? itStartTime : null, isIt ? accumulatedItMs : 0);
  const total = player.totalTimeMs + (isIt ? liveExtra : 0);

  return (
    <div className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${
      isIt && !isPaused ? 'border-[#ff3b3b]/40 bg-[#ff3b3b]/5 shadow-[0_0_20px_rgba(255,59,59,0.1)]'
      : isIt && isPaused ? 'border-[#3b7fff]/30 bg-[#3b7fff]/5'
      : 'border-white/5 bg-[#111118]'}`}
    >
      <RankBadge rank={rank} />
      <Avatar name={player.name} avatarColor={player.avatarColor} size="md" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-white font-bold truncate">{player.name}</span>
          {isIt && (
            <span className={`text-xs font-mono font-bold uppercase tracking-widest flex-shrink-0 ${isPaused ? 'text-[#3b7fff]' : 'text-[#ff3b3b] animate-pulse'}`}>
              {isPaused ? '⏸ it' : 'it'}
            </span>
          )}
        </div>
        <span className="text-white/30 text-xs font-mono">tagged {player.tagCount}x</span>
      </div>
      <span className={`font-mono font-bold text-lg flex-shrink-0 ${isIt && !isPaused ? 'text-[#ff3b3b]' : isIt ? 'text-[#7baaff]' : 'text-white'}`}>
        {formatTotalTime(total)}
      </span>
    </div>
  );
}

function EventRow({ event }: { event: GameEvent }) {
  const time = new Date(event.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  let icon: React.ReactNode;
  let label: React.ReactNode;

  if (event.type === 'tag') {
    icon = <Tag size={13} className="text-white/40 flex-shrink-0 mt-0.5" />;
    label = <><span className="text-white font-bold">{event.taggerName}</span>{' → '}<span className="text-[#ff3b3b] font-bold">{event.taggedName}</span></>;
  } else if (event.type === 'pause') {
    icon = <Pause size={13} className="text-[#7baaff] flex-shrink-0 mt-0.5" />;
    label = <><span className="text-[#7baaff] font-bold">Paused</span>{' by '}<span className="text-white font-bold">{event.actorName}</span></>;
  } else if (event.type === 'resume') {
    icon = <Play size={13} className="text-green-400 flex-shrink-0 mt-0.5" />;
    label = <><span className="text-green-400 font-bold">Resumed</span>{' by '}<span className="text-white font-bold">{event.actorName}</span></>;
  } else if (event.type === 'adjustment') {
    const ms = event.adjustmentMs ?? 0;
    const isAdd = ms > 0;
    const sign = isAdd ? '+' : '-';
    const color = isAdd ? 'text-[#ff3b3b]' : 'text-green-400';
    icon = <Scale size={13} className="text-amber-400 flex-shrink-0 mt-0.5" />;
    label = (
      <>
        <span className="text-amber-400 font-bold">Adjusted</span>
        {' '}<span className="text-white font-bold">{event.playerName}</span>
        {' '}<span className={`font-bold ${color}`}>{sign}{formatTotalTime(Math.abs(ms))}</span>
        {' by '}<span className="text-white/70">{event.actorName}</span>
      </>
    );
  } else if (event.type === 'start') {
    icon = <Flag size={13} className="text-green-400 flex-shrink-0 mt-0.5" />;
    label = <><span className="text-green-400 font-bold">Game started</span>{' — '}<span className="text-white font-bold">{event.taggedName}</span>{' is first it'}</>;
  } else if (event.type === 'end') {
    icon = <Flag size={13} className="text-white/30 flex-shrink-0 mt-0.5" />;
    label = <span className="text-white/40 font-bold">Game ended</span>;
  } else {
    icon = <ArrowRightLeft size={13} className="text-white/20 flex-shrink-0 mt-0.5" />;
    label = null;
  }

  return (
    <div className="bg-[#111118] border border-white/5 rounded-xl px-4 py-3 flex items-center justify-between gap-4">
      <div className="flex items-start gap-2 min-w-0">
        {icon}
        <div className="min-w-0">
          <span className="text-white/70 text-sm">{label}</span>
          {event.type === 'tag' && event.durationMs && (
            <p className="text-white/20 text-xs font-mono mt-0.5">{formatTotalTime(event.durationMs)} as it</p>
          )}
        </div>
      </div>
      <span className="text-white/20 text-xs font-mono flex-shrink-0">{time}</span>
    </div>
  );
}

export default function LeaderboardPage() {
  const { players, gameState, gameEvents } = useGameState();
  const [, setTick] = useState(0);

  useEffect(() => {
    if (!gameState?.isGameActive || gameState.isPaused) return;
    const interval = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(interval);
  }, [gameState?.isGameActive, gameState?.isPaused]);

  const sorted = [...players].sort((a, b) => {
    const now = Date.now();
    const aExtra = a.id === gameState?.currentItPlayerId && !gameState?.isPaused
      ? (gameState.accumulatedItMs ?? 0) + (now - (gameState.itStartTime ?? now))
      : a.id === gameState?.currentItPlayerId ? (gameState?.accumulatedItMs ?? 0) : 0;
    const bExtra = b.id === gameState?.currentItPlayerId && !gameState?.isPaused
      ? (gameState.accumulatedItMs ?? 0) + (now - (gameState.itStartTime ?? now))
      : b.id === gameState?.currentItPlayerId ? (gameState?.accumulatedItMs ?? 0) : 0;
    return (b.totalTimeMs + bExtra) - (a.totalTimeMs + aExtra);
  });

  return (
    <div className="min-h-screen bg-[#0a0a0f] px-6 py-10">
      <div className="mb-8">
        <h1 className="font-display text-4xl font-black text-white tracking-tight">Leaderboard</h1>
        <p className="text-white/30 mt-1 text-sm">Most time = most punished.</p>
      </div>

      {players.length === 0 ? (
        <p className="text-white/30 text-center mt-20">No players yet</p>
      ) : (
        <div className="flex flex-col gap-3 mb-10">
          {sorted.map((player, i) => (
            <LeaderboardRow
              key={player.id}
              player={player}
              rank={i + 1}
              isIt={player.id === gameState?.currentItPlayerId}
              itStartTime={gameState?.itStartTime ?? null}
              accumulatedItMs={gameState?.accumulatedItMs ?? 0}
              isPaused={gameState?.isPaused ?? false}
            />
          ))}
        </div>
      )}

      {gameEvents.length > 0 && (
        <div>
          <h2 className="text-white/40 text-xs font-mono uppercase tracking-widest mb-4">Event Log</h2>
          <div className="flex flex-col gap-2">
            {gameEvents.slice(0, 30).map((event) => (
              <EventRow key={event.id} event={event} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}