# Super Pipe Bros — Design Document

**Ngày tạo:** 2026-05-23
**Tác giả:** Hiếu (hieunm2@hasaki.vn)
**Trạng thái:** Draft — chờ review

> Tên `Super Pipe Bros` là tên làm việc, có thể đổi trước khi triển khai.

---

## 1. Mục tiêu

Xây dựng một game 2D side-scrolling theo phong cách Super Mario Bros, chạy trực tiếp trên trình duyệt, dùng làm dự án học game loop / physics / Canvas API. Game phải:

- Chơi được liền tay bằng bàn phím trên desktop
- Có đủ cảm giác "Mario" (chạy, nhảy, đạp địch, thu coin, power-up, cờ kết thúc)
- Đi qua hết 4 màn, kết thúc bằng một trận boss
- Không cần build step — mở `index.html` (qua HTTP server local) là chạy

## 2. Phạm vi

### 2.1 Trong phạm vi

- 4 màn chơi: Overworld (L1), Underground (L2), Sky (L3), Castle + Boss (L4)
- Player có 3 hình thái: Small / Big / Fire
- 2 loại địch thường: Goomba, Koopa (+ biến thể Goomba bay ở L3)
- Power-ups: Mushroom (nâng cấp Small→Big), Fire Flower (nâng cấp lên Fire)
- Vật thể tương tác: Coin, Brick (Big Mario phá được), ?-Block, Pipe (decorative + chặn), Flag
- Boss cuối: HP=5, chỉ chịu sát thương từ fireball
- HUD: Score, Coins, World, Lives, Time
- 5 màn UI vẽ trên canvas: Menu / HUD / Pause / Game Over / Victory
- Âm thanh sinh runtime bằng WebAudio (9 SFX + 3 track nhạc nền)
- Lưu high score vào `localStorage`
- Debug overlay (F1-F4) cho dev

### 2.2 Ngoài phạm vi (YAGNI)

- Multiplayer / co-op
- Level editor
- Lưu tiến trình giữa các session (chỉ lưu high score)
- Mobile / touch controls
- Gamepad API
- Snapshot/render testing
- E2E testing
- Asset music/sprite từ file ngoài
- CI/CD

## 3. Stack kỹ thuật

| Thành phần | Lựa chọn |
|---|---|
| Ngôn ngữ | Vanilla JavaScript (ES2022, modules) |
| Render | Canvas 2D API |
| Audio | WebAudio API (oscillator + noise, không file asset) |
| Persistence | `localStorage` |
| Testing | Vitest (chỉ dev-dependency, game chính không cần npm install) |
| HTTP server | Bất kỳ — XAMPP/Live Server/`npx serve` (cần vì ES modules) |

Phong cách thẳng hàng với các project khác trong repo (`125_offline_cache`, `130_leaflet_map_v2`): không framework, không build step, mở qua trình duyệt là chạy.

## 4. Phong cách đồ họa

- **Flat / cartoon hiện đại** — bo góc tròn, không pixel sắc
- **Vẽ trực tiếp bằng Canvas API**: `roundRect`, `arc`, `quadraticCurveTo`, `createRadialGradient`, `createLinearGradient`
- Không sprite sheet, không file ảnh
- Nguyên tắc:
  - Entity bo `border-radius` ≥ 30% (tròn/elip)
  - Block tổng thể vuông nhưng bo góc 8px
  - Stroke đậm 2px màu tối hơn body → cảm giác cartoon
  - Gradient nhẹ tránh phẳng lì

## 5. Cấu trúc file

```
Example/
├── index.html             # <canvas> + nạp main.js (type="module")
├── style.css              # reset, full-screen canvas
├── README.md              # hướng dẫn chạy
├── src/
│   ├── main.js            # entry — khởi tạo Game, bind input
│   ├── game.js            # state machine + main loop (rAF)
│   ├── input.js           # keyboard → action state
│   ├── renderer.js        # camera, primitive draw helpers
│   ├── physics.js         # AABB collision, gravity, friction
│   ├── audio.js           # WebAudio SFX + nhạc nền
│   ├── storage.js         # localStorage wrapper
│   ├── ui.js              # HUD, menu, pause, game over, victory
│   ├── entities/
│   │   ├── player.js
│   │   ├── goomba.js
│   │   ├── koopa.js
│   │   ├── block.js       # ground, brick, qblock, pipe, flag
│   │   ├── item.js        # coin, mushroom, fire flower
│   │   ├── fireball.js
│   │   └── boss.js
│   └── levels/
│       ├── level1.js
│       ├── level2.js
│       ├── level3.js
│       └── level4.js
└── test/
    ├── physics.test.js
    └── entities.test.js
```

