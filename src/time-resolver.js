import { wordToCells } from './grid-layouts.js';

// Maps 1–12 to the word key for that hour.
const HOUR_WORD = {
  1:  'ONE',
  2:  'TWO',
  3:  'THREE',
  4:  'FOUR',
  5:  'FIVE_HR',
  6:  'SIX',
  7:  'SEVEN',
  8:  'EIGHT',
  9:  'NINE',
  10: 'TEN_HR',
  11: 'ELEVEN',
  12: 'TWELVE',
};

// Returns the word keys active for a given 5-minute bucket (0–55, step 5).
function minuteWords(bucket) {
  switch (bucket) {
    case  0: return ['OCLOCK'];
    case  5: return ['FIVE_MIN', 'PAST'];
    case 10: return ['TEN_MIN',  'PAST'];
    case 15: return ['A', 'QUARTER', 'PAST'];
    case 20: return ['TWENTY', 'PAST'];
    case 25: return ['TWENTY', 'FIVE_MIN', 'PAST'];
    case 30: return ['HALF', 'PAST'];
    case 35: return ['TWENTY', 'FIVE_MIN', 'TO'];
    case 40: return ['TWENTY', 'TO'];
    case 45: return ['A', 'QUARTER', 'TO'];
    case 50: return ['TEN_MIN', 'TO'];
    case 55: return ['FIVE_MIN', 'TO'];
    default: return ['OCLOCK'];
  }
}

// Returns a Set of "row-col" strings that should be active right now.
export function resolveActiveCells(date = new Date()) {
  const rawHour = date.getHours();
  const minutes = date.getMinutes();
  const bucket = Math.floor(minutes / 5) * 5;

  // "To" phrases refer to the NEXT hour.
  const toNext = bucket >= 35;
  const hour12 = rawHour % 12 || 12;
  const displayHour = toNext ? (hour12 === 12 ? 1 : hour12 + 1) : hour12;

  const words = ['IT', 'IS', ...minuteWords(bucket), HOUR_WORD[displayHour]];

  const cells = new Set();
  for (const w of words) {
    for (const id of wordToCells(w)) cells.add(id);
  }
  return cells;
}

// Stable key for comparison — just the sorted joined string.
export function cellSetKey(cells) {
  return [...cells].sort().join(',');
}
