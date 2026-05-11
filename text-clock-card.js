const DEFAULT_CONFIG = {
  active_color: '#2B7EFF',
  inactive_color: '#1a2035',
  background_color: '#090e1a',
  font_family: 'mono',
  letter_spacing: 1.2,
  inactive_opacity: 0.15,
  padding: 16,
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
const COLS = 11;
const ROWS = 10;

// Each string is exactly 11 characters; uppercase, fillers fill unused cells.
const GRID_ROWS = [
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
const WORD_POSITIONS = {
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

    this.shadowRoot.innerHTML = `
      <style>
        :host { display: block; padding: 16px; font-family: var(--paper-font-body1_-_font-family, sans-serif); }
        details { border: 1px solid var(--divider-color, #ddd); border-radius: 8px; margin-bottom: 8px; padding: 4px 10px 10px; }
        summary { cursor: pointer; font-weight: 600; padding: 6px 0; color: var(--primary-text-color, #000); list-style: none; }
        summary::before { content: '▶'; display: inline-block; margin-right: 6px; transition: transform 0.2s; }
        details[open] summary::before { transform: rotate(90deg); }
        .row { display: flex; align-items: center; justify-content: space-between; padding: 5px 0; font-size: 14px; }
        .row label { flex: 1; color: var(--primary-text-color, #333); }
        input[type="color"]    { width: 48px; height: 28px; padding: 1px; border: 1px solid var(--divider-color,#ccc); border-radius: 4px; cursor: pointer; }
        input[type="range"]    { width: 110px; }
        input[type="number"]   { width: 64px; padding: 2px 4px; border: 1px solid var(--divider-color,#ccc); border-radius: 4px; }
        input[type="checkbox"] { width: 18px; height: 18px; cursor: pointer; }
        select                 { width: 140px; padding: 3px; border: 1px solid var(--divider-color,#ccc); border-radius: 4px; background: var(--card-background-color, #fff); color: var(--primary-text-color, #333); }
        .val                   { min-width: 36px; text-align: right; font-size: 12px; color: var(--secondary-text-color, #888); margin-left: 4px; }
      </style>

      <details open>
        <summary>Appearance</summary>
        ${this._sel('color_theme', 'Colour Theme', [...Object.keys(COLOR_THEMES), 'custom'])}
        ${this._col('active_color',     'Active Colour',     c.active_color)}
        ${this._col('inactive_color',   'Inactive Colour',   c.inactive_color)}
        ${this._col('background_color', 'Background',        c.background_color)}
        ${this._sel('font_family',      'Font',              Object.keys(FONT_FAMILIES))}
        ${this._rng('inactive_opacity', 'Inactive Opacity',  0, 1, 0.01)}
      </details>

      <details>
        <summary>Layout</summary>
        ${this._sel('font_size_mode',  'Font Size Mode',   ['auto', 'fixed'])}
        ${this._num('font_size_fixed', 'Fixed Size (px)',  8, 120)}
        ${this._num('padding',         'Padding (px)',      0, 64)}
        ${this._rng('letter_spacing',  'Letter Spacing',   0.8, 2.5, 0.05)}
      </details>

      <details>
        <summary>Effects</summary>
        ${this._sel('effect_mode',         'Effect Mode',       ['none', 'glow', 'matrix', 'pixel_reveal', 'typewriter', 'aurora'])}
        ${this._rng('effect_speed',        'Speed',             0.1, 3.0, 0.1)}
        ${this._rng('effect_intensity',    'Intensity',         0.0, 1.0, 0.05)}
        ${this._num('transition_duration', 'Transition (ms)',   100, 3000)}
        ${this._sel('second_dot_mode',     'Second Dots',       ['none', 'corners', 'pulse', 'sweep'])}
        ${this._chk('ambient_drift',       'Ambient Drift')}
      </details>
    `;

    this._attach();
  }

  _sel(key, label, opts) {
    const current = this._config[key];
    const options = opts.map(o =>
      `<option value="${o}"${current === o ? ' selected' : ''}>${o.replace(/_/g, ' ')}</option>`
    ).join('');
    return `<div class="row"><label>${label}</label><select data-key="${key}">${options}</select></div>`;
  }

  _col(key, label, val) {
    return `<div class="row"><label>${label}</label><input type="color" data-key="${key}" value="${val || '#000000'}"></div>`;
  }

  _rng(key, label, min, max, step) {
    const v = this._config[key] ?? 1;
    return `
      <div class="row">
        <label>${label}</label>
        <input type="range" data-key="${key}" min="${min}" max="${max}" step="${step}" value="${v}">
        <span class="val" data-val="${key}">${parseFloat(v).toFixed(2)}</span>
      </div>`;
  }

  _num(key, label, min, max) {
    return `<div class="row"><label>${label}</label><input type="number" data-key="${key}" min="${min}" max="${max}" value="${this._config[key] ?? 0}"></div>`;
  }

  _chk(key, label) {
    return `<div class="row"><label>${label}</label><input type="checkbox" data-key="${key}"${this._config[key] ? ' checked' : ''}></div>`;
  }

  _attach() {
    this.shadowRoot.querySelectorAll('[data-key]').forEach(el => {
      el.addEventListener('change', e => {
        const key = e.target.dataset.key;
        let value;

        if (e.target.type === 'checkbox') {
          value = e.target.checked;
        } else if (e.target.type === 'range' || e.target.type === 'number') {
          value = parseFloat(e.target.value);
        } else {
          value = e.target.value;
        }

        // Live-update range label
        if (e.target.type === 'range') {
          const lbl = this.shadowRoot.querySelector(`[data-val="${key}"]`);
          if (lbl) lbl.textContent = parseFloat(value).toFixed(2);
        }

        // Apply colour theme preset
        let patch = { [key]: value };
        if (key === 'color_theme' && value !== 'custom') {
          patch = { color_theme: value, ...(COLOR_THEMES[value] || {}) };
        }

        this._config = { ...this._config, ...patch };

        this.dispatchEvent(new CustomEvent('config-changed', {
          detail: { config: this._config },
          bubbles: true,
          composed: true,
        }));
      });
    });
  }
}

customElements.define('text-clock-card-editor', TextClockCardEditor);

const loadedFonts = new Set();

function loadFont(key) {
  if (!FONT_URLS[key] || loadedFonts.has(key)) return;
  loadedFonts.add(key);
  const link   = document.createElement('link');
  link.rel     = 'stylesheet';
  link.href    = FONT_URLS[key];
  document.head.appendChild(link);
}

class TextClockCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._config       = null;
    this._activeCells  = new Set();
    this._activeKey    = '';
    this._effectMgr    = null;
    this._mainTimer    = null;
    this._secondTimer  = null;
    this._resizeObs    = null;
    this._wrapper      = null;
    this._grid         = null;
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

    if (this.isConnected) this._reset();
  }

  // hass setter is required by the HA interface but this card doesn't use entity data.
  set hass(_) {}

  getCardSize() { return 4; }

  getConfigElement() {
    return document.createElement('text-clock-card-editor');
  }

  // ── lifecycle ─────────────────────────────────────────────────────────────

  connectedCallback() {
    if (this._config) this._reset();
  }

  disconnectedCallback() {
    this._teardown();
  }

  // ── core ──────────────────────────────────────────────────────────────────

  _reset() {
    this._teardown();
    this._buildDOM();
    this._update();
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

    // Grid rows
    let gridHTML = '';
    for (let r = 0; r < ROWS; r++) {
      gridHTML += '<div class="tc-row">';
      for (let c = 0; c < COLS; c++) {
        gridHTML += `<span class="cell" data-pos="${r}-${c}">${GRID_ROWS[r][c]}</span>`;
      }
      gridHTML += '</div>';
    }

    // Corner dots
    const dots = '<div class="dot tl"></div><div class="dot tr"></div><div class="dot bl"></div><div class="dot br"></div>';

    // Matrix canvas only injected when needed (avoids unused DOM)
    const canvas = cfg.effect_mode === 'matrix' ? '<canvas class="matrix-canvas"></canvas>' : '';

    shadow.innerHTML = `
      <style>${this._css()}</style>
      <ha-card>
        <div class="tc-wrap">
          ${canvas}
          <div class="tc-grid">${gridHTML}</div>
          ${dots}
        </div>
      </ha-card>
    `;

    this._wrapper = shadow.querySelector('.tc-wrap');
    this._grid    = shadow.querySelector('.tc-grid');

    this._effectMgr = new EffectManager(shadow, cfg);
  }

  _css() {
    const c   = this._config;
    const gr  = Math.round(c.effect_intensity * 22);
    const tdur = c.transition_duration;
    const ff  = FONT_FAMILIES[c.font_family] || 'monospace';
    const dotShow = c.second_dot_mode === 'corners' ? '1' : '0';
    const pw  = Math.round(c.padding / 2);

    return `
      :host {
        display: block;
        --tc-active:   ${c.active_color};
        --tc-inactive: ${c.inactive_color};
        --tc-bg:       ${c.background_color};
        --tc-opacity:  ${c.inactive_opacity};
        --tc-glow:     ${gr}px;
        --tc-tdur:     ${tdur}ms;
      }
      ha-card {
        background: var(--tc-bg);
        overflow: hidden;
        height: 100%;
        border-radius: var(--ha-card-border-radius, 12px);
      }
      .tc-wrap {
        position: relative;
        width: 100%;
        height: 100%;
        min-height: 180px;
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
      }
      .tc-row {
        display: flex;
      }
      .cell {
        display: inline-block;
        min-width: ${c.letter_spacing}ch;
        text-align: center;
        color: var(--tc-inactive);
        opacity: var(--tc-opacity);
        transition: color var(--tc-tdur) ease, opacity var(--tc-tdur) ease, text-shadow var(--tc-tdur) ease;
        cursor: default;
      }
      .cell.active {
        color: var(--tc-active);
        opacity: 1;
      }
      ${c.effect_mode === 'glow' ? `
      .cell.active {
        text-shadow:
          0 0 var(--tc-glow) var(--tc-active),
          0 0 calc(var(--tc-glow) * 2) var(--tc-active);
      }` : ''}
      .dot {
        position: absolute;
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: var(--tc-active);
        opacity: ${dotShow};
        transition: opacity 0.4s;
      }
      .dot.tl { top: ${pw}px;  left: ${pw}px;  }
      .dot.tr { top: ${pw}px;  right: ${pw}px; }
      .dot.bl { bottom: ${pw}px; left: ${pw}px;  }
      .dot.br { bottom: ${pw}px; right: ${pw}px; }
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
      const prev       = this._activeCells;
      this._activeCells = cells;
      this._activeKey   = key;
      this._applyActiveCells(cells, prev);
    }

    this._updateDots(now.getSeconds());
  }

  _applyActiveCells(newCells, prevCells) {
    const mode = this._config.effect_mode;

    // pixel_reveal and typewriter transitions are handled by EffectManager.
    // For those modes we still need to set the .active class, but let the
    // effect manager drive timing.
    const delegated = mode === 'pixel_reveal' || mode === 'typewriter';

    if (!delegated) {
      this.shadowRoot.querySelectorAll('.cell').forEach(cell => {
        cell.classList.toggle('active', newCells.has(cell.dataset.pos));
        // Aurora / ambient_drift clear inline color so CSS var takes over
        if (mode !== 'aurora') {
          cell.style.color = '';
          cell.style.textShadow = '';
        }
      });
    }

    // Notify effect manager — it handles pixel_reveal and typewriter animations.
    if (this._effectMgr) this._effectMgr.onTransition(newCells, prevCells);

    // After applying classes, re-calc font size (cell count didn't change but
    // active state may affect bounding box in some fonts).
    requestAnimationFrame(() => this._recalcFontSize());
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
      const order = ['tl', 'tr', 'br', 'bl'];
      const active = Math.floor(secs / 15) % 4;
      dots.forEach(d  => { d.style.opacity = '0.15'; });
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
    if (!this._wrapper) return;
    this._resizeObs = new ResizeObserver(() => this._recalcFontSize());
    this._resizeObs.observe(this._wrapper);
  }

  _recalcFontSize() {
    const cfg = this._config;
    if (cfg.font_size_mode !== 'auto') return;

    const wrap = this._wrapper;
    const grid = this._grid;
    if (!wrap || !grid) return;

    const availW = wrap.clientWidth  - cfg.padding * 2;
    const availH = wrap.clientHeight - cfg.padding * 2;
    if (availW <= 0 || availH <= 0) return;

    const curFS  = parseFloat(grid.style.fontSize) || 20;
    const gridW  = grid.scrollWidth;
    const gridH  = grid.scrollHeight;
    if (gridW <= 0 || gridH <= 0) return;

    // Scale from current rendered dimensions to available space.
    const scale  = Math.min(availW / gridW, availH / gridH);
    const newFS  = Math.max(6, Math.min(300, Math.floor(curFS * scale)));

    if (Math.abs(newFS - curFS) >= 1) {
      grid.style.fontSize = `${newFS}px`;
    }
  }
}

customElements.define('text-clock-card', TextClockCard);

window.customCards = window.customCards || [];
window.customCards.push({
  type:        'text-clock-card',
  name:        'Text Clock Card',
  description: 'A beautiful word clock card for Home Assistant',
  preview:     true,
  documentationURL: 'https://github.com/squizzer73/text_clock',
});
