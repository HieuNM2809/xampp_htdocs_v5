import { describe, it, expect } from 'vitest';
import { aabbOverlap, resolveAabb } from '../src/physics.js';

describe('aabbOverlap', () => {
  it('returns true when boxes overlap', () => {
    expect(aabbOverlap({x:0,y:0,w:10,h:10}, {x:5,y:5,w:10,h:10})).toBe(true);
  });
  it('returns false when boxes are apart', () => {
    expect(aabbOverlap({x:0,y:0,w:10,h:10}, {x:20,y:0,w:10,h:10})).toBe(false);
  });
  it('returns false when boxes only touch edges', () => {
    expect(aabbOverlap({x:0,y:0,w:10,h:10}, {x:10,y:0,w:10,h:10})).toBe(false);
  });
});

describe('resolveAabb', () => {
  it('player falling onto ground stops at ground top with vy=0 and onGround=true', () => {
    const player = { x:100, y:216, w:32, h:32, vx:0, vy:300, onGround:false };
    const ground = { x:0, y:240, w:500, h:64 };
    resolveAabb(player, ground);
    expect(player.y + player.h).toBe(240);
    expect(player.vy).toBe(0);
    expect(player.onGround).toBe(true);
  });
  it('player moving right into wall stops at wall left edge, vx=0', () => {
    const player = { x:90, y:100, w:32, h:32, vx:80, vy:0, onGround:false };
    const wall = { x:120, y:80, w:32, h:64 };
    resolveAabb(player, wall);
    expect(player.x + player.w).toBe(120);
    expect(player.vx).toBe(0);
  });
  it('player moving left into wall stops at wall right edge, vx=0', () => {
    const player = { x:110, y:100, w:32, h:32, vx:-80, vy:0, onGround:false };
    const wall = { x:90, y:80, w:32, h:64 };
    resolveAabb(player, wall);
    expect(player.x).toBe(90 + 32);
    expect(player.vx).toBe(0);
  });
  it('player hitting ceiling stops with vy=0', () => {
    const player = { x:100, y:60, w:32, h:32, vx:0, vy:-200, onGround:false };
    const ceiling = { x:80, y:32, w:80, h:32 };
    resolveAabb(player, ceiling);
    expect(player.y).toBe(64);
    expect(player.vy).toBe(0);
  });
});
