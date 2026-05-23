// Pure drawing helpers. No state. ctx is always passed in.

export function clear(ctx, color = '#5c94fc') {
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
}

export function drawRoundRect(ctx, x, y, w, h, r = 8) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y,     x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x,     y + h, r);
  ctx.arcTo(x,     y + h, x,     y,     r);
  ctx.arcTo(x,     y,     x + w, y,     r);
  ctx.closePath();
}

export function fillRoundRect(ctx, x, y, w, h, fillStyle, strokeStyle = null, r = 8, lineW = 2) {
  drawRoundRect(ctx, x, y, w, h, r);
  ctx.fillStyle = fillStyle;
  ctx.fill();
  if (strokeStyle) {
    ctx.lineWidth = lineW;
    ctx.strokeStyle = strokeStyle;
    ctx.stroke();
  }
}

export function fillCircle(ctx, cx, cy, r, fillStyle, strokeStyle = null, lineW = 2) {
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = fillStyle;
  ctx.fill();
  if (strokeStyle) {
    ctx.lineWidth = lineW;
    ctx.strokeStyle = strokeStyle;
    ctx.stroke();
  }
}

export function fillEllipse(ctx, cx, cy, rx, ry, fillStyle, strokeStyle = null, lineW = 2) {
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
  ctx.fillStyle = fillStyle;
  ctx.fill();
  if (strokeStyle) {
    ctx.lineWidth = lineW;
    ctx.strokeStyle = strokeStyle;
    ctx.stroke();
  }
}

export function applyCamera(ctx, camera) {
  ctx.save();
  ctx.translate(-Math.round(camera.x), -Math.round(camera.y));
}
export function resetCamera(ctx) { ctx.restore(); }
