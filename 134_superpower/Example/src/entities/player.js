import { fillRoundRect, fillEllipse } from '../renderer.js';

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
    // Movement/jump logic added in Tasks 8-9.
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
