# Super Pipe Bros Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a 2D side-scrolling Mario-style game in vanilla JS + Canvas, runnable from `index.html`, with 4 levels + boss, 3 player forms, power-ups, audio, and high-score persistence.

**Architecture:** Modular ES modules — 6 infrastructure modules (`input`, `renderer`, `physics`, `audio`, `storage`, `ui`) that don't import each other, plus an `entities/` and `levels/` folder. `game.js` orchestrates everything via a fixed-timestep loop (60Hz update + render-every-frame) and a 5-state machine.

**Tech Stack:** Vanilla JavaScript (ES2022 modules), Canvas 2D API, WebAudio API, `localStorage`. Vitest for unit tests (dev-only dependency).

**Defaults chosen for spec open questions:**
- Working name `Super Pipe Bros` retained.
- HUD `TIME` is **decorative** (display only, doesn't kill player at 0). Can be promoted later.
- Flag touch = immediate next level (no slide animation, no bonus calc).

---

## Reference: file map

| Path | Responsibility |
|---|---|
| `index.html` | `<canvas>` + nạp `src/main.js` as ES module |
| `style.css` | reset + full-screen canvas centering |
| `src/main.js` | entry — instantiate Game, bind to window |
| `src/game.js` | state machine + main loop (rAF) |
| `src/input.js` | keyboard handler → action state |
| `src/renderer.js` | drawing primitives (roundRect, gradients, camera transform) |
| `src/physics.js` | AABB collision, gravity, friction (pure functions) |
| `src/audio.js` | WebAudio SFX synth + music scheduler |
| `src/storage.js` | localStorage wrapper |
| `src/ui.js` | HUD, menu, pause, game over, victory (pure draw fns) |
| `src/entities/player.js` | Mario (small/big/fire states) |
| `src/entities/goomba.js` | basic + flying variant |
| `src/entities/koopa.js` | Koopa + KoopaShell |
| `src/entities/block.js` | Ground, Brick, QBlock, Pipe, Flag |
| `src/entities/item.js` | Coin, Mushroom, FireFlower |
| `src/entities/fireball.js` | Mario's projectile |
| `src/entities/boss.js` | Final boss |
| `src/levels/level1.js`..`level4.js` | static level data |
| `test/physics.test.js` | AABB resolution tests |
| `test/entities.test.js` | Player/Koopa state machine tests |
| `test/storage.test.js` | localStorage hi-score logic |
| `package.json` | only for vitest dev-dependency |
| `README.md` | how to run + controls |

---

## Phase 1 — Bootstrap

### Task 1: Project skeleton

**Files:**
- Create: `index.html`
- Create: `style.css`
- Create: `src/main.js`
- Create: `README.md`

- [ ] **Step 1: Create `index.html`**

```html
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <title>Super Pipe Bros</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <canvas id="game" width="800" height="480"></canvas>
  <script type="module" src="src/main.js"></script>
</body>
</html>
```

- [ ] **Step 2: Create `style.css`**

```css
* { margin: 0; padding: 0; box-sizing: border-box; }
html, body { height: 100%; background: #000; }
body { display: flex; align-items: center; justify-content: center; }
canvas { background: #5c94fc; image-rendering: auto; box-shadow: 0 0 20px rgba(0,0,0,0.5); }
```

- [ ] **Step 3: Create `src/main.js` (placeholder)**

```js
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
ctx.fillStyle = '#fff';
ctx.font = '24px monospace';
ctx.fillText('Super Pipe Bros — booting...', 200, 240);
```

- [ ] **Step 4: Create `README.md`**

```markdown
# Super Pipe Bros

A vanilla-JS Mario clone built as a learning project.

## Run

Because the game uses ES modules, you need to serve via HTTP (not `file://`):

```bash
# Option 1: any static server
npx serve .

# Option 2: with XAMPP — put folder under htdocs/, open http://localhost/.../index.html
```

Then open the URL in your browser.

## Controls

| Key | Action |
|---|---|
| ← / → / A / D | Move |
| Space / W / ↑ | Jump |
| Shift | Run |
| X / J | Shoot fireball (Fire Mario) |
| Enter | Start / Confirm |
| Esc | Pause |
| R | Retry (Game Over) |
| Q | Quit to menu |
| M | Mute |

## Test

```bash
npm install
npm test
```
```

- [ ] **Step 5: Verify boot — serve and open in browser**

Run: `npx serve .` (or use XAMPP). Open the URL.

Expected: blue canvas with white text "Super Pipe Bros — booting...".

- [ ] **Step 6: Commit**

```bash
git add index.html style.css src/main.js README.md
git commit -m "feat(bootstrap): canvas skeleton + entry point"
```

### Task 2: Test infrastructure

**Files:**
- Create: `package.json`
- Create: `test/smoke.test.js`

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "super-pipe-bros",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "devDependencies": {
    "vitest": "^1.6.0"
  }
}
```

- [ ] **Step 2: Install**

Run: `npm install`
Expected: vitest installs, `node_modules/` created, no errors.

- [ ] **Step 3: Create smoke test `test/smoke.test.js`**

```js
import { describe, it, expect } from 'vitest';

describe('smoke', () => {
  it('vitest is working', () => {
    expect(1 + 1).toBe(2);
  });
});
```

- [ ] **Step 4: Run tests**

Run: `npm test`
Expected: 1 passed.

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json test/smoke.test.js
git commit -m "chore(test): add vitest"
```

> Note: add `node_modules/` to `.gitignore` (root repo gitignore already covers `node_modules` patterns in similar projects, but check). If not ignored, add an entry: `/134_superpower/Example/node_modules`.

### Task 3: Game loop skeleton

**Files:**
- Modify: `src/main.js`
- Create: `src/game.js`

- [ ] **Step 1: Create `src/game.js`**

```js
const FIXED_DT = 1 / 60;

export function createGame(canvas) {
  const ctx = canvas.getContext('2d');
  const game = {
    state: 'PLAYING',  // temporary — full state machine added in Task 24
    width: canvas.width,
    height: canvas.height,
    frame: 0,
    fps: 0,
    _acc: 0,
    _last: performance.now(),
    _fpsLast: performance.now(),
    _fpsCount: 0,
  };

  function update(dt) {
    game.frame++;
  }

  function render() {
    ctx.fillStyle = '#5c94fc';
    ctx.fillRect(0, 0, game.width, game.height);
    ctx.fillStyle = '#fff';
    ctx.font = '20px monospace';
    ctx.fillText(`Frame ${game.frame}  FPS ${game.fps}`, 20, 30);
  }

  function tick(now) {
    const frame = (now - game._last) / 1000;
    game._last = now;
    game._acc += Math.min(frame, 0.1);

    while (game._acc >= FIXED_DT) {
      if (game.state === 'PLAYING') update(FIXED_DT);
      game._acc -= FIXED_DT;
    }

    game._fpsCount++;
    if (now - game._fpsLast >= 1000) {
      game.fps = game._fpsCount;
      game._fpsCount = 0;
      game._fpsLast = now;
    }

    render();
    requestAnimationFrame(tick);
  }

  return {
    start() { requestAnimationFrame(tick); },
    game,
  };
}
```

- [ ] **Step 2: Replace `src/main.js`**

```js
import { createGame } from './game.js';

const canvas = document.getElementById('game');
const { start } = createGame(canvas);
start();
```

- [ ] **Step 3: Verify in browser**

Refresh page. Expected: blue background with "Frame N  FPS 60" updating in real-time. FPS should hover at 60.

- [ ] **Step 4: Commit**

```bash
git add src/main.js src/game.js
git commit -m "feat(loop): fixed-timestep game loop + fps counter"
```

---

## Phase 2 — Input

### Task 4: Keyboard input module

**Files:**
- Create: `src/input.js`
- Modify: `src/main.js`, `src/game.js`

- [ ] **Step 1: Create `src/input.js`**

```js
const KEY_MAP = {
  ArrowLeft: 'left',  KeyA: 'left',
  ArrowRight: 'right', KeyD: 'right',
  ArrowUp: 'jump',    KeyW: 'jump',    Space: 'jump',
  ShiftLeft: 'run',   ShiftRight: 'run',
  KeyX: 'fire',       KeyJ: 'fire',
  Enter: 'confirm',
  Escape: 'pause',
  KeyR: 'retry',
  KeyQ: 'quit',
  KeyM: 'mute',
  F1: 'debugAABB', F2: 'debugStats', F3: 'debugLevel', F4: 'debugGod',
};

export function createInput(target = window) {
  const held = new Set();
  const pressed = new Set();   // edge-triggered, cleared each frame

  function onKeyDown(e) {
    const action = KEY_MAP[e.code];
    if (!action) return;
    if (!held.has(action)) pressed.add(action);
    held.add(action);
    if (e.code === 'Space' || e.code.startsWith('F') || e.code === 'ArrowUp' || e.code === 'ArrowDown') {
      e.preventDefault();
    }
  }
  function onKeyUp(e) {
    const action = KEY_MAP[e.code];
    if (action) held.delete(action);
  }

  target.addEventListener('keydown', onKeyDown);
  target.addEventListener('keyup', onKeyUp);

  return {
    isHeld: (action) => held.has(action),
    wasPressed: (action) => pressed.has(action),
    endFrame: () => pressed.clear(),
  };
}
```

- [ ] **Step 2: Wire input into `src/game.js`**

In `createGame`, after `const ctx = ...`:
```js
import { createInput } from './input.js';
```
At top of file. Then inside `createGame`:
```js
const input = createInput();
game.input = input;
```
After the `while` loop in `tick`, before `render()`:
```js
input.endFrame();
```

In `render`, add below the existing fillText:
```js
const dbg = ['left','right','jump','run','fire','confirm','pause']
  .filter(a => input.isHeld(a)).join(' ');
ctx.fillText(`Input: ${dbg}`, 20, 60);
```

- [ ] **Step 3: Verify in browser**

Refresh. Hold arrow keys / space — the "Input:" line should show held actions in real time.

- [ ] **Step 4: Commit**

```bash
git add src/input.js src/game.js
git commit -m "feat(input): keyboard handler with held + edge-trigger"
```

---

## Phase 3 — Renderer + Physics

### Task 5: Renderer primitives

**Files:**
- Create: `src/renderer.js`

- [ ] **Step 1: Create `src/renderer.js`**

```js
// Pure drawing helpers. No state. ctx is always passed in.

export function clear(ctx, color = '#5c94fc') {
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
}

export function drawRoundRect(ctx, x, y, w, h, r = 8) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y,     x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x,     y + h, r);
  ctx.arcTo(x,     y + h, x,     y,     r);
  ctx.arcTo(x,     y,     x + w, y,     r);
  ctx.closePath();
}

export function fillRoundRect(ctx, x, y, w, h, fillStyle, strokeStyle = null, r = 8, lineW = 2) {
  drawRoundRect(ctx, x, y, w, h, r);
  ctx.fillStyle = fillStyle;
  ctx.fill();
  if (strokeStyle) {
    ctx.lineWidth = lineW;
    ctx.strokeStyle = strokeStyle;
    ctx.stroke();
  }
}

export function fillCircle(ctx, cx, cy, r, fillStyle, strokeStyle = null, lineW = 2) {
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = fillStyle;
  ctx.fill();
  if (strokeStyle) {
    ctx.lineWidth = lineW;
    ctx.strokeStyle = strokeStyle;
    ctx.stroke();
  }
}

export function fillEllipse(ctx, cx, cy, rx, ry, fillStyle, strokeStyle = null, lineW = 2) {
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
  ctx.fillStyle = fillStyle;
  ctx.fill();
  if (strokeStyle) {
    ctx.lineWidth = lineW;
    ctx.strokeStyle = strokeStyle;
    ctx.stroke();
  }
}

export function applyCamera(ctx, camera) {
  ctx.save();
  ctx.translate(-Math.round(camera.x), -Math.round(camera.y));
}
export function resetCamera(ctx) { ctx.restore(); }
```

- [ ] **Step 2: Commit (no behavior change yet)**

```bash
git add src/renderer.js
git commit -m "feat(renderer): drawing primitives"
```

### Task 6: Physics module (TDD)

**Files:**
- Create: `src/physics.js`
- Create: `test/physics.test.js`

- [ ] **Step 1: Write failing test `test/physics.test.js`**

```js
import { describe, it, expect } from 'vitest';
import { aabbOverlap, resolveAabb } from '../src/physics.js';

describe('aabbOverlap', () => {
  it('returns true when boxes overlap', () => {
    expect(aabbOverlap({x:0,y:0,w:10,h:10}, {x:5,y:5,w:10,h:10})).toBe(true);
  });
  it('returns false when boxes are apart', () => {
    expect(aabbOverlap({x:0,y:0,w:10,h:10}, {x:20,y:0,w:10,h:10})).toBe(false);
  });
  it('returns false when boxes only touch edges', () => {
    expect(aabbOverlap({x:0,y:0,w:10,h:10}, {x:10,y:0,w:10,h:10})).toBe(false);
  });
});

