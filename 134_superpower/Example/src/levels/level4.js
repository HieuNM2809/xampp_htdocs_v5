export default {
  name: '1-4 Castle',
  width: 2600, height: 480,
  background: 'castle',
  music: 'castle',
  spawn: { x: 50, y: 320 },
  blocks: [
    { type: 'ground', x: 0, y: 416, w: 2600, h: 64 },
    { type: 'ground', x: 0, y: 0,   w: 2600, h: 32 },

    { type: 'brick',  x: 300, y: 320 }, { type: 'brick',  x: 300, y: 352 },
    { type: 'brick',  x: 600, y: 320 }, { type: 'brick',  x: 600, y: 352 },
    { type: 'brick',  x: 900, y: 320 }, { type: 'brick',  x: 900, y: 352 },

    { type: 'qblock', x: 700, y: 256, contains: 'fireflower' },

    { type: 'brick', x: 1800, y: 96 }, { type: 'brick', x: 1800, y: 128 },
    { type: 'brick', x: 1800, y: 160 }, { type: 'brick', x: 1800, y: 192 },
    { type: 'brick', x: 1800, y: 224 }, { type: 'brick', x: 1800, y: 256 },
    { type: 'brick', x: 1800, y: 288 }, { type: 'brick', x: 1800, y: 320 },
    { type: 'brick', x: 1800, y: 352 }, { type: 'brick', x: 1800, y: 384 },
  ],
  enemies: [
    { type: 'goomba', x: 800, y: 388 },
    { type: 'koopa',  x: 1400, y: 380 },
    { type: 'boss',   x: 2300, y: 356 }
  ],
  coins: [],
};