### 5.1 Quy tắc

- Mỗi file mục tiêu < 300 dòng
- 6 module hạ tầng (`input`, `renderer`, `physics`, `audio`, `storage`, `ui`) **không import lẫn nhau** — chỉ phơi API thuần
- `game.js` là chỗ phối hợp tất cả
- Level data là object thuần (không có logic), import động khi đổi màn
- Entities tự render và tự update — không phụ thuộc trực tiếp vào `renderer.js`

### 5.2 Luồng phụ thuộc

```
main.js
  └─→ game.js
        ├─→ input.js
        ├─→ renderer.js
        ├─→ physics.js
        ├─→ audio.js
        ├─→ storage.js
        ├─→ ui.js
        ├─→ entities/*.js
        └─→ levels/*.js (import động)
```

## 6. Game loop & state machine

### 6.1 State machine

```
MENU ──Enter──► PLAYING ◄──Esc──► PAUSED
                  │                  │
                  │die               │Q
                  ▼                  ▼
              GAME_OVER ◄────────── MENU
                  │R                 ▲
                  │                  │
                  └──Enter───────────┘

  PLAYING ──boss killed──► VICTORY ──Enter──► MENU
```

5 trạng thái: `MENU`, `PLAYING`, `PAUSED`, `GAME_OVER`, `VICTORY`.

### 6.2 Loop chính (fixed timestep 60Hz)

```js
const FIXED_DT = 1/60;
let acc = 0, last = performance.now();

function tick(now) {
  const frame = (now - last) / 1000;
  last = now;
  acc += Math.min(frame, 0.1);   // chống spike

  while (acc >= FIXED_DT) {
    if (state === 'PLAYING') update(FIXED_DT);
    acc -= FIXED_DT;
  }
  render();                       // luôn vẽ
  requestAnimationFrame(tick);
}
```

Tách rời `update` (deterministic physics) và `render` (mượt theo refresh rate). Pause = ngừng `update`, vẫn `render` overlay.

### 6.3 Cấu trúc `Game` object

- `state` — một trong 5 state ở trên
- `currentLevel` — index 0..3
- `player` — đối tượng Player duy nhất
- `entities` — mảng địch/item/block/fireball của level hiện tại
- `camera` — `{ x, y }` theo player, có dead-zone
- `score`, `coins`, `lives`, `hiScore`, `timeLeft` — số liệu HUD
- `input`, `audio`, `storage` — tham chiếu module

## 7. Entities

### 7.1 Interface chung

Mọi entity tuân theo:

```js
class Entity {
  constructor(x, y) { /* set position, size, default state */ }
  update(dt, world)   { /* physics, AI, animation */ }
  render(ctx, camera) { /* vẽ lên canvas */ }
  getAABB()           { return { x, y, w, h } }
  onCollide(other)    { /* xử lý va chạm */ }
  get dead()          { return this._dead }
}
```

Mỗi tick `game.js` lặp qua mảng `entities`:
1. Gọi `update(dt, world)` cho từng entity
2. Detect collision bằng AABB
3. Gọi `onCollide(other)` cả hai chiều
4. Lọc bỏ entity `dead`
5. Gọi `render(ctx, camera)`

### 7.2 Player (Mario)

| State | Hành vi |
|---|---|
| `small` | 1 hit → chết |
| `big`   | 1 hit → `small`, bất tử 1.5s |
| `fire`  | 1 hit → `big`, bất tử 1.5s. Bắn fireball bằng phím X (tối đa 2 fireball cùng lúc) |