describe('resolveAabb', () => {
  it('player falling onto ground stops at ground top with vy=0 and onGround=true', () => {
    const player = { x:100, y:200, w:32, h:32, vx:0, vy:300, onGround:false };
    const ground = { x:0, y:240, w:500, h:64 };
    resolveAabb(player, ground);
    expect(player.y + player.h).toBe(240);
    expect(player.vy).toBe(0);
    expect(player.onGround).toBe(true);
  });
  it('player moving right into wall stops at wall left edge, vx=0', () => {
    const player = { x:90, y:100, w:32, h:32, vx:80, vy:0, onGround:false };
    const wall = { x:120, y:80, w:32, h:64 };
    resolveAabb(player, wall);
    expect(player.x + player.w).toBe(120);
    expect(player.vx).toBe(0);
  });
  it('player moving left into wall stops at wall right edge, vx=0', () => {
    const player = { x:130, y:100, w:32, h:32, vx:-80, vy:0, onGround:false };
    const wall = { x:90, y:80, w:32, h:64 };
    resolveAabb(player, wall);
    expect(player.x).toBe(90 + 32);
    expect(player.vx).toBe(0);
  });
  it('player hitting ceiling stops with vy=0', () => {
    const player = { x:100, y:60, w:32, h:32, vx:0, vy:-200, onGround:false };
    const ceiling = { x:80, y:32, w:80, h:32 };
    resolveAabb(player, ceiling);
    expect(player.y).toBe(64);
    expect(player.vy).toBe(0);
  });
});
```

- [ ] **Step 2: Run test, verify fail**

Run: `npm test`
Expected: FAIL — "aabbOverlap is not a function" or similar.

- [ ] **Step 3: Implement `src/physics.js`**

```js
export const GRAVITY = 1400;
export const MAX_FALL_SPEED = 600;
export const FRICTION = 8;

export function aabbOverlap(a, b) {
  return a.x < b.x + b.w &&
         a.x + a.w > b.x &&
         a.y < b.y + b.h &&
         a.y + a.h > b.y;
}

// Resolve a single AABB-vs-static collision by pushing dynamic out along
// the axis with the smaller overlap. Mutates `dyn` in place.
export function resolveAabb(dyn, stat) {
  if (!aabbOverlap(dyn, stat)) return null;

  const overlapX = Math.min(dyn.x + dyn.w - stat.x, stat.x + stat.w - dyn.x);
  const overlapY = Math.min(dyn.y + dyn.h - stat.y, stat.y + stat.h - dyn.y);

  if (overlapX < overlapY) {
    // Horizontal resolution
    if (dyn.x + dyn.w / 2 < stat.x + stat.w / 2) {
      dyn.x = stat.x - dyn.w;
    } else {
      dyn.x = stat.x + stat.w;
    }
    dyn.vx = 0;
    return 'x';
  } else {
    // Vertical resolution
    if (dyn.y + dyn.h / 2 < stat.y + stat.h / 2) {
      dyn.y = stat.y - dyn.h;
      dyn.onGround = true;
    } else {
      dyn.y = stat.y + stat.h;
    }
    dyn.vy = 0;
    return 'y';
  }
}

export function applyGravity(entity, dt) {
  entity.vy = Math.min(entity.vy + GRAVITY * dt, MAX_FALL_SPEED);
}

export function applyFriction(entity, dt) {
  entity.vx -= entity.vx * Math.min(1, FRICTION * dt);
  if (Math.abs(entity.vx) < 1) entity.vx = 0;
}
```

- [ ] **Step 4: Run tests, verify pass**

Run: `npm test`
Expected: 7 passed (3 overlap + 4 resolve).

- [ ] **Step 5: Commit**

```bash
git add src/physics.js test/physics.test.js
git commit -m "feat(physics): aabb collision + gravity/friction (TDD)"
```

---

## Phase 4 — Player

### Task 7: Player skeleton

**Files:**
- Create: `src/entities/player.js`
- Modify: `src/game.js`

- [ ] **Step 1: Create `src/entities/player.js`**

```js
import { fillRoundRect, fillEllipse } from '../renderer.js';

export const PLAYER_SIZES = {
  small: { w: 28, h: 32 },
  big:   { w: 32, h: 56 },
  fire:  { w: 32, h: 56 },
};

export class Player {
  constructor(x, y) {
    const s = PLAYER_SIZES.small;
    this.x = x; this.y = y;
    this.w = s.w; this.h = s.h;
    this.vx = 0; this.vy = 0;
    this.facing = 1;          // 1=right, -1=left
    this.onGround = false;
    this.form = 'small';      // 'small' | 'big' | 'fire'
    this.invulnUntil = 0;
    this._dead = false;
  }
  get dead() { return this._dead; }
  getAABB() { return { x: this.x, y: this.y, w: this.w, h: this.h }; }

  update(dt, world) {
    // Movement/jump logic added in Tasks 8-9.
  }

  render(ctx, camera) {
    const x = this.x, y = this.y, w = this.w, h = this.h;
    const isFire = this.form === 'fire';
    const hatColor = isFire ? '#ffffff' : '#e74c3c';
    const bodyColor = isFire ? '#e74c3c' : '#3498db';
    // hat
    fillRoundRect(ctx, x, y - 2, w, 12, hatColor, '#5a2a0a', 6);
    // face
    fillRoundRect(ctx, x + 3, y + 6, w - 6, h * 0.4, '#ffd5b0', '#5a2a0a', 8);
    // body
    fillRoundRect(ctx, x + 1, y + h * 0.45, w - 2, h * 0.55, bodyColor, '#142850', 8);
  }
}
```

- [ ] **Step 2: Spawn player in `src/game.js`**

In `createGame`, before returning:
```js
import { Player } from './entities/player.js';
```
At top. Inside `createGame`, after `const input = ...`:
```js
const player = new Player(100, 300);
game.player = player;
```
In `update(dt)`:
```js
player.update(dt, game);
```
In `render()`, after the background fill:
```js
player.render(ctx);
```

- [ ] **Step 3: Verify**

Refresh browser. Expected: a small red-blue Mario stick figure appears stationary at (100, 300).

- [ ] **Step 4: Commit**

```bash
git add src/entities/player.js src/game.js
git commit -m "feat(player): skeleton with render"
```

### Task 8: Player horizontal movement

**Files:**
- Modify: `src/entities/player.js`

- [ ] **Step 1: Fill in `update(dt, world)` of `Player`**

Constants at top of file (under imports):
```js
const WALK_ACCEL = 600;
const RUN_ACCEL  = 900;
const WALK_MAX   = 180;
const RUN_MAX    = 280;
```

In `update(dt, world)`:
```js
const input = world.input;
const accel = input.isHeld('run') ? RUN_ACCEL : WALK_ACCEL;
const maxV  = input.isHeld('run') ? RUN_MAX   : WALK_MAX;

if (input.isHeld('left'))  { this.vx -= accel * dt; this.facing = -1; }
if (input.isHeld('right')) { this.vx += accel * dt; this.facing =  1; }
if (!input.isHeld('left') && !input.isHeld('right')) {
  this.vx -= this.vx * Math.min(1, 8 * dt);
  if (Math.abs(this.vx) < 1) this.vx = 0;
}
this.vx = Math.max(-maxV, Math.min(maxV, this.vx));

this.x += this.vx * dt;
```

- [ ] **Step 2: Verify**

Refresh. Press left/right — player slides left/right with acceleration & friction. Shift = faster. Off-screen is OK for now.

- [ ] **Step 3: Commit**

```bash
git add src/entities/player.js
git commit -m "feat(player): horizontal movement with run modifier"
```

### Task 9: Player jump + gravity

**Files:**
- Modify: `src/entities/player.js`
- Modify: `src/game.js`

- [ ] **Step 1: Import gravity helper in `player.js`**

Add to imports:
```js
import { applyGravity } from '../physics.js';
```

Add constants:
```js
const JUMP_SPEED       = 480;
const JUMP_CUT_FACTOR  = 0.45;
```

In `update(dt, world)`, after horizontal movement:
```js
// Jump
if (world.input.wasPressed('jump') && this.onGround) {
  this.vy = -JUMP_SPEED;
  this.onGround = false;
}
// Variable height: release jump early → cut vy
if (!world.input.isHeld('jump') && this.vy < 0) {
  this.vy *= JUMP_CUT_FACTOR;
  // apply once per release: clamp so we don't keep multiplying
  if (this.vy > -1) this.vy = 0;
}

applyGravity(this, dt);
this.y += this.vy * dt;
this.onGround = false;  // reset; collision resolver will set true if standing
```

- [ ] **Step 2: Add a temporary floor in `src/game.js`**

In `createGame`, after spawning player:
```js
const tmpFloor = { x: 0, y: 416, w: 800, h: 64 };
game.tmpFloor = tmpFloor;
```

In `update(dt)`, after `player.update(dt, game)`:
```js
import { resolveAabb } from './physics.js';
```
At top. After `player.update`:
```js
resolveAabb(player, tmpFloor);
```

In `render()`, after background, before player:
```js
ctx.fillStyle = '#6b4423';
ctx.fillRect(tmpFloor.x, tmpFloor.y, tmpFloor.w, tmpFloor.h);
```

- [ ] **Step 3: Verify**

Refresh. Player should fall onto brown floor at y=416, then run left/right on floor, jump with Space. Holding Space jumps higher, tapping = shorter hop.

- [ ] **Step 4: Commit**

```bash
git add src/entities/player.js src/game.js
git commit -m "feat(player): gravity + variable-height jump"
```

---

## Phase 5 — Blocks

### Task 10: Block entities

**Files:**
- Create: `src/entities/block.js`
- Modify: `src/game.js`

- [ ] **Step 1: Create `src/entities/block.js`**

```js
import { fillRoundRect } from '../renderer.js';

const TILE = 32;

class BaseBlock {
  constructor(x, y, w = TILE, h = TILE) {
    this.x = x; this.y = y; this.w = w; this.h = h;
    this._dead = false;
  }
  get dead() { return this._dead; }
  getAABB() { return { x: this.x, y: this.y, w: this.w, h: this.h }; }
  update() {}
}

export class Ground extends BaseBlock {
  render(ctx) {
    // brown solid with grass cap
    ctx.fillStyle = '#6b4423';
    ctx.fillRect(this.x, this.y + 8, this.w, this.h - 8);
    ctx.fillStyle = '#3a7a3a';
    ctx.fillRect(this.x, this.y, this.w, 10);
  }
}

export class Brick extends BaseBlock {
  constructor(x, y) { super(x, y, TILE, TILE); }
  render(ctx) {
    const g = ctx.createLinearGradient(0, this.y, 0, this.y + this.h);
    g.addColorStop(0, '#c0392b');
    g.addColorStop(1, '#922b21');
    fillRoundRect(ctx, this.x, this.y, this.w, this.h, g, '#5a1a1a', 8);
    ctx.strokeStyle = 'rgba(0,0,0,0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(this.x + 4, this.y + 8);
    ctx.lineTo(this.x + this.w - 4, this.y + 8);
    ctx.stroke();
  }
  // bumpFromBelow handled in Task 12
}

export class QBlock extends BaseBlock {
  constructor(x, y, contains = 'coin') {
    super(x, y, TILE, TILE);
    this.contains = contains;  // 'coin' | 'mushroom' | 'fireflower'
    this.used = false;
  }
  render(ctx) {
    const g = ctx.createLinearGradient(0, this.y, 0, this.y + this.h);
    if (this.used) {
      g.addColorStop(0, '#8b6914'); g.addColorStop(1, '#5a4406');
    } else {
      g.addColorStop(0, '#f39c12'); g.addColorStop(1, '#d68910');
    }
    fillRoundRect(ctx, this.x, this.y, this.w, this.h, g, '#7d5f06', 8);
    if (!this.used) {
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 22px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('?', this.x + this.w / 2, this.y + this.h - 8);
      ctx.textAlign = 'left';
    }
  }
}

export class Pipe extends BaseBlock {
  constructor(x, y, h = 64) { super(x, y, TILE * 1.5, h); }
  render(ctx) {
    const g = ctx.createLinearGradient(0, this.y, 0, this.y + this.h);
    g.addColorStop(0, '#27ae60');
    g.addColorStop(1, '#145a32');
    fillRoundRect(ctx, this.x, this.y + 12, this.w, this.h - 12, g, '#0e3d22', 6);
    const g2 = ctx.createLinearGradient(0, this.y, 0, this.y + 14);
    g2.addColorStop(0, '#2ecc71');
    g2.addColorStop(1, '#196f3d');
    fillRoundRect(ctx, this.x - 4, this.y, this.w + 8, 14, g2, '#0e3d22', 6);
  }
}

export class Flag extends BaseBlock {
  constructor(x, y) { super(x, y, 8, 200); }
  render(ctx) {
    // pole
    ctx.fillStyle = '#bbb';
    ctx.fillRect(this.x, this.y, this.w, this.h);
    // flag triangle
    ctx.fillStyle = '#e74c3c';
    ctx.beginPath();
    ctx.moveTo(this.x + this.w, this.y + 8);
    ctx.lineTo(this.x + this.w + 28, this.y + 16);
    ctx.lineTo(this.x + this.w, this.y + 24);
    ctx.closePath();
    ctx.fill();
  }
}

