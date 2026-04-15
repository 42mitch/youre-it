import { useState, useEffect, useRef } from 'react';

export function useLiveTimer(startTime: number | null, baseMs: number = 0) {
  const [elapsed, setElapsed] = useState(0);
  const rafRef = useRef<number>();

  useEffect(() => {
    if (!startTime) {
      setElapsed(baseMs);
      return;
    }

    const tick = () => {
      setElapsed(baseMs + (Date.now() - startTime));
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [startTime, baseMs]);

  return elapsed;
}

export function formatTime(ms: number): { h: string; m: string; s: string; ms: string } {
  const totalSeconds = Math.floor(ms / 1000);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const msVal = Math.floor((ms % 1000) / 10);

  return {
    h: String(h).padStart(2, '0'),
    m: String(m).padStart(2, '0'),
    s: String(s).padStart(2, '0'),
    ms: String(msVal).padStart(2, '0'),
  };
}

export function formatTotalTime(ms: number): string {
  const { h, m, s, ms: msVal } = formatTime(ms);
  if (parseInt(h) > 0) return `${h}h ${m}m ${s}s`;
  if (parseInt(m) > 0) return `${m}m ${s}s`;
  return `${s}.${msVal}s`;
}