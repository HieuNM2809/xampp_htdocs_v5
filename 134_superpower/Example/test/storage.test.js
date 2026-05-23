import { describe, it, expect, beforeEach } from 'vitest';
import { createStorage } from '../src/storage.js';

function makeFakeStorage() {
  const data = new Map();
  return {
    getItem: (k) => data.has(k) ? data.get(k) : null,
    setItem: (k, v) => data.set(k, String(v)),
    removeItem: (k) => data.delete(k),
  };
}

describe('storage', () => {
  let fake, s;
  beforeEach(() => { fake = makeFakeStorage(); s = createStorage(fake); });

  it('hiScore defaults to 0 when nothing stored', () => {
    expect(s.getHiScore()).toBe(0);
  });
  it('setHiScore writes when value is higher', () => {
    s.setHiScore(500);
    expect(s.getHiScore()).toBe(500);
  });
  it('setHiScore does not overwrite lower score', () => {
    s.setHiScore(500);
    s.setHiScore(100);
    expect(s.getHiScore()).toBe(500);
  });
  it('muted defaults to false', () => {
    expect(s.getMuted()).toBe(false);
  });
  it('setMuted persists boolean', () => {
    s.setMuted(true);
    expect(s.getMuted()).toBe(true);
    s.setMuted(false);
    expect(s.getMuted()).toBe(false);
  });
});