export function createBlock(spec) {
  switch (spec.type) {
    case 'ground': return new Ground(spec.x, spec.y, spec.w, spec.h);
    case 'brick':  return new Brick(spec.x, spec.y);
    case 'qblock': return new QBlock(spec.x, spec.y, spec.contains);
    case 'pipe':   return new Pipe(spec.x, spec.y, spec.h);
    case 'flag':   return new Flag(spec.x, spec.y);
    default: throw new Error(`Unknown block type ${spec.type}`);
  }
}
```

- [ ] **Step 2: Render a sample row in `src/game.js`**

Replace `tmpFloor` with a small set of blocks. In `createGame`:
```js
import { createBlock } from './entities/block.js';
```
Replace `const tmpFloor = ...` block with:
```js
const blocks = [
  createBlock({ type: 'ground', x: 0,   y: 416, w: 800, h: 64 }),
  createBlock({ type: 'brick',  x: 200, y: 320 }),
  createBlock({ type: 'qblock', x: 232, y: 320, contains: 'coin' }),
  createBlock({ type: 'qblock', x: 264, y: 320, contains: 'mushroom' }),
  createBlock({ type: 'pipe',   x: 400, y: 368, h: 48 }),
  createBlock({ type: 'flag',   x: 700, y: 216 }),
];
game.blocks = blocks;
```

In `update(dt)`, replace `resolveAabb(player, tmpFloor)` with:
```js
for (const b of blocks) resolveAabb(player, b);
```

In `render()`, replace the brown fillRect block with:
```js
for (const b of blocks) b.render(ctx);
```

- [ ] **Step 3: Verify**

Refresh. Should see ground, two bricks (red), two ?-blocks (yellow with `?`), a green pipe, a flag pole. Mario can jump on all of them.

- [ ] **Step 4: Commit**

```bash
git add src/entities/block.js src/game.js
git commit -m "feat(blocks): Ground, Brick, QBlock, Pipe, Flag"
```

### Task 11: Block bump-from-below

**Files:**
- Modify: `src/entities/block.js`, `src/entities/player.js`, `src/game.js`

- [ ] **Step 1: Add `onBumpFromBelow` to blocks**

In `block.js`, on `Brick`:
```js
onBumpFromBelow(player, world) {
  if (player.form === 'small') {
    // small Mario bounces brick — no break
    this._bumpT = 0.15;
  } else {
    this._dead = true;     // brick destroyed
    world.audio?.play?.('break');
    world.onScore?.(50);
  }
}
```
On `QBlock`:
```js
onBumpFromBelow(player, world) {
  if (this.used) return;
  this.used = true;
  this._bumpT = 0.15;
  world.spawnFromQBlock?.(this);
}
```
Add `update(dt)` to `Brick` and `QBlock`:
```js
update(dt) {
  if (this._bumpT > 0) {
    this._bumpT -= dt;
  }
}
```
In their `render`, before drawing the rect, add:
```js
const offset = this._bumpT > 0 ? -6 * Math.sin(this._bumpT / 0.15 * Math.PI) : 0;
ctx.save();
ctx.translate(0, offset);
// ... existing draw calls ...
ctx.restore();
```

- [ ] **Step 2: Detect ceiling-hit in `src/game.js`**

Replace the existing `for (const b of blocks) resolveAabb(player, b);` with the block below. Ceiling-hit = player's y was pushed downward by the resolver, so we snapshot `prevY` before each resolve.

```js
for (const b of blocks) {
  if (b.dead) continue;
  const prevY = player.y;
  const result = resolveAabb(player, b);
  if (result === 'y' && player.y > prevY && b.onBumpFromBelow) {
    b.onBumpFromBelow(player, game);
  }
}
game.blocks = game.blocks.filter(b => !b.dead);
```

Add `update` call for blocks in `update(dt)`:
```js
for (const b of blocks) b.update?.(dt);
```

- [ ] **Step 3: Verify**

Refresh. Jump under a Brick — small Mario should see brick bounce. Jump under ?-block — block turns dim with no `?`. (Spawn logic comes in Task 20+.)

- [ ] **Step 4: Commit**

```bash
git add src/entities/block.js src/entities/player.js src/game.js
git commit -m "feat(blocks): bump-from-below for brick and qblock"
```

---

## Phase 6 — Camera

### Task 12: Camera with dead-zone

**Files:**
- Modify: `src/game.js`

- [ ] **Step 1: Add camera state**

In `createGame`, after spawning player:
```js
const camera = { x: 0, y: 0 };
game.camera = camera;
game.worldWidth = 3200;   // temporary; level loader will set this
game.worldHeight = 480;
```

- [ ] **Step 2: Update camera each frame**

Add helper before returning from `createGame`:
```js
function updateCamera() {
  const cx = player.x + player.w / 2;
  const screenCx = camera.x + game.width / 2;
  const deadzone = 100;
  if (cx - screenCx > deadzone)  camera.x += cx - screenCx - deadzone;
  if (cx - screenCx < -deadzone) camera.x += cx - screenCx + deadzone;
  camera.x = Math.max(0, Math.min(game.worldWidth - game.width, camera.x));
}
```

Call `updateCamera()` after `player.update` in `update(dt)`.

- [ ] **Step 3: Apply camera in render**

In `render()`, wrap world-space drawing with translate. Replace existing render body:
```js
function render() {
  clear(ctx, '#5c94fc');
  ctx.save();
  ctx.translate(-Math.round(camera.x), -Math.round(camera.y));
  for (const b of blocks) b.render(ctx);
  player.render(ctx);
  ctx.restore();

  // HUD-space drawing (no camera)
  ctx.fillStyle = '#fff';
  ctx.font = '20px monospace';
  ctx.fillText(`FPS ${game.fps}`, 20, 30);
}
```
Add `import { clear } from './renderer.js';` at top.

- [ ] **Step 4: Verify**

Refresh. Walk right past x=500 — Mario stops at center of screen and the world scrolls. Add a temporary wider ground:
```js
createBlock({ type: 'ground', x: 0, y: 416, w: 3200, h: 64 }),
```
Replace the first ground block. Refresh and walk right — should scroll all the way.

- [ ] **Step 5: Commit**

```bash
git add src/game.js
git commit -m "feat(camera): follow with dead-zone + horizontal clamp"
```

---

## Phase 7 — Level loader & Level 1

### Task 13: Level data format + loader

**Files:**
- Create: `src/levels/level1.js`
- Modify: `src/game.js`

- [ ] **Step 1: Create `src/levels/level1.js`**

```js
export default {
  name: '1-1 Overworld',
  width: 3200,
  height: 480,
  background: 'sky',
  music: 'overworld',
  spawn: { x: 50, y: 320 },
  blocks: [
    { type: 'ground', x: 0,    y: 416, w: 1024, h: 64 },
    { type: 'ground', x: 1100, y: 416, w: 2100, h: 64 },
    { type: 'brick',  x: 320,  y: 320 },
    { type: 'qblock', x: 352,  y: 320, contains: 'coin' },
    { type: 'qblock', x: 384,  y: 320, contains: 'mushroom' },
    { type: 'brick',  x: 416,  y: 320 },
    { type: 'pipe',   x: 600,  y: 368, h: 48 },
    { type: 'pipe',   x: 900,  y: 352, h: 64 },
    { type: 'brick',  x: 1300, y: 320 },
    { type: 'brick',  x: 1332, y: 320 },
    { type: 'qblock', x: 1364, y: 320, contains: 'coin' },
    { type: 'brick',  x: 1396, y: 320 },
    { type: 'ground', x: 1500, y: 384, w: 200, h: 96 },  // step up
    { type: 'flag',   x: 3050, y: 216 }
  ],
  enemies: [],   // filled in Phase 8
  coins:   [],   // filled in Phase 10
};
```

- [ ] **Step 2: Add `loadLevel` to `src/game.js`**

In `createGame`, replace the hardcoded `blocks` setup with an `async loadLevel(idx)` flow.

Add to imports:
```js
const LEVEL_FILES = ['./levels/level1.js', './levels/level2.js', './levels/level3.js', './levels/level4.js'];
```

Add inside `createGame`:
```js
game.currentLevel = -1;
game.background = 'sky';

async function loadLevel(idx) {
  const mod = await import(LEVEL_FILES[idx]);
  const data = mod.default;
  game.currentLevel = idx;
  game.worldWidth = data.width;
  game.worldHeight = data.height;
  game.background = data.background;
  game.levelName = data.name;
  game.blocks = data.blocks.map(createBlock);
  game.enemies = [];
  game.coinsInLevel = [];   // populated in Phase 10
  game.player = new Player(data.spawn.x, data.spawn.y);
  camera.x = 0;
  camera.y = 0;
}
game.loadLevel = loadLevel;
```

Remove the hardcoded `const blocks = [...]` and `const player = new Player(...)`.

Update references: anywhere that used the closed-over `player` or `blocks`, switch to `game.player` and `game.blocks`. Specifically in `update(dt)`:
```js
function update(dt) {
  const { player, blocks } = game;
  if (!player) return;
  game.frame++;
  player.update(dt, game);

  for (const b of blocks) b.update?.(dt);
  for (const b of blocks) {
    if (b.dead) continue;
    const prevY = player.y;
    const result = resolveAabb(player, b);
    if (result === 'y' && player.y > prevY && b.onBumpFromBelow) {
      b.onBumpFromBelow(player, game);
    }
  }
  game.blocks = blocks.filter(b => !b.dead);

  updateCamera();
}
```

In `render()`:
```js
function render() {
  clear(ctx, backgroundColor(game.background));
  if (!game.player) return;
  ctx.save();
  ctx.translate(-Math.round(camera.x), -Math.round(camera.y));
  for (const b of game.blocks) b.render(ctx);
  game.player.render(ctx);
  ctx.restore();

  ctx.fillStyle = '#fff';
  ctx.font = '20px monospace';
  ctx.fillText(`FPS ${game.fps}  ${game.levelName ?? ''}`, 20, 30);
}

function backgroundColor(bg) {
  switch (bg) {
    case 'sky':       return '#5c94fc';
    case 'cave':      return '#0a0a0f';
    case 'night':     return '#1a1a3a';
    case 'castle':    return '#1a0033';
    default:          return '#5c94fc';
  }
}
```

In `start`, kick off load:
```js
start() {
  loadLevel(0).then(() => requestAnimationFrame(tick));
}
```

- [ ] **Step 3: Verify**

Refresh. Should see "1-1 Overworld" in HUD. Mario spawned at x=50. Can walk right, see bricks/?-blocks/pipes, scroll the level. Flag visible at far right.

- [ ] **Step 4: Commit**

```bash
git add src/levels/level1.js src/game.js
git commit -m "feat(level): data format + loader + Level 1 layout"
```

---

## Phase 8 — Goomba

### Task 14: Goomba entity (TDD state)

**Files:**
- Create: `src/entities/goomba.js`
- Create: `test/entities.test.js`

- [ ] **Step 1: Write failing test `test/entities.test.js`**

```js
import { describe, it, expect } from 'vitest';
import { Goomba } from '../src/entities/goomba.js';

describe('Goomba', () => {
  it('walks left by default', () => {
    const g = new Goomba(200, 384);
    expect(g.vx).toBeLessThan(0);
  });

  it('reverses direction when colliding with a wall', () => {
    const g = new Goomba(200, 384);
    const startVx = g.vx;
    g.reverse();
    expect(g.vx).toBe(-startVx);
  });

  it('stomped() marks goomba dead and stops it', () => {
    const g = new Goomba(200, 384);
    g.stomped();
    expect(g.dead).toBe(true);
    expect(g.vx).toBe(0);
  });
});
```

- [ ] **Step 2: Run, verify fail**

Run: `npm test`
Expected: "Cannot find module './goomba.js'".

- [ ] **Step 3: Create `src/entities/goomba.js`**

```js
import { fillRoundRect, fillEllipse, fillCircle } from '../renderer.js';
import { applyGravity } from '../physics.js';

const SPEED = 60;

export class Goomba {
  constructor(x, y) {
    this.x = x; this.y = y;
    this.w = 28; this.h = 26;
    this.vx = -SPEED;
    this.vy = 0;
    this.onGround = false;
    this._dead = false;
    this._dyingT = 0;
  }
  get dead() { return this._dead && this._dyingT <= 0; }
  getAABB() { return { x: this.x, y: this.y, w: this.w, h: this.h }; }

  reverse() { this.vx = -this.vx; }
  stomped() {
    this._dead = true;
    this._dyingT = 0.4;
    this.vx = 0;
    this.h = 12;        // flatten
  }

  update(dt) {
    if (this._dyingT > 0) {
      this._dyingT -= dt;
      return;
    }
    applyGravity(this, dt);
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.onGround = false;
  }