- Nhảy: **variable height** — ấn lâu nhảy cao hơn. Tối đa ~110px (đủ nhảy qua 1 brick + 1 thân Big Mario)
- Sau khi bị hit ở `big`/`fire`: bất tử 1.5s, render nhấp nháy
- Chết: rơi xuống dưới màn hình, sau 1s respawn (nếu còn life) hoặc → `GAME_OVER`
- Dimensions: small `32×32`, big/fire `32×60`

### 7.3 Enemies

| Loại | Hành vi |
|---|---|
| **Goomba** | Đi qua lại ngang, đổi chiều khi gặp tường/vực. Đạp lên → chết (+100 điểm). Va vào sườn → Mario mất 1 hit |
| **Goomba bay** (L3) | Như Goomba nhưng dao động Y ±30px theo sin |
| **Koopa** | Phase 1: đi như Goomba. Đạp lên → chui vào mai (entity mới: `KoopaShell`). Phase 2 (shell): Mario chạm vào sườn → đá, mai trượt nhanh và giết các địch trên đường. Đạp lại shell → dừng. Shell trượt va Mario → mất hit |

### 7.4 Items

| Loại | Mô tả |
|---|---|
| **Coin** | Static. Chạm → +100 điểm + SFX `coin`. Đủ 100 coin → +1 mạng |
| **Mushroom** | Bật ra từ ?-block, di chuyển ngang như Goomba. Chạm: `small → big` |
| **Fire Flower** | Bật ra từ ?-block, đứng yên. Chạm: lên thẳng `fire` (kể cả từ `small`) |
| **Fireball** | Mario `fire` bắn ra. Trọng lực, nẩy mặt đất tối đa 2 lần rồi biến mất. Va địch → địch chết. Va brick → biến mất, brick không vỡ |

### 7.5 Blocks

| Loại | Tương tác |
|---|---|
| **Ground** | Không tương tác đặc biệt — chỉ chặn |
| **Brick** | Big/Fire Mario đánh từ dưới → vỡ. Small Mario → bật lại |
| **?-block** | Đánh từ dưới → bật content (coin/mushroom/fire flower theo `level data`). Sau đó thành block trơ |
| **Pipe** | Chặn, có thể đứng lên. Decorative. Không có pipe-warp |
| **Flag** | Chạm → hoàn thành level, sang level kế tiếp |

### 7.6 Boss (cuối Level 4)

- HP = 5
- Pattern: đi qua lại trong boss room, mỗi 2-3s nhảy 1 lần, mỗi 4s phun fireball ngang
- Chỉ chịu sát thương từ fireball của Mario (không đạp được)
- Hết HP → state `VICTORY`, lưu high score

## 8. Levels

### 8.1 Danh sách màn

| # | Tên | Mô tả ngắn |
|---|---|---|
| 1 | Overworld | Dạy gameplay cơ bản. Chỉ Goomba |
| 2 | Underground | Hành lang hẹp, brick nhiều. Giới thiệu Koopa + Fire Flower |
| 3 | Sky | Platform nhỏ rải rác, có vực. Mix Goomba bay + Koopa thường |
| 4 | Castle | Hành lang tối, ít địch, kết thúc bằng boss |

### 8.2 Định dạng dữ liệu level

```js
// src/levels/level1.js
export default {
  name: '1-1 Overworld',
  width: 3200,           // pixel — camera scroll tới đây
  height: 480,
  background: 'sky',     // 'sky' | 'cave' | 'night' | 'castle'
  music: 'overworld',    // tên track trong audio.js
  spawn: { x: 50, y: 300 },
  blocks: [
    { type: 'ground', x: 0,    y: 416, w: 1024, h: 64 },
    { type: 'ground', x: 1100, y: 416, w: 2100, h: 64 },
    { type: 'brick',  x: 320,  y: 320 },
    { type: 'qblock', x: 352,  y: 320, contains: 'coin' },
    { type: 'qblock', x: 384,  y: 320, contains: 'mushroom' },
    { type: 'pipe',   x: 600,  y: 352, h: 64 },
    { type: 'flag',   x: 3100, y: 200 }
  ],
  enemies: [
    { type: 'goomba', x: 500,  y: 384 },
    { type: 'goomba', x: 1500, y: 384 }
  ],
  coins: [
    { x: 200, y: 350 },
    { x: 240, y: 350 }
  ]
}
```

