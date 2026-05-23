import { describe, it, expect } from 'vitest';
import { Goomba } from '../src/entities/goomba.js';

describe('Goomba', () => {
  it('walks left by default', () => {
    const g = new Goomba(200, 384);
    expect(g.vx).toBeLessThan(0);
  });

  it('reverses direction when colliding with a wall', () => {
    const g = new Goomba(200, 384);
    const startVx = g.vx;
    g.reverse();
    expect(g.vx).toBe(-startVx);
  });

  it('stomped() marks goomba dead and stops it', () => {
    const g = new Goomba(200, 384);
    g.stomped();
    expect(g.dead).toBe(true);
    expect(g.vx).toBe(0);
  });
});
