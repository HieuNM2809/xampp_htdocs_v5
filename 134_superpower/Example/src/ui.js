function panel(ctx, w, h, alpha = 0.5) {
  ctx.fillStyle = `rgba(0,0,0,${alpha})`;
  ctx.fillRect(0, 0, w, h);
}
function center(ctx, text, y, size, color) {
  ctx.fillStyle = color;
  ctx.font = `bold ${size}px "Courier New", monospace`;
  ctx.textAlign = 'center';
  ctx.fillText(text, ctx.canvas.width / 2, y);
  ctx.textAlign = 'left';
}

export function renderHUD(ctx, hud) {
  const w = ctx.canvas.width;
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  ctx.fillRect(0, 0, w, 30);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 14px monospace';
  ctx.fillText(`SCORE ${String(hud.score ?? 0).padStart(6, '0')}`, 10, 20);
  ctx.fillText(`COIN ×${hud.coins ?? 0}`, 180, 20);
  ctx.fillText(`${hud.world ?? ''}`, 300, 20);
  ctx.fillText(`LIFE ×${hud.lives ?? 3}`, 480, 20);
  ctx.fillText(`TIME ${hud.time ?? '---'}`, 600, 20);
}

export function renderMenu(ctx, hiScore) {
  const w = ctx.canvas.width, h = ctx.canvas.height;
  panel(ctx, w, h, 0.3);
  center(ctx, 'SUPER PIPE BROS', h * 0.3, 44, '#fff');
  center(ctx, '— a learning project —', h * 0.4, 16, '#ddd');
  if ((performance.now() / 500) % 2 < 1) {
    center(ctx, 'PRESS ENTER TO START', h * 0.6, 22, '#ffe27a');
  }
  center(ctx, `HI-SCORE ${String(hiScore).padStart(6, '0')}`, h * 0.75, 16, '#fff');
}

export function renderPauseOverlay(ctx) {
  const w = ctx.canvas.width, h = ctx.canvas.height;
  panel(ctx, w, h, 0.6);
  center(ctx, '⏸ PAUSED', h * 0.35, 36, '#fff');
  center(ctx, '[ESC] CONTINUE', h * 0.55, 18, '#fff');
  center(ctx, '[Q] QUIT TO MENU', h * 0.62, 18, '#fff');
  center(ctx, '[M] TOGGLE SOUND', h * 0.69, 18, '#fff');
}

export function renderGameOver(ctx, score, hiScore) {
  const w = ctx.canvas.width, h = ctx.canvas.height;
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, w, h);
  center(ctx, 'GAME OVER', h * 0.35, 44, '#e74c3c');
  center(ctx, `SCORE ${String(score).padStart(6, '0')}`, h * 0.5, 20, '#fff');
  center(ctx, `HI-SCORE ${String(hiScore).padStart(6, '0')} ⭐`, h * 0.58, 18, '#ffe27a');
  center(ctx, '[R] RETRY  ·  [Q] MENU', h * 0.75, 18, '#fff');
}

export function renderVictory(ctx, score, hiScore) {
  const w = ctx.canvas.width, h = ctx.canvas.height;
  ctx.fillStyle = '#1a3a5a';
  ctx.fillRect(0, 0, w, h);
  center(ctx, '🏆 VICTORY 🏆', h * 0.3, 44, '#ffe27a');
  center(ctx, 'You beat the boss!', h * 0.45, 22, '#fff');
  center(ctx, `FINAL SCORE ${String(score).padStart(6, '0')}`, h * 0.6, 20, '#fff');
  center(ctx, `HI-SCORE ${String(hiScore).padStart(6, '0')}`, h * 0.68, 18, '#ffe27a');
  center(ctx, '[ENTER] MENU', h * 0.8, 18, '#fff');
}
