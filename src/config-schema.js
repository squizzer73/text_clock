export const DEFAULT_CONFIG = {
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

export const COLOR_THEMES = {
  solarised:      { active_color: '#268bd2', inactive_color: '#073642', background_color: '#002b36' },
  nord:           { active_color: '#88c0d0', inactive_color: '#3b4252', background_color: '#2e3440' },
  dracula:        { active_color: '#bd93f9', inactive_color: '#3d3f4f', background_color: '#1e1f29' },
  amber:          { active_color: '#ffb000', inactive_color: '#2a1a00', background_color: '#1a1000' },
  green_phosphor: { active_color: '#00ff41', inactive_color: '#001a05', background_color: '#000d02' },
  paper:          { active_color: '#333333', inactive_color: '#aaaaaa', background_color: '#f5f0e8' },
};

export const FONT_URLS = {
  vt323:       'https://fonts.googleapis.com/css2?family=VT323&display=swap',
  orbitron:    'https://fonts.googleapis.com/css2?family=Orbitron:wght@700&display=swap',
  press_start: 'https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap',
  share_tech:  'https://fonts.googleapis.com/css2?family=Share+Tech+Mono&display=swap',
};

export const FONT_FAMILIES = {
  mono:        'monospace',
  vt323:       "'VT323', monospace",
  orbitron:    "'Orbitron', monospace",
  press_start: "'Press Start 2P', monospace",
  share_tech:  "'Share Tech Mono', monospace",
  courier:     "'Courier New', Courier, monospace",
};
