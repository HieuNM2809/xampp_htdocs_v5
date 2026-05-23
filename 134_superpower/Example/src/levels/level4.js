export default {
  name: '1-4 Castle',
  width: 2400, height: 480,
  background: 'castle', music: 'castle',
  spawn: { x: 50, y: 320 },
  blocks: [
    { type: 'ground', x: 0, y: 416, w: 2400, h: 64 },
    { type: 'flag',   x: 2300, y: 216 }
  ],
  enemies: [], coins: [],
};
