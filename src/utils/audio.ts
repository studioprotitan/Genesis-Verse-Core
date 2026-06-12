/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

class SoundManager {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;

  // Initialize browser AudioContext on first user interaction
  private init() {
    if (this.ctx) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    } catch (e) {
      console.warn('Web Audio API is not supported in this browser.', e);
    }
  }

  // Resume context if suspended (common browser security constraint)
  private resume() {
    this.init();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(err => console.log('AudioContext resume failed:', err));
    }
  }

  setMute(muted: boolean) {
    this.isMuted = muted;
    // Persist to localStorage
    localStorage.setItem('genesis_verse_muted', muted ? 'true' : 'false');
  }

  getMute(): boolean {
    // If we haven't loaded, load from localStorage
    const saved = localStorage.getItem('genesis_verse_muted');
    if (saved !== null) {
      this.isMuted = saved === 'true';
    }
    return this.isMuted;
  }

  toggleMute(): boolean {
    const next = !this.getMute();
    this.setMute(next);
    return next;
  }

  // Laser Weapon Fire sound effect using precise frequency sweeps
  playLaser(isPlayer: boolean = true) {
    this.resume();
    if (!this.ctx || this.isMuted) return;

    const now = this.ctx.currentTime;
    
    // Main oscillator for the projectile pulse
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    if (isPlayer) {
      // High-tech cyber pulse
      osc.type = 'sawtooth';
      
      // Dynamic frequency sweep down from high pitch to low
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(120, now + 0.15);

      // Volume envelope
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
      
      osc.start(now);
      osc.stop(now + 0.18);
    } else {
      // Enemy digital blip
      osc.type = 'triangle';
      
      osc.frequency.setValueAtTime(450, now);
      osc.frequency.exponentialRampToValueAtTime(80, now + 0.12);

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

      osc.start(now);
      osc.stop(now + 0.15);
    }
  }

  // Hit sound notifications (rewards/penalties)
  playHit(isPlayerHit: boolean = false) {
    this.resume();
    if (!this.ctx || this.isMuted) return;

    const now = this.ctx.currentTime;

    if (isPlayerHit) {
      // Low alarm alert rumble (impact)
      const osc = this.ctx.createOscillator();
      const noise = this.createNoiseBufferNode();
      const oscGain = this.ctx.createGain();
      const noiseGain = this.ctx.createGain();

      osc.connect(oscGain);
      oscGain.connect(this.ctx.destination);

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.linearRampToValueAtTime(40, now + 0.3);

      oscGain.gain.setValueAtTime(0.25, now);
      oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc.start(now);
      osc.stop(now + 0.35);

      if (noise) {
        noise.connect(noiseGain);
        noiseGain.connect(this.ctx.destination);
        noiseGain.gain.setValueAtTime(0.18, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        noise.start(now);
        noise.stop(now + 0.25);
      }
    } else {
      // High frequency pitch confirm sound (Cyber chime)
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gain1 = this.ctx.createGain();
      const gain2 = this.ctx.createGain();

      osc1.connect(gain1);
      osc2.connect(gain2);
      gain1.connect(this.ctx.destination);
      gain2.connect(this.ctx.destination);

      osc1.type = 'sine';
      osc2.type = 'triangle';

      osc1.frequency.setValueAtTime(1100, now);
      osc1.frequency.linearRampToValueAtTime(1300, now + 0.08);

      osc2.frequency.setValueAtTime(880, now);
      osc2.frequency.linearRampToValueAtTime(1050, now + 0.08);

      gain1.gain.setValueAtTime(0.08, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

      gain2.gain.setValueAtTime(0.05, now);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.12);
      osc2.stop(now + 0.12);
    }
  }

  // Power Up item pick up effect (musical cyber upward chord)
  playPowerup() {
    this.resume();
    if (!this.ctx || this.isMuted) return;

    const now = this.ctx.currentTime;
    const freqs = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50]; // Ascending C major arpeggio
    
    freqs.forEach((freq, idx) => {
      if (!this.ctx) return;
      const o = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      
      o.connect(g);
      g.connect(this.ctx.destination);
      
      o.type = 'sine';
      o.frequency.setValueAtTime(freq, now + idx * 0.06);
      
      const noteStart = now + idx * 0.06;
      g.gain.setValueAtTime(0.0, now);
      g.gain.linearRampToValueAtTime(0.06, noteStart);
      g.gain.exponentialRampToValueAtTime(0.001, noteStart + 0.25);
      
      o.start(noteStart);
      o.stop(noteStart + 0.25);
    });
  }

  // Radar tactical ping alerting teammate or self
  playPing(isPlayer: boolean = true) {
    this.resume();
    if (!this.ctx || this.isMuted) return;

    const now = this.ctx.currentTime;

    if (isPlayer) {
      // Local player ping: High-pitched electric chirp (fast slide-down)
      const o1 = this.ctx.createOscillator();
      const o2 = this.ctx.createOscillator();
      const g1 = this.ctx.createGain();
      const g2 = this.ctx.createGain();
      
      o1.connect(g1);
      o2.connect(g2);
      g1.connect(this.ctx.destination);
      g2.connect(this.ctx.destination);
      
      o1.type = 'sine';
      o1.frequency.setValueAtTime(2400, now);
      o1.frequency.exponentialRampToValueAtTime(1800, now + 0.12);
      
      o2.type = 'sine';
      o2.frequency.setValueAtTime(3200, now);
      o2.frequency.exponentialRampToValueAtTime(2400, now + 0.08);
      
      g1.gain.setValueAtTime(0.08, now);
      g1.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      
      g2.gain.setValueAtTime(0.04, now);
      g2.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
      
      o1.start(now);
      o2.start(now);
      o1.stop(now + 0.2);
      o2.stop(now + 0.1);
    } else {
      // Teammate ping: Tactical incoming comms scan sound (low-to-high double-beep)
      const o1 = this.ctx.createOscillator();
      const o2 = this.ctx.createOscillator();
      const g1 = this.ctx.createGain();
      const g2 = this.ctx.createGain();
      
      o1.connect(g1);
      o2.connect(g2);
      g1.connect(this.ctx.destination);
      g2.connect(this.ctx.destination);
      
      // First wave (slightly warmer triangle wave)
      o1.type = 'triangle';
      o1.frequency.setValueAtTime(800, now);
      o1.frequency.exponentialRampToValueAtTime(1400, now + 0.15);
      
      g1.gain.setValueAtTime(0.06, now);
      g1.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      
      // Second wave (delayed higher tone swoop to indicate tactical alert receipt)
      const delay = 0.08;
      o2.type = 'sine';
      o2.frequency.setValueAtTime(1200, now + delay);
      o2.frequency.exponentialRampToValueAtTime(2000, now + delay + 0.12);
      
      g2.gain.setValueAtTime(0.0, now);
      g2.gain.setValueAtTime(0.04, now + delay);
      g2.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.2);
      
      o1.start(now);
      o2.start(now + delay);
      o1.stop(now + 0.25);
      o2.stop(now + delay + 0.2);
    }
  }

  // Alerts for Menu entry, match starting, system failures
  playSysAlert(type: 'start' | 'gameover' | 'regenerate' | 'click' | 'reboot' | 'ping') {
    this.resume();
    if (!this.ctx || this.isMuted) return;

    const now = this.ctx.currentTime;

    switch (type) {
      case 'ping': {
        this.playPing(true);
        break;
      }
      case 'start': {
        // Futuristic double pulse
        const notes = [440, 880];
        notes.forEach((freq, i) => {
          if (!this.ctx) return;
          const o = this.ctx.createOscillator();
          const g = this.ctx.createGain();
          o.connect(g);
          g.connect(this.ctx.destination);
          
          o.type = 'sawtooth';
          o.frequency.setValueAtTime(freq, now + i * 0.15);
          
          const start = now + i * 0.15;
          g.gain.setValueAtTime(0.0, now);
          g.gain.linearRampToValueAtTime(0.08, start);
          g.gain.exponentialRampToValueAtTime(0.001, start + 0.3);
          
          o.start(start);
          o.stop(start + 0.3);
        });
        break;
      }
      case 'gameover': {
        // Dramatic minor decline sweep
        const notes = [587.33, 493.88, 392.00, 293.66, 196.00]; // descending progression
        notes.forEach((freq, i) => {
          if (!this.ctx) return;
          const o = this.ctx.createOscillator();
          const g = this.ctx.createGain();
          o.connect(g);
          g.connect(this.ctx.destination);
          
          o.type = 'triangle';
          o.frequency.setValueAtTime(freq, now + i * 0.1);
          
          const start = now + i * 0.1;
          g.gain.setValueAtTime(0.0, now);
          g.gain.linearRampToValueAtTime(0.07, start);
          g.gain.exponentialRampToValueAtTime(0.001, start + 0.4);
          
          o.start(start);
          o.stop(start + 0.45);
        });
        break;
      }
      case 'regenerate': {
        // Continuous upward sci-fi scanning sound
        const o = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        o.connect(g);
        g.connect(this.ctx.destination);
        
        o.type = 'sine';
        o.frequency.setValueAtTime(300, now);
        o.frequency.linearRampToValueAtTime(900, now + 0.4);
        
        g.gain.setValueAtTime(0.05, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
        
        o.start(now);
        o.stop(now + 0.4);
        break;
      }
      case 'reboot': {
        // Heavy siren pulse
        const o = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        o.connect(g);
        g.connect(this.ctx.destination);
        
        o.type = 'sawtooth';
        o.frequency.setValueAtTime(100, now);
        o.frequency.linearRampToValueAtTime(400, now + 0.2);
        o.frequency.linearRampToValueAtTime(100, now + 0.4);
        
        g.gain.setValueAtTime(0.12, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
        
        o.start(now);
        o.stop(now + 0.42);
        break;
      }
      case 'click': {
        const o = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        o.connect(g);
        g.connect(this.ctx.destination);
        
        o.type = 'sine';
        o.frequency.setValueAtTime(1200, now);
        
        g.gain.setValueAtTime(0.06, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
        
        o.start(now);
        o.stop(now + 0.05);
        break;
      }
    }
  }

  // Rhythmic combo sound cue with pitch scaling dynamically with consecutive hits count
  playComboHit(comboCount: number) {
    this.resume();
    if (!this.ctx || this.isMuted) return;

    const now = this.ctx.currentTime;
    
    // Nice ascending scale pitch using frequency steps.
    // Base frequency is 320Hz, incrementing pitch with equal-temperament semi-tone steps.
    const steps = Math.min(comboCount, 16); 
    const freq = 320 * Math.pow(1.059463, steps);
    
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    
    o.connect(g);
    g.connect(this.ctx.destination);
    
    // Use triangle wave for a retro/sci-fi synth element
    o.type = 'triangle';
    o.frequency.setValueAtTime(freq, now);
    // Dynamic frequency modulation: slight pitch swoop upwards for modern punchy feel
    o.frequency.exponentialRampToValueAtTime(freq * 1.12, now + 0.12);
    
    // Quick transient attack and decay envelope
    g.gain.setValueAtTime(0.0, now);
    g.gain.linearRampToValueAtTime(0.08, now + 0.01);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    
    o.start(now);
    o.stop(now + 0.16);
  }

  // Generates low/mid noise textures for rich explosions/impacts
  private createNoiseBufferNode(): AudioBufferSourceNode | null {
    if (!this.ctx) return null;
    try {
      const bufferSize = this.ctx.sampleRate * 0.4; // 0.4 seconds of noise
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      const source = this.ctx.createBufferSource();
      source.buffer = buffer;
      return source;
    } catch {
      return null;
    }
  }
}

export const soundManager = new SoundManager();
