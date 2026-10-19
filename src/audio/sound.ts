type Cue = 'select' | 'move' | 'capture' | 'injury' | 'bleed' | 'crown' | 'heart' | 'death' | 'victory';
class Sound {
  private ctx: AudioContext | null = null;
  enabled = true;
  volume = 0.35;
  unlock() { this.ctx ??= new AudioContext(); if (this.ctx.state === 'suspended') void this.ctx.resume(); }
  play(cue: Cue) {
    if (!this.enabled || !this.ctx || this.ctx.state !== 'running') return;
    const ctx = this.ctx, start = ctx.currentTime;
    const tone = (freq: number, duration: number, offset = 0, type: OscillatorType = 'sine', level = 0.35, end = freq / 2) => {
      const osc = ctx.createOscillator(), gain = ctx.createGain();
      osc.type = type; osc.frequency.setValueAtTime(freq, start + offset); osc.frequency.exponentialRampToValueAtTime(Math.max(15, end), start + offset + duration);
      gain.gain.setValueAtTime(0.001, start + offset); gain.gain.linearRampToValueAtTime(this.volume * level, start + offset + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.001, start + offset + duration); osc.connect(gain); gain.connect(ctx.destination);
      osc.start(start + offset); osc.stop(start + offset + duration + 0.02); osc.onended = () => { osc.disconnect(); gain.disconnect(); };
    };
    const noise = (duration: number, frequency: number) => {
      const buffer = ctx.createBuffer(1, ctx.sampleRate * duration, ctx.sampleRate), data = buffer.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
      const source = ctx.createBufferSource(), filter = ctx.createBiquadFilter(), gain = ctx.createGain();
      source.buffer = buffer; filter.type = 'lowpass'; filter.frequency.value = frequency; gain.gain.value = this.volume * 0.3;
      source.connect(filter); filter.connect(gain); gain.connect(ctx.destination); source.start(); source.onended = () => { source.disconnect(); filter.disconnect(); gain.disconnect(); };
    };
    switch (cue) {
      case 'select': tone(460, .065, 0, 'triangle', .2); break;
      case 'move': noise(.13, 900); tone(180, .12, 0, 'triangle'); break;
      case 'capture': tone(95, .5, 0, 'triangle', .65); noise(.2, 1800); break;
      case 'injury': noise(.28, 650); tone(65, .45, 0, 'sawtooth', .18); break;
      case 'bleed': tone(520, .13, 0, 'sine', .12, 140); break;
      case 'crown': tone(790, .55, 0, 'triangle', .2, 780); tone(1170, .6, .08, 'sine', .1, 1150); break;
      case 'heart': tone(55, .16, 0, 'sine', .5, 35); tone(47, .18, .22, 'sine', .3, 30); break;
      case 'death': tone(100, 1.1, 0, 'sawtooth', .25, 15); noise(.3, 220); break;
      case 'victory': [196, 233, 185].forEach((f, i) => tone(f, .8, i * .35, 'triangle', .24, f * .99)); break;
    }
  }
  dispose() { void this.ctx?.close(); this.ctx = null; }
}
export const sound = new Sound();
