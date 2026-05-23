export function createAudio() {
  let ctx = null;
  let muted = false;
  let musicStop = null;
  let musicTrack = null;

  function ensureCtx() {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  function tone(freq, dur, type = 'square', gain = 0.15, sweepTo = null) {
    if (muted) return;
    const c = ensureCtx();
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    if (sweepTo != null) osc.frequency.linearRampToValueAtTime(sweepTo, c.currentTime + dur);
    g.gain.value = gain;
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + dur);
    osc.connect(g).connect(c.destination);
    osc.start();
    osc.stop(c.currentTime + dur);
  }

  function noise(dur, gain = 0.1) {
    if (muted) return;
    const c = ensureCtx();
    const buf = c.createBuffer(1, c.sampleRate * dur, c.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    const src = c.createBufferSource(); src.buffer = buf;
    const g = c.createGain(); g.gain.value = gain;
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + dur);
    src.connect(g).connect(c.destination);
    src.start();
    src.stop(c.currentTime + dur);
  }

  const SFX = {
    jump:       () => tone(400, 0.08, 'square', 0.12, 800),
    coin:       () => { tone(987, 0.05, 'sine', 0.15); setTimeout(() => tone(1318, 0.08, 'sine', 0.15), 50); },
    stomp:      () => { tone(120, 0.06, 'square', 0.12); noise(0.06, 0.08); },
    powerup:    () => { [523,659,784,1047].forEach((f, i) => setTimeout(() => tone(f, 0.1, 'square', 0.12), i * 80)); },
    fireball:   () => tone(200, 0.1, 'sawtooth', 0.12, 100),
    hit:        () => tone(200, 0.3, 'square', 0.12, 80),
    die:        () => { [523,494,440,392,349,294].forEach((f, i) => setTimeout(() => tone(f, 0.2, 'square', 0.1), i * 180)); },
    break:      () => { noise(0.05, 0.12); tone(300, 0.05, 'square', 0.1); },
    levelClear: () => { [392,494,587,784,988,1175].forEach((f, i) => setTimeout(() => tone(f, 0.12, 'square', 0.12), i * 130)); },
  };

  return {
    unlock() { ensureCtx(); },
    play(name) { SFX[name]?.(); },
    startMusic(name) { /* full impl added in Task 24 */ musicTrack = name; },
    stopMusic() { if (musicStop) musicStop(); musicTrack = null; },
    setMuted(v) { muted = v; if (v) this.stopMusic(); },
    get isMuted() { return muted; },
  };
}
