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
    ctx.fillStyle = '#6b4423';
    ctx.fillRect(this.x, this.y + 8, this.w, this.h - 8);
    ctx.fillStyle = '#3a7a3a';
    ctx.fillRect(this.x, this.y, this.w, 10);
  }
}

export class Brick extends BaseBlock {
  constructor(x, y) { super(x, y, TILE, TILE); this._bumpT = 0; }
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
  update(dt) {
    if (this._bumpT > 0) {
      this._bumpT -= dt;
    }
  }
  render(ctx) {
    const offset = this._bumpT > 0 ? -6 * Math.sin(this._bumpT / 0.15 * Math.PI) : 0;
    ctx.save();
    ctx.translate(0, offset);
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
    ctx.restore();
  }
}

export class QBlock extends BaseBlock {
  constructor(x, y, contains = 'coin') {
    super(x, y, TILE, TILE);
    this.contains = contains;
    this.used = false;
    this._bumpT = 0;
  }
  onBumpFromBelow(player, world) {
    if (this.used) return;
    this.used = true;
    this._bumpT = 0.15;
    world.spawnFromQBlock?.(this);
  }
  update(dt) {
    if (this._bumpT > 0) {
      this._bumpT -= dt;
    }
  }
  render(ctx) {
    const offset = this._bumpT > 0 ? -6 * Math.sin(this._bumpT / 0.15 * Math.PI) : 0;
    ctx.save();
    ctx.translate(0, offset);
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
    ctx.restore();
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
    ctx.fillStyle = '#bbb';
    ctx.fillRect(this.x, this.y, this.w, this.h);
    ctx.fillStyle = '#e74c3c';
    ctx.beginPath();
    ctx.moveTo(this.x + this.w, this.y + 8);
    ctx.lineTo(this.x + this.w + 28, this.y + 16);
    ctx.lineTo(this.x + this.w, this.y + 24);
    ctx.closePath();
    ctx.fill();
  }
  get isTrigger() { return true; }
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
