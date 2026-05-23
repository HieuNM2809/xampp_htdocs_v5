export default {
  name: '1-2 Underground',
  width: 2800, height: 480,
  background: 'cave',
  music: 'underground',
  spawn: { x: 50, y: 320 },
  blocks: [
    { type: 'ground', x: 0,    y: 416, w: 2800, h: 64 },
    { type: 'ground', x: 0,    y: 0,   w: 2800, h: 32 },

    { type: 'brick',  x: 200, y: 320 },
    { type: 'brick',  x: 232, y: 320 },
    { type: 'qblock', x: 264, y: 320, contains: 'fireflower' },
    { type: 'brick',  x: 296, y: 320 },

    { type: 'brick', x: 600, y: 320 },
    { type: 'brick', x: 600, y: 352 },
    { type: 'brick', x: 600, y: 384 },

    { type: 'qblock', x: 900, y: 256, contains: 'coin' },
    { type: 'qblock', x: 932, y: 256, contains: 'mushroom' },

    { type: 'brick', x: 1300, y: 320 },
    { type: 'brick', x: 1332, y: 320 },
    { type: 'brick', x: 1364, y: 320 },
    { type: 'brick', x: 1396, y: 320 },

    { type: 'pipe', x: 1700, y: 384, h: 32 },
    { type: 'pipe', x: 2000, y: 352, h: 64 },

    { type: 'flag', x: 2700, y: 216 }
  ],
  enemies: [
    { type: 'goomba', x: 400, y: 388 },
    { type: 'koopa',  x: 800, y: 380 },
    { type: 'goomba', x: 1200, y: 388 },
    { type: 'koopa',  x: 1600, y: 380 },
    { type: 'goomba', x: 2300, y: 388 },
  ],
  coins: [
    { x: 400, y: 360 }, { x: 430, y: 360 },
    { x: 1500, y: 280 }, { x: 1530, y: 280 }, { x: 1560, y: 280 },
    { x: 2400, y: 360 }, { x: 2430, y: 360 },
  ],
};
