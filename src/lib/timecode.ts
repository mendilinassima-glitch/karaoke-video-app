export const DEFAULT_FRAMERATE = 25;

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function parseTimecode(value: string): number {
  const raw = value.trim();
  if (!raw) throw new Error('Timecode vide');

  const frameMatch = raw.match(/^(\d{2}:\d{2}:\d{2}):(\d{2})$/);
  if (frameMatch) {
    const [, hhmmss, ff] = frameMatch;
    const [hh, mm, ss] = hhmmss.split(':').map(Number);
    const frames = Number(ff);
    return hh * 3600 + mm * 60 + ss + frames / DEFAULT_FRAMERATE;
  }

  const msMatch = raw.match(/^(\d{2}:\d{2}:\d{2})[.,](\d{1,3})$/);
  if (msMatch) {
    const [_, hhmmss, ms] = msMatch;
    const [hh, mm, ss] = hhmmss.split(':').map(Number);
    const millis = Number(ms.padEnd(3, '0'));
    return hh * 3600 + mm * 60 + ss + millis / 1000;
  }

  const parts = raw.split(':').map(Number);
  if (parts.length === 3 && parts.every((n) => !Number.isNaN(n))) {
    const [hh, mm, ss] = parts;
    return hh * 3600 + mm * 60 + ss;
  }

  throw new Error(`Format de timecode invalide : ${value}`);
}

export function formatProgress(current: number, start: number, end: number) {
  if (current <= start) return 0;
  if (current >= end) return 1;
  return clamp((current - start) / (end - start), 0, 1);
}
