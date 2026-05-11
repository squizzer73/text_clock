// 11 columns × 10 rows English word clock grid
export const COLS = 11;
export const ROWS = 10;

// Each string is exactly 11 characters; uppercase, fillers fill unused cells.
export const GRID_ROWS = [
  'ITLISASAMPM', // 0: IT IS A  AM PM
  'ACQUARTERDC', // 1: QUARTER
  'TWENTYFIVEX', // 2: TWENTY  FIVE(min)
  'HALFBTENFTO', // 3: HALF  TEN(min/hr)  TO
  'PASTERUNEIN', // 4: PAST
  'ONESIXTHREE', // 5: ONE  SIX  THREE
  'FOURFIVETWO', // 6: FOUR  FIVE(hr)  TWO
  'EIGHTELEVEN', // 7: EIGHT  ELEVEN
  'SEVENTWELVE', // 8: SEVEN  TWELVE
  'OCLOCKNINEE', // 9: OCLOCK  NINE
];

// Word positions: { row, cols: [startInclusive, endInclusive] }
// Verified against GRID_ROWS above.
export const WORD_POSITIONS = {
  IT:       { row: 0, cols: [0,  1]  }, // I T
  IS:       { row: 0, cols: [3,  4]  }, // I S
  A:        { row: 0, cols: [5,  5]  }, // A
  AM:       { row: 0, cols: [7,  8]  }, // A M
  PM:       { row: 0, cols: [9,  10] }, // P M
  QUARTER:  { row: 1, cols: [2,  8]  }, // Q U A R T E R
  TWENTY:   { row: 2, cols: [0,  5]  }, // T W E N T Y
  FIVE_MIN: { row: 2, cols: [6,  9]  }, // F I V E
  HALF:     { row: 3, cols: [0,  3]  }, // H A L F
  TEN_MIN:  { row: 3, cols: [5,  7]  }, // T E N (also used as hour 10)
  TEN_HR:   { row: 3, cols: [5,  7]  }, // same cells — hour 10 reuses minute TEN
  TO:       { row: 3, cols: [9,  10] }, // T O
  PAST:     { row: 4, cols: [0,  3]  }, // P A S T
  ONE:      { row: 5, cols: [0,  2]  }, // O N E
  SIX:      { row: 5, cols: [3,  5]  }, // S I X
  THREE:    { row: 5, cols: [6,  10] }, // T H R E E
  FOUR:     { row: 6, cols: [0,  3]  }, // F O U R
  FIVE_HR:  { row: 6, cols: [4,  7]  }, // F I V E
  TWO:      { row: 6, cols: [8,  10] }, // T W O
  EIGHT:    { row: 7, cols: [0,  4]  }, // E I G H T
  ELEVEN:   { row: 7, cols: [5,  10] }, // E L E V E N
  SEVEN:    { row: 8, cols: [0,  4]  }, // S E V E N
  TWELVE:   { row: 8, cols: [5,  10] }, // T W E L V E
  OCLOCK:   { row: 9, cols: [0,  5]  }, // O C L O C K
  NINE:     { row: 9, cols: [6,  9]  }, // N I N E
};

// Maps a word key to the Set of "row-col" cell IDs it covers.
export function wordToCells(wordKey) {
  const pos = WORD_POSITIONS[wordKey];
  if (!pos) return [];
  const cells = [];
  for (let c = pos.cols[0]; c <= pos.cols[1]; c++) {
    cells.push(`${pos.row}-${c}`);
  }
  return cells;
}
