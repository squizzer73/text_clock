# Text Clock Card

A beautiful word clock card for Home Assistant that displays the current time as illuminated words in an 11×10 letter grid.

## Features

- Classic word clock layout (IT IS HALF PAST TEN, etc.)
- Auto-sizing font fills the card perfectly via ResizeObserver
- 6 visual effects: glow, matrix, pixel reveal, typewriter, aurora
- 6 colour themes: amber, green phosphor, paper, nord, dracula, solarised
- 6 font choices including VT323, Orbitron, and Press Start 2P
- Second-dot indicators: corners, pulse, sweep
- Ambient drift mode for inactive letters
- Full GUI editor — no YAML required

## Installation via HACS

1. Add this repository as a custom repository in HACS (type: Lovelace).
2. Install **Text Clock Card**.
3. Add the card to your dashboard.

## Manual Installation

Copy `dist/text-clock-card.js` to `config/www/` and add to your Lovelace resources:

```yaml
url: /local/text-clock-card.js
type: module
```
