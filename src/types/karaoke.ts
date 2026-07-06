export type KaraokeLine = {
  id: string;
  start: number;
  end: number;
  text: string;
  wordTimings?: KaraokeWordTiming[];
};

export type KaraokeWordTiming = {
  text: string;
  duration: number;
};

export type PresetKey =
  | 'youtube'
  | 'disney'
  | 'cocomelon'
  | 'netflixKids'
  | 'appleMusic'
  | 'video'
  | 'fiveMonkeys'
  | 'custom';

export type KaraokeStyle = {
  preset: PresetKey;
  fontFamily: string;
  fontSize: number;
  baseColor: string;
  highlightColor: string;
  outlineColor: string;
  verticalPosition: number;
  alignment: 'left' | 'center' | 'right';
  flowMode:
    | 'sweep'
    | 'color-progressive'
    | 'word'
    | 'word-highlight'
    | 'word-sweep'
    | 'word-kf-timed'
    | 'gradient-background'
    | 'word-wave'
    | 'slide-left'
    | 'slide-up'
    | 'youtube'
    | 'classic';
  wordSpeed: number;
  wordEffect: 'none' | 'pop' | 'bounce' | 'glow' | 'wave';
};
