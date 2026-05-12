const DEFAULT_CONFIG = {
  active_color: '#2B7EFF',
  inactive_color: '#1a2035',
  background_color: '#090e1a',
  font_family: 'mono',
  letter_spacing: 1.6,
  inactive_opacity: 0.25,
  padding: 16,
  aspect_ratio: '1/1',
  font_size_mode: 'auto',
  font_size_fixed: 24,
  effect_mode: 'glow',
  effect_speed: 1.0,
  effect_intensity: 0.7,
  transition_duration: 800,
  second_dot_mode: 'none',
  ambient_drift: false,
  color_theme: 'custom',
};

const COLOR_THEMES = {
  solarised:      { active_color: '#268bd2', inactive_color: '#073642', background_color: '#002b36' },
  nord:           { active_color: '#88c0d0', inactive_color: '#3b4252', background_color: '#2e3440' },
  dracula:        { active_color: '#bd93f9', inactive_color: '#3d3f4f', background_color: '#1e1f29' },
  amber:          { active_color: '#ffb000', inactive_color: '#2a1a00', background_color: '#1a1000' },
  green_phosphor: { active_color: '#00ff41', inactive_color: '#001a05', background_color: '#000d02' },
  paper:          { active_color: '#333333', inactive_color: '#aaaaaa', background_color: '#f5f0e8' },
};

const FONT_URLS = {
  vt323:       'https://fonts.googleapis.com/css2?family=VT323&display=swap',
  orbitron:    'https://fonts.googleapis.com/css2?family=Orbitron:wght@700&display=swap',
  press_start: 'https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap',
  share_tech:  'https://fonts.googleapis.com/css2?family=Share+Tech+Mono&display=swap',
};

const FONT_FAMILIES = {
  mono:        'monospace',
  vt323:       "'VT323', monospace",
  orbitron:    "'Orbitron', monospace",
  press_start: "'Press Start 2P', monospace",
  share_tech:  "'Share Tech Mono', monospace",
  courier:     "'Courier New', Courier, monospace",
};

// 11 columns × 10 rows English word clock grid
// Layout designed so words appear in natural spoken order top-to-bottom:
//   IT IS (row 0) → minute amounts (rows 1-2) → PAST/TO (row 3) → hours (rows 4-8) → O'CLOCK (row 9)
// TEN_MIN (row 1) and TEN_HR (row 8) are separate positions to avoid overlap.
const COLS = 11;
const ROWS = 10;