**Lý do dùng mảng object thay vì tilemap (mảng số):** vì game flat/cartoon không có tile sheet — block kích thước tùy ý (`w`, `h` cho `ground`). Dễ đọc, dễ chỉnh tay khi xây màn.

### 8.3 Loader

`game.js` có hàm `async loadLevel(index)`:
1. `import(\`./levels/level${index+1}.js\`)` — import động
2. Reset `entities[]`
3. Spawn `Player` tại `data.spawn`
4. Tạo entity tương ứng từ `data.blocks`, `data.enemies`, `data.coins`
5. Set `audio.startMusic(data.music)`
6. Reset camera

## 9. Audio

### 9.1 Cách tiếp cận

- Sinh âm runtime bằng WebAudio (oscillator + noise) — **không file asset**
- Lý do: repo gọn, không lo bản quyền, đậm chất chiptune, khởi tạo nhanh
- Trade-off: nhạc nền là melody ngắn lặp lại

### 9.2 SFX (9 loại)

| Tên | Trigger | Đặc tả âm |
|---|---|---|
| `jump` | Player nhảy | Square wave, pitch sweep 400→800Hz, 80ms |
| `coin` | Ăn coin | 2 nốt B5→E6 sine, 100ms |
| `stomp` | Đạp địch | Noise burst + low square, 60ms |
| `powerup` | Ăn nấm/hoa | Arpeggio 4 nốt C-E-G-C, square, 400ms |
| `fireball` | Bắn lửa | Sweep 200→100Hz sawtooth, 100ms |
| `hit` | Mario bị đánh | Square 200Hz → 80Hz, 300ms |
| `die` | Mario chết | 6 nốt melody buồn giảm dần, 1.2s |
| `break` | Vỡ brick | Noise burst + pitch, 50ms |
| `levelClear` | Tới flag | 6 nốt fanfare thăng lên |

### 9.3 Nhạc nền (3 track, lặp vô hạn)

| Track | Dùng cho | Mood |
|---|---|---|
| `overworld` | L1, L3 | Vui, vừa nhanh |
| `underground` | L2 | Chậm, âm sâu |
| `castle` | L4 | Minor key, hồi hộp |

Mỗi track là mảng `{ note, duration }`, scheduler dùng `audioCtx.currentTime` để xếp lịch chính xác.

### 9.4 API của `audio.js`

```js
export function createAudio() {
  return {
    unlock(),                   // gọi 1 lần sau gesture đầu (chính sách trình duyệt)
    play(sfxName),              // SFX không chặn nhạc
    startMusic(trackName),      // đổi track, fade in
    stopMusic(),
    setMuted(v),                // lưu localStorage
    get isMuted()
  };
}
```

### 9.5 Mute / autoplay

- Phải gọi `audio.unlock()` sau lần ấn phím đầu ở MENU
- Phím **M** bật/tắt âm, lưu trạng thái vào `localStorage`
- Nếu user mute trước khi nghe lần nào, **không khởi tạo AudioContext** (tiết kiệm CPU)

## 10. UI

### 10.1 Nguyên tắc

- **Toàn bộ UI vẽ trên cùng canvas** — không có DOM overlay
- Font: monospace web-safe + text-shadow giả pixel — không cần load font file
- HUD top bar luôn hiển thị khi `PLAYING`
- `PAUSED` / `GAME_OVER` / `VICTORY` là overlay đè lên scene đông cứng

### 10.2 API của `ui.js`

```js
renderMenu(ctx, hiScore)
renderHUD(ctx, { score, coins, world, lives, time })
renderPauseOverlay(ctx)
renderGameOver(ctx, score, hiScore)
renderVictory(ctx, score, hiScore)
```

Mỗi hàm là pure: nhận `ctx` + dữ liệu, vẽ ra. Không giữ state.

### 10.3 Layout HUD

```
┌──────────────────────────────────────────────────────────────┐
│  SCORE 002400   💰 × 12   WORLD 1-1   ♥ × 3   TIME 287       │
└──────────────────────────────────────────────────────────────┘
```

## 11. Controls

