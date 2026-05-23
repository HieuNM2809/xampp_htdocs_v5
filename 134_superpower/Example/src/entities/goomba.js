import { fillRoundRect, fillEllipse, fillCircle } from '../renderer.js';
import { applyGravity } from '../physics.js';

const SPEED = 60;

export class Goomba {
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
  get dead() { return this._dead; }
  getAABB() { return { x: this.x, y: this.y, w: this.w, h: this.h }; }

  reverse() { this.vx = -this.vx; }
  stomped() {
    this._dead = true;
    this._dyingT = 0.4;
    this.vx = 0;
    this.h = 12;
  }

  update(dt) {
    if (this._dyingT > 0) {
      this._dyingT -= dt;
      return;
    }
    this._t += dt;
    if (this.flying) {
      this.y = this._baseY + Math.sin(this._t * 2.5) * 24;
      this.x += this.vx * dt;
    } else {
      applyGravity(this, dt);
      this.x += this.vx * dt;
      this.y += this.vy * dt;
      this.onGround = false;
    }
  }

  render(ctx) {
    const cx = this.x + this.w / 2;
    const cy = this.y + this.h / 2;
    if (this._dead) {
      fillRoundRect(ctx, this.x, this.y + this.h - 8, this.w, 8, '#8b4513', '#3d1d05', 4);
      return;
    }
    fillRoundRect(ctx, this.x, this.y, this.w, this.h * 0.75, '#8b4513', '#3d1d05', 14);
    fillCircle(ctx, cx - 7, this.y + 9, 3, '#fff', '#000', 1);
    fillCircle(ctx, cx + 7, this.y + 9, 3, '#fff', '#000', 1);
    fillEllipse(ctx, this.x + 5, this.y + this.h, 4, 4, '#5d2906', '#3d1d05', 1);
    fillEllipse(ctx, this.x + this.w - 5, this.y + this.h, 4, 4, '#5d2906', '#3d1d05', 1);
    if (this.flying && !this._dead) {
      const wingY = this.y + 6;
      fillEllipse(ctx, this.x - 4, wingY, 6, 4, '#fff', '#666', 1);
      fillEllipse(ctx, this.x + this.w + 4, wingY, 6, 4, '#fff', '#666', 1);
    }
  }
}
