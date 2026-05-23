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
