import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameState } from '../hooks/useGameState';
import { Player } from '../types';
import Avatar from '../components/Avatar';
import { ArrowLeft, Tag, ShieldOff, Check } from 'lucide-react';

export default function TagPage() {
  const { gameState, players, myPlayerId, transferTag } = useGameState();
  const [selected, setSelected] = useState<Player | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const currentIt = players.find((p) => p.id === gameState?.currentItPlayerId);
  const protectedId = gameState?.lastTaggedPlayerId;
  const taggablePlayers = players.filter((p) => p.id !== gameState?.currentItPlayerId);

  // Guard: only current it person can tag
  if (gameState?.isGameActive && myPlayerId !== gameState?.currentItPlayerId) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-[#0a0a0f] px-6 text-center">
        <Tag size={40} className="text-white/10 mb-4" strokeWidth={1} />
        <p className="text-white/40 text-lg">Only <span className="text-white font-bold">{currentIt?.name}</span> can tag right now</p>
      </div>
    );
  }

  if (!gameState?.isGameActive || gameState.isPaused) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-[#0a0a0f] px-6 text-center">
        <p className="text-white/40 text-lg">{gameState?.isPaused ? 'Game is paused' : 'No game in progress'}</p>
      </div>
    );
  }

  const handleSelect = (player: Player) => {
    if (player.id === protectedId) return;
    setSelected(player);
    setConfirming(true);
  };

  const handleConfirm = async () => {
    if (!selected || !gameState?.currentItPlayerId) return;
    setLoading(true);
    await transferTag(gameState.currentItPlayerId, selected.id);
    setLoading(false);
    navigate('/');
  };

  return (
    <div className="w-full bg-[#0a0a0f] px-6 py-10">
      <div className="mb-8">
        <button onClick={() => navigate('/')} className="text-white/30 text-sm font-mono mb-4 flex items-center gap-2 hover:text-white/60 transition-colors">
          <ArrowLeft size={14} /> back
        </button>
        <h1 className="font-display text-4xl font-black text-white tracking-tight">Tag Someone</h1>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-white/40">You are</span>
          <Avatar name={currentIt?.name ?? '?'} avatarColor={currentIt?.avatarColor ?? '#888'} size="sm" />
          <span className="text-[#ff3b3b] font-bold">{currentIt?.name}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-8">
        {taggablePlayers.map((player) => {
          const isProtected = player.id === protectedId;
          const isSelected = selected?.id === player.id;
          return (
            <button
              key={player.id}
              onClick={() => handleSelect(player)}
              disabled={isProtected}
              className={`relative flex flex-col items-center justify-center p-5 rounded-2xl border-2 transition-all gap-3
                ${isSelected ? 'border-[#ff3b3b] bg-[#ff3b3b]/10 shadow-[0_0_30px_rgba(255,59,59,0.3)]'
                  : isProtected ? 'border-white/5 bg-[#111118] opacity-40 cursor-not-allowed'
                  : 'border-white/10 bg-[#111118] hover:border-white/30 active:scale-95'}`}
            >
              <div className="relative">
                <Avatar name={player.name} avatarColor={player.avatarColor} size="lg" />
                {isProtected && (
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-[#1a1a24] rounded-full flex items-center justify-center">
                    <ShieldOff size={11} className="text-white/40" />
                  </div>
                )}
                {isSelected && (
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-[#ff3b3b] rounded-full flex items-center justify-center">
                    <Check size={11} className="text-white" strokeWidth={3} />
                  </div>
                )}
              </div>
              <span className="text-white font-bold text-sm">{player.name}</span>
              {isProtected && <span className="text-white/30 text-xs font-mono -mt-2">no tag-backs</span>}
            </button>
          );
        })}
      </div>

      {confirming && selected && (
        <div className="fixed inset-x-0 bottom-0 bg-[#111118] border-t border-white/10 p-6 pb-24 rounded-t-3xl shadow-2xl">
          <p className="text-white/40 text-sm text-center mb-3 font-mono">confirm tag</p>
          <div className="flex items-center justify-center gap-3 mb-6">
            <Avatar name={selected.name} avatarColor={selected.avatarColor} size="md" />
            <p className="text-white text-2xl font-black">{selected.name}?</p>
          </div>
          <div className="flex gap-3">
            <button onClick={() => { setConfirming(false); setSelected(null); }} className="flex-1 py-4 rounded-2xl border border-white/10 text-white/50 font-bold hover:border-white/20 transition-colors">
              Cancel
            </button>
            <button onClick={handleConfirm} disabled={loading} className="flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl bg-[#ff3b3b] text-white font-black text-lg hover:bg-[#ff5555] active:scale-95 transition-all disabled:opacity-50">
              {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><Tag size={18} strokeWidth={2.5} /> Tag!</>}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}