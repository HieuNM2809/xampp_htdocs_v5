# Super Pipe Bros

A vanilla-JS Mario clone built as a learning project. No frameworks, no build step — just open `index.html` over HTTP.

## Run

```bash
# any static server works (ES modules need HTTP, not file://)
npx serve .
```

Then open the printed URL.

## Controls

| Key | Action |
|---|---|
| ← / → or A / D | Move |
| Space / W / ↑ | Jump (hold for higher) |
| Shift | Run |
| X / J | Shoot fireball (Fire Mario only) |
| Enter | Start / Confirm |
| Esc | Pause |
| R | Retry (Game Over) |
| Q | Quit to menu |
| M | Mute |

### Debug

| Key | Toggle |
|---|---|
| F1 | Draw AABB boxes |
| F2 | FPS + entity count |
| F3 | Skip to next level |
| F4 | God mode |

## Features

- 4 levels: Overworld, Underground, Sky, Castle (boss)
- 3 player forms: small / big / fire
- Power-ups: mushroom, fire flower
- Enemies: Goomba (+ flying variant), Koopa (3-phase shell)
- Final boss with HP bar — only fireballs hurt it
- WebAudio synthesizer — 9 SFX + 3 chiptune music tracks (no audio files)
- High-score persistence (localStorage)

## Architecture

See `docs/superpowers/specs/2026-05-23-mario-game-design.md`.

## Tests

```bash
npm install
npm test
```

Unit tests cover physics (AABB), entity state machines (Goomba/Koopa/Boss), and storage. Render and audio are verified by playtest.
