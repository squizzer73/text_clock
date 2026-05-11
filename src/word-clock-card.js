import { DEFAULT_CONFIG, COLOR_THEMES, FONT_URLS, FONT_FAMILIES } from './config-schema.js';
import { GRID_ROWS, COLS, ROWS } from './grid-layouts.js';
import { resolveActiveCells, cellSetKey } from './time-resolver.js';
import { EffectManager } from './effects.js';
import './word-clock-editor.js';

const loadedFonts = new Set();

function loadFont(key) {
  if (!FONT_URLS[key] || loadedFonts.has(key)) return;
  loadedFonts.add(key);
  const link   = document.createElement('link');
  link.rel     = 'stylesheet';
  link.href    = FONT_URLS[key];
  document.head.appendChild(link);
}

function setsEqual(a, b) {
  if (a.size !== b.size) return false;
  for (const v of a) if (!b.has(v)) return false;
  return true;
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
