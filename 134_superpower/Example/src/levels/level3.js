export default {
  name: '1-3 Sky',
  width: 3000, height: 480,
  background: 'sky',
  music: 'overworld',
  spawn: { x: 50, y: 320 },
  blocks: [
    { type: 'ground', x: 0,    y: 416, w: 200, h: 64 },
    { type: 'ground', x: 300,  y: 360, w: 100, h: 24 },
    { type: 'ground', x: 480,  y: 320, w: 80,  h: 24 },
    { type: 'qblock', x: 540,  y: 256, contains: 'coin' },
    { type: 'ground', x: 660,  y: 360, w: 120, h: 24 },
    { type: 'ground', x: 880,  y: 300, w: 60,  h: 24 },
    { type: 'ground', x: 1040, y: 360, w: 200, h: 24 },
    { type: 'qblock', x: 1100, y: 256, contains: 'fireflower' },

    { type: 'ground', x: 1400, y: 360, w: 60, h: 24 },
    { type: 'ground', x: 1560, y: 320, w: 60, h: 24 },
    { type: 'ground', x: 1720, y: 360, w: 60, h: 24 },
    { type: 'ground', x: 1880, y: 320, w: 60, h: 24 },

    { type: 'ground', x: 2100, y: 416, w: 600, h: 64 },
    { type: 'brick',  x: 2300, y: 320 },
    { type: 'qblock', x: 2332, y: 320, contains: 'coin' },

    { type: 'ground', x: 2800, y: 416, w: 200, h: 64 },
    { type: 'flag',   x: 2900, y: 216 }
  ],
  enemies: [
    { type: 'goomba', x: 320, y: 332, flying: true },
    { type: 'goomba', x: 700, y: 332, flying: true },
    { type: 'koopa',  x: 1080, y: 324 },
    { type: 'goomba', x: 1450, y: 332, flying: true },
    { type: 'goomba', x: 1750, y: 332, flying: true },
    { type: 'koopa',  x: 2300, y: 380 },
  ],
  coins: [
    { x: 320, y: 330 }, { x: 350, y: 330 },
    { x: 500, y: 290 },
    { x: 700, y: 330 },
    { x: 1100, y: 320 }, { x: 1130, y: 320 },
  ],
};