  render(ctx) {
    const cx = this.x + this.w / 2;
    const cy = this.y + this.h / 2;
    if (this._dead) {
      // flat squished
      fillRoundRect(ctx, this.x, this.y + this.h - 8, this.w, 8, '#8b4513', '#3d1d05', 4);
      return;
    }
    fillRoundRect(ctx, this.x, this.y, this.w, this.h * 0.75, '#8b4513', '#3d1d05', 14);
    // eyes
    fillCircle(ctx, cx - 7, this.y + 9, 3, '#fff', '#000', 1);
    fillCircle(ctx, cx + 7, this.y + 9, 3, '#fff', '#000', 1);
    // feet
    fillEllipse(ctx, this.x + 5, this.y + this.h, 4, 4, '#5d2906', '#3d1d05', 1);
    fillEllipse(ctx, this.x + this.w - 5, this.y + this.h, 4, 4, '#5d2906', '#3d1d05', 1);
  }
}
```

- [ ] **Step 4: Run tests, verify pass**

Run: `npm test`
Expected: previous tests + 3 Goomba tests passing.

- [ ] **Step 5: Commit**

```bash
git add src/entities/goomba.js test/entities.test.js
git commit -m "feat(goomba): entity with walk/reverse/stomp (TDD)"
```

### Task 15: Goomba in level + interactions

**Files:**
- Modify: `src/levels/level1.js`, `src/game.js`

- [ ] **Step 1: Add Goombas to Level 1**

In `src/levels/level1.js`, replace `enemies: []` with:
```js
enemies: [
  { type: 'goomba', x: 500,  y: 388 },
  { type: 'goomba', x: 800,  y: 388 },
  { type: 'goomba', x: 1500, y: 354 },
  { type: 'goomba', x: 2200, y: 388 },
],
```

- [ ] **Step 2: Spawn enemies in loader**

In `src/game.js`, in `loadLevel`, add:
```js
import { Goomba } from './entities/goomba.js';
```

```js
game.enemies = data.enemies.map(spec => {
  if (spec.type === 'goomba') return new Goomba(spec.x, spec.y);
  throw new Error(`Unknown enemy ${spec.type}`);
});
```

- [ ] **Step 3: Update + collide enemies**

In `update(dt)`, after the block loop:
```js
import { aabbOverlap } from './physics.js';
```

```js
for (const e of game.enemies) e.update(dt);
// enemy-vs-block collisions (gravity + walls)
for (const e of game.enemies) {
  if (e.dead) continue;
  for (const b of game.blocks) {
    if (b.dead) continue;
    const prevX = e.x;
    const result = resolveAabb(e, b);
    if (result === 'x') e.reverse();
    if (result === 'y') {
      // on top of block
      if (e.vy === 0 && e.y + e.h <= b.y + 1) e.onGround = true;
    }
  }
  // edge detection: turn around if about to walk off ledge
  if (e.onGround && e.vx !== 0) {
    const probeX = e.vx > 0 ? e.x + e.w + 2 : e.x - 2;
    const probeY = e.y + e.h + 2;
    let supported = false;
    for (const b of game.blocks) {
      if (b.x <= probeX && probeX <= b.x + b.w && b.y <= probeY && probeY <= b.y + b.h) {
        supported = true; break;
      }
    }
    if (!supported) e.reverse();
  }
}
// player-vs-enemy
for (const e of game.enemies) {
  if (e._dead) continue;
  if (!aabbOverlap(player.getAABB(), e.getAABB())) continue;
  const stomped = player.vy > 0 && player.y + player.h - 8 < e.y;
  if (stomped) {
    e.stomped();
    player.vy = -260;   // bounce
    game.score = (game.score ?? 0) + 100;
  } else {
    onPlayerHit(player, game);
  }
}
game.enemies = game.enemies.filter(e => !e.dead);
```

Add at top of `src/game.js`:
```js
import { Player, PLAYER_SIZES } from './entities/player.js';
```
(Replace any existing single `Player` import with this one.)

Add helper at the bottom of `createGame`:
```js
function onPlayerHit(p, g) {
  if (g.frame < p.invulnUntil) return;
  if (p.form === 'fire') {
    p.form = 'big';
    g.audio?.play?.('hit');
  } else if (p.form === 'big') {
    p.form = 'small';
    g.audio?.play?.('hit');
  } else {
    p._dead = true;
    g.audio?.play?.('die');
    return;
  }
  const s = PLAYER_SIZES[p.form];
  p.w = s.w; p.h = s.h;
  p.invulnUntil = g.frame + 90;  // ~1.5s @ 60fps
}
```

In `render()`, after blocks:
```js
for (const e of game.enemies) e.render(ctx);
```

- [ ] **Step 4: Verify**

Refresh. Should see Goombas walking back and forth. Jumping on one kills it (with little bounce). Walking into one without jumping makes Mario flash and shrink (or fail).

- [ ] **Step 5: Commit**

```bash
git add src/levels/level1.js src/game.js
git commit -m "feat(goomba): walk + stomp + ledge-turn + player damage"
```

---

## Phase 9 — Koopa

### Task 16: Koopa entity + KoopaShell (TDD)

**Files:**
- Create: `src/entities/koopa.js`
- Modify: `test/entities.test.js`

- [ ] **Step 1: Add tests in `test/entities.test.js`**

```js
import { Koopa } from '../src/entities/koopa.js';

describe('Koopa', () => {
  it('initial phase is walking', () => {
    const k = new Koopa(200, 384);
    expect(k.phase).toBe('walk');
    expect(Math.abs(k.vx)).toBeGreaterThan(0);
  });
  it('first stomp → shell phase, vx=0', () => {
    const k = new Koopa(200, 384);
    k.stomped();
    expect(k.phase).toBe('shell');
    expect(k.vx).toBe(0);
  });
  it('kick on shell → sliding shell with speed', () => {
    const k = new Koopa(200, 384);
    k.stomped();
    k.kick(1);   // 1 = right
    expect(k.phase).toBe('sliding');
    expect(k.vx).toBeGreaterThan(0);
  });
  it('stomp on sliding shell → stops, back to shell', () => {
    const k = new Koopa(200, 384);
    k.stomped();
    k.kick(1);
    k.stomped();
    expect(k.phase).toBe('shell');
    expect(k.vx).toBe(0);
  });
});
```

- [ ] **Step 2: Run, verify fail**

Run: `npm test`
Expected: "Cannot find module './koopa.js'".

- [ ] **Step 3: Create `src/entities/koopa.js`**

```js
import { fillRoundRect, fillCircle, fillEllipse } from '../renderer.js';
import { applyGravity } from '../physics.js';

const WALK_SPEED = 50;
const SLIDE_SPEED = 280;

export class Koopa {
  constructor(x, y) {
    this.x = x; this.y = y;
    this.w = 30; this.h = 36;
    this.vx = -WALK_SPEED;
    this.vy = 0;
    this.onGround = false;
    this.phase = 'walk';   // walk | shell | sliding
    this._dead = false;
  }
  get dead() { return this._dead; }
  getAABB() { return { x: this.x, y: this.y, w: this.w, h: this.h }; }
  reverse() { this.vx = -this.vx; }

  stomped() {
    if (this.phase === 'walk') {
      this.phase = 'shell';
      this.vx = 0;
      this.h = 22;
    } else if (this.phase === 'sliding') {
      this.phase = 'shell';
      this.vx = 0;
    }
  }
  kick(dir = 1) {
    if (this.phase !== 'shell') return;
    this.phase = 'sliding';
    this.vx = SLIDE_SPEED * dir;
  }

  update(dt) {
    applyGravity(this, dt);
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.onGround = false;
  }

  render(ctx) {
    const cx = this.x + this.w / 2;
    if (this.phase === 'shell' || this.phase === 'sliding') {
      // shell only
      fillEllipse(ctx, cx, this.y + this.h * 0.5, this.w / 2, this.h * 0.55, '#27ae60', '#145a32', 2);
      fillEllipse(ctx, cx, this.y + this.h * 0.5, this.w * 0.32, this.h * 0.3, '#f1c40f', '#7d5f06', 1);
    } else {
      // body shell
      fillEllipse(ctx, cx, this.y + this.h * 0.65, this.w / 2, this.h * 0.45, '#27ae60', '#145a32', 2);
      fillEllipse(ctx, cx, this.y + this.h * 0.65, this.w * 0.32, this.h * 0.25, '#f1c40f', '#7d5f06', 1);
      // head
      fillCircle(ctx, cx, this.y + 10, 10, '#f1c40f', '#145a32', 2);
      fillCircle(ctx, cx + (this.vx < 0 ? -4 : 4), this.y + 8, 2, '#000');
    }
  }
}
```

- [ ] **Step 4: Run tests, verify pass**

Run: `npm test`
Expected: all passing including 4 new Koopa tests.

- [ ] **Step 5: Commit**

```bash
git add src/entities/koopa.js test/entities.test.js
git commit -m "feat(koopa): walk/shell/sliding state machine (TDD)"
```

### Task 17: Koopa integration

**Files:**
- Modify: `src/game.js`

- [ ] **Step 1: Wire Koopa spawn in loader**

In `loadLevel`, expand enemy spawn:
```js
import { Koopa } from './entities/koopa.js';
```
```js
game.enemies = data.enemies.map(spec => {
  if (spec.type === 'goomba') return new Goomba(spec.x, spec.y);
  if (spec.type === 'koopa')  return new Koopa(spec.x, spec.y);
  throw new Error(`Unknown enemy ${spec.type}`);
});
```

- [ ] **Step 2: Handle player-vs-Koopa & shell**

Replace the existing player-vs-enemy block with:
```js
for (const e of game.enemies) {
  if (e._dead) continue;
  if (!aabbOverlap(player.getAABB(), e.getAABB())) continue;
  const stomped = player.vy > 0 && player.y + player.h - 8 < e.y;

  if (e instanceof Koopa) {
    if (e.phase === 'walk') {
      if (stomped) { e.stomped(); player.vy = -260; game.score = (game.score ?? 0) + 100; }
      else { onPlayerHit(player, game); }
    } else if (e.phase === 'shell') {
      if (stomped) {
        e.stomped();   // no-op already a shell
        player.vy = -260;
      } else {
        const dir = (player.x < e.x) ? 1 : -1;
        e.kick(dir);
        // teleport player out of overlap
        player.x = dir === 1 ? e.x - player.w - 1 : e.x + e.w + 1;
      }
    } else if (e.phase === 'sliding') {
      if (stomped) { e.stomped(); player.vy = -260; }
      else onPlayerHit(player, game);
    }
  } else {
    // Goomba branch (unchanged)
    if (stomped) { e.stomped(); player.vy = -260; game.score = (game.score ?? 0) + 100; }
    else onPlayerHit(player, game);
  }
}
```

Add the import:
```js
import { Goomba } from './entities/goomba.js';   // already imported in Task 15
import { Koopa } from './entities/koopa.js';
```

- [ ] **Step 3: Sliding shell kills other enemies**

Inside the enemy-update loop, after the for-block loop:
```js
for (const e of game.enemies) {
  if (e instanceof Koopa && e.phase === 'sliding') {
    for (const other of game.enemies) {
      if (other === e || other._dead) continue;
      if (aabbOverlap(e.getAABB(), other.getAABB())) {
        if (typeof other.stomped === 'function' && !(other instanceof Koopa && other.phase === 'shell')) {
          other.stomped();
          if (other instanceof Goomba) game.score += 100;
        }
      }
    }
  }
}
```

- [ ] **Step 4: Quick test in level 1**

Edit `src/levels/level1.js` `enemies`:
```js
enemies: [
  { type: 'goomba', x: 500,  y: 388 },
  { type: 'koopa',  x: 800,  y: 380 },
  { type: 'goomba', x: 1500, y: 354 },
  { type: 'koopa',  x: 2200, y: 380 },
],
```

- [ ] **Step 5: Verify**

Refresh. Mario should be able to: stomp Goomba → die. Stomp Koopa → becomes shell. Touch shell → it slides. Sliding shell kills Goomba on its path.

- [ ] **Step 6: Commit**

```bash
git add src/game.js src/levels/level1.js
git commit -m "feat(koopa): integrate with player + shell kicks other enemies"
```

---

## Phase 10 — Coin + Mushroom

### Task 18: Item entities

**Files:**
- Create: `src/entities/item.js`

- [ ] **Step 1: Create `src/entities/item.js`**

```js
import { fillRoundRect, fillCircle, fillEllipse } from '../renderer.js';
import { applyGravity } from '../physics.js';

export class Coin {
  constructor(x, y) {
    this.x = x; this.y = y;
    this.w = 20; this.h = 24;
    this._dead = false;
    this._spinT = 0;
  }
  get dead() { return this._dead; }
  getAABB() { return { x: this.x, y: this.y, w: this.w, h: this.h }; }
  update(dt) { this._spinT += dt; }
  render(ctx) {
    const sx = Math.abs(Math.sin(this._spinT * 4)) * 0.5 + 0.5;
    const cx = this.x + this.w / 2;
    const cy = this.y + this.h / 2;
    const g = ctx.createRadialGradient(cx, cy, 2, cx, cy, this.w / 2);
    g.addColorStop(0, '#ffe27a');
    g.addColorStop(1, '#f39c12');
    fillEllipse(ctx, cx, cy, (this.w / 2) * sx, this.h / 2, g, '#b8770a', 2);
  }
  collect() { this._dead = true; }
}

const MUSHROOM_SPEED = 90;

export class Mushroom {
  constructor(x, y) {
    this.x = x; this.y = y;
    this.w = 28; this.h = 28;
    this.vx = MUSHROOM_SPEED;
    this.vy = -120;             // little pop out
    this.onGround = false;
    this._dead = false;
    this._spawning = true;
    this._spawnT = 0.4;
  }
  get dead() { return this._dead; }
  getAABB() {
    if (this._spawning) return { x: this.x, y: this.y, w: 0, h: 0 };
    return { x: this.x, y: this.y, w: this.w, h: this.h };
  }
  reverse() { this.vx = -this.vx; }
  collect() { this._dead = true; }

  update(dt) {
    if (this._spawning) {
      this._spawnT -= dt;
      this.y -= 30 * dt;       // rise from block
      if (this._spawnT <= 0) { this._spawning = false; this.vy = 0; }
      return;
    }
    applyGravity(this, dt);
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.onGround = false;
  }
  render(ctx) {
    const cx = this.x + this.w / 2;
    fillRoundRect(ctx, this.x, this.y, this.w, this.h * 0.65, '#e74c3c', '#5a1a1a', 12);
    fillCircle(ctx, this.x + 7, this.y + 6, 3, '#fff', '#5a1a1a', 1);
    fillCircle(ctx, this.x + this.w - 7, this.y + 6, 4, '#fff', '#5a1a1a', 1);
    fillRoundRect(ctx, this.x + 4, this.y + this.h * 0.55, this.w - 8, this.h * 0.45, '#ffd5b0', '#5a2a0a', 8);
  }
}

