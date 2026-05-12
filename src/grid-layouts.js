// 11 columns × 10 rows English word clock grid
// Layout designed so words appear in natural spoken order top-to-bottom:
//   IT IS (row 0) → minute amounts (rows 1-2) → PAST/TO (row 3) → hours (rows 4-8) → O'CLOCK (row 9)
// TEN_MIN (row 1) and TEN_HR (row 8) are separate positions to avoid overlap.
export const COLS = 11;
export const ROWS = 10;

export const GRID_ROWS = [
  'ITLISASAMPM', // 0: IT IS A  AM PM
  'ATENQUARTER', // 1: TEN(min)  QUARTER
  'TWENTYFIVEX', // 2: TWENTY  FIVE(min)
  'HALFXPASTTO', // 3: HALF  PAST  TO
  'ONESIXTHREE', // 4: ONE  SIX  THREE
  'FOURFIVETWO', // 5: FOUR  FIVE(hr)  TWO
  'EIGHTELEVEN', // 6: EIGHT  ELEVEN
  'SEVENTWELVE', // 7: SEVEN  TWELVE
  'TENSENINERS', // 8: TEN(hr)  NINE
  'OCLOCKNIGHT', // 9: OCLOCK
];

// Word positions: { row, cols: [startInclusive, endInclusive] }
// All positions verified against GRID_ROWS above.
export const WORD_POSITIONS = {
  // Row 0 — I T L I S A S A M P M
  IT:       { row: 0, cols: [0,  1]  }, // I T
  IS:       { row: 0, cols: [3,  4]  }, // I S
  A:        { row: 0, cols: [5,  5]  }, // A
  AM:       { row: 0, cols: [7,  8]  }, // A M
  PM:       { row: 0, cols: [9,  10] }, // P M

  // Row 1 — A T E N Q U A R T E R
  TEN_MIN:  { row: 1, cols: [1,  3]  }, // T E N
  QUARTER:  { row: 1, cols: [4,  10] }, // Q U A R T E R

  // Row 2 — T W E N T Y F I V E X
  TWENTY:   { row: 2, cols: [0,  5]  }, // T W E N T Y
  FIVE_MIN: { row: 2, cols: [6,  9]  }, // F I V E

  // Row 3 — H A L F X P A S T T O
  HALF:     { row: 3, cols: [0,  3]  }, // H A L F  (appears left of PAST → reads "HALF PAST" ✓)
  PAST:     { row: 3, cols: [5,  8]  }, // P A S T
  TO:       { row: 3, cols: [9,  10] }, // T O

  // Rows 4-7 — hours (all after PAST/TO so reading order is correct)
  ONE:      { row: 4, cols: [0,  2]  }, // O N E
  SIX:      { row: 4, cols: [3,  5]  }, // S I X
  THREE:    { row: 4, cols: [6,  10] }, // T H R E E

  FOUR:     { row: 5, cols: [0,  3]  }, // F O U R
  FIVE_HR:  { row: 5, cols: [4,  7]  }, // F I V E
  TWO:      { row: 5, cols: [8,  10] }, // T W O

  EIGHT:    { row: 6, cols: [0,  4]  }, // E I G H T
  ELEVEN:   { row: 6, cols: [5,  10] }, // E L E V E N

  SEVEN:    { row: 7, cols: [0,  4]  }, // S E V E N
  TWELVE:   { row: 7, cols: [5,  10] }, // T W E L V E

  // Row 8 — T E N S E N I N E R S
  // TEN_HR is separate from TEN_MIN (row 1) so "TEN PAST TEN" shows both.
  TEN_HR:   { row: 8, cols: [0,  2]  }, // T E N
  NINE:     { row: 8, cols: [5,  8]  }, // N I N E

  // Row 9 — O C L O C K N I G H T
  OCLOCK:   { row: 9, cols: [0,  5]  }, // O C L O C K
};

// Maps a word key to the array of "row-col" cell IDs it covers.
export function wordToCells(wordKey) {
  const pos = WORD_POSITIONS[wordKey];
  if (!pos) return [];
  const cells = [];
  for (let c = pos.cols[0]; c <= pos.cols[1]; c++) {
    cells.push(`${pos.row}-${c}`);
  }
  return cells;
}
