import { ref, watch } from 'vue'
import { assetUrl } from '../assets'

/**
 * Ritual sounds + haptics.
 * Each sound tries /assets/sfx/<name>.mp3 first (see ASSET_PROMPTS.md);
 * if that file is missing it is synthesized with Web Audio, so sound works
 * with zero assets. Sound is opt-in and remembered per browser.
 */
export type SoundName = 'shake' | 'stick' | 'jiao' | 'bell'

const readPref = () => {
  try {
    return localStorage.getItem('oracle-sound') === 'on'
  } catch {
    return false
  }
}
export const soundEnabled = ref(readPref())
watch(soundEnabled, (on) => {
  try {
    localStorage.setItem('oracle-sound', on ? 'on' : 'off')
  } catch {
    /* storage unavailable */
  }
})

let ctx: AudioContext | null = null
let master: GainNode | null = null
const buffers = new Map<SoundName, AudioBuffer | null>() // null = no file, use synth
const loading = new Map<SoundName, Promise<void>>()

function audio(): AudioContext | null {
  if (typeof window === 'undefined' || !('AudioContext' in window)) return null
  if (!ctx) {
    ctx = new AudioContext()
    master = ctx.createGain()
    master.gain.value = 0.7
    master.connect(ctx.destination)
  }
  if (ctx.state === 'suspended') void ctx.resume()
  return ctx
}

function loadFile(name: SoundName): Promise<void> {
  if (buffers.has(name)) return Promise.resolve()
  let p = loading.get(name)
  if (!p) {
    p = (async () => {
      try {
        const res = await fetch(assetUrl(`sfx/${name}.mp3`))
        const type = res.headers.get('content-type') ?? ''
        if (!res.ok || !type.startsWith('audio')) throw new Error('missing')
        buffers.set(name, await audio()!.decodeAudioData(await res.arrayBuffer()))
      } catch {
        buffers.set(name, null)
      }
    })()
    loading.set(name, p)
  }
  return p
}

/** Warm up files so the first real play has no latency. Call after a user gesture. */
export function preloadSounds() {
  if (!soundEnabled.value || !audio()) return
  ;(['shake', 'stick', 'jiao', 'bell'] as const).forEach((n) => void loadFile(n))
}

// ───────────── synthesis ─────────────
function noiseBuffer(c: AudioContext, seconds: number) {
  const buf = c.createBuffer(1, Math.ceil(c.sampleRate * seconds), c.sampleRate)
  const d = buf.getChannelData(0)
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1
  return buf
}

/** A short woody knock: filtered noise burst + resonant body tone. */
function knock(c: AudioContext, out: AudioNode, t: number, freq: number, gain: number, decay = 0.06) {
  const src = c.createBufferSource()
  src.buffer = noiseBuffer(c, decay * 2)
  const bp = c.createBiquadFilter()
  bp.type = 'bandpass'
  bp.frequency.value = freq * 3
  bp.Q.value = 2.5
  const g = c.createGain()
  g.gain.setValueAtTime(gain, t)
  g.gain.exponentialRampToValueAtTime(0.0001, t + decay)
  src.connect(bp).connect(g).connect(out)
  src.start(t)

  const osc = c.createOscillator()
  osc.type = 'triangle'
  osc.frequency.setValueAtTime(freq * 1.1, t)
  osc.frequency.exponentialRampToValueAtTime(freq, t + 0.03)
  const og = c.createGain()
  og.gain.setValueAtTime(gain * 0.6, t)
  og.gain.exponentialRampToValueAtTime(0.0001, t + decay * 1.6)
  osc.connect(og).connect(out)
  osc.start(t)
  osc.stop(t + decay * 2)
}

const synth: Record<SoundName, (c: AudioContext, out: AudioNode, duration: number) => void> = {
  // bamboo sticks rattling in a cylinder
  shake(c, out, duration) {
    const now = c.currentTime
    let t = now
    while (t < now + duration) {
      const cycle = (t - now) % 0.35 // bursts follow each shake swing
      const dense = cycle < 0.14
      knock(c, out, t, 900 + Math.random() * 900, (dense ? 0.22 : 0.08) * (0.6 + Math.random() * 0.6), 0.035)
      t += dense ? 0.012 + Math.random() * 0.025 : 0.05 + Math.random() * 0.06
    }
  },
  // one stick falls out and clacks on the table
  stick(c, out) {
    const t = c.currentTime
    knock(c, out, t, 620, 0.5, 0.08)
    knock(c, out, t + 0.11, 700, 0.22, 0.06)
    knock(c, out, t + 0.19, 760, 0.1, 0.05)
  },
  // two wooden blocks land and bounce on stone
  jiao(c, out) {
    const t = c.currentTime
    knock(c, out, t, 330, 0.75, 0.14)
    knock(c, out, t + 0.035, 300, 0.55, 0.12)
    knock(c, out, t + 0.16, 360, 0.28, 0.08)
    knock(c, out, t + 0.24, 340, 0.12, 0.06)
    knock(c, out, t + 0.29, 380, 0.06, 0.04)
  },
  // 磬 — temple singing bowl / chime
  bell(c, out) {
    const t = c.currentTime
    const base = 392
    ;[
      [1, 0.5, 4.5],
      [2.71, 0.22, 3],
      [5.15, 0.1, 1.8],
      [8.4, 0.05, 1.1],
    ].forEach(([ratio, gain, decay]) => {
      const osc = c.createOscillator()
      osc.type = 'sine'
      osc.frequency.value = base * ratio
      const g = c.createGain()
      g.gain.setValueAtTime(0.0001, t)
      g.gain.exponentialRampToValueAtTime(gain, t + 0.008)
      g.gain.exponentialRampToValueAtTime(0.0001, t + decay)
      osc.connect(g).connect(out)
      osc.start(t)
      osc.stop(t + decay + 0.1)
    })
    knock(c, out, t, 1400, 0.15, 0.03) // mallet strike
  },
}

export async function play(name: SoundName, duration = 1) {
  if (!soundEnabled.value) return
  const c = audio()
  if (!c || !master) return
  await loadFile(name)
  const buf = buffers.get(name)
  if (buf) {
    const src = c.createBufferSource()
    src.buffer = buf
    src.connect(master)
    src.start()
    if (name === 'shake') src.stop(c.currentTime + duration)
  } else {
    synth[name](c, master, duration)
  }
}

/** Vibrate where supported (Android Chrome); silently ignored elsewhere. */
export function haptic(pattern: number | number[]) {
  try {
    navigator.vibrate?.(pattern)
  } catch {
    /* unsupported */
  }
}