export class FireFlower {
  constructor(x, y) {
    this.x = x; this.y = y;
    this.w = 24; this.h = 28;
    this._dead = false;
    this._spawning = true;
    this._spawnT = 0.4;
  }
  get dead() { return this._dead; }
  getAABB() {
    if (this._spawning) return { x: this.x, y: this.y, w: 0, h: 0 };
    return { x: this.x, y: this.y, w: this.w, h: this.h };
  }
  collect() { this._dead = true; }
  update(dt) {
    if (this._spawning) {
      this._spawnT -= dt;
      this.y -= 30 * dt;
      if (this._spawnT <= 0) this._spawning = false;
    }
  }
  render(ctx) {
    const cx = this.x + this.w / 2;
    fillCircle(ctx, cx, this.y + this.h * 0.4, this.w / 2, '#e74c3c', '#5a1a1a', 2);
    fillCircle(ctx, cx, this.y + this.h * 0.4, this.w * 0.28, '#2980b9', '#142850', 1);
    ctx.fillStyle = '#27ae60';
    ctx.fillRect(cx - 2, this.y + this.h * 0.7, 4, this.h * 0.3);
  }
}

export function createItem(spec) {
  switch (spec.type) {
    case 'coin':       return new Coin(spec.x, spec.y);
    case 'mushroom':   return new Mushroom(spec.x, spec.y);
    case 'fireflower': return new FireFlower(spec.x, spec.y);
    default: throw new Error(`Unknown item ${spec.type}`);
  }
}
```

- [ ] **Step 2: Commit (no integration yet)**

```bash
git add src/entities/item.js
git commit -m "feat(items): Coin, Mushroom, FireFlower entities"
```

### Task 19: Items in game + ?-block spawn

**Files:**
- Modify: `src/game.js`, `src/levels/level1.js`

- [ ] **Step 1: Add items array & spawn from ?-block**

In `src/game.js`:
```js
import { Coin, Mushroom, FireFlower, createItem } from './entities/item.js';
```

In `loadLevel`:
```js
game.items = data.coins.map(c => new Coin(c.x, c.y));
```

Add to `createGame` after spawning blocks:
```js
game.spawnFromQBlock = function(qblock) {
  const content = qblock.contains;
  const x = qblock.x + 2;
  const y = qblock.y - 4;
  if (content === 'coin') {
    // floating coin that auto-collects
    game.score = (game.score ?? 0) + 100;
    game.coins = (game.coins ?? 0) + 1;
    game.audio?.play?.('coin');
  } else if (content === 'mushroom') {
    // small Mario → mushroom; otherwise → fireflower (Mario logic)
    const itemType = game.player.form === 'small' ? 'mushroom' : 'fireflower';
    game.items.push(createItem({ type: itemType, x, y }));
  } else if (content === 'fireflower') {
    game.items.push(createItem({ type: 'fireflower', x, y }));
  }
};
```

- [ ] **Step 2: Update + collide items**

In `update(dt)`, after enemies:
```js
for (const it of game.items) it.update(dt);
// items vs blocks (only Mushroom needs physics)
for (const it of game.items) {
  if (it._dead) continue;
  if (!(it instanceof Mushroom)) continue;
  for (const b of game.blocks) {
    if (b.dead) continue;
    const result = resolveAabb(it, b);
    if (result === 'x') it.reverse();
  }
}
// items vs player
for (const it of game.items) {
  if (it._dead) continue;
  if (!aabbOverlap(player.getAABB(), it.getAABB())) continue;
  if (it instanceof Coin) {
    it.collect();
    game.score = (game.score ?? 0) + 100;
    game.coins = (game.coins ?? 0) + 1;
    if ((game.coins ?? 0) >= 100) { game.coins -= 100; game.lives++; }
    game.audio?.play?.('coin');
  } else if (it instanceof Mushroom) {
    it.collect();
    if (player.form === 'small') {
      player.form = 'big';
      const s = PLAYER_SIZES.big;
      player.y -= (s.h - player.h);
      player.w = s.w; player.h = s.h;
    }
    game.score = (game.score ?? 0) + 1000;
    game.audio?.play?.('powerup');
  } else if (it instanceof FireFlower) {
    it.collect();
    player.form = 'fire';
    const s = PLAYER_SIZES.fire;
    if (player.h !== s.h) {
      player.y -= (s.h - player.h);
      player.w = s.w; player.h = s.h;
    }
    game.score = (game.score ?? 0) + 1000;
    game.audio?.play?.('powerup');
  }
}
game.items = game.items.filter(it => !it._dead);
```

In `render()`, after blocks:
```js
for (const it of game.items) it.render(ctx);
```

- [ ] **Step 3: Add coins to Level 1**

```js
coins: [
  { x: 200, y: 360 }, { x: 230, y: 360 }, { x: 260, y: 360 },
  { x: 1200, y: 360 }, { x: 1230, y: 360 }, { x: 1260, y: 360 },
  { x: 2400, y: 360 }, { x: 2440, y: 360 }, { x: 2480, y: 360 },
],
```

- [ ] **Step 4: Verify**

Refresh. Walk over coins → they vanish, score (no HUD yet but you can `console.log(game.score)` from devtools). Hit a ?-block from below containing mushroom → mushroom pops out, drifts on ground, walk into it → Mario grows.

- [ ] **Step 5: Commit**

```bash
git add src/game.js src/levels/level1.js
git commit -m "feat(items): coin pickup, mushroom power-up, fire flower"
```

---

## Phase 11 — Fireball

### Task 20: Fireball projectile

**Files:**
- Create: `src/entities/fireball.js`
- Modify: `src/entities/player.js`, `src/game.js`

- [ ] **Step 1: Create `src/entities/fireball.js`**

```js
import { fillCircle } from '../renderer.js';
import { applyGravity } from '../physics.js';

const SPEED = 320;
const BOUNCE_VY = -260;
const MAX_BOUNCES = 2;

export class Fireball {
  constructor(x, y, dir) {
    this.x = x; this.y = y;
    this.w = 12; this.h = 12;
    this.vx = SPEED * dir;
    this.vy = 100;
    this.bounces = 0;
    this._dead = false;
  }
  get dead() { return this._dead; }
  getAABB() { return { x: this.x, y: this.y, w: this.w, h: this.h }; }

  onHitGround() {
    this.bounces++;
    if (this.bounces > MAX_BOUNCES) { this._dead = true; return; }
    this.vy = BOUNCE_VY;
  }
  onHitWall() { this._dead = true; }
  onHitEnemy() { this._dead = true; }

  update(dt) {
    applyGravity(this, dt);
    this.x += this.vx * dt;
    this.y += this.vy * dt;
  }
  render(ctx) {
    const cx = this.x + this.w / 2;
    const cy = this.y + this.h / 2;
    const g = ctx.createRadialGradient(cx, cy, 1, cx, cy, this.w);
    g.addColorStop(0, '#fff');
    g.addColorStop(0.4, '#ffe27a');
    g.addColorStop(1, '#c0392b');
    fillCircle(ctx, cx, cy, this.w / 2, g, '#c0392b', 1);
  }
}
```

- [ ] **Step 2: Add fire button to Player**

In `src/entities/player.js`, in `update(dt, world)`, after the jump block:
```js
if (this.form === 'fire' && world.input.wasPressed('fire')) {
  const count = (world.fireballs ?? []).filter(f => !f.dead).length;
  if (count < 2) {
    world.spawnFireball?.(this.x + this.w / 2, this.y + this.h / 2, this.facing);
  }
}
```

- [ ] **Step 3: Wire fireballs in game.js**

```js
import { Fireball } from './entities/fireball.js';
```

In `createGame`, add:
```js
game.fireballs = [];
game.spawnFireball = (x, y, dir) => {
  game.fireballs.push(new Fireball(x, y, dir));
  game.audio?.play?.('fireball');
};
```

In `loadLevel`:
```js
game.fireballs = [];
```

In `update(dt)`, after items:
```js
for (const f of game.fireballs) f.update(dt);
for (const f of game.fireballs) {
  if (f._dead) continue;
  for (const b of game.blocks) {
    if (b.dead) continue;
    const result = resolveAabb(f, b);
    if (result === 'x') f.onHitWall();
    if (result === 'y' && f.y < b.y) f.onHitGround();
  }
}
// fireball vs enemies
for (const f of game.fireballs) {
  if (f._dead) continue;
  for (const e of game.enemies) {
    if (e._dead) continue;
    if (aabbOverlap(f.getAABB(), e.getAABB())) {
      f.onHitEnemy();
      e.stomped();
      game.score = (game.score ?? 0) + 200;
    }
  }
}
game.fireballs = game.fireballs.filter(f => !f._dead);
```

In `render()`, after items:
```js
for (const f of game.fireballs) f.render(ctx);
```

- [ ] **Step 4: Add fireflower ?-block to Level 1**

Edit the qblock list so one of them contains fire flower:
```js
{ type: 'qblock', x: 1364, y: 320, contains: 'fireflower' },
```

- [ ] **Step 5: Verify**

Refresh. Walk to Level 1, eat mushroom → big Mario. Hit the fire flower ?-block → flower comes out, walk into it → fire Mario (red+white). Press X → fireball flies forward, bounces, kills enemies on contact.

- [ ] **Step 6: Commit**

```bash
git add src/entities/fireball.js src/entities/player.js src/game.js src/levels/level1.js
git commit -m "feat(fireball): projectile + fire mario bonus"
```

---

## Phase 12 — Flag + Level transition

### Task 21: Flag completes level

**Files:**
- Modify: `src/game.js`, `src/entities/block.js`

- [ ] **Step 1: Mark Flag as overlap-only (not collide-with)**

In `src/entities/block.js`, add to `Flag` class:
```js
get isTrigger() { return true; }
```

In `src/game.js`, in the block-resolve loop, skip resolving for triggers:
```js
for (const b of game.blocks) {
  if (b.dead) continue;
  if (b.isTrigger) {
    if (aabbOverlap(player.getAABB(), b.getAABB())) {
      onFlagReached(b);
    }
    continue;
  }
  const prevY = player.y;
  const result = resolveAabb(player, b);
  if (result === 'y' && player.y > prevY && b.onBumpFromBelow) {
    b.onBumpFromBelow(player, game);
  }
}
```

Add helper in `createGame`:
```js
function onFlagReached(flag) {
  if (game.levelComplete) return;
  game.levelComplete = true;
  game.audio?.play?.('levelClear');
  game.score = (game.score ?? 0) + 500;
  setTimeout(() => {
    const next = game.currentLevel + 1;
    if (next < LEVEL_FILES.length) {
      loadLevel(next);
      game.levelComplete = false;
    } else {
      game.state = 'VICTORY';   // wired up in Phase 14
    }
  }, 1500);
}
```

In `loadLevel`, reset:
```js
game.levelComplete = false;
```

- [ ] **Step 2: Add Level 2 stub so transition can happen**

Create `src/levels/level2.js` with a minimal layout:
```js
export default {
  name: '1-2 Underground',
  width: 2400, height: 480,
  background: 'cave', music: 'underground',
  spawn: { x: 50, y: 320 },
  blocks: [
    { type: 'ground', x: 0, y: 416, w: 2400, h: 64 },
    { type: 'flag',   x: 2300, y: 216 }
  ],
  enemies: [], coins: [],
};
```

Similarly create `level3.js` and `level4.js` stubs with `name: '1-3 Sky'` / `'1-4 Castle'` and same minimal layout (different `background` for variety).

- [ ] **Step 3: Verify**

Refresh, run to far right of Level 1, touch flag — short pause, then loads "1-2 Underground" with dark background.

- [ ] **Step 4: Commit**

```bash
git add src/game.js src/entities/block.js src/levels/level2.js src/levels/level3.js src/levels/level4.js
git commit -m "feat(level): flag triggers next-level transition"
```

---

## Phase 13 — Game state machine

### Task 22: State machine + Menu + Pause + GameOver

**Files:**
- Modify: `src/game.js`
- Create: `src/ui.js`

- [ ] **Step 1: Create `src/ui.js`**

```js
function panel(ctx, w, h, alpha = 0.5) {
  ctx.fillStyle = `rgba(0,0,0,${alpha})`;
  ctx.fillRect(0, 0, w, h);
}
function center(ctx, text, y, size, color) {
  ctx.fillStyle = color;
  ctx.font = `bold ${size}px "Courier New", monospace`;
  ctx.textAlign = 'center';
  ctx.fillText(text, ctx.canvas.width / 2, y);
  ctx.textAlign = 'left';
}

export function renderHUD(ctx, hud) {
  const w = ctx.canvas.width;
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  ctx.fillRect(0, 0, w, 30);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 14px monospace';
  ctx.fillText(`SCORE ${String(hud.score ?? 0).padStart(6, '0')}`, 10, 20);
  ctx.fillText(`COIN ×${hud.coins ?? 0}`, 180, 20);
  ctx.fillText(`${hud.world ?? ''}`, 300, 20);
  ctx.fillText(`LIFE ×${hud.lives ?? 3}`, 480, 20);
  ctx.fillText(`TIME ${hud.time ?? '---'}`, 600, 20);
}

