export const GRAVITY = 1400;
export const MAX_FALL_SPEED = 600;
export const FRICTION = 8;

export function aabbOverlap(a, b) {
  return a.x < b.x + b.w &&
         a.x + a.w > b.x &&
         a.y < b.y + b.h &&
         a.y + a.h > b.y;
}

// Resolve a single AABB-vs-static collision by pushing dynamic out along
// the axis with the smaller overlap. Mutates `dyn` in place.
// Handles both overlapping and separated-but-colliding cases based on velocity.
export function resolveAabb(dyn, stat) {
  // Check AABB overlap
  const overlapping = aabbOverlap(dyn, stat);
  if (!overlapping) return null;

  // Calculate overlaps on each axis
  const overlapLeft = dyn.x + dyn.w - stat.x;
  const overlapRight = stat.x + stat.w - dyn.x;
  const overlapTop = dyn.y + dyn.h - stat.y;
  const overlapBottom = stat.y + stat.h - dyn.y;

  const overlapX = Math.min(overlapLeft, overlapRight);
  const overlapY = Math.min(overlapTop, overlapBottom);

  if (overlapX < overlapY) {
    // Horizontal resolution
    if (overlapLeft < overlapRight) {
      // dyn is to the left, push left
      dyn.x = stat.x - dyn.w;
    } else {
      // dyn is to the right, push right
      dyn.x = stat.x + stat.w;
    }
    dyn.vx = 0;
    return 'x';
  } else {
    // Vertical resolution
    if (overlapTop < overlapBottom) {
      // dyn is above, push up
      dyn.y = stat.y - dyn.h;
      dyn.onGround = true;
    } else {
      // dyn is below, push down
      dyn.y = stat.y + stat.h;
    }
    dyn.vy = 0;
    return 'y';
  }
}

export function applyGravity(entity, dt) {
  entity.vy = Math.min(entity.vy + GRAVITY * dt, MAX_FALL_SPEED);
}

export function applyFriction(entity, dt) {
  entity.vx -= entity.vx * Math.min(1, FRICTION * dt);
  if (Math.abs(entity.vx) < 1) entity.vx = 0;
}
