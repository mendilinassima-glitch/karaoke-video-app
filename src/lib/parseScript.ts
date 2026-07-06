import Papa from 'papaparse';
import { KaraokeLine } from '../types/karaoke';
import { parseTimecode } from './timecode';

// Simple SRT parser to replace missing dependency
function parseSrtFromString(content: string) {
  const entries: Array<{ startTime: string; endTime: string; text: string }> = [];
  const blocks = content.split(/\n\s*\n/);
  
  for (const block of blocks) {
    const lines = block.trim().split('\n');
    if (lines.length < 3) continue;
    
    const timeLine = lines[1];
    const timeMatch = timeLine.match(/(\d{2}:\d{2}:\d{2}[.,]\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2}[.,]\d{3})/);
    
    if (timeMatch) {
      entries.push({
        startTime: timeMatch[1],
        endTime: timeMatch[2],
        text: lines.slice(2).join('\n'),
      });
    }
  }
  
  return entries;
}

function normalizeText(text: string) {
  return text.trim().replace(/\r/g, '');
}

function generateId(index: number) {
  return `line-${Date.now()}-${index}`;
}

function parseAssKaraokeText(text: string) {
  const matches = [...text.matchAll(/\{\\k(?:f)?(\d+)\}([^{}]*)/g)];
  if (!matches.length) {
    return { text: normalizeText(text), wordTimings: undefined };
  }

  const wordTimings = matches
    .map((match) => ({
      duration: Number(match[1]) / 100,
      text: match[2],
    }))
    .filter((item) => item.text.trim());

  return {
    text: normalizeText(wordTimings.map((item) => item.text).join('')),
    wordTimings,
  };
}

export function parseScript(content: string, fileName: string): KaraokeLine[] {
  const lowerName = fileName.toLowerCase();

  if (lowerName.endsWith('.srt') || /-->/.test(content)) {
    try {
      const data = parseSrtFromString(content);
      return data.map((item, index) => {
        const parsedText = parseAssKaraokeText(item.text);
        return {
          id: generateId(index),
          start: parseTimecode(item.startTime.replace(',', '.')),
          end: parseTimecode(item.endTime.replace(',', '.')),
          ...parsedText,
        };
      });
    } catch (error) {
      throw new Error('Impossible de parser le fichier SRT.');
    }
  }

  const lower = content.trim().slice(0, 64).toLowerCase();
  if (lower.startsWith('tc_in') || lower.includes('tc_in,') || lower.includes('start,')) {
    const parsed = Papa.parse<Record<string, string>>(content, { header: true, skipEmptyLines: true });
    if (parsed.errors.length) {
      throw new Error('Erreur pendant le parsing CSV.');
    }
    return parsed.data.map((row: Record<string, string>, index: number) => {
      const startText = row.tc_in ?? row.start ?? row['TC IN'] ?? row['tc_in'] ?? '';
      const endText = row.tc_out ?? row.end ?? row['TC OUT'] ?? row['tc_out'] ?? '';
      const text = row.text ?? row.Texte ?? row.text ?? '';
      const parsedText = parseAssKaraokeText(text);
      return {
        id: generateId(index),
        start: parseTimecode(startText),
        end: parseTimecode(endText),
        ...parsedText,
      };
    });
  }

  const lines = content.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const parsed: KaraokeLine[] = [];
  for (let i = 0; i < lines.length; i++) {
    const arrowMatch = lines[i].match(/^(.*?)\s*-->\s*(.*)$/);
    if (arrowMatch && lines[i + 1]) {
      const parsedText = parseAssKaraokeText(lines[i + 1]);
      parsed.push({
        id: generateId(parsed.length),
        start: parseTimecode(arrowMatch[1]),
        end: parseTimecode(arrowMatch[2]),
        ...parsedText,
      });
      i += 1;
    }
  }

  if (!parsed.length) {
    throw new Error('Aucune ligne valide trouvée dans le fichier script.');
  }

  return parsed;
}