export function renderMenu(ctx, hiScore) {
  const w = ctx.canvas.width, h = ctx.canvas.height;
  panel(ctx, w, h, 0.3);
  center(ctx, 'SUPER PIPE BROS', h * 0.3, 44, '#fff');
  center(ctx, '— a learning project —', h * 0.4, 16, '#ddd');
  if ((performance.now() / 500) % 2 < 1) {
    center(ctx, 'PRESS ENTER TO START', h * 0.6, 22, '#ffe27a');
  }
  center(ctx, `HI-SCORE ${String(hiScore).padStart(6, '0')}`, h * 0.75, 16, '#fff');
}

export function renderPauseOverlay(ctx) {
  const w = ctx.canvas.width, h = ctx.canvas.height;
  panel(ctx, w, h, 0.6);
  center(ctx, '⏸ PAUSED', h * 0.35, 36, '#fff');
  center(ctx, '[ESC] CONTINUE', h * 0.55, 18, '#fff');
  center(ctx, '[Q] QUIT TO MENU', h * 0.62, 18, '#fff');
  center(ctx, '[M] TOGGLE SOUND', h * 0.69, 18, '#fff');
}

export function renderGameOver(ctx, score, hiScore) {
  const w = ctx.canvas.width, h = ctx.canvas.height;
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, w, h);
  center(ctx, 'GAME OVER', h * 0.35, 44, '#e74c3c');
  center(ctx, `SCORE ${String(score).padStart(6, '0')}`, h * 0.5, 20, '#fff');
  center(ctx, `HI-SCORE ${String(hiScore).padStart(6, '0')} ⭐`, h * 0.58, 18, '#ffe27a');
  center(ctx, '[R] RETRY  ·  [Q] MENU', h * 0.75, 18, '#fff');
}

export function renderVictory(ctx, score, hiScore) {
  const w = ctx.canvas.width, h = ctx.canvas.height;
  ctx.fillStyle = '#1a3a5a';
  ctx.fillRect(0, 0, w, h);
  center(ctx, '🏆 VICTORY 🏆', h * 0.3, 44, '#ffe27a');
  center(ctx, 'You beat the boss!', h * 0.45, 22, '#fff');
  center(ctx, `FINAL SCORE ${String(score).padStart(6, '0')}`, h * 0.6, 20, '#fff');
  center(ctx, `HI-SCORE ${String(hiScore).padStart(6, '0')}`, h * 0.68, 18, '#ffe27a');
  center(ctx, '[ENTER] MENU', h * 0.8, 18, '#fff');
}
```

- [ ] **Step 2: Refactor `src/game.js` state**

Add:
```js
import { renderHUD, renderMenu, renderPauseOverlay, renderGameOver, renderVictory } from './ui.js';
```

Replace `game.state = 'PLAYING'` initial value with:
```js
game.state = 'MENU';
game.score = 0;
game.coins = 0;
game.lives = 3;
game.hiScore = 0;   // wired up in Phase 16
```

Replace `update(dt)` body wrapper to gate on state:
```js
function update(dt) {
  if (game.state === 'PLAYING') updatePlaying(dt);
}
function updatePlaying(dt) {
  // ... existing update body (player.update, blocks, enemies, items, fireballs, camera) ...
  // Death check:
  if (game.player && game.player._dead) {
    game.lives -= 1;
    if (game.lives <= 0) game.state = 'GAME_OVER';
    else loadLevel(game.currentLevel);
  }
}
```

Handle global keys in `tick` (after `update`, before `endFrame`):
```js
const input = game.input;
if (input.wasPressed('mute')) game.audio?.setMuted?.(!game.audio?.isMuted);

if (game.state === 'MENU' && input.wasPressed('confirm')) {
  game.score = 0; game.coins = 0; game.lives = 3;
  game.state = 'PLAYING';
  loadLevel(0);
}
if (game.state === 'PLAYING' && input.wasPressed('pause')) game.state = 'PAUSED';
else if (game.state === 'PAUSED' && input.wasPressed('pause')) game.state = 'PLAYING';

if (game.state === 'PAUSED' && input.wasPressed('quit')) game.state = 'MENU';
if (game.state === 'GAME_OVER' && input.wasPressed('retry')) {
  game.score = 0; game.coins = 0; game.lives = 3;
  game.state = 'PLAYING';
  loadLevel(0);
}
if ((game.state === 'GAME_OVER' || game.state === 'VICTORY') && input.wasPressed('confirm'))
  game.state = 'MENU';
if (game.state === 'GAME_OVER' && input.wasPressed('quit')) game.state = 'MENU';
```

Replace `render()`:
```js
function render() {
  clear(ctx, backgroundColor(game.background));

  if (game.state === 'MENU') {
    renderMenu(ctx, game.hiScore);
    return;
  }
  if (game.state === 'VICTORY') {
    renderVictory(ctx, game.score, game.hiScore);
    return;
  }
  if (game.state === 'GAME_OVER') {
    renderGameOver(ctx, game.score, game.hiScore);
    return;
  }

  // PLAYING or PAUSED: draw world + HUD
  if (game.player) {
    ctx.save();
    ctx.translate(-Math.round(camera.x), -Math.round(camera.y));
    for (const b of game.blocks) b.render(ctx);
    for (const it of game.items) it.render(ctx);
    for (const e of game.enemies) e.render(ctx);
    for (const f of game.fireballs) f.render(ctx);
    game.player.render(ctx);
    ctx.restore();
  }
  renderHUD(ctx, {
    score: game.score, coins: game.coins,
    world: game.levelName ?? '', lives: game.lives, time: '---'
  });

  if (game.state === 'PAUSED') renderPauseOverlay(ctx);
}
```

- [ ] **Step 3: Verify all states**

Refresh:
- **MENU**: title screen with blinking prompt.
- Enter → PLAYING with HUD top bar.
- Esc → PAUSED overlay.
- Esc again → resume.
- Q (in pause) → MENU.
- Walk off cliff (level 1 has a gap at x=1024-1100) → die → respawns. After 3 deaths → GAME OVER. R → restart from L1.
- Reach flag, finish L1 → loads L2.

- [ ] **Step 4: Commit**

```bash
git add src/ui.js src/game.js
git commit -m "feat(state): MENU/PLAYING/PAUSED/GAME_OVER/VICTORY + UI screens"
```

---

## Phase 14 — Audio

### Task 23: Audio module skeleton + jump SFX

**Files:**
- Create: `src/audio.js`
- Modify: `src/game.js`

- [ ] **Step 1: Create `src/audio.js`**

```js
export function createAudio() {
  let ctx = null;
  let muted = false;
  let musicStop = null;
  let musicTrack = null;

  function ensureCtx() {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  function tone(freq, dur, type = 'square', gain = 0.15, sweepTo = null) {
    if (muted) return;
    const c = ensureCtx();
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    if (sweepTo != null) osc.frequency.linearRampToValueAtTime(sweepTo, c.currentTime + dur);
    g.gain.value = gain;
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + dur);
    osc.connect(g).connect(c.destination);
    osc.start();
    osc.stop(c.currentTime + dur);
  }

  function noise(dur, gain = 0.1) {
    if (muted) return;
    const c = ensureCtx();
    const buf = c.createBuffer(1, c.sampleRate * dur, c.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    const src = c.createBufferSource(); src.buffer = buf;
    const g = c.createGain(); g.gain.value = gain;
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + dur);
    src.connect(g).connect(c.destination);
    src.start();
    src.stop(c.currentTime + dur);
  }

  const SFX = {
    jump:       () => tone(400, 0.08, 'square', 0.12, 800),
    coin:       () => { tone(987, 0.05, 'sine', 0.15); setTimeout(() => tone(1318, 0.08, 'sine', 0.15), 50); },
    stomp:      () => { tone(120, 0.06, 'square', 0.12); noise(0.06, 0.08); },
    powerup:    () => { [523,659,784,1047].forEach((f, i) => setTimeout(() => tone(f, 0.1, 'square', 0.12), i * 80)); },
    fireball:   () => tone(200, 0.1, 'sawtooth', 0.12, 100),
    hit:        () => tone(200, 0.3, 'square', 0.12, 80),
    die:        () => { [523,494,440,392,349,294].forEach((f, i) => setTimeout(() => tone(f, 0.2, 'square', 0.1), i * 180)); },
    break:      () => { noise(0.05, 0.12); tone(300, 0.05, 'square', 0.1); },
    levelClear: () => { [392,494,587,784,988,1175].forEach((f, i) => setTimeout(() => tone(f, 0.12, 'square', 0.12), i * 130)); },
  };

  return {
    unlock() { ensureCtx(); },
    play(name) { SFX[name]?.(); },
    startMusic(name) { /* full impl added in Task 24 */ musicTrack = name; },
    stopMusic() { if (musicStop) musicStop(); musicTrack = null; },
    setMuted(v) { muted = v; if (v) this.stopMusic(); },
    get isMuted() { return muted; },
  };
}
```

- [ ] **Step 2: Wire audio into game**

In `src/game.js`:
```js
import { createAudio } from './audio.js';
```

In `createGame`, after `const input = ...`:
```js
const audio = createAudio();
game.audio = audio;
```

In key handler (the part where MENU → PLAYING), call:
```js
audio.unlock();
```

In `src/entities/player.js`, in jump branch:
```js
world.audio?.play?.('jump');
```

- [ ] **Step 3: Verify SFX**

Refresh, start game. Jumping plays jump sound. Collecting coin plays coin sound (already wired in Task 19). Stomping plays stomp. Eating mushroom plays powerup. Press M to mute, sounds stop.

- [ ] **Step 4: Commit**

```bash
git add src/audio.js src/game.js src/entities/player.js
git commit -m "feat(audio): WebAudio synthesizer + all 9 SFX"
```

### Task 24: Background music

**Files:**
- Modify: `src/audio.js`

- [ ] **Step 1: Add music scheduler to `audio.js`**

Replace the `startMusic` / `stopMusic` stubs:

```js
const MUSIC = {
  overworld: { bpm: 200, notes: [
    // C major arpeggio bounce
    [659, 0.25], [659, 0.25], [0, 0.25], [659, 0.25],
    [0, 0.25], [523, 0.25], [659, 0.25], [0, 0.25],
    [784, 0.5],  [0, 0.5],   [392, 0.5], [0, 0.5],
  ]},
  underground: { bpm: 140, notes: [
    [196, 0.5], [220, 0.5], [196, 0.5], [165, 0.5],
    [196, 0.5], [165, 0.5], [147, 0.5], [165, 0.5],
  ]},
  castle: { bpm: 160, notes: [
    [220, 0.5], [261, 0.5], [220, 0.5], [196, 0.5],
    [165, 0.5], [196, 0.5], [220, 0.5], [261, 0.5],
  ]},
};

function startMusicImpl(track) {
  if (muted) return null;
  const c = ensureCtx();
  const data = MUSIC[track];
  if (!data) return null;
  const beat = 60 / data.bpm;
  let stopped = false;
  let i = 0;
  let t = c.currentTime + 0.05;

  function schedule() {
    if (stopped) return;
    while (t < c.currentTime + 1) {
      const [f, dur] = data.notes[i % data.notes.length];
      if (f > 0) {
        const osc = c.createOscillator();
        const g = c.createGain();
        osc.type = 'triangle';
        osc.frequency.value = f;
        g.gain.value = 0.06;
        g.gain.setValueAtTime(0.06, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + dur * beat * 0.95);
        osc.connect(g).connect(c.destination);
        osc.start(t); osc.stop(t + dur * beat);
      }
      t += dur * beat;
      i++;
    }
    setTimeout(schedule, 200);
  }
  schedule();
  return () => { stopped = true; };
}
```

Update the public methods:
```js
startMusic(name) {
  if (musicStop) musicStop();
  musicStop = startMusicImpl(name);
  musicTrack = name;
},
stopMusic() {
  if (musicStop) musicStop();
  musicStop = null;
  musicTrack = null;
},
```

- [ ] **Step 2: Start music on level load**

In `src/game.js`, in `loadLevel`, after setting `game.background`:
```js
audio.startMusic(data.music);
```

In key-handler MENU→PLAYING transition, after `loadLevel(0)`:
The music starts inside loadLevel. ✓

In transitions that leave PLAYING (`GAME_OVER`, `VICTORY`, going to `MENU`), call:
```js
audio.stopMusic();
```
Add this in: death check (`game.state = 'GAME_OVER'`), victory transition, and the pause→menu and gameover→menu key handlers.

- [ ] **Step 3: Verify**

Refresh. Start game → overworld music plays. Walk to flag → music continues briefly then L2 starts → underground music. Press M → music stops.

- [ ] **Step 4: Commit**

```bash
git add src/audio.js src/game.js
git commit -m "feat(audio): 3 background music tracks (chiptune scheduler)"
```

---

## Phase 15 — Persistence

### Task 25: Storage module (TDD)

**Files:**
- Create: `src/storage.js`
- Create: `test/storage.test.js`

- [ ] **Step 1: Write failing test `test/storage.test.js`**

```js
import { describe, it, expect, beforeEach } from 'vitest';
import { createStorage } from '../src/storage.js';

function makeFakeStorage() {
  const data = new Map();
  return {
    getItem: (k) => data.has(k) ? data.get(k) : null,
    setItem: (k, v) => data.set(k, String(v)),
    removeItem: (k) => data.delete(k),
  };
}

