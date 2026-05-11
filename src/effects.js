import { COLS } from './grid-layouts.js';

export class EffectManager {
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
    const cfg = this._cfg;

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
