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
    this.phase = 'walk';
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
      fillEllipse(ctx, cx, this.y + this.h * 0.5, this.w / 2, this.h * 0.55, '#27ae60', '#145a32', 2);
      fillEllipse(ctx, cx, this.y + this.h * 0.5, this.w * 0.32, this.h * 0.3, '#f1c40f', '#7d5f06', 1);
    } else {
      fillEllipse(ctx, cx, this.y + this.h * 0.65, this.w / 2, this.h * 0.45, '#27ae60', '#145a32', 2);
      fillEllipse(ctx, cx, this.y + this.h * 0.65, this.w * 0.32, this.h * 0.25, '#f1c40f', '#7d5f06', 1);
      fillCircle(ctx, cx, this.y + 10, 10, '#f1c40f', '#145a32', 2);
      fillCircle(ctx, cx + (this.vx < 0 ? -4 : 4), this.y + 8, 2, '#000');
    }
  }
}
