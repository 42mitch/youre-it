import { useState, useEffect } from 'react';
import {
  collection,
  doc,
  onSnapshot,
  setDoc,
  updateDoc,
  addDoc,
  deleteDoc,
  query,
  orderBy,
  getDocs,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Player, GameState, GameEvent, ArchivedGame } from '../types';
import { getAvatarColor } from '../components/Avatar';

const GAME_DOC = 'game/state';
const PLAYERS_COL = 'players';
const EVENTS_COL = 'gameEvents';
const ARCHIVE_COL = 'archivedGames';

// Unique device ID stored in localStorage
function getDeviceId(): string {
  let id = localStorage.getItem('deviceId');
  if (!id) {
    id = `device_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    localStorage.setItem('deviceId', id);
  }
  return id;
}

export const deviceId = getDeviceId();

export function useGameState() {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [gameEvents, setGameEvents] = useState<GameEvent[]>([]);
  const [archivedGames, setArchivedGames] = useState<ArchivedGame[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubGame = onSnapshot(doc(db, GAME_DOC), (snap) => {
      if (snap.exists()) {
        setGameState(snap.data() as GameState);
      } else {
        setDoc(doc(db, GAME_DOC), {
          id: 'state',
          currentItPlayerId: null,
          itStartTime: null,
          lastTaggedPlayerId: null,
          isGameActive: false,
          isPaused: false,
          pausedAt: null,
          accumulatedItMs: 0,
          gameStartTime: null,
        });
      }
      setLoading(false);
    });

    const unsubPlayers = onSnapshot(collection(db, PLAYERS_COL), (snap) => {
      const ps = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Player));
      setPlayers(ps.sort((a, b) => a.createdAt - b.createdAt));
    });

    const eventsQuery = query(collection(db, EVENTS_COL), orderBy('timestamp', 'desc'));
    const unsubEvents = onSnapshot(eventsQuery, (snap) => {
      setGameEvents(snap.docs.map((d) => ({ id: d.id, ...d.data() } as GameEvent)));
    });

    const archiveQuery = query(collection(db, ARCHIVE_COL), orderBy('startTime', 'desc'));
    const unsubArchive = onSnapshot(archiveQuery, (snap) => {
      setArchivedGames(snap.docs.map((d) => ({ id: d.id, ...d.data() } as ArchivedGame)));
    });

    return () => { unsubGame(); unsubPlayers(); unsubEvents(); unsubArchive(); };
  }, []);

  // --- Player management ---

  const addPlayer = async (name: string) => {
    await addDoc(collection(db, PLAYERS_COL), {
      name,
      avatarColor: getAvatarColor(name),
      totalTimeMs: 0,
      tagCount: 0,
      createdAt: Date.now(),
    });
  };

  const removePlayer = async (playerId: string) => {
    await deleteDoc(doc(db, PLAYERS_COL, playerId));
  };

  const claimPlayer = async (playerId: string) => {
    // Unclaim any previously claimed player on this device
    const prev = players.find((p) => p.claimedByDevice === deviceId);
    if (prev && prev.id !== playerId) {
      await updateDoc(doc(db, PLAYERS_COL, prev.id), { claimedByDevice: null });
    }
    await updateDoc(doc(db, PLAYERS_COL, playerId), { claimedByDevice: deviceId });
    localStorage.setItem('myPlayerId', playerId);
  };

  const myPlayer = players.find((p) => p.claimedByDevice === deviceId) ?? null;
  const myPlayerId = myPlayer?.id ?? null;

  // --- Game lifecycle ---

  const notify = async (body: object) => {
    try {
      const allTokens = players.filter((p) => p.fcmToken).map((p) => ({
        token: p.fcmToken!,
        isTagged: false,
      }));
      if (allTokens.length === 0) return;
      await fetch(`${import.meta.env.VITE_API_URL}/api/notify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tokens: allTokens, ...body }),
      });
    } catch (e) { console.warn('Notification send failed:', e); }
  };

  const startGame = async (startingPlayerId: string) => {
    const now = Date.now();
    await setDoc(doc(db, GAME_DOC), {
      id: 'state',
      currentItPlayerId: startingPlayerId,
      itStartTime: now,
      lastTaggedPlayerId: null,
      isGameActive: true,
      isPaused: false,
      pausedAt: null,
      accumulatedItMs: 0,
      gameStartTime: now,
    });
    // Clear old events
    const oldEvents = await getDocs(collection(db, EVENTS_COL));
    await Promise.all(oldEvents.docs.map((d) => deleteDoc(d.ref)));

    const startingPlayer = players.find((p) => p.id === startingPlayerId);
    await addDoc(collection(db, EVENTS_COL), {
      type: 'start',
      timestamp: now,
      taggedId: startingPlayerId,
      taggedName: startingPlayer?.name ?? '',
    });

    await notify({ type: 'start', taggedName: startingPlayer?.name ?? '' });
  };

  const endGame = async () => {
    if (!gameState?.currentItPlayerId) return;
    const now = Date.now();

    // Finalize current it player's time — works whether paused or not
    const durationMs = gameState.isPaused
      ? gameState.accumulatedItMs
      : gameState.accumulatedItMs + (now - (gameState.itStartTime ?? now));
    const currentPlayer = players.find((p) => p.id === gameState.currentItPlayerId);
    if (currentPlayer) {
      await updateDoc(doc(db, PLAYERS_COL, gameState.currentItPlayerId), {
        totalTimeMs: currentPlayer.totalTimeMs + durationMs,
      });
    }

    // Archive the game
    const finalPlayers = await getDocs(collection(db, PLAYERS_COL));
    const finalStandings = finalPlayers.docs.map((d) => {
      const p = d.data() as Player;
      const extra = d.id === gameState.currentItPlayerId ? durationMs : 0;
      return { playerId: d.id, name: p.name, avatarColor: p.avatarColor, totalTimeMs: p.totalTimeMs + extra };
    }).sort((a, b) => b.totalTimeMs - a.totalTimeMs);

    const allEvents = await getDocs(query(collection(db, EVENTS_COL), orderBy('timestamp', 'asc')));
    await addDoc(collection(db, ARCHIVE_COL), {
      startTime: gameState.gameStartTime ?? now,
      endTime: now,
      finalStandings,
      events: allEvents.docs.map((d) => d.data()),
    });

    await addDoc(collection(db, EVENTS_COL), { type: 'end', timestamp: now });

    await updateDoc(doc(db, GAME_DOC), {
      isGameActive: false,
      currentItPlayerId: null,
      itStartTime: null,
      isPaused: false,
      pausedAt: null,
      accumulatedItMs: 0,
    });

    await notify({ type: 'end', playerName: finalStandings[0]?.name ?? '' });
  };

  // --- Tag transfer ---

  const transferTag = async (taggerId: string, taggedId: string) => {
    if (!gameState?.itStartTime || gameState.isPaused) return;
    const now = Date.now();
    const durationMs = gameState.accumulatedItMs + (now - gameState.itStartTime);

    const tagger = players.find((p) => p.id === taggerId);
    const tagged = players.find((p) => p.id === taggedId);
    if (!tagger || !tagged) return;

    await updateDoc(doc(db, PLAYERS_COL, taggerId), {
      totalTimeMs: tagger.totalTimeMs + durationMs,
    });
    await updateDoc(doc(db, PLAYERS_COL, taggedId), {
      tagCount: tagged.tagCount + 1,
    });
    await addDoc(collection(db, EVENTS_COL), {
      type: 'tag',
      taggerId,
      taggedId,
      timestamp: now,
      taggerName: tagger.name,
      taggedName: tagged.name,
      durationMs,
    });
    await updateDoc(doc(db, GAME_DOC), {
      currentItPlayerId: taggedId,
      itStartTime: now,
      lastTaggedPlayerId: taggerId,
      accumulatedItMs: 0,
    });

    // Notify all players
    try {
      const allTokens = players.filter((p) => p.fcmToken).map((p) => ({
        token: p.fcmToken!,
        isTagged: p.id === taggedId,
      }));
      await fetch(`${import.meta.env.VITE_API_URL}/api/notify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tokens: allTokens,
          taggerName: tagger.name,
          taggedName: tagged.name,
          type: 'tag',
        }),
      });
    } catch (e) {
      console.warn('Notification send failed:', e);
    }
  };

  // --- Pause / Resume ---

  const pauseGame = async () => {
    if (!gameState?.isGameActive || gameState.isPaused || !gameState.itStartTime) return;
    const now = Date.now();
    const accumulated = gameState.accumulatedItMs + (now - gameState.itStartTime);
    const actor = myPlayer?.name ?? 'Someone';

    await updateDoc(doc(db, GAME_DOC), {
      isPaused: true,
      pausedAt: now,
      accumulatedItMs: accumulated,
      itStartTime: null,
    });
    await addDoc(collection(db, EVENTS_COL), {
      type: 'pause',
      timestamp: now,
      actorName: actor,
    });

    try {
      const allTokens = players.filter((p) => p.fcmToken).map((p) => p.fcmToken!);
      await fetch(`${import.meta.env.VITE_API_URL}/api/notify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tokens: allTokens, type: 'pause', actorName: actor }),
      });
    } catch (e) { console.warn('Notification send failed:', e); }
  };

  const resumeGame = async () => {
    if (!gameState?.isGameActive || !gameState.isPaused) return;
    const now = Date.now();
    const actor = myPlayer?.name ?? 'Someone';

    await updateDoc(doc(db, GAME_DOC), {
      isPaused: false,
      pausedAt: null,
      itStartTime: now,
    });
    await addDoc(collection(db, EVENTS_COL), {
      type: 'resume',
      timestamp: now,
      actorName: actor,
    });

    try {
      const allTokens = players.filter((p) => p.fcmToken).map((p) => p.fcmToken!);
      await fetch(`${import.meta.env.VITE_API_URL}/api/notify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tokens: allTokens, type: 'resume', actorName: actor }),
      });
    } catch (e) { console.warn('Notification send failed:', e); }
  };

  // --- Manual time adjustment ---

  const adjustTime = async (playerId: string, adjustmentMs: number) => {
    const player = players.find((p) => p.id === playerId);
    if (!player) return;
    const newTotal = Math.max(0, player.totalTimeMs + adjustmentMs);
    await updateDoc(doc(db, PLAYERS_COL, playerId), { totalTimeMs: newTotal });
    const actor = myPlayer?.name ?? 'Someone';
    await addDoc(collection(db, EVENTS_COL), {
      type: 'adjustment',
      timestamp: Date.now(),
      playerId,
      playerName: player.name,
      adjustmentMs,
      actorName: actor,
    });
    await notify({ type: 'adjustment', playerName: player.name, adjustmentMs, actorName: actor });
  };

  // --- FCM token ---

  const saveFcmToken = async (playerId: string, token: string) => {
    await updateDoc(doc(db, PLAYERS_COL, playerId), { fcmToken: token });
  };

  return {
    gameState,
    players,
    gameEvents,
    archivedGames,
    loading,
    myPlayer,
    myPlayerId,
    deviceId,
    addPlayer,
    removePlayer,
    claimPlayer,
    startGame,
    endGame,
    transferTag,
    pauseGame,
    resumeGame,
    adjustTime,
    saveFcmToken,
  };
}