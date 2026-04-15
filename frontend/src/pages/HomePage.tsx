import { useState, useEffect } from 'react';
import { useGameState } from '../hooks/useGameState';
import { useLiveTimer, formatTime } from '../hooks/useLiveTimer';
import { Link } from 'react-router-dom';
import Avatar from '../components/Avatar';
import { Tag, Pause, Play } from 'lucide-react';

export default function HomePage() {
  const { gameState, players, myPlayerId, pauseGame, resumeGame, loading } = useGameState();
  const [pulse, setPulse] = useState(false);

  const currentIt = players.find((p) => p.id === gameState?.currentItPlayerId);
  const isPaused = gameState?.isPaused ?? false;
  const isMyTurn = myPlayerId === gameState?.currentItPlayerId;

  // Timer: only ticks when active and not paused
  const elapsed = useLiveTimer(
    gameState?.isGameActive && !isPaused ? gameState.itStartTime : null,
    gameState?.accumulatedItMs ?? 0
  );

  const { h, m, s, ms } = formatTime(elapsed);

  useEffect(() => {
    setPulse(true);
    const t = setTimeout(() => setPulse(false), 800);
    return () => clearTimeout(t);
  }, [gameState?.currentItPlayerId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#0a0a0f]">
        <div className="w-8 h-8 border-2 border-[#ff3b3b] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!gameState?.isGameActive) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-[#0a0a0f] px-6 text-center">
        <div className="w-20 h-20 rounded-full bg-[#ff3b3b]/10 border border-[#ff3b3b]/20 flex items-center justify-center mb-6">
          <Tag size={36} className="text-[#ff3b3b]" strokeWidth={1.5} />
        </div>
        <h1 className="font-display text-5xl font-black text-white mb-3 tracking-tight">You're It</h1>
        <p className="text-white/40 text-lg mb-10">No game in progress</p>
        <Link to="/players" className="bg-[#ff3b3b] text-white font-bold px-8 py-4 rounded-2xl text-lg tracking-wide hover:bg-[#ff5555] transition-colors">
          Set Up Game
        </Link>
      </div>
    );
  }

  return (
    <div className={`flex flex-col min-h-screen px-6 py-10 select-none transition-colors duration-700 ${isPaused ? 'bg-[#060b14]' : 'bg-[#0a0a0f]'}`}>

      {/* Paused banner */}
      {isPaused && (
        <div className="bg-[#0d1f3c] border border-[#3b7fff]/30 rounded-2xl px-4 py-3 mb-4 text-center">
          <p className="text-[#7baaff] text-sm font-mono font-bold uppercase tracking-widest">⏸ Game Paused</p>
        </div>
      )}

      <div className="text-center mb-2">
        <p className={`text-xs uppercase tracking-[0.3em] font-mono ${isPaused ? 'text-[#3b7fff]/50' : 'text-white/30'}`}>currently</p>
      </div>

      <div className={`flex flex-col items-center justify-center flex-1 transition-all duration-300 ${pulse ? 'scale-105' : 'scale-100'}`}>
        {/* Avatar */}
        <div className="relative mb-6">
          <div className={`absolute inset-0 rounded-full blur-3xl opacity-20 scale-150 ${isPaused ? 'bg-[#3b7fff]' : 'bg-[#ff3b3b] animate-pulse'}`} />
          <div className={`relative ring-4 rounded-full shadow-lg ${isPaused ? 'ring-[#3b7fff]/40 shadow-[0_0_60px_rgba(59,127,255,0.3)]' : 'ring-[#ff3b3b]/40 shadow-[0_0_60px_rgba(255,59,59,0.3)]'}`}>
            <Avatar name={currentIt?.name ?? '?'} avatarColor={currentIt?.avatarColor ?? '#888'} size="xl" />
          </div>
        </div>

        <h2 className="font-display text-5xl font-black text-white mb-1 tracking-tight">{currentIt?.name ?? 'Unknown'}</h2>
        <div className="flex items-center gap-2 mb-10">
          <div className={`w-2 h-2 rounded-full ${isPaused ? 'bg-[#3b7fff]' : 'bg-[#ff3b3b] animate-pulse'}`} />
          <span className={`text-sm font-mono font-bold uppercase tracking-widest ${isPaused ? 'text-[#3b7fff]' : 'text-[#ff3b3b]'}`}>
            is it
          </span>
        </div>

        {/* Timer */}
        <div className={`border rounded-3xl px-8 py-6 text-center shadow-xl transition-colors duration-700 ${isPaused ? 'bg-[#0d1f3c] border-[#3b7fff]/10' : 'bg-[#111118] border-white/5'}`}>
          <p className={`text-xs font-mono uppercase tracking-widest mb-3 ${isPaused ? 'text-[#3b7fff]/40' : 'text-white/20'}`}>
            {isPaused ? '❄️ frozen' : 'time on the clock'}
          </p>
          <div className="flex items-end gap-1 justify-center">
            {parseInt(h) > 0 && (
              <>
                <span className={`font-mono text-5xl font-black ${isPaused ? 'text-[#7baaff]' : 'text-white'}`}>{h}</span>
                <span className={`font-mono text-2xl mb-1 ${isPaused ? 'text-[#3b7fff]/40' : 'text-white/30'}`}>h</span>
              </>
            )}
            <span className={`font-mono text-5xl font-black ${isPaused ? 'text-[#7baaff]' : 'text-white'}`}>{m}</span>
            <span className={`font-mono text-2xl mb-1 ${isPaused ? 'text-[#3b7fff]/40' : 'text-white/30'}`}>m</span>
            <span className={`font-mono text-5xl font-black ${isPaused ? 'text-[#7baaff]' : 'text-white'}`}>{s}</span>
            <span className={`font-mono text-2xl mb-1 ${isPaused ? 'text-[#3b7fff]/40' : 'text-white/30'}`}>s</span>
            <span className={`font-mono text-3xl font-black ${isPaused ? 'text-[#3b7fff]/60' : 'text-[#ff3b3b]'}`}>.{isPaused ? '--' : ms}</span>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="mt-auto pt-6 flex flex-col gap-3">
        {/* Tag button — only shown to current it person, disabled when paused */}
        {isMyTurn && (
          <Link
            to={isPaused ? '#' : '/tag'}
            onClick={(e) => isPaused && e.preventDefault()}
            className={`flex items-center justify-center gap-3 w-full font-black text-xl py-5 rounded-2xl tracking-wide transition-all ${
              isPaused
                ? 'bg-white/5 text-white/20 cursor-not-allowed'
                : 'bg-[#ff3b3b] text-white hover:bg-[#ff5555] active:scale-95 shadow-[0_0_40px_rgba(255,59,59,0.4)]'
            }`}
          >
            <Tag size={22} strokeWidth={2.5} />
            {isPaused ? 'Tagging disabled while paused' : 'Tag Someone'}
          </Link>
        )}

        {/* Pause / Resume — available to everyone */}
        <button
          onClick={isPaused ? resumeGame : pauseGame}
          className={`flex items-center justify-center gap-3 w-full font-bold text-base py-4 rounded-2xl tracking-wide transition-all active:scale-95 ${
            isPaused
              ? 'bg-[#3b7fff] text-white hover:bg-[#5b8fff] shadow-[0_0_30px_rgba(59,127,255,0.4)]'
              : 'border border-white/10 text-white/50 hover:border-white/20 hover:text-white/70'
          }`}
        >
          {isPaused ? <><Play size={18} strokeWidth={2.5} /> Resume Game</> : <><Pause size={18} strokeWidth={2} /> Pause Game</>}
        </button>

        {!isMyTurn && !isPaused && (
          <p className="text-center text-white/20 text-xs font-mono">
            Only {currentIt?.name} can tag someone
          </p>
        )}
      </div>
    </div>
  );
}