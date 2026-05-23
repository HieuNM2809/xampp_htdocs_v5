import { createInput } from './input.js';
import { Player, PLAYER_SIZES } from './entities/player.js';
import { Goomba } from './entities/goomba.js';
import { Koopa } from './entities/koopa.js';
import { resolveAabb, aabbOverlap } from './physics.js';
import { createBlock } from './entities/block.js';
import { clear } from './renderer.js';
import { Coin, Mushroom, FireFlower, createItem } from './entities/item.js';
import { Fireball } from './entities/fireball.js';

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
    game.enemies = data.enemies.map(spec => {
      if (spec.type === 'goomba') return new Goomba(spec.x, spec.y);
      if (spec.type === 'koopa')  return new Koopa(spec.x, spec.y);
      throw new Error(`Unknown enemy ${spec.type}`);
    });
    game.items = data.coins.map(c => new Coin(c.x, c.y));
    game.fireballs = [];
    game.coinsInLevel = [];
    game.player = new Player(data.spawn.x, data.spawn.y);
    camera.x = 0;
    camera.y = 0;
  }
  game.loadLevel = loadLevel;

  game.fireballs = [];
  game.spawnFireball = (x, y, dir) => {
    game.fireballs.push(new Fireball(x, y, dir));
    game.audio?.play?.('fireball');
  };

  game.spawnFromQBlock = function(qblock) {
    const content = qblock.contains;
    const x = qblock.x + 2;
    const y = qblock.y - 4;
    if (content === 'coin') {
      game.score = (game.score ?? 0) + 100;
      game.coins = (game.coins ?? 0) + 1;
      game.audio?.play?.('coin');
    } else if (content === 'mushroom') {
      const itemType = game.player.form === 'small' ? 'mushroom' : 'fireflower';
      game.items.push(createItem({ type: itemType, x, y }));
    } else if (content === 'fireflower') {
      game.items.push(createItem({ type: 'fireflower', x, y }));
    }
  };

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

    // Enemies update + collide with blocks
    for (const e of game.enemies) e.update(dt);
    for (const e of game.enemies) {
      if (e._dead) continue;
      for (const b of game.blocks) {
        if (b.dead) continue;
        const result = resolveAabb(e, b);
        if (result === 'x') e.reverse();
        if (result === 'y') {
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
    // Player-vs-enemy
    for (const e of game.enemies) {
      if (e._dead) continue;
      if (!aabbOverlap(player.getAABB(), e.getAABB())) continue;
      const stomped = player.vy > 0 && player.y + player.h - 8 < e.y;

      if (e instanceof Koopa) {
        if (e.phase === 'walk') {
          if (stomped) {
            e.stomped();
            player.vy = -260;
            game.score = (game.score ?? 0) + 100;
          } else {
            onPlayerHit(player, game);
          }
        } else if (e.phase === 'shell') {
          if (stomped) {
            player.vy = -260;
          } else {
            const dir = (player.x < e.x) ? 1 : -1;
            e.kick(dir);
            player.x = dir === 1 ? e.x - player.w - 1 : e.x + e.w + 1;
          }
        } else if (e.phase === 'sliding') {
          if (stomped) {
            e.stomped();
            player.vy = -260;
          } else {
            onPlayerHit(player, game);
          }
        }
      } else {
        // Goomba branch (unchanged)
        if (stomped) {
          e.stomped();
          player.vy = -260;
          game.score = (game.score ?? 0) + 100;
        } else {
          onPlayerHit(player, game);
        }
      }
    }

    // Sliding shell kills other enemies in its path
    for (const e of game.enemies) {
      if (e instanceof Koopa && e.phase === 'sliding') {
        for (const other of game.enemies) {
          if (other === e || other._dead) continue;
          if (aabbOverlap(e.getAABB(), other.getAABB())) {
            const isOtherShell = other instanceof Koopa && other.phase === 'shell';
            if (!isOtherShell && typeof other.stomped === 'function') {
              other.stomped();
              if (other instanceof Goomba) game.score = (game.score ?? 0) + 100;
            }
          }
        }
      }
    }
    // Filter only after dying animation complete (so flat-squish renders for 0.4s)
    game.enemies = game.enemies.filter(e => !e._dead || (e._dyingT ?? 0) > 0);

    // Items update + collide with blocks (only Mushroom needs physics)
    for (const it of game.items) it.update(dt);
    for (const it of game.items) {
      if (it._dead) continue;
      if (!(it instanceof Mushroom)) continue;
      for (const b of game.blocks) {
        if (b.dead) continue;
        const result = resolveAabb(it, b);
        if (result === 'x') it.reverse();
      }
    }
    // Items vs player
    for (const it of game.items) {
      if (it._dead) continue;
      if (!aabbOverlap(player.getAABB(), it.getAABB())) continue;
      if (it instanceof Coin) {
        it.collect();
        game.score = (game.score ?? 0) + 100;
        game.coins = (game.coins ?? 0) + 1;
        if ((game.coins ?? 0) >= 100) { game.coins -= 100; game.lives = (game.lives ?? 3) + 1; }
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
        const oldH = player.h;
        player.form = 'fire';
        const s = PLAYER_SIZES.fire;
        if (player.h !== s.h) {
          player.y -= (s.h - oldH);
          player.w = s.w; player.h = s.h;
        }
        game.score = (game.score ?? 0) + 1000;
        game.audio?.play?.('powerup');
      }
    }
    game.items = game.items.filter(it => !it._dead);

    // Fireballs
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
    // Fireball vs enemies
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
  }

  function render() {
    clear(ctx, backgroundColor(game.background));
    if (!game.player) return;
    ctx.save();
    ctx.translate(-Math.round(camera.x), -Math.round(camera.y));
    for (const b of game.blocks) b.render(ctx);
    for (const it of game.items) it.render(ctx);
    for (const e of game.enemies) e.render(ctx);
    for (const f of game.fireballs) f.render(ctx);
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
    p.invulnUntil = g.frame + 90;
  }

  return {
    start() {
      loadLevel(0).then(() => requestAnimationFrame(tick));
    },
    game,
  };
}
