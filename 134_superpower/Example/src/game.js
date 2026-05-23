import { createInput } from './input.js';
import { Player } from './entities/player.js';
import { resolveAabb } from './physics.js';
import { createBlock } from './entities/block.js';
import { clear } from './renderer.js';

const FIXED_DT = 1 / 60;

const LEVEL_FILES = ['./levels/level1.js', './levels/level2.js', './levels/level3.js', './levels/level4.js'];

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

  const input = createInput();
  game.input = input;

  game.currentLevel = -1;
  game.background = 'sky';

  const camera = { x: 0, y: 0 };
  game.camera = camera;

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
    game.coinsInLevel = [];
    game.player = new Player(data.spawn.x, data.spawn.y);
    camera.x = 0;
    camera.y = 0;
  }
  game.loadLevel = loadLevel;

  function updateCamera() {
    if (!game.player) return;
    const cx = game.player.x + game.player.w / 2;
    const screenCx = camera.x + game.width / 2;
    const deadzone = 100;
    if (cx - screenCx > deadzone)  camera.x += cx - screenCx - deadzone;
    if (cx - screenCx < -deadzone) camera.x += cx - screenCx + deadzone;
    camera.x = Math.max(0, Math.min(game.worldWidth - game.width, camera.x));
  }

  function update(dt) {
    const { player, blocks } = game;
    if (!player) return;
    game.frame++;
    player.update(dt, game);
    updateCamera();

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
  }

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
      case 'sky':    return '#5c94fc';
      case 'cave':   return '#0a0a0f';
      case 'night':  return '#1a1a3a';
      case 'castle': return '#1a0033';
      default:       return '#5c94fc';
    }
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

    input.endFrame();
    render();
    requestAnimationFrame(tick);
  }

  return {
    start() {
      loadLevel(0).then(() => requestAnimationFrame(tick));
    },
    game,
  };
}
