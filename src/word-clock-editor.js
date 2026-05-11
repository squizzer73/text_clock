import { DEFAULT_CONFIG, COLOR_THEMES, FONT_FAMILIES } from './config-schema.js';

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
