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

  const MUSIC = {
    overworld: { bpm: 200, notes: [
      [659, 0.25], [659, 0.25], [0, 0.25], [659, 0.25],
      [0, 0.25], [523, 0.25], [659, 0.25], [0, 0.25],
      [784, 0.5],  [0, 0.5],   [392, 0.5], [0, 0.5],
    ]},
    underground: { bpm: 140, notes: [
      [196, 0.5], [220, 0.5], [196, 0.5], [165, 0.5],
      [196, 0.5], [165, 0.5], [147, 0.5], [165, 0.5],
    ]},
    castle: { bpm: 160, notes: [
      [220, 0.5], [261, 0.5], [220, 0.5], [196, 0.5],
      [165, 0.5], [196, 0.5], [220, 0.5], [261, 0.5],
    ]},
  };

  function startMusicImpl(track) {
    if (muted) return null;
    const c = ensureCtx();
    const data = MUSIC[track];
    if (!data) return null;
    const beat = 60 / data.bpm;
    let stopped = false;
    let i = 0;
    let t = c.currentTime + 0.05;

    function schedule() {
      if (stopped) return;
      while (t < c.currentTime + 1) {
        const [f, dur] = data.notes[i % data.notes.length];
        if (f > 0) {
          const osc = c.createOscillator();
          const g = c.createGain();
          osc.type = 'triangle';
          osc.frequency.value = f;
          g.gain.value = 0.06;
          g.gain.setValueAtTime(0.06, t);
          g.gain.exponentialRampToValueAtTime(0.001, t + dur * beat * 0.95);
          osc.connect(g).connect(c.destination);
          osc.start(t); osc.stop(t + dur * beat);
        }
        t += dur * beat;
        i++;
      }
      setTimeout(schedule, 200);
    }
    schedule();
    return () => { stopped = true; };
  }

  return {
    unlock() { ensureCtx(); },
    play(name) { SFX[name]?.(); },
    startMusic(name) {
      if (musicStop) musicStop();
      musicStop = startMusicImpl(name);
      musicTrack = name;
    },
    stopMusic() {
      if (musicStop) musicStop();
      musicStop = null;
      musicTrack = null;
    },
    setMuted(v) { muted = v; if (v) this.stopMusic(); },
    get isMuted() { return muted; },
  };
}
