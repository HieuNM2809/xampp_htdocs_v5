import { createInput } from './input.js';
import { Player } from './entities/player.js';
import { resolveAabb } from './physics.js';
import { createBlock } from './entities/block.js';

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

  const input = createInput();
  game.input = input;

  const player = new Player(100, 300);
  game.player = player;

  const blocks = [
    createBlock({ type: 'ground', x: 0,   y: 416, w: 800, h: 64 }),
    createBlock({ type: 'brick',  x: 200, y: 320 }),
    createBlock({ type: 'qblock', x: 232, y: 320, contains: 'coin' }),
    createBlock({ type: 'qblock', x: 264, y: 320, contains: 'mushroom' }),
    createBlock({ type: 'pipe',   x: 400, y: 368, h: 48 }),
    createBlock({ type: 'flag',   x: 700, y: 216 }),
  ];
  game.blocks = blocks;

  function update(dt) {
    game.frame++;
    player.update(dt, game);
    for (const b of blocks) resolveAabb(player, b);
  }

  function render() {
    ctx.fillStyle = '#5c94fc';
    ctx.fillRect(0, 0, game.width, game.height);
    ctx.fillStyle = '#fff';
    ctx.font = '20px monospace';
    ctx.fillText(`Frame ${game.frame}  FPS ${game.fps}`, 20, 30);
    const dbg = ['left','right','jump','run','fire','confirm','pause']
      .filter(a => input.isHeld(a)).join(' ');
    ctx.fillText(`Input: ${dbg}`, 20, 60);
    for (const b of blocks) b.render(ctx);
    player.render(ctx);
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
    start() { requestAnimationFrame(tick); },
    game,
  };
}
