export default {
  name: '1-2 Underground',
  width: 2400, height: 480,
  background: 'cave', music: 'underground',
  spawn: { x: 50, y: 320 },
  blocks: [
    { type: 'ground', x: 0, y: 416, w: 2400, h: 64 },
    { type: 'flag',   x: 2300, y: 216 }
  ],
  enemies: [], coins: [],
};