describe('storage', () => {
  let fake, s;
  beforeEach(() => { fake = makeFakeStorage(); s = createStorage(fake); });

  it('hiScore defaults to 0 when nothing stored', () => {
    expect(s.getHiScore()).toBe(0);
  });
  it('setHiScore writes when value is higher', () => {
    s.setHiScore(500);
    expect(s.getHiScore()).toBe(500);
  });
  it('setHiScore does not overwrite lower score', () => {
    s.setHiScore(500);
    s.setHiScore(100);
    expect(s.getHiScore()).toBe(500);
  });
  it('muted defaults to false', () => {
    expect(s.getMuted()).toBe(false);
  });
  it('setMuted persists boolean', () => {
    s.setMuted(true);
    expect(s.getMuted()).toBe(true);
    s.setMuted(false);
    expect(s.getMuted()).toBe(false);
  });
});
```

- [ ] **Step 2: Run, verify fail**

Run: `npm test`
Expected: "Cannot find module '../src/storage.js'".

- [ ] **Step 3: Create `src/storage.js`**

```js
const HI_KEY    = 'pipebros:hiScore';
const MUTED_KEY = 'pipebros:muted';

export function createStorage(backend = window.localStorage) {
  return {
    getHiScore() {
      const v = backend.getItem(HI_KEY);
      return v ? parseInt(v, 10) : 0;
    },
    setHiScore(score) {
      const current = this.getHiScore();
      if (score > current) backend.setItem(HI_KEY, String(score));
    },
    getMuted() {
      return backend.getItem(MUTED_KEY) === '1';
    },
    setMuted(v) {
      backend.setItem(MUTED_KEY, v ? '1' : '0');
    },
  };
}
```

- [ ] **Step 4: Run, verify pass**

Run: `npm test`
Expected: 5 storage tests passing.

- [ ] **Step 5: Wire storage into game**

In `src/game.js`:
```js
import { createStorage } from './storage.js';
```
In `createGame`:
```js
const storage = createStorage();
game.storage = storage;
game.hiScore = storage.getHiScore();
audio.setMuted(storage.getMuted());
```

Update mute toggle:
```js
if (input.wasPressed('mute')) {
  const next = !audio.isMuted;
  audio.setMuted(next);
  storage.setMuted(next);
}
```

On `GAME_OVER` and `VICTORY` transitions, save hi-score:
```js
storage.setHiScore(game.score);
game.hiScore = storage.getHiScore();
```

- [ ] **Step 6: Verify**

Play. Die 3 times → game over. Restart, beat your previous score, die. Refresh browser. Menu shows hi-score persisted.

- [ ] **Step 7: Commit**

```bash
git add src/storage.js test/storage.test.js src/game.js
git commit -m "feat(storage): hi-score + mute persistence (TDD)"
```

---

## Phase 16 — Levels 2 & 3 + Goomba flying

### Task 26: Flesh out Level 2 (Underground)

**Files:**
- Modify: `src/levels/level2.js`

- [ ] **Step 1: Replace level 2 stub with full layout**

```js
export default {
  name: '1-2 Underground',
  width: 2800, height: 480,
  background: 'cave',
  music: 'underground',
  spawn: { x: 50, y: 320 },
  blocks: [
    { type: 'ground', x: 0,    y: 416, w: 2800, h: 64 },
    { type: 'ground', x: 0,    y: 0,   w: 2800, h: 32 },   // ceiling

    // brick corridors
    { type: 'brick',  x: 200, y: 320 },
    { type: 'brick',  x: 232, y: 320 },
    { type: 'qblock', x: 264, y: 320, contains: 'fireflower' },
    { type: 'brick',  x: 296, y: 320 },

    // tall pillar
    { type: 'brick', x: 600, y: 320 },
    { type: 'brick', x: 600, y: 352 },
    { type: 'brick', x: 600, y: 384 },

    { type: 'qblock', x: 900, y: 256, contains: 'coin' },
    { type: 'qblock', x: 932, y: 256, contains: 'mushroom' },

    // narrow gap
    { type: 'brick', x: 1300, y: 320 },
    { type: 'brick', x: 1332, y: 320 },
    { type: 'brick', x: 1364, y: 320 },
    { type: 'brick', x: 1396, y: 320 },

    { type: 'pipe', x: 1700, y: 384, h: 32 },
    { type: 'pipe', x: 2000, y: 352, h: 64 },

    { type: 'flag', x: 2700, y: 216 }
  ],
  enemies: [
    { type: 'goomba', x: 400, y: 388 },
    { type: 'koopa',  x: 800, y: 380 },
    { type: 'goomba', x: 1200, y: 388 },
    { type: 'koopa',  x: 1600, y: 380 },
    { type: 'goomba', x: 2300, y: 388 },
  ],
  coins: [
    { x: 400, y: 360 }, { x: 430, y: 360 },
    { x: 1500, y: 280 }, { x: 1530, y: 280 }, { x: 1560, y: 280 },
    { x: 2400, y: 360 }, { x: 2430, y: 360 },
  ],
};
```

- [ ] **Step 2: Verify**

Reach Level 2. Should see darker palette, ceiling, denser brick layout, Goomba+Koopa mix.

- [ ] **Step 3: Commit**

```bash
git add src/levels/level2.js
git commit -m "feat(level): Level 2 Underground layout"
```

### Task 27: Flying Goomba variant

**Files:**
- Modify: `src/entities/goomba.js`, `src/game.js`

- [ ] **Step 1: Add wing variant**

In `src/entities/goomba.js`, replace constructor:
```js
constructor(x, y, opts = {}) {
  this.x = x; this.y = y;
  this.w = 28; this.h = 26;
  this.vx = -SPEED;
  this.vy = 0;
  this.onGround = false;
  this.flying = opts.flying ?? false;
  this._baseY = y;
  this._t = 0;
  this._dead = false;
  this._dyingT = 0;
}
```

Replace `update(dt)`:
```js
update(dt) {
  if (this._dyingT > 0) {
    this._dyingT -= dt;
    return;
  }
  this._t += dt;
  if (this.flying) {
    // hover with sin
    this.y = this._baseY + Math.sin(this._t * 2.5) * 24;
    this.x += this.vx * dt;
  } else {
    applyGravity(this, dt);
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.onGround = false;
  }
}
```

In `render`, add tiny wing overlay when `this.flying && !this._dead`:
```js
if (this.flying && !this._dead) {
  const wingY = this.y + 6;
  fillEllipse(ctx, this.x - 4, wingY, 6, 4, '#fff', '#666', 1);
  fillEllipse(ctx, this.x + this.w + 4, wingY, 6, 4, '#fff', '#666', 1);
}
```

- [ ] **Step 2: Update loader to read flying flag**

In `src/game.js` `loadLevel`:
```js
if (spec.type === 'goomba') return new Goomba(spec.x, spec.y, { flying: !!spec.flying });
```

- [ ] **Step 3: Commit**

```bash
git add src/entities/goomba.js src/game.js
git commit -m "feat(goomba): flying variant with sin bobbing"
```

### Task 28: Level 3 (Sky)

**Files:**
- Modify: `src/levels/level3.js`

- [ ] **Step 1: Layout Level 3**

```js
export default {
  name: '1-3 Sky',
  width: 3000, height: 480,
  background: 'sky',
  music: 'overworld',
  spawn: { x: 50, y: 320 },
  blocks: [
    { type: 'ground', x: 0,    y: 416, w: 200, h: 64 },   // start
    // floating platforms
    { type: 'ground', x: 300,  y: 360, w: 100, h: 24 },
    { type: 'ground', x: 480,  y: 320, w: 80,  h: 24 },
    { type: 'qblock', x: 540,  y: 256, contains: 'coin' },
    { type: 'ground', x: 660,  y: 360, w: 120, h: 24 },
    { type: 'ground', x: 880,  y: 300, w: 60,  h: 24 },
    { type: 'ground', x: 1040, y: 360, w: 200, h: 24 },
    { type: 'qblock', x: 1100, y: 256, contains: 'fireflower' },

    // gap section
    { type: 'ground', x: 1400, y: 360, w: 60, h: 24 },
    { type: 'ground', x: 1560, y: 320, w: 60, h: 24 },
    { type: 'ground', x: 1720, y: 360, w: 60, h: 24 },
    { type: 'ground', x: 1880, y: 320, w: 60, h: 24 },

    { type: 'ground', x: 2100, y: 416, w: 600, h: 64 },
    { type: 'brick',  x: 2300, y: 320 },
    { type: 'qblock', x: 2332, y: 320, contains: 'coin' },

    { type: 'ground', x: 2800, y: 416, w: 200, h: 64 },
    { type: 'flag',   x: 2900, y: 216 }
  ],
  enemies: [
    { type: 'goomba', x: 320, y: 332, flying: true },
    { type: 'goomba', x: 700, y: 332, flying: true },
    { type: 'koopa',  x: 1080, y: 324 },
    { type: 'goomba', x: 1450, y: 332, flying: true },
    { type: 'goomba', x: 1750, y: 332, flying: true },
    { type: 'koopa',  x: 2300, y: 380 },
  ],
  coins: [
    { x: 320, y: 330 }, { x: 350, y: 330 },
    { x: 500, y: 290 },
    { x: 700, y: 330 },
    { x: 1100, y: 320 }, { x: 1130, y: 320 },
  ],
};
```

- [ ] **Step 2: Verify**

Play through level 1 → 2 → 3. Level 3 has small floating platforms requiring careful jumps and flying Goombas.

- [ ] **Step 3: Commit**

```bash
git add src/levels/level3.js
git commit -m "feat(level): Level 3 Sky layout with flying enemies"
```

---

## Phase 17 — Boss + Level 4

### Task 29: Boss entity (TDD)

**Files:**
- Create: `src/entities/boss.js`
- Modify: `test/entities.test.js`

- [ ] **Step 1: Add boss tests**

```js
import { Boss } from '../src/entities/boss.js';

describe('Boss', () => {
  it('starts with hp=5', () => {
    const b = new Boss(800, 360);
    expect(b.hp).toBe(5);
  });
  it('damage() reduces hp', () => {
    const b = new Boss(800, 360);
    b.damage();
    expect(b.hp).toBe(4);
    expect(b.dead).toBe(false);
  });
  it('dies when hp reaches 0', () => {
    const b = new Boss(800, 360);
    for (let i = 0; i < 5; i++) b.damage();
    expect(b.hp).toBe(0);
    expect(b.dead).toBe(true);
  });
  it('immune during invuln window after damage', () => {
    const b = new Boss(800, 360);
    b.damage();
    expect(b.invulnT).toBeGreaterThan(0);
    b.damage();  // should be ignored
    expect(b.hp).toBe(4);
  });
});
```

- [ ] **Step 2: Run, verify fail**

Run: `npm test`
Expected: cannot find boss module.

- [ ] **Step 3: Create `src/entities/boss.js`**

```js
import { fillRoundRect, fillEllipse, fillCircle } from '../renderer.js';
import { applyGravity } from '../physics.js';

const SPEED = 80;

export class Boss {
  constructor(x, y) {
    this.x = x; this.y = y;
    this.w = 64; this.h = 60;
    this.vx = -SPEED;
    this.vy = 0;
    this.hp = 5;
    this.onGround = false;
    this._dead = false;
    this.invulnT = 0;
    this.jumpCooldown = 2;
    this.fireCooldown = 3;
    this.facing = -1;
  }
  get dead() { return this._dead; }
  getAABB() { return { x: this.x, y: this.y, w: this.w, h: this.h }; }

  damage() {
    if (this.invulnT > 0 || this._dead) return;
    this.hp -= 1;
    this.invulnT = 0.8;
    if (this.hp <= 0) this._dead = true;
  }
  reverse() { this.vx = -this.vx; this.facing = -this.facing; }

  update(dt, world) {
    if (this._dead) return;
    if (this.invulnT > 0) this.invulnT -= dt;

    this.jumpCooldown -= dt;
    if (this.jumpCooldown <= 0 && this.onGround) {
      this.vy = -380;
      this.onGround = false;
      this.jumpCooldown = 2 + Math.random() * 1.5;
    }

    this.fireCooldown -= dt;
    if (this.fireCooldown <= 0) {
      world?.spawnBossFireball?.(this.x + this.w / 2, this.y + this.h / 2, this.facing);
      this.fireCooldown = 3 + Math.random();
    }

    applyGravity(this, dt);
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.onGround = false;
  }

