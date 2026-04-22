import toast from 'react-hot-toast';

const NOTES = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];
const NOTES_FLAT_EQUIV: Record<string, string> = { 'Db': 'C#', 'D#': 'Eb', 'Gb': 'F#', 'G#': 'Ab', 'A#': 'Bb' };

function normalizeNote(note: string) {
  return NOTES_FLAT_EQUIV[note] || note;
}

export function transposeKey(keyString: string, steps: number): string {
  if (!keyString || typeof keyString !== 'string') return '';
  
  // Regex to find chords (A-G with optional flat/sharp and optional 'm' for minor)
  const chordRegex = /([CDEFGAB][b#]?)(m?)/g;
  
  let matchCount = 0;
  let transposedString = keyString.replace(chordRegex, (match, note, minor) => {
    // Treat the chord logic
    const normalized = normalizeNote(note);
    const index = NOTES.indexOf(normalized);
    
    // If somehow it's valid according to regex but not in our 12 notes (should be impossible)
    if (index === -1) return match;
    
    matchCount++;
    // Calculate new position circularly
    const newIndex = (index + steps + 60) % 12;
    return NOTES[newIndex] + minor;
  });

  if (matchCount === 0) {
    // Se o user tinha algo escrito mas não deu 'match' em nota válida
    if (keyString.trim().length > 0) {
      toast.error('Formato não reconhecido para transposição rápida.');
    }
    return keyString;
  }

  return transposedString;
}

export function toggleMinorKey(keyString: string): string {
  if (!keyString) return '';
  const trimmed = keyString.trim();
  if (trimmed.endsWith('m')) {
    return trimmed.slice(0, -1);
  }
  return trimmed + 'm';
}
