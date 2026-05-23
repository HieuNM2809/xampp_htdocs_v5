import { fillRoundRect, fillCircle, fillEllipse } from '../renderer.js';
import { applyGravity } from '../physics.js';

export class Coin {
  constructor(x, y) {
    this.x = x; this.y = y;
    this.w = 20; this.h = 24;
    this._dead = false;
    this._spinT = 0;
    this._gradient = null;
  }
  get dead() { return this._dead; }
  getAABB() { return { x: this.x, y: this.y, w: this.w, h: this.h }; }
  update(dt) { this._spinT += dt; }
  render(ctx) {
    const sx = Math.abs(Math.sin(this._spinT * 4)) * 0.5 + 0.5;
    const cx = this.x + this.w / 2;
    const cy = this.y + this.h / 2;
    if (!this._gradient) {
      this._gradient = ctx.createRadialGradient(cx, cy, 2, cx, cy, this.w / 2);
      this._gradient.addColorStop(0, '#ffe27a');
      this._gradient.addColorStop(1, '#f39c12');
    }
    fillEllipse(ctx, cx, cy, (this.w / 2) * sx, this.h / 2, this._gradient, '#b8770a', 2);
  }
  collect() { this._dead = true; }
}

const MUSHROOM_SPEED = 90;

export class Mushroom {
  constructor(x, y) {
    this.x = x; this.y = y;
    this.w = 28; this.h = 28;
    this.vx = MUSHROOM_SPEED;
    this.vy = -120;
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
      this.y -= 30 * dt;
      if (this._spawnT <= 0) { this._spawning = false; this.vy = 0; }
      return;
    }
    applyGravity(this, dt);
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.onGround = false;
  }
  render(ctx) {
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
