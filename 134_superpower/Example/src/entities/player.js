import { fillRoundRect, fillEllipse } from '../renderer.js';
import { applyGravity } from '../physics.js';

const WALK_ACCEL = 600;
const RUN_ACCEL  = 900;
const WALK_MAX   = 180;
const RUN_MAX    = 280;
const JUMP_SPEED       = 480;
const JUMP_CUT_FACTOR  = 0.45;

export const PLAYER_SIZES = {
  small: { w: 28, h: 32 },
  big:   { w: 32, h: 56 },
  fire:  { w: 32, h: 56 },
};

export class Player {
  constructor(x, y) {
    const s = PLAYER_SIZES.small;
    this.x = x; this.y = y;
    this.w = s.w; this.h = s.h;
    this.vx = 0; this.vy = 0;
    this.facing = 1;          // 1=right, -1=left
    this.onGround = false;
    this.form = 'small';      // 'small' | 'big' | 'fire'
    this.invulnUntil = 0;
    this._dead = false;
  }
  get dead() { return this._dead; }
  getAABB() { return { x: this.x, y: this.y, w: this.w, h: this.h }; }

  update(dt, world) {
    const input = world.input;
    const accel = input.isHeld('run') ? RUN_ACCEL : WALK_ACCEL;
    const maxV  = input.isHeld('run') ? RUN_MAX   : WALK_MAX;

    if (input.isHeld('left'))  { this.vx -= accel * dt; this.facing = -1; }
    if (input.isHeld('right')) { this.vx += accel * dt; this.facing =  1; }
    if (!input.isHeld('left') && !input.isHeld('right')) {
      this.vx -= this.vx * Math.min(1, 8 * dt);
      if (Math.abs(this.vx) < 1) this.vx = 0;
    }
    this.vx = Math.max(-maxV, Math.min(maxV, this.vx));

    this.x += this.vx * dt;

    // Jump
    if (world.input.wasPressed('jump') && this.onGround) {
      this.vy = -JUMP_SPEED;
      this.onGround = false;
    }
    // Variable height: release jump early → cut vy
    if (!world.input.isHeld('jump') && this.vy < 0) {
      this.vy *= JUMP_CUT_FACTOR;
      if (this.vy > -1) this.vy = 0;
    }

    applyGravity(this, dt);
    this.y += this.vy * dt;
    this.onGround = false;  // reset; collision resolver will set true if standing
  }

  render(ctx, camera) {
    const x = this.x, y = this.y, w = this.w, h = this.h;
    const isFire = this.form === 'fire';
    const hatColor = isFire ? '#ffffff' : '#e74c3c';
    const bodyColor = isFire ? '#e74c3c' : '#3498db';
    // hat
    fillRoundRect(ctx, x, y - 2, w, 12, hatColor, '#5a2a0a', 6);
    // face
    fillRoundRect(ctx, x + 3, y + 6, w - 6, h * 0.4, '#ffd5b0', '#5a2a0a', 8);
    // body
    fillRoundRect(ctx, x + 1, y + h * 0.45, w - 2, h * 0.55, bodyColor, '#142850', 8);
  }
}
