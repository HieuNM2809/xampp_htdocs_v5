import { createInput } from './input.js';
import { createAudio } from './audio.js';
import { createStorage } from './storage.js';
import { Player, PLAYER_SIZES } from './entities/player.js';
import { Goomba } from './entities/goomba.js';
import { Koopa } from './entities/koopa.js';
import { Boss } from './entities/boss.js';
import { resolveAabb, aabbOverlap } from './physics.js';
import { createBlock } from './entities/block.js';
import { clear } from './renderer.js';
import { Coin, Mushroom, FireFlower, createItem } from './entities/item.js';
import { Fireball } from './entities/fireball.js';
import { renderHUD, renderMenu, renderPauseOverlay, renderGameOver, renderVictory } from './ui.js';

const FIXED_DT = 1 / 60;

const LEVEL_FILES = ['./levels/level1.js', './levels/level2.js', './levels/level3.js', './levels/level4.js'];

export function createGame(canvas) {
  const ctx = canvas.getContext('2d');
  const game = {
    state: 'MENU',
    width: canvas.width,
    height: canvas.height,
    frame: 0,
    fps: 0,
    _acc: 0,
    _last: performance.now(),
    _fpsLast: performance.now(),
    _fpsCount: 0,
    score: 0,
    coins: 0,
    lives: 3,
    hiScore: 0,
  };

  const input = createInput();
  game.input = input;

  const audio = createAudio();
  game.audio = audio;

  const storage = createStorage();
  game.storage = storage;
  game.hiScore = storage.getHiScore();
  audio.setMuted(storage.getMuted());

  game.currentLevel = -1;
  game.background = 'sky';

  game.debug = {
    aabb: false,
    stats: false,
    god: false,
  };

  const camera = { x: 0, y: 0 };
  game.camera = camera;

  async function loadLevel(idx) {
    const mod = await import(LEVEL_FILES[idx]);
    const data = mod.default;
    game.currentLevel = idx;
    game.worldWidth = data.width;
    game.worldHeight = data.height;
    game.background = data.background;
    audio.startMusic(data.music);
    game.levelName = data.name;
    game.blocks = data.blocks.map(createBlock);
      game.enemies = data.enemies.map(spec => {
        if (spec.type === 'goomba') return new Goomba(spec.x, spec.y, { flying: !!spec.flying });
        if (spec.type === 'koopa')  return new Koopa(spec.x, spec.y);
        if (spec.type === 'boss')   return new Boss(spec.x, spec.y);
        throw new Error(`Unknown enemy ${spec.type}`);
      });
    game.items = data.coins.map(c => new Coin(c.x, c.y));
    game.fireballs = [];
    game.coinsInLevel = [];
    game.player = new Player(data.spawn.x, data.spawn.y);
    game.levelComplete = false;
    camera.x = 0;
    camera.y = 0;
  }
  game.loadLevel = loadLevel;

  game.fireballs = [];
  game.spawnFireball = (x, y, dir) => {
    game.fireballs.push(new Fireball(x, y, dir));
    game.audio?.play?.('fireball');
  };
  game.spawnBossFireball = (x, y, dir) => {
    game.fireballs.push(new Fireball(x, y, dir, false));
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
        audio.stopMusic();
        storage.setHiScore(game.score);
        game.hiScore = storage.getHiScore();
        game.state = 'VICTORY';
      }
    }, 1500);
  }

  function updateCamera() {
    if (!game.player) return;
    const cx = game.player.x + game.player.w / 2;
    const screenCx = camera.x + game.width / 2;
    const deadzone = 100;
    if (cx - screenCx > deadzone)  camera.x += cx - screenCx - deadzone;
    if (cx - screenCx < -deadzone) camera.x += cx - screenCx + deadzone;
    camera.x = Math.max(0, Math.min(game.worldWidth - game.width, camera.x));
  }

  function updatePlaying(dt) {
    const { player, blocks } = game;
    if (!player) return;
    game.frame++;
    player.update(dt, game);
    updateCamera();

    for (const b of blocks) b.update?.(dt);
    for (const b of blocks) {
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
    game.blocks = blocks.filter(b => !b.dead);

    // Enemies update + collide with blocks
    for (const e of game.enemies) e.update(dt, game);
    for (const e of game.enemies) {
      if (e._dead) continue;
      for (const b of game.blocks) {
        if (b.dead) continue;
        const prevVx = e.vx;
        const result = resolveAabb(e, b);
        if (result === 'x') {
          // resolveAabb zeroed vx; restore opposite direction
          e.vx = -prevVx;
          if (typeof e.facing !== 'undefined') e.facing = e.vx > 0 ? 1 : -1;
        }
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

      if (e instanceof Boss) {
        onPlayerHit(player, game);
        continue;
      }
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
    // Friendly fireball vs enemies
    for (const f of game.fireballs) {
      if (f._dead || !f.friendly) continue;
      for (const e of game.enemies) {
        if (e._dead) continue;
        if (aabbOverlap(f.getAABB(), e.getAABB())) {
          f.onHitEnemy();
          if (e instanceof Boss) {
            e.damage();
            game.score = (game.score ?? 0) + 500;
            if (e.dead) {
              audio.stopMusic();
              storage.setHiScore(game.score);
              game.hiScore = storage.getHiScore();
              game.state = 'VICTORY';
            }
          } else {
            e.stomped();
            game.score = (game.score ?? 0) + 200;
          }
        }
      }
    }
    // Hostile fireballs vs player
    for (const f of game.fireballs) {
      if (f._dead || f.friendly) continue;
      if (aabbOverlap(f.getAABB(), player.getAABB())) {
        f._dead = true;
        onPlayerHit(player, game);
      }
    }
    game.fireballs = game.fireballs.filter(f => !f._dead);

    // Player death with 1-second delay
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
          storage.setHiScore(game.score);
          game.hiScore = storage.getHiScore();
          game.state = 'GAME_OVER';
        } else {
          loadLevel(game.currentLevel);
        }
      }
    }
  }

  function update(dt) {
    if (game.state === 'PLAYING') updatePlaying(dt);
  }

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

    // Debug overlay
    if (game.debug.aabb && game.player) {
      ctx.save();
      ctx.translate(-Math.round(camera.x), -Math.round(camera.y));
      ctx.strokeStyle = '#0f0'; ctx.lineWidth = 1;
      const all = [game.player, ...game.blocks, ...game.enemies, ...game.items, ...game.fireballs];
      for (const e of all) {
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

    if (game.state === 'PAUSED') renderPauseOverlay(ctx);
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

    // Global state-machine keys (read once per render frame)
    const inp = game.input;
    if (inp.wasPressed('mute')) {
      const next = !audio.isMuted;
      audio.setMuted(next);
      storage.setMuted(next);
    }
    if (game.state === 'MENU' && inp.wasPressed('confirm')) {
      audio.unlock();
      game.score = 0; game.coins = 0; game.lives = 3;
      game.state = 'PLAYING';
      loadLevel(0);
    }
    if (game.state === 'PLAYING' && inp.wasPressed('pause')) game.state = 'PAUSED';
    else if (game.state === 'PAUSED' && inp.wasPressed('pause')) game.state = 'PLAYING';
    if (game.state === 'PAUSED' && inp.wasPressed('quit')) { audio.stopMusic(); game.state = 'MENU'; }
    if (game.state === 'GAME_OVER' && inp.wasPressed('retry')) {
      game.score = 0; game.coins = 0; game.lives = 3;
      game.state = 'PLAYING';
      loadLevel(0);
    }
    if ((game.state === 'GAME_OVER' || game.state === 'VICTORY') && inp.wasPressed('confirm')) {
      audio.stopMusic();
      game.state = 'MENU';
    }
    if (game.state === 'GAME_OVER' && inp.wasPressed('quit')) { audio.stopMusic(); game.state = 'MENU'; }

    if (inp.wasPressed('debugAABB'))  game.debug.aabb  = !game.debug.aabb;
    if (inp.wasPressed('debugStats')) game.debug.stats = !game.debug.stats;
    if (inp.wasPressed('debugLevel')) {
      const next = (game.currentLevel + 1) % LEVEL_FILES.length;
      loadLevel(next);
    }
    if (inp.wasPressed('debugGod'))   game.debug.god   = !game.debug.god;

    while (game._acc >= FIXED_DT) {
      update(FIXED_DT);
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
    if (g.debug?.god) return;
    if (g.frame < p.invulnUntil) return;
    if (p.form === 'fire') {
      p.form = 'big';
      g.audio?.play?.('hit');
    } else if (p.form === 'big') {
      p.form = 'small';
      g.audio?.play?.('hit');
    } else {
      p._dead = true;
      return;
    }
    const s = PLAYER_SIZES[p.form];
    p.w = s.w; p.h = s.h;
    p.invulnUntil = g.frame + 90;
  }

  return {
    start() {
      requestAnimationFrame(tick);
    },
    game,
  };
}
