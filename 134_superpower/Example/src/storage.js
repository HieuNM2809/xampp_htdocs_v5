const HI_KEY    = 'pipebros:hiScore';
const MUTED_KEY = 'pipebros:muted';

export function createStorage(backend = window.localStorage) {
  return {
    getHiScore() {
      const v = backend.getItem(HI_KEY);
      return v ? parseInt(v, 10) : 0;
    },
    setHiScore(score) {
      const current = this.getHiScore();
      if (score > current) backend.setItem(HI_KEY, String(score));
    },
    getMuted() {
      return backend.getItem(MUTED_KEY) === '1';
    },
    setMuted(v) {
      backend.setItem(MUTED_KEY, v ? '1' : '0');
    },
  };
}
