import { fillRoundRect, fillEllipse, fillCircle } from '../renderer.js';
import { applyGravity } from '../physics.js';

const SPEED = 80;

export class Boss {
  constructor(x, y) {
    this.x = x; this.y = y;
    this.w = 64; this.h = 60;
    this.vx = -SPEED;
    this.vy = 0;
    this.hp = 5;
    this.onGround = false;
    this._dead = false;
    this.invulnT = 0;
    this.jumpCooldown = 2;
    this.fireCooldown = 3;
    this.facing = -1;
  }
  get dead() { return this._dead; }
  getAABB() { return { x: this.x, y: this.y, w: this.w, h: this.h }; }

  damage() {
    if (this.invulnT > 0 || this._dead) return;
    this.hp -= 1;
    this.invulnT = 0.8;
    if (this.hp <= 0) this._dead = true;
  }
  reverse() { this.vx = -this.vx; this.facing = -this.facing; }

  update(dt, world) {
    if (this._dead) return;
    if (this.invulnT > 0) this.invulnT -= dt;

    this.jumpCooldown -= dt;
    if (this.jumpCooldown <= 0 && this.onGround) {
      this.vy = -380;
      this.onGround = false;
      this.jumpCooldown = 2 + Math.random() * 1.5;
    }

    this.fireCooldown -= dt;
    if (this.fireCooldown <= 0) {
      world?.spawnBossFireball?.(this.x + this.w / 2, this.y + this.h / 2, this.facing);
      this.fireCooldown = 3 + Math.random();
    }

    applyGravity(this, dt);
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.onGround = false;
  }

  render(ctx) {
    const cx = this.x + this.w / 2;
    const flash = this.invulnT > 0 && Math.floor(this.invulnT * 12) % 2 === 0;
    const bodyColor = flash ? '#fff' : '#e67e22';
    fillEllipse(ctx, cx, this.y + this.h * 0.6, this.w * 0.5, this.h * 0.45, bodyColor, '#5a2a0a', 3);
    fillRoundRect(ctx, this.x + 12, this.y + 4, 12, 14, '#fff', '#5a2a0a', 5);
    fillRoundRect(ctx, this.x + this.w - 24, this.y + 4, 12, 14, '#fff', '#5a2a0a', 5);
    fillCircle(ctx, cx - 12, this.y + 22, 6, '#fff', '#000', 1);
    fillCircle(ctx, cx + 12, this.y + 22, 6, '#fff', '#000', 1);
    fillCircle(ctx, cx - 12, this.y + 24, 3, '#c0392b');
    fillCircle(ctx, cx + 12, this.y + 24, 3, '#c0392b');
    ctx.fillStyle = '#000';
    ctx.fillRect(this.x, this.y - 12, this.w, 6);
    ctx.fillStyle = '#e74c3c';
    ctx.fillRect(this.x + 1, this.y - 11, (this.w - 2) * (this.hp / 5), 4);
  }
}
