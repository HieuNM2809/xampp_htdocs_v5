import { describe, it, expect } from 'vitest';
import { Goomba } from '../src/entities/goomba.js';
import { Koopa } from '../src/entities/koopa.js';
import { Boss } from '../src/entities/boss.js';

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

describe('Boss', () => {
  it('starts with hp=5', () => {
    const b = new Boss(800, 360);
    expect(b.hp).toBe(5);
  });
  it('damage() reduces hp', () => {
    const b = new Boss(800, 360);
    b.damage();
    expect(b.hp).toBe(4);
    expect(b.dead).toBe(false);
  });
  it('dies when hp reaches 0', () => {
    const b = new Boss(800, 360);
    for (let i = 0; i < 5; i++) {
      b.damage();
      b.invulnT = 0;  // reset invuln so damage applies repeatedly
    }
    expect(b.hp).toBe(0);
    expect(b.dead).toBe(true);
  });
  it('immune during invuln window after damage', () => {
    const b = new Boss(800, 360);
    b.damage();
    expect(b.invulnT).toBeGreaterThan(0);
    b.damage();
    expect(b.hp).toBe(4);
  });
});
