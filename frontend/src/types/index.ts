export interface Player {
    id: string;
    name: string;
    avatarColor: string;
    claimedByDevice?: string; // device identifier that claimed "me?"
    fcmToken?: string;
    totalTimeMs: number;
    tagCount: number;
    createdAt: number;
  }
  
  export interface GameState {
    id: string;
    currentItPlayerId: string | null;
    itStartTime: number | null;        // when current stint started (or resumed)
    lastTaggedPlayerId: string | null; // for no tag-backs
    isGameActive: boolean;
    isPaused: boolean;
    pausedAt: number | null;           // timestamp when paused
    accumulatedItMs: number;           // ms already accumulated before current stint
    gameStartTime: number | null;
  }
  
  export interface GameEvent {
    id: string;
    type: 'tag' | 'pause' | 'resume' | 'adjustment' | 'start' | 'end';
    timestamp: number;
    // tag events
    taggerId?: string;
    taggerName?: string;
    taggedId?: string;
    taggedName?: string;
    durationMs?: number;
    // pause/resume
    actorName?: string;
    // adjustment
    playerId?: string;
    playerName?: string;
    adjustmentMs?: number; // positive = add, negative = subtract
  }
  
  export interface ArchivedGame {
    id: string;
    startTime: number;
    endTime: number;
    finalStandings: { playerId: string; name: string; avatarColor: string; totalTimeMs: number }[];
    events: GameEvent[];
  }