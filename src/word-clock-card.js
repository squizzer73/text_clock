import { DEFAULT_CONFIG, COLOR_THEMES, FONT_URLS, FONT_FAMILIES } from './config-schema.js';
import { GRID_ROWS, COLS, ROWS } from './grid-layouts.js';
import { resolveActiveCells, cellSetKey } from './time-resolver.js';
import { EffectManager } from './effects.js';
import './word-clock-editor.js';

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
    this._config      = null;
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
  documentationURL: 'https://github.com/squizzer73/text_clock',
});
