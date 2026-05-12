import { DEFAULT_CONFIG, COLOR_THEMES, FONT_FAMILIES } from './config-schema.js';

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
    const v = this._config[key] ?? 1;
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
