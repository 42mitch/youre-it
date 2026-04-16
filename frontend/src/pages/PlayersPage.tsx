import { useState } from 'react';
import { useGameState } from '../hooks/useGameState';
import { useNotifications } from '../hooks/useNotifications';
import Avatar from '../components/Avatar';
import { getAvatarColor } from '../components/Avatar';
import { UserPlus, Trash2, Bell, BellOff, Play, Square, Plus, Minus } from 'lucide-react';

export default function PlayersPage() {
  const { players, gameState, myPlayerId, addPlayer, removePlayer, claimPlayer, startGame, endGame, adjustTime, saveFcmToken } = useGameState();
  const { permission, requestPermission } = useNotifications();

  const [name, setName] = useState('');
  const [adding, setAdding] = useState(false);
  const [startingPlayer, setStartingPlayer] = useState('');
  const [adjustingId, setAdjustingId] = useState<string | null>(null);
  const [adjustMinutes, setAdjustMinutes] = useState('');

  const previewColor = getAvatarColor(name || 'A');
  const allClaimed = players.length >= 2 && players.every((p) => p.claimedByDevice);
  const canStart = !!startingPlayer && allClaimed;

  const handleAddPlayer = async () => {
    if (!name.trim()) return;
    const playerName = name.trim();
    setName('');        // clear input immediately
    setAdding(false);   // never show spinner at all
    addPlayer(playerName); // fire and forget — Firestore listener will update UI
  };

  const handleSetupNotifications = async () => {
    if (!myPlayerId) return alert('Claim yourself as a player first');
    const token = await requestPermission();
    if (token) {
      await saveFcmToken(myPlayerId, token);
      alert('Notifications enabled!');
    } else {
      alert('Notification permission denied or not supported.');
    }
  };

  const handleAdjust = async (playerId: string, sign: 1 | -1) => {
    const mins = parseFloat(adjustMinutes);
    if (isNaN(mins) || mins <= 0) return;
    await adjustTime(playerId, sign * mins * 60 * 1000);
    setAdjustingId(null);
    setAdjustMinutes('');
  };

  return (
    <div className="w-full bg-[#0a0a0f] px-6 py-10">
      <h1 className="font-display text-4xl font-black text-white tracking-tight mb-8">Players</h1>

      {/* Add player — only when game not active */}
      {!gameState?.isGameActive && (
        <div className="bg-[#111118] border border-white/5 rounded-2xl p-5 mb-6">
          <h2 className="text-white/40 text-xs font-mono uppercase tracking-widest mb-4">Add Player</h2>
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg text-white flex-shrink-0 ring-2 ring-white/10" style={{ backgroundColor: previewColor }}>
              {name.trim().charAt(0).toUpperCase() || '?'}
            </div>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddPlayer()}
              placeholder="Player name..."
              className="flex-1 bg-[#0a0a0f] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-white/30"
            />
          </div>
          <button
            onClick={handleAddPlayer}
            disabled={!name.trim() || adding}
            className="w-full flex items-center justify-center gap-2 bg-[#ff3b3b] text-white font-bold py-3 rounded-xl hover:bg-[#ff5555] transition-colors disabled:opacity-40"
          >
            {adding ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><UserPlus size={16} /> Add Player</>}
          </button>
        </div>
      )}

      {/* Roster */}
      {players.length > 0 && (
        <div className="mb-6">
          <h2 className="text-white/40 text-xs font-mono uppercase tracking-widest mb-3">Roster</h2>
          {!gameState?.isGameActive && (
            <p className="text-white/20 text-xs font-mono mb-3">Each player must tap "me?" on their own device before starting.</p>
          )}
          <div className="flex flex-col gap-2">
            {players.map((p) => {
              const isClaimed = !!p.claimedByDevice;
              const isMe = p.claimedByDevice === (localStorage.getItem('deviceId') ?? '');
              const isAdjusting = adjustingId === p.id;

              return (
                <div key={p.id} className="bg-[#111118] border border-white/5 rounded-xl overflow-hidden">
                  <div className="flex items-center gap-3 px-4 py-3">
                    <Avatar name={p.name} avatarColor={p.avatarColor} size="md" />
                    <span className="text-white font-bold flex-1">{p.name}</span>

                    {/* Claim button */}
                    {!gameState?.isGameActive ? (
                      <button
                        onClick={() => claimPlayer(p.id)}
                        className={`text-xs font-mono px-3 py-1.5 rounded-lg transition-colors ${
                          isMe ? 'bg-[#ff3b3b]/20 text-[#ff3b3b] border border-[#ff3b3b]/30'
                          : isClaimed ? 'bg-white/5 text-white/20 border border-white/5 cursor-not-allowed'
                          : 'text-white/30 border border-white/10 hover:border-white/20'}`}
                        disabled={isClaimed && !isMe}
                      >
                        {isMe ? '✓ me' : isClaimed ? 'taken' : 'me?'}
                      </button>
                    ) : (
                      <span className={`text-xs font-mono px-2 py-1 rounded ${isMe ? 'text-[#ff3b3b]' : 'text-white/20'}`}>
                        {isMe ? 'you' : isClaimed ? '●' : '—'}
                      </span>
                    )}

                    {/* Adjust time */}
                    {gameState?.isGameActive && (
                      <button
                        onClick={() => setAdjustingId(isAdjusting ? null : p.id)}
                        className="text-white/20 hover:text-amber-400 transition-colors ml-1"
                        title="Adjust time"
                      >
                        <span className="text-xs font-mono">±</span>
                      </button>
                    )}

                    {/* Remove player */}
                    {!gameState?.isGameActive && (
                      <button onClick={() => removePlayer(p.id)} className="text-white/20 hover:text-[#ff3b3b] transition-colors">
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>

                  {/* Inline time adjustment */}
                  {isAdjusting && (
                    <div className="px-4 pb-3 flex items-center gap-2 border-t border-white/5 pt-3">
                      <input
                        type="number"
                        value={adjustMinutes}
                        onChange={(e) => setAdjustMinutes(e.target.value)}
                        placeholder="minutes"
                        className="flex-1 bg-[#0a0a0f] border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder-white/20 focus:outline-none focus:border-white/30"
                      />
                      <button onClick={() => handleAdjust(p.id, 1)} className="flex items-center gap-1 bg-green-500/20 text-green-400 border border-green-500/30 px-3 py-2 rounded-lg text-xs font-bold hover:bg-green-500/30 transition-colors">
                        <Plus size={12} /> Add
                      </button>
                      <button onClick={() => handleAdjust(p.id, -1)} className="flex items-center gap-1 bg-red-500/20 text-red-400 border border-red-500/30 px-3 py-2 rounded-lg text-xs font-bold hover:bg-red-500/30 transition-colors">
                        <Minus size={12} /> Sub
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Notifications */}
      {myPlayerId && (
        <div className="bg-[#111118] border border-white/5 rounded-2xl p-5 mb-6">
          <h2 className="text-white/40 text-xs font-mono uppercase tracking-widest mb-3">Notifications</h2>
          <p className="text-white/40 text-sm mb-4">
            Get alerted when you're tagged.{' '}
            <span className="text-white/20">iPhone: add to Home Screen first.</span>
          </p>
          <button
            onClick={handleSetupNotifications}
            disabled={permission === 'denied'}
            className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition-colors ${
              permission === 'granted' ? 'bg-green-500/20 text-green-400 border border-green-500/30'
              : permission === 'denied' ? 'bg-white/5 text-white/20 cursor-not-allowed'
              : 'bg-[#ff3b3b] text-white hover:bg-[#ff5555]'}`}
          >
            {permission === 'granted' ? <><Bell size={16} /> Notifications enabled</>
              : permission === 'denied' ? <><BellOff size={16} /> Blocked in browser</>
              : <><Bell size={16} /> Enable Notifications</>}
          </button>
        </div>
      )}

      {/* Game controls */}
      <div className="bg-[#111118] border border-white/5 rounded-2xl p-5">
        <h2 className="text-white/40 text-xs font-mono uppercase tracking-widest mb-4">Game Controls</h2>
        {!gameState?.isGameActive ? (
          <>
            <p className="text-white/40 text-sm mb-3">Who starts as it?</p>
            <div className="grid grid-cols-2 gap-2 mb-4">
              {players.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setStartingPlayer(p.id)}
                  className={`flex items-center gap-2 py-3 px-4 rounded-xl border text-sm font-bold transition-all ${
                    startingPlayer === p.id ? 'border-[#ff3b3b] bg-[#ff3b3b]/10 text-white'
                    : 'border-white/10 text-white/40 hover:border-white/20'}`}
                >
                  <Avatar name={p.name} avatarColor={p.avatarColor} size="sm" />
                  <span className="truncate">{p.name}</span>
                </button>
              ))}
            </div>
            {!allClaimed && players.length >= 2 && (
              <p className="text-amber-400/70 text-xs font-mono text-center mb-3">
                All players must claim "me?" before starting
              </p>
            )}
            <button
              onClick={() => startGame(startingPlayer)}
              disabled={!canStart}
              className="w-full flex items-center justify-center gap-2 py-4 bg-[#ff3b3b] text-white font-black text-lg rounded-xl hover:bg-[#ff5555] transition-colors disabled:opacity-30"
            >
              <Play size={20} fill="white" /> Start Game
            </button>
            {players.length < 2 && (
              <p className="text-white/20 text-xs text-center mt-2 font-mono">Need at least 2 players</p>
            )}
          </>
        ) : (
          <button
            onClick={endGame}
            className="w-full flex items-center justify-center gap-2 py-4 border border-[#ff3b3b]/30 text-[#ff3b3b] font-bold rounded-xl hover:bg-[#ff3b3b]/10 transition-colors"
          >
            <Square size={18} /> End Game
          </button>
        )}
      </div>
    </div>
  );
}