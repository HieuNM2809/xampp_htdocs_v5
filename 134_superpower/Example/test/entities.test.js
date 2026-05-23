import { describe, it, expect } from 'vitest';
import { Goomba } from '../src/entities/goomba.js';
import { Koopa } from '../src/entities/koopa.js';

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

describe('Koopa', () => {
  it('initial phase is walking', () => {
    const k = new Koopa(200, 384);
    expect(k.phase).toBe('walk');
    expect(Math.abs(k.vx)).toBeGreaterThan(0);
  });
  it('first stomp → shell phase, vx=0', () => {
    const k = new Koopa(200, 384);
    k.stomped();
    expect(k.phase).toBe('shell');
    expect(k.vx).toBe(0);
  });
  it('kick on shell → sliding shell with speed', () => {
    const k = new Koopa(200, 384);
    k.stomped();
    k.kick(1);
    expect(k.phase).toBe('sliding');
    expect(k.vx).toBeGreaterThan(0);
  });
  it('stomp on sliding shell → stops, back to shell', () => {
    const k = new Koopa(200, 384);
    k.stomped();
    k.kick(1);
    k.stomped();
    expect(k.phase).toBe('shell');
    expect(k.vx).toBe(0);
  });
});