const GRID_ROWS = [
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
const WORD_POSITIONS = {
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
function wordToCells(wordKey) {
  const pos = WORD_POSITIONS[wordKey];
  if (!pos) return [];
  const cells = [];
  for (let c = pos.cols[0]; c <= pos.cols[1]; c++) {
    cells.push(`${pos.row}-${c}`);
  }
  return cells;
}

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
function resolveActiveCells(date = new Date()) {
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
function cellSetKey(cells) {
  return [...cells].sort().join(',');
}

class EffectManager {
  constructor(shadow, config) {
    this._shadow = shadow;
    this._cfg = config;
    this._rafId = null;
    this._intervals = [];
    this._auroraHue = 200;

    this._init();
  }

  // Called whenever the active cell set changes.
  onTransition(newCells, prevCells) {
    if (this._cfg.effect_mode === 'pixel_reveal') {
      this._pixelReveal(newCells, prevCells);
    } else if (this._cfg.effect_mode === 'typewriter') {
      this._typewriter(newCells, prevCells);
    }
  }

  destroy() {
    if (this._rafId) cancelAnimationFrame(this._rafId);
    this._intervals.forEach(id => clearInterval(id));
    this._rafId = null;
    this._intervals = [];
  }

  // ── init ──────────────────────────────────────────────────────────────────

  _init() {
    const mode = this._cfg.effect_mode;
    if (mode === 'matrix')        this._initMatrix();
    if (mode === 'aurora')        this._initAurora();
    if (this._cfg.ambient_drift)  this._initAmbientDrift();
  }

  // ── matrix ────────────────────────────────────────────────────────────────

  _initMatrix() {
    const canvas = this._shadow.querySelector('.matrix-canvas');
    if (!canvas) return;

    const cfg = this._cfg;
    const ctx = canvas.getContext('2d');
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&*<>';

    let drops = [];
    let frame = 0;

    const resize = () => {
      canvas.width  = canvas.offsetWidth  || canvas.parentElement.clientWidth;
      canvas.height = canvas.offsetHeight || canvas.parentElement.clientHeight;
      const count = Math.max(1, Math.floor(canvas.width / 18));
      drops = Array.from({ length: count }, () => Math.random() * -canvas.height);
    };

    resize();
    window.addEventListener('resize', resize);

    const skipFrames = Math.max(1, Math.round(8 / cfg.effect_speed));

    const draw = () => {
      this._rafId = requestAnimationFrame(draw);
      frame++;
      if (frame % skipFrames !== 0) return;

      ctx.fillStyle = 'rgba(0,0,0,0.06)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.font = '14px monospace';

      drops.forEach((y, i) => {
        const char = charset[Math.floor(Math.random() * charset.length)];
        const x = i * 18;
        // Bright head
        ctx.fillStyle = `rgba(0,255,65,${cfg.effect_intensity})`;
        ctx.fillText(char, x, y);
        // Dimmer trail char above
        ctx.fillStyle = `rgba(0,200,50,${cfg.effect_intensity * 0.4})`;
        ctx.fillText(
          charset[Math.floor(Math.random() * charset.length)],
          x, y - 18,
        );

        if (y > canvas.height && Math.random() > 0.975) {
          drops[i] = 0;
        } else {
          drops[i] += 18;
        }
      });
    };

    draw();

    this._intervals.push(() => window.removeEventListener('resize', resize));
  }

  // ── pixel_reveal ─────────────────────────────────────────────────────────

  _pixelReveal(newCells, prevCells) {
    const cfg = this._cfg;
    const dur = cfg.transition_duration;

    this._shadow.querySelectorAll('.cell').forEach(cell => {
      const id  = cell.dataset.pos;
      const now = newCells.has(id);
      const was = prevCells.has(id);

      if (now && !was) {
        const dx    = (Math.random() - 0.5) * 120;
        const dy    = (Math.random() - 0.5) * 120;
        const delay = Math.random() * 300;
        cell.style.setProperty('--dx', `${dx}px`);
        cell.style.setProperty('--dy', `${dy}px`);
        cell.style.animation = 'none';
        void cell.offsetHeight; // force reflow
        cell.classList.add('active');
        cell.style.animation = `tcPixelIn ${dur}ms ease ${delay}ms both`;
      } else if (!now && was) {
        const dx    = (Math.random() - 0.5) * 120;
        const dy    = (Math.random() - 0.5) * 120;
        cell.style.setProperty('--dx', `${dx}px`);
        cell.style.setProperty('--dy', `${dy}px`);
        cell.style.animation = `tcPixelOut ${dur}ms ease both`;
        setTimeout(() => {
          cell.classList.remove('active');
          cell.style.animation = '';
        }, dur);
      }
    });
  }

  // ── typewriter ────────────────────────────────────────────────────────────

  _typewriter(newCells, prevCells) {
    this._cfg;

    this._shadow.querySelectorAll('.cell').forEach(cell => {
      const id  = cell.dataset.pos;
      const now = newCells.has(id);
      const was = prevCells.has(id);

      if (!now && was) {
        cell.classList.remove('active');
        cell.style.animation = '';
      }

      if (now && !was) {
        const [r, c] = id.split('-').map(Number);
        const idx    = r * COLS + c;
        const delay  = idx * 35;
        cell.style.animation = `tcTypeIn 120ms ease ${delay}ms both`;
        setTimeout(() => {
          cell.classList.add('active');
          cell.style.animation = '';
        }, delay + 120);
      }
    });
  }

  // ── aurora ────────────────────────────────────────────────────────────────

  _initAurora() {
    const cfg   = this._cfg;
    let hue     = 200;
    const speed = cfg.effect_speed;

    const id = setInterval(() => {
      hue = (hue + speed * 0.6) % 360;
      const cells = this._shadow.querySelectorAll('.cell.active');
      cells.forEach(cell => {
        cell.style.color      = `hsl(${hue},100%,65%)`;
        cell.style.textShadow = `0 0 12px hsl(${hue},100%,65%), 0 0 24px hsl(${hue},100%,65%)`;
      });
    }, 50);

    this._intervals.push(id);
  }

  // ── ambient_drift ─────────────────────────────────────────────────────────

  _initAmbientDrift() {
    const cfg    = this._cfg;
    const phases = new Map();
    let t        = 0;

    const id = setInterval(() => {
      t += 0.025 * cfg.effect_speed;

      this._shadow.querySelectorAll('.cell').forEach((cell, i) => {
        if (cell.classList.contains('active')) return;
        if (!phases.has(i)) phases.set(i, Math.random() * Math.PI * 2);
        const drift = Math.sin(t + phases.get(i)) * 0.06 * cfg.effect_intensity;
        cell.style.opacity = Math.max(0, cfg.inactive_opacity + drift).toFixed(3);
      });
    }, 60);

    this._intervals.push(id);
  }
}

const FONT_LABELS = {
  mono:        'System Mono',
  vt323:       'VT323 (retro)',
  orbitron:    'Orbitron (sci-fi)',
  press_start: 'Press Start 2P (pixel)',
  share_tech:  'Share Tech Mono',
  courier:     'Courier New',
};

const EFFECT_LABELS = {
  none:          'None',
  glow:          'Glow',
  matrix:        'Matrix',
  pixel_reveal:  'Pixel Reveal',
  typewriter:    'Typewriter',
  aurora:        'Aurora',
};

const ASPECT_OPTIONS = [
  { value: '1/1',  label: 'Square (1:1)' },
  { value: '4/3',  label: 'Standard (4:3)' },
  { value: '3/2',  label: 'Photo (3:2)' },
  { value: '16/9', label: 'Widescreen (16:9)' },
  { value: '2/1',  label: 'Wide (2:1)' },
  { value: '2/3',  label: 'Portrait (2:3)' },
  { value: '3/4',  label: 'Portrait (3:4)' },
  { value: 'fill', label: 'Fill container (no ratio)' },
];

const SECOND_DOT_LABELS = {
  none:    'None',
  corners: 'Corners (always on)',
  pulse:   'Pulse (every second)',
  sweep:   'Sweep (second hand)',
};

class TextClockCardEditor extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._config = { ...DEFAULT_CONFIG };
  }

  setConfig(config) {
    this._config = { ...DEFAULT_CONFIG, ...config };
    this._render();
  }

  _render() {
    const c = this._config;
    const fixedHidden = c.font_size_mode !== 'fixed' ? 'style="display:none"' : '';

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          padding: 16px;
          font-family: var(--paper-font-body1_-_font-family, sans-serif);
          color: var(--primary-text-color, #333);
        }
        details {
          border: 1px solid var(--divider-color, #ddd);
          border-radius: 8px;
          margin-bottom: 8px;
          padding: 4px 12px 12px;
        }
        summary {
          cursor: pointer;
          font-weight: 600;
          font-size: 14px;
          padding: 8px 0;
          list-style: none;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        summary::before {
          content: '▶';
          font-size: 10px;
          transition: transform 0.2s;
          flex-shrink: 0;
        }
        details[open] summary::before { transform: rotate(90deg); }

        .row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 5px 0;
          gap: 8px;
          min-height: 32px;
        }
        .row label {
          flex: 1;
          font-size: 13px;
          color: var(--primary-text-color, #333);
        }
        .row .hint {
          font-size: 11px;
          color: var(--secondary-text-color, #888);
          margin-top: 1px;
        }
        .label-col { display: flex; flex-direction: column; flex: 1; }

        input[type="color"] {
          width: 52px; height: 30px;
          padding: 1px; border: 1px solid var(--divider-color,#ccc);
          border-radius: 4px; cursor: pointer; background: none;
        }
        input[type="range"] { width: 110px; cursor: pointer; }
        input[type="number"] {
          width: 68px; padding: 4px 6px;
          border: 1px solid var(--divider-color,#ccc);
          border-radius: 4px;
          background: var(--card-background-color, #fff);
          color: var(--primary-text-color, #333);
          text-align: right;
        }
        input[type="checkbox"] { width: 18px; height: 18px; cursor: pointer; }
        select {
          width: 160px; padding: 4px 6px;
          border: 1px solid var(--divider-color,#ccc);
          border-radius: 4px;
          background: var(--card-background-color, #fff);
          color: var(--primary-text-color, #333);
          font-size: 13px;
        }
        .val {
          min-width: 38px; text-align: right;
          font-size: 12px; color: var(--secondary-text-color, #888);
        }
        .divider {
          border: none; border-top: 1px solid var(--divider-color, #eee);
          margin: 6px 0;
        }
      </style>

      <!-- ── Appearance ──────────────────────────────────────────────── -->
      <details open>
        <summary>Appearance</summary>

        ${this._sel('color_theme', 'Colour Theme',
            [...Object.keys(COLOR_THEMES).map(k => ({ value: k, label: this._titleCase(k) })),
             { value: 'custom', label: 'Custom' }])}
        <hr class="divider">
        ${this._col('active_color',     'Active colour',    c.active_color)}
        ${this._col('inactive_color',   'Inactive colour',  c.inactive_color)}
        ${this._col('background_color', 'Background',       c.background_color)}
        <hr class="divider">
        ${this._sel('font_family', 'Font',
            Object.entries(FONT_LABELS).map(([v,l]) => ({ value: v, label: l })))}
        ${this._rng('inactive_opacity', 'Inactive opacity', 0, 1, 0.01, 'How dim the unlit letters appear')}
      </details>

      <!-- ── Layout ─────────────────────────────────────────────────── -->
      <details>
        <summary>Layout</summary>

        ${this._sel('aspect_ratio', 'Aspect ratio', ASPECT_OPTIONS,
            'Shape of the card — Square fills most dashboards well')}
        <hr class="divider">
        ${this._sel('font_size_mode', 'Font size mode',
            [{ value: 'auto', label: 'Auto (fill card)' },
             { value: 'fixed', label: 'Fixed size' }])}
        <div class="row fixed-size-row" ${fixedHidden}>
          <label>Fixed size (px)</label>
          ${this._numInput('font_size_fixed', 8, 200, c.font_size_fixed)}
        </div>
        <hr class="divider">
        ${this._rng('padding',        'Padding (px)',     0,   64, 1)}
        ${this._rng('letter_spacing', 'Letter spacing',  0.8, 2.5, 0.05,
            'Space between letter cells (1.0 = tight, 1.5 = airy)')}
      </details>

      <!-- ── Effects ────────────────────────────────────────────────── -->
      <details>
        <summary>Effects</summary>

        ${this._sel('effect_mode', 'Effect',
            Object.entries(EFFECT_LABELS).map(([v,l]) => ({ value: v, label: l })))}
        ${this._rng('effect_speed',     'Effect speed',    0.1, 3.0, 0.1)}
        ${this._rng('effect_intensity', 'Intensity',       0.0, 1.0, 0.05)}
        ${this._rng('transition_duration', 'Transition (ms)', 100, 3000, 50)}
        <hr class="divider">
        ${this._sel('second_dot_mode', 'Second dots',
            Object.entries(SECOND_DOT_LABELS).map(([v,l]) => ({ value: v, label: l })),
            'Corner dots that indicate seconds')}
        ${this._chk('ambient_drift', 'Ambient drift',
            'Inactive letters shimmer slowly at random')}
      </details>
    `;

    this._attach();
  }

  // ── helpers ───────────────────────────────────────────────────────────────

  _sel(key, label, options, hint = '') {
    const cur  = this._config[key];
    const opts = options.map(o =>
      `<option value="${o.value}"${cur === o.value ? ' selected' : ''}>${o.label}</option>`
    ).join('');
    return `
      <div class="row">
        <div class="label-col">
          <label>${label}</label>
          ${hint ? `<span class="hint">${hint}</span>` : ''}
        </div>
        <select data-key="${key}">${opts}</select>
      </div>`;
  }

  _col(key, label, val) {
    return `
      <div class="row">
        <label>${label}</label>
        <input type="color" data-key="${key}" value="${val || '#000000'}">
      </div>`;
  }

  _rng(key, label, min, max, step, hint = '') {
    const v = this._config[key] ?? DEFAULT_CONFIG[key] ?? 1;
    return `
      <div class="row">
        <div class="label-col">
          <label>${label}</label>
          ${hint ? `<span class="hint">${hint}</span>` : ''}
        </div>
        <input type="range" data-key="${key}" min="${min}" max="${max}" step="${step}" value="${v}">
        <span class="val" data-val="${key}">${parseFloat(v).toFixed(step < 1 ? 2 : 0)}</span>
      </div>`;
  }

  _numInput(key, min, max, val) {
    return `<input type="number" data-key="${key}" min="${min}" max="${max}" value="${val ?? 0}">`;
  }

  _chk(key, label, hint = '') {
    return `
      <div class="row">
        <div class="label-col">
          <label>${label}</label>
          ${hint ? `<span class="hint">${hint}</span>` : ''}
        </div>
        <input type="checkbox" data-key="${key}"${this._config[key] ? ' checked' : ''}>
      </div>`;
  }

  _titleCase(str) {
    return str.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }

  // ── events ────────────────────────────────────────────────────────────────

  _attach() {
    this.shadowRoot.querySelectorAll('[data-key]').forEach(el => {
      el.addEventListener('change', e => this._onChange(e));
      // Live update for range sliders
      if (el.type === 'range') {
        el.addEventListener('input', e => this._onInput(e));
      }
    });
  }

  _onInput(e) {
    const key = e.target.dataset.key;
    const lbl = this.shadowRoot.querySelector(`[data-val="${key}"]`);
    if (lbl) {
      const step = parseFloat(e.target.step);
      lbl.textContent = parseFloat(e.target.value).toFixed(step < 1 ? 2 : 0);
    }
  }

  _onChange(e) {
    const key = e.target.dataset.key;
    let value;

    if (e.target.type === 'checkbox')            value = e.target.checked;
    else if (e.target.type === 'range' ||
             e.target.type === 'number')          value = parseFloat(e.target.value);
    else                                          value = e.target.value;

    // Update range label
    this._onInput(e);

    // Apply colour theme preset (overrides individual colour fields)
    let patch = { [key]: value };
    if (key === 'color_theme' && value !== 'custom') {
      patch = { color_theme: value, ...(COLOR_THEMES[value] || {}) };
    }

    this._config = { ...this._config, ...patch };

    // Conditional visibility: fixed-size row
    if (key === 'font_size_mode') {
      const row = this.shadowRoot.querySelector('.fixed-size-row');
      if (row) row.style.display = value === 'fixed' ? '' : 'none';
    }

    this.dispatchEvent(new CustomEvent('config-changed', {
      detail: { config: this._config },
      bubbles: true,
      composed: true,
    }));
  }
}

customElements.define('text-clock-card-editor', TextClockCardEditor);

const loadedFonts = new Set();

function loadFont(key) {
  if (!FONT_URLS[key] || loadedFonts.has(key)) return;
  loadedFonts.add(key);
  const link = document.createElement('link');
  link.rel   = 'stylesheet';
  link.href  = FONT_URLS[key];
  document.head.appendChild(link);
}

class TextClockCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._config      = { ...DEFAULT_CONFIG };
    this._activeCells = new Set();
    this._activeKey   = '';
    this._effectMgr   = null;
    this._mainTimer   = null;
    this._secondTimer = null;
    this._resizeObs   = null;
    this._wrapper     = null;
    this._grid        = null;
    this._ready       = false; // true once DOM is built and first update run
  }

  // ── HA interface ──────────────────────────────────────────────────────────

  static getStubConfig() {
    return { ...DEFAULT_CONFIG };
  }

  setConfig(config) {
    const theme = (config.color_theme && config.color_theme !== 'custom')
      ? (COLOR_THEMES[config.color_theme] || {})
      : {};
    this._config = { ...DEFAULT_CONFIG, ...theme, ...config };
    this._ready  = false;

    if (this.isConnected) this._reset();
  }

  // HA calls set hass on every state update — use it as a guaranteed first-paint trigger.
  set hass(_) {
    if (!this._ready && this._config && this.isConnected) {
      this._reset();
    }
  }

  getCardSize() { return 4; }

  static getConfigElement() {
    return document.createElement('text-clock-card-editor');
  }

  // ── lifecycle ─────────────────────────────────────────────────────────────

  connectedCallback() {
    this._reset();
  }

  disconnectedCallback() {
    this._teardown();
  }

  // ── core ──────────────────────────────────────────────────────────────────

  _reset() {
    this._teardown();
    this._buildDOM();
    // Synchronous first paint of active cells
    this._update();
    this._ready = true;
    // Deferred recalc after browser has measured layout
    requestAnimationFrame(() => {
      this._recalcFontSize();
      // Second pass in case first RAF fired before layout was stable
      requestAnimationFrame(() => this._recalcFontSize());
    });
    this._startTimers();
    this._startResizeObserver();
  }

  _teardown() {
    clearInterval(this._mainTimer);
    clearInterval(this._secondTimer);
    if (this._resizeObs) this._resizeObs.disconnect();
    if (this._effectMgr) this._effectMgr.destroy();
    this._mainTimer   = null;
    this._secondTimer = null;
    this._resizeObs   = null;
    this._effectMgr   = null;
  }

  // ── DOM ───────────────────────────────────────────────────────────────────

  _buildDOM() {
    const cfg    = this._config;
    const shadow = this.shadowRoot;

    loadFont(cfg.font_family);

    let gridHTML = '';
    for (let r = 0; r < ROWS; r++) {
      gridHTML += '<div class="tc-row">';
      for (let c = 0; c < COLS; c++) {
        gridHTML += `<span class="cell" data-pos="${r}-${c}">${GRID_ROWS[r][c]}</span>`;
      }
      gridHTML += '</div>';
    }

    const dots   = '<div class="dot tl"></div><div class="dot tr"></div><div class="dot bl"></div><div class="dot br"></div>';
    const canvas = cfg.effect_mode === 'matrix' ? '<canvas class="matrix-canvas"></canvas>' : '';

    // Use a plain div instead of ha-card so CSS variables and styles are not
    // subject to ha-card's shadow boundary slot quirks.
    shadow.innerHTML = `
      <style>${this._css()}</style>
      <div class="tc-card">
        <div class="tc-wrap">
          ${canvas}
          <div class="tc-grid">${gridHTML}</div>
          ${dots}
        </div>
      </div>
    `;

    this._wrapper = shadow.querySelector('.tc-wrap');
    this._grid    = shadow.querySelector('.tc-grid');

    this._effectMgr = new EffectManager(shadow, cfg);
  }

  _css() {
    const c    = this._config;
    const gr   = Math.round(c.effect_intensity * 22);
    const tdur = c.transition_duration;
    const ff   = FONT_FAMILIES[c.font_family] || 'monospace';
    const pw   = Math.round(c.padding / 2);
    const dotOp = c.second_dot_mode === 'corners' ? '1' : '0';

    // Use literal colour values — avoids CSS variable inheritance issues
    // across shadow boundaries when card is slotted inside other elements.
    const glowCSS = c.effect_mode === 'glow' ? `
      .cell.active {
        text-shadow:
          0 0 ${gr}px ${c.active_color},
          0 0 ${gr * 2}px ${c.active_color};
      }` : '';

    return `
      :host {
        display: block;
        ${c.aspect_ratio !== 'fill' ? `aspect-ratio: ${c.aspect_ratio};` : ''}
      }
      .tc-card {
        background: ${c.background_color};
        border-radius: var(--ha-card-border-radius, 12px);
        box-shadow: var(--ha-card-box-shadow, 0 2px 8px rgba(0,0,0,0.4));
        overflow: hidden;
        width: 100%;
        height: 100%;
        box-sizing: border-box;
      }
      .tc-wrap {
        position: relative;
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: ${c.padding}px;
        box-sizing: border-box;
        overflow: hidden;
      }
      .tc-grid {
        display: flex;
        flex-direction: column;
        align-items: center;
        line-height: 1.35;
        font-family: ${ff};
        font-size: 20px;
        font-weight: bold;
        position: relative;
        z-index: 1;
        user-select: none;
        flex-shrink: 0;
      }
      .tc-row {
        display: flex;
        white-space: nowrap;
      }
      .cell {
        display: inline-block;
        min-width: ${c.letter_spacing}ch;
        text-align: center;
        color: ${c.inactive_color};
        opacity: ${c.inactive_opacity};
        transition:
          color ${tdur}ms ease,
          opacity ${tdur}ms ease,
          text-shadow ${tdur}ms ease;
        cursor: default;
      }
      .cell.active {
        color: ${c.active_color};
        opacity: 1;
      }
      ${glowCSS}
      .dot {
        position: absolute;
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: ${c.active_color};
        opacity: ${dotOp};
        transition: opacity 0.4s;
      }
      .dot.tl { top: ${pw}px;    left: ${pw}px;   }
      .dot.tr { top: ${pw}px;    right: ${pw}px;  }
      .dot.bl { bottom: ${pw}px; left: ${pw}px;   }
      .dot.br { bottom: ${pw}px; right: ${pw}px;  }
      .matrix-canvas {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 0;
      }
      @keyframes tcPixelIn {
        from { transform: translate(var(--dx), var(--dy)); opacity: 0; }
        to   { transform: none; opacity: 1; }
      }
      @keyframes tcPixelOut {
        from { transform: none; opacity: 1; }
        to   { transform: translate(var(--dx), var(--dy)); opacity: 0; }
      }
      @keyframes tcTypeIn {
        from { opacity: 0; transform: scaleY(0); }
        to   { opacity: 1; transform: none; }
      }
    `;
  }

  // ── update ────────────────────────────────────────────────────────────────

  _update() {
    const now   = new Date();
    const cells = resolveActiveCells(now);
    const key   = cellSetKey(cells);

    if (key !== this._activeKey) {
      const prev        = this._activeCells;
      this._activeCells = cells;
      this._activeKey   = key;
      this._applyActiveCells(cells, prev);
    }

    this._updateDots(now.getSeconds());
  }

  _applyActiveCells(newCells, prevCells) {
    const mode      = this._config.effect_mode;
    const delegated = mode === 'pixel_reveal' || mode === 'typewriter';

    if (!delegated) {
      this.shadowRoot.querySelectorAll('.cell').forEach(cell => {
        const active = newCells.has(cell.dataset.pos);
        cell.classList.toggle('active', active);

        // Clear any inline colour left by aurora / ambient_drift so the
        // stylesheet rule (literal colour values) takes over cleanly.
        if (mode !== 'aurora') {
          cell.style.color      = '';
          cell.style.textShadow = '';
        }
      });
    }

    if (this._effectMgr) this._effectMgr.onTransition(newCells, prevCells);
  }

  _updateDots(secs) {
    const mode = this._config.second_dot_mode;
    if (mode === 'none' || mode === 'corners') return;

    const dots = this.shadowRoot.querySelectorAll('.dot');
    if (!dots.length) return;

    if (mode === 'pulse') {
      const op = (0.35 + 0.65 * Math.abs(Math.sin(secs * Math.PI))).toFixed(3);
      dots.forEach(d => { d.style.opacity = op; });
    } else if (mode === 'sweep') {
      const order  = ['tl', 'tr', 'br', 'bl'];
      const active = Math.floor(secs / 15) % 4;
      dots.forEach(d => { d.style.opacity = '0.15'; });
      const sel = this.shadowRoot.querySelector(`.dot.${order[active]}`);
      if (sel) sel.style.opacity = '1';
    }
  }

  // ── timers ────────────────────────────────────────────────────────────────

  _startTimers() {
    this._mainTimer = setInterval(() => this._update(), 5000);

    const dotMode = this._config.second_dot_mode;
    if (dotMode === 'pulse' || dotMode === 'sweep') {
      this._secondTimer = setInterval(() => {
        this._updateDots(new Date().getSeconds());
      }, 1000);
    }
  }

  // ── auto font size ────────────────────────────────────────────────────────

  _startResizeObserver() {
    // Observe the host element — HA always assigns it a width via the grid
    // layout, and with aspect-ratio:1 the height is derived from that width.
    this._resizeObs = new ResizeObserver(() => this._recalcFontSize());
    this._resizeObs.observe(this);
  }

  _recalcFontSize() {
    if (!this._config || this._config.font_size_mode !== 'auto') return;

    const grid = this._grid;
    if (!grid) return;

    const pad    = this._config.padding;
    // Use the host element's dimensions — they are always well-defined because
    // HA provides a width and aspect-ratio:1 gives a matching height.
    const availW = this.clientWidth  - pad * 2;
    const availH = this.clientHeight - pad * 2;
    if (availW <= 10 || availH <= 10) return;

    const curFS = parseFloat(grid.style.fontSize) || 20;

    const sample = grid.querySelector('.tc-row');
    if (!sample) return;

    const rowW = sample.scrollWidth;   // natural width of one row at curFS
    const rowH = sample.offsetHeight;  // natural height of one row at curFS
    if (rowW <= 0 || rowH <= 0) return;

    const scaleW = availW / rowW;
    const scaleH = availH / (rowH * ROWS);

    // 0.97 safety margin prevents single-pixel overflow clipping.
    const scale = Math.min(scaleW, scaleH) * 0.97;
    const newFS = Math.max(6, Math.min(300, Math.floor(curFS * scale)));

    if (Math.abs(newFS - curFS) >= 1) {
      grid.style.fontSize = `${newFS}px`;
    }
  }
}

customElements.define('text-clock-card', TextClockCard);

window.customCards = window.customCards || [];
window.customCards.push({
  type:             'text-clock-card',
  name:             'Text Clock Card',
  description:      'A beautiful word clock card for Home Assistant',
  preview:          true,
  configurable:     true,
  documentationURL: 'https://github.com/squizzer73/text_clock',
});
