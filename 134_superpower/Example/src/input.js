const KEY_MAP = {
  ArrowLeft: 'left',  KeyA: 'left',
  ArrowRight: 'right', KeyD: 'right',
  ArrowUp: 'jump',    KeyW: 'jump',    Space: 'jump',
  ShiftLeft: 'run',   ShiftRight: 'run',
  KeyX: 'fire',       KeyJ: 'fire',
  Enter: 'confirm',
  Escape: 'pause',
  KeyR: 'retry',
  KeyQ: 'quit',
  KeyM: 'mute',
  F1: 'debugAABB', F2: 'debugStats', F3: 'debugLevel', F4: 'debugGod',
};

export function createInput(target = window) {
  const held = new Set();
  const pressed = new Set();   // edge-triggered, cleared each frame

  function onKeyDown(e) {
    const action = KEY_MAP[e.code];
    if (!action) return;
    if (!held.has(action)) pressed.add(action);
    held.add(action);
    if (e.code === 'Space' || e.code.startsWith('F') || e.code === 'ArrowUp' || e.code === 'ArrowDown') {
      e.preventDefault();
    }
  }
  function onKeyUp(e) {
    const action = KEY_MAP[e.code];
    if (action) held.delete(action);
  }

  target.addEventListener('keydown', onKeyDown);
  target.addEventListener('keyup', onKeyUp);

  return {
    isHeld: (action) => held.has(action),
    wasPressed: (action) => pressed.has(action),
    endFrame: () => pressed.clear(),
  };
}