| Phím | Action |
|---|---|
| `←` / `→` hoặc `A` / `D` | Di chuyển |
| `Space` hoặc `W` hoặc `↑` | Nhảy (variable height) |
| `Shift` | Chạy nhanh (khi đang di chuyển) |
| `X` hoặc `J` | Bắn fireball (chỉ khi Fire Mario) |
| `Enter` | Xác nhận / Start (ở MENU/GAMEOVER/VICTORY) |
| `Esc` | Pause / Resume |
| `Q` | Quit về menu (khi PAUSED/GAMEOVER) |
| `R` | Retry (khi GAMEOVER) |
| `M` | Mute / unmute |
| `F1` | Debug: vẽ AABB |
| `F2` | Debug: FPS counter + entity count |
| `F3` | Debug: nhảy nhanh level |
| `F4` | Debug: god mode |

## 12. Persistence

`storage.js` wrapper quanh `localStorage` với 2 key:

| Key | Giá trị | Mô tả |
|---|---|---|
| `pipebros:hiScore` | number | Điểm cao nhất từng đạt |
| `pipebros:muted` | `'1'` / `'0'` | Trạng thái mute |

API:

```js
storage.getHiScore()         // number
storage.setHiScore(score)    // chỉ ghi nếu > current
storage.getMuted()           // boolean
storage.setMuted(v)
```

## 13. Testing

### 13.1 Phạm vi

| Lớp | Công cụ | Số lượng |
|---|---|---|
| Unit (logic thuần) | Vitest | 15-25 test |
| Debug overlay (manual) | F1-F4 in-game | N/A |
| Playtest checklist | Tay người | 8 items |

### 13.2 Unit tests bao phủ

- **Physics**: AABB collision 4 chiều (top/bottom/left/right), gravity, friction, variable jump
- **Player state**: small→big→fire→big→small→dead
- **Koopa state**: walk → stomp → shell → kicked → dừng
- **Level loader**: parse data đúng → tạo đúng số entity
- **Storage**: hiScore chỉ ghi khi cao hơn

### 13.3 Loại trừ (YAGNI)

- ❌ Render testing (Canvas pixel-perfect khó test, ROI thấp)
- ❌ Audio waveform testing (chỉ test SFX có được gọi đúng)
- ❌ Snapshot testing
- ❌ E2E (Playwright/Cypress)
- ❌ CI/CD

### 13.4 Playtest checklist

- [ ] Hoàn thành mỗi màn từ spawn → flag (boss room L4)
- [ ] Tất cả block tương tác đúng (brick, ?-block content, pipe, flag)
- [ ] Mọi power-up nhặt được, state Mario chuyển đúng
- [ ] Boss đánh bại được bằng fireball, có thể thua được
- [ ] Pause / resume / quit / retry không bug
- [ ] HUD số đúng (score, coins, lives, time)
- [ ] High score lưu sau khi đóng tab và mở lại
- [ ] Audio không bị stuck khi mute/unmute giữa game

## 14. Camera

- Camera theo player với **dead-zone**: player di chuyển trong khung 200px giữa màn không làm camera nhúc nhích; ra ngoài thì camera đuổi theo
- Clamp camera trong `[0, level.width - screen.width]` và `[0, level.height - screen.height]`
- Không scroll mượt (lerp) — chỉ follow cứng để tránh motion sickness

## 15. Performance targets

- 60 FPS trên Chrome desktop với 50+ entity trên màn hình
- Frame budget: < 16ms (10ms update + 6ms render)
- Bộ nhớ: < 30MB heap (không có asset to)

## 16. Open questions

- **Tên game chính thức**: hiện đang dùng `Super Pipe Bros`. Có muốn đổi không?
- **HUD time countdown**: có cần thực sự đếm ngược và game over khi hết giờ không, hay chỉ hiển thị decorative?
- **Cờ kết thúc**: có cần animation tụt cờ + bonus điểm như Mario gốc, hay chạm là next level luôn?

## 17. Tham khảo

- Pattern game loop: [Game Programming Patterns — Game Loop](https://gameprogrammingpatterns.com/game-loop.html)
- Phong cách dự án: các project trong repo (`125_offline_cache`, `130_leaflet_map_v2`) — vanilla, không build step