  render(ctx) {
    const cx = this.x + this.w / 2;
    const flash = this.invulnT > 0 && Math.floor(this.invulnT * 12) % 2 === 0;
    const bodyColor = flash ? '#fff' : '#e67e22';
    fillEllipse(ctx, cx, this.y + this.h * 0.6, this.w * 0.5, this.h * 0.45, bodyColor, '#5a2a0a', 3);
    // horns
    fillRoundRect(ctx, this.x + 12, this.y + 4, 12, 14, '#fff', '#5a2a0a', 5);
    fillRoundRect(ctx, this.x + this.w - 24, this.y + 4, 12, 14, '#fff', '#5a2a0a', 5);
    // eyes
    fillCircle(ctx, cx - 12, this.y + 22, 6, '#fff', '#000', 1);
    fillCircle(ctx, cx + 12, this.y + 22, 6, '#fff', '#000', 1);
    fillCircle(ctx, cx - 12, this.y + 24, 3, '#c0392b');
    fillCircle(ctx, cx + 12, this.y + 24, 3, '#c0392b');
    // hp bar
    ctx.fillStyle = '#000';
    ctx.fillRect(this.x, this.y - 12, this.w, 6);
    ctx.fillStyle = '#e74c3c';
    ctx.fillRect(this.x + 1, this.y - 11, (this.w - 2) * (this.hp / 5), 4);
  }
}
```

- [ ] **Step 4: Run tests, verify pass**

Run: `npm test`
Expected: all passing.

- [ ] **Step 5: Commit**

```bash
git add src/entities/boss.js test/entities.test.js
git commit -m "feat(boss): entity with hp/damage/AI patterns (TDD)"
```

### Task 30: Boss fireball + Level 4 + Victory

**Files:**
- Modify: `src/entities/fireball.js`, `src/game.js`, `src/levels/level4.js`

- [ ] **Step 1: Add `friendly` flag to Fireball**

In `src/entities/fireball.js`, replace constructor:
```js
constructor(x, y, dir, friendly = true) {
  this.x = x; this.y = y;
  this.w = 12; this.h = 12;
  this.vx = SPEED * dir;
  this.vy = friendly ? 100 : 0;
  this.bounces = 0;
  this.friendly = friendly;
  this._dead = false;
}
```

When `!friendly`, render in different color: in `render`, replace gradient:
```js
const c1 = this.friendly ? '#fff' : '#fff';
const c2 = this.friendly ? '#ffe27a' : '#9b59b6';
const c3 = this.friendly ? '#c0392b' : '#5a006a';
const g = ctx.createRadialGradient(cx, cy, 1, cx, cy, this.w);
g.addColorStop(0, c1);
g.addColorStop(0.4, c2);
g.addColorStop(1, c3);
fillCircle(ctx, cx, cy, this.w / 2, g, c3, 1);
```

- [ ] **Step 2: Wire boss into game**

In `src/game.js`:
```js
import { Boss } from './entities/boss.js';
```

In `loadLevel` enemy map, add:
```js
if (spec.type === 'boss') return new Boss(spec.x, spec.y);
```

In `createGame`, add:
```js
game.spawnBossFireball = (x, y, dir) => {
  game.fireballs.push(new Fireball(x, y, dir, false));
};
```

In `updatePlaying`, where fireballs collide with enemies, restrict to friendly only:
```js
for (const f of game.fireballs) {
  if (f._dead || !f.friendly) continue;
  for (const e of game.enemies) {
    if (e._dead) continue;
    if (aabbOverlap(f.getAABB(), e.getAABB())) {
      f.onHitEnemy();
      if (e instanceof Boss) {
        e.damage();
        game.score = (game.score ?? 0) + 500;
      } else {
        e.stomped();
        game.score = (game.score ?? 0) + 200;
      }
    }
  }
}
```

Add player-vs-hostile-fireball:
```js
for (const f of game.fireballs) {
  if (f._dead || f.friendly) continue;
  if (aabbOverlap(f.getAABB(), player.getAABB())) {
    f._dead = true;
    onPlayerHit(player, game);
  }
}
```

In enemy-player collision, special-case Boss: stomping it does NOT kill it (it only takes fireball damage), only hurts player:
```js
if (e instanceof Boss) {
  onPlayerHit(player, game);
  continue;
}
```
(Place at the top of the enemy-player loop body, before the Koopa branch.)

Boss death → VICTORY:
In the same update loop, after the dead-filter for enemies:
```js
if (game.enemies.length === 0 && game.currentLevel === 3 && game.boss_was_alive) {
  game.state = 'VICTORY';
  storage.setHiScore(game.score);
  game.hiScore = storage.getHiScore();
  audio.stopMusic();
}
```
Simpler approach: track boss death directly. In the fireball-vs-boss branch, after `e.damage()`, check:
```js
if (e instanceof Boss && e.dead) {
  game.state = 'VICTORY';
  storage.setHiScore(game.score);
  game.hiScore = storage.getHiScore();
  audio.stopMusic();
}
```

- [ ] **Step 3: Layout Level 4**

```js
// src/levels/level4.js
export default {
  name: '1-4 Castle',
  width: 2600, height: 480,
  background: 'castle',
  music: 'castle',
  spawn: { x: 50, y: 320 },
  blocks: [
    { type: 'ground', x: 0,    y: 416, w: 2600, h: 64 },
    { type: 'ground', x: 0,    y: 0,   w: 2600, h: 32 },

    // pillars
    { type: 'brick',  x: 300, y: 320 }, { type: 'brick',  x: 300, y: 352 },
    { type: 'brick',  x: 600, y: 320 }, { type: 'brick',  x: 600, y: 352 },
    { type: 'brick',  x: 900, y: 320 }, { type: 'brick',  x: 900, y: 352 },

    { type: 'qblock', x: 700, y: 256, contains: 'fireflower' },

    // boss room walls
    { type: 'brick', x: 1800, y: 96 }, { type: 'brick', x: 1800, y: 128 },
    { type: 'brick', x: 1800, y: 160 }, { type: 'brick', x: 1800, y: 192 },
    { type: 'brick', x: 1800, y: 224 }, { type: 'brick', x: 1800, y: 256 },
    { type: 'brick', x: 1800, y: 288 }, { type: 'brick', x: 1800, y: 320 },
    { type: 'brick', x: 1800, y: 352 }, { type: 'brick', x: 1800, y: 384 },
  ],
  enemies: [
    { type: 'goomba', x: 800, y: 388 },
    { type: 'koopa',  x: 1400, y: 380 },
    { type: 'boss',   x: 2300, y: 356 }
  ],
  coins: [],
};
```

- [ ] **Step 4: Verify**

Reach Level 4 (or hack: in console call `game.loadLevel(3)`). Should see castle bg + dark music + boss visible. Mario without fire form just gets hurt. With fire, shoot fireballs → boss flashes, HP bar drops. 5 hits → VICTORY screen.

- [ ] **Step 5: Commit**

```bash
git add src/entities/fireball.js src/game.js src/levels/level4.js
git commit -m "feat(boss): boss fireball + L4 + victory state"
```

---

## Phase 18 — Debug overlay

### Task 31: F1-F4 debug toggles

**Files:**
- Modify: `src/game.js`

- [ ] **Step 1: Add debug state and toggles**

In `createGame`:
```js
game.debug = {
  aabb: false,
  stats: false,
  god: false,
};
```

In key handler section:
```js
if (input.wasPressed('debugAABB'))  game.debug.aabb  = !game.debug.aabb;
if (input.wasPressed('debugStats')) game.debug.stats = !game.debug.stats;
if (input.wasPressed('debugLevel')) {
  const next = (game.currentLevel + 1) % LEVEL_FILES.length;
  loadLevel(next);
}
if (input.wasPressed('debugGod'))   game.debug.god   = !game.debug.god;
```

- [ ] **Step 2: Apply god mode in onPlayerHit**

```js
function onPlayerHit(p, g) {
  if (g.debug?.god) return;
  // ... existing ...
}
```

- [ ] **Step 3: Render debug overlays**

In `render()`, after PLAYING world draw and before HUD overlay:

```js
if (game.debug.aabb && game.player) {
  ctx.save();
  ctx.translate(-Math.round(camera.x), -Math.round(camera.y));
  ctx.strokeStyle = '#0f0'; ctx.lineWidth = 1;
  const all = [game.player, ...game.blocks, ...game.enemies, ...game.items, ...game.fireballs];
  for (const e of all) {
    if (e.dead && !e._dyingT) continue;
    const a = e.getAABB?.() ?? e;
    ctx.strokeRect(a.x, a.y, a.w, a.h);
  }
  ctx.restore();
}

if (game.debug.stats) {
  ctx.fillStyle = '#0f0';
  ctx.font = '12px monospace';
  ctx.fillText(`FPS ${game.fps}`, 10, 60);
  ctx.fillText(`Entities ${game.blocks.length + game.enemies.length + game.items.length + game.fireballs.length}`, 10, 76);
  if (game.player) ctx.fillText(`Mario ${game.player.form} (${Math.round(game.player.x)},${Math.round(game.player.y)})`, 10, 92);
  if (game.debug.god) ctx.fillText('GOD MODE', 10, 108);
}
```

- [ ] **Step 4: Verify**

Refresh. F1 → green boxes around every entity. F2 → stats overlay. F3 → cycle levels. F4 → "GOD MODE" appears, Mario takes no damage from any enemy.

- [ ] **Step 5: Commit**

```bash
git add src/game.js
git commit -m "feat(debug): F1-F4 overlay toggles"
```

---

## Phase 19 — Polish

### Task 32: Player death & invuln visual

**Files:**
- Modify: `src/entities/player.js`, `src/game.js`

- [ ] **Step 1: Add invuln blink to render**

In `src/entities/player.js`, in `render(ctx)`, wrap drawing with alpha:
```js
const blink = this.invulnUntil && this._frame !== undefined && this._frame < this.invulnUntil && (this._frame % 8 < 4);
ctx.globalAlpha = blink ? 0.4 : 1;
// ... existing draw ...
ctx.globalAlpha = 1;
```

`_frame` isn't available on player directly. Simpler: track via `world.frame` in update. Inside `update(dt, world)`, save:
```js
this._frame = world.frame;
```

- [ ] **Step 2: Death sequence**

In `src/game.js`, in `updatePlaying`, replace immediate death respawn with a small delay so death feels real:
```js
if (game.player && game.player._dead && !game.player._respawnT) {
  game.player._respawnT = 1.0;
  game.audio?.play?.('die');
  audio.stopMusic();
}
if (game.player && game.player._respawnT) {
  game.player._respawnT -= 1/60;
  if (game.player._respawnT <= 0) {
    game.lives -= 1;
    if (game.lives <= 0) {
      game.state = 'GAME_OVER';
      storage.setHiScore(game.score);
      game.hiScore = storage.getHiScore();
    } else {
      loadLevel(game.currentLevel);
    }
  }
}
```

- [ ] **Step 3: Verify**

Refresh. Walk into Goomba → small Mario flashes briefly then dies after a 1s pause. Big Mario → shrinks, blinks 1.5s, can take more hits during blink-period without dying.

- [ ] **Step 4: Commit**

```bash
git add src/entities/player.js src/game.js
git commit -m "feat(polish): death pause + invuln blink"
```

### Task 33: Playtest pass

**Files:**
- (No code changes pre-emptive; this is a manual verification + fix-as-you-find pass)

- [ ] **Step 1: Complete playtest checklist**

Manually verify each item, fix any bug found inline (small commits per fix):
- [ ] L1 → L2 → L3 → L4 → boss → VICTORY runs end-to-end
- [ ] All ?-block contents pop out and are collectible
- [ ] Pipes block correctly (cannot fall through)
- [ ] Brick: small Mario bumps; big Mario destroys
- [ ] Flag triggers next level (last flag at L4 leads to boss room, not next level — note: L4 currently has flag too, may want to remove the flag at boss room. If so, remove from `level4.js`)
- [ ] HUD counters increment correctly
- [ ] Pause / resume mid-action
- [ ] Quit-to-menu preserves hi-score after refresh
- [ ] M mutes both SFX and music
- [ ] F4 god mode prevents all damage

- [ ] **Step 2: Verify L4 flag intentionality**

If you keep the flag at end of L4 in addition to boss, it lets the player skip the boss. Either:
- Remove the flag from `level4.js`, OR
- Position it after the boss (x > 2300) so player must beat boss first.

Recommended: remove L4 flag, since boss kill triggers VICTORY directly:
```js
// in src/levels/level4.js, remove any { type: 'flag', ... } entry
```

- [ ] **Step 3: Commit any fixes**

```bash
git add -A
git commit -m "chore(playtest): pass + small fixes"
```

### Task 34: README update + final commit

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Update `README.md` with full content**

```markdown
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
```

- [ ] **Step 2: Final commit**

```bash
git add README.md
git commit -m "docs: full README with controls + features"
```

---

## Self-review notes

After implementing, verify spec coverage:

- [ ] **Spec §2.1 (in scope) items** — every bullet has a task above:
  - 4 levels: Tasks 13, 26, 28, 30 ✓
  - Player forms small/big/fire: Tasks 7, 19, 20 ✓
  - Goomba + flying: Tasks 14, 27 ✓
  - Koopa: Task 16 ✓
  - Mushroom + Fire Flower: Task 19 ✓
  - Coin, Brick, ?-Block, Pipe, Flag: Tasks 10, 11, 21 ✓
  - Boss HP=5 fire-only: Tasks 29, 30 ✓
  - HUD: Task 22 ✓
  - 5 UI screens: Task 22 ✓
  - 9 SFX + 3 music tracks: Tasks 23, 24 ✓
  - Hi-score localStorage: Task 25 ✓
  - Debug overlay F1-F4: Task 31 ✓

- [ ] **Spec §11 controls** — all keys wired in Task 4 + state handler Task 22.

- [ ] **Spec §13.2 unit tests** — physics (Task 6), Goomba (14), Koopa (16), Boss (29), storage (25). ~16-20 assertions, in the 15-25 range.

- [ ] **Open questions resolved (defaults):**
  - HUD `TIME` decorative — Task 22 sets time to `'---'`.
  - Flag = instant next level — Task 21.
  - Working name `Super Pipe Bros` — README + Menu in Tasks 1, 22.

---

## Execution checklist (for the implementer)

- Each task ends with a `git commit`. Do not skip commits — they're checkpoints.
- For TDD tasks: confirm test fails BEFORE writing the implementation.
- Manual-playtest tasks: actually open the browser, don't trust unit tests alone for render/audio.
- If you discover a bug mid-task, finish the current task, commit, then add a follow-up task. Don't expand scope.
