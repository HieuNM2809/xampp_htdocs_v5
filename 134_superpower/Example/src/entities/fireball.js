import { fillCircle } from '../renderer.js';
import { applyGravity } from '../physics.js';

const SPEED = 320;
const BOUNCE_VY = -260;
const MAX_BOUNCES = 2;

export class Fireball {
  constructor(x, y, dir, friendly = true) {
    this.x = x; this.y = y;
    this.w = 12; this.h = 12;
    this.vx = SPEED * dir;
    this.vy = friendly ? 100 : 0;
    this.bounces = 0;
    this.friendly = friendly;
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
    const c1 = '#fff';
    const c2 = this.friendly ? '#ffe27a' : '#9b59b6';
    const c3 = this.friendly ? '#c0392b' : '#5a006a';
    const g = ctx.createRadialGradient(cx, cy, 1, cx, cy, this.w);
    g.addColorStop(0, c1);
    g.addColorStop(0.4, c2);
    g.addColorStop(1, c3);
    fillCircle(ctx, cx, cy, this.w / 2, g, c3, 1);
  }
}
