import { KaraokeLine } from '../types/karaoke';

export function getActiveLine(lines: KaraokeLine[], currentTime: number): KaraokeLine | null {
  return lines.find((line) => currentTime >= line.start && currentTime <= line.end) ?? null;
}
