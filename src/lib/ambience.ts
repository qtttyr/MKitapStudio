/* РђС‚РјРѕСЃС„РµСЂРЅС‹Рµ Р·РІСѓРєРё С‡С‚РµРЅРёСЏ — СЃРёРЅС‚РµР· Web Audio, Р±РµР· С„Р°Р№Р»РѕРІ.
   Р’СЃС‘ РѕС‡РµРЅСЊ РјСЏРіРєРѕРµ Рё С‚РёС…РѕРµ: С†РµР»СЊ — РєРѕРЅС†РµРЅС‚СЂР°С†РёСЏ, Р° РЅРµ РєРѕРЅС†РµСЂС‚. */

export type AmbienceKind = 'rain' | 'fire' | 'cafe'

const STORE_KEY = 'mkstudio.ambience'

let ctx: AudioContext | null = null
let master: GainNode | null = null
let current: { kind: AmbienceKind; nodes: AudioScheduledSourceNode[]; extras: AudioNode[]; timers: number[] } | null = null

function getCtx(): AudioContext {
  if (!ctx) {
    ctx = new AudioContext()
    master = ctx.createGain()
    master.gain.value = 0
    master.connect(ctx.destination)
  }
  return ctx
}

/** Р‘СѓС„РµСЂ С€СѓРјР°: Р±РµР»С‹Р№ РёР»Рё «РєРѕСЂРёС‡РЅРµРІС‹Р№» (РјСЏРіРєРёР№, РЅРёР·РєРёР№). */
function noiseBuffer(c: AudioContext, brown: boolean): AudioBuffer {
  const len = c.sampleRate * 2
  const buf = c.createBuffer(1, len, c.sampleRate)
  const data = buf.getChannelData(0)
  let last = 0
  for (let i = 0; i < len; i++) {
    const white = Math.random() * 2 - 1
    if (brown) {
      last = (last + 0.02 * white) / 1.02
      data[i] = last * 3.5
    } else {
      data[i] = white
    }
  }
  return buf
}

function loopNoise(c: AudioContext, brown: boolean): AudioBufferSourceNode {
  const src = c.createBufferSource()
  src.buffer = noiseBuffer(c, brown)
  src.loop = true
  src.start()
  return src
}

type Built = { nodes: AudioScheduledSourceNode[]; extras: AudioNode[]; timers: number[] }

/* ---------- РґРѕР¶РґСЊ: РјСЏРіРєРёР№ С€РµР»РµСЃС‚ + СЂРµРґРєРёРµ РєР°РїР»Рё ---------- */
function buildRain(c: AudioContext): Built {
  const nodes: AudioScheduledSourceNode[] = []
  const extras: AudioNode[] = []
  const timers: number[] = []

  const bodyGain = c.createGain()
  bodyGain.gain.value = 0.05 // РѕС‡РµРЅСЊ С‚РёС…Рѕ
  const hp = c.createBiquadFilter()
  hp.type = 'highpass'
  hp.frequency.value = 400
  const lp = c.createBiquadFilter()
  lp.type = 'lowpass'
  lp.frequency.value = 950
  lp.Q.value = 0.4

  const noise = loopNoise(c, false)
  noise.connect(hp)
  hp.connect(lp)
  lp.connect(bodyGain)
  bodyGain.connect(master as AudioNode)
  nodes.push(noise)
  extras.push(hp, lp, bodyGain)

  /* РјРµРґР»РµРЅРЅРѕРµ «РґС‹С…Р°РЅРёРµ» РіСЂРѕРјРєРѕСЃС‚Рё */
  const lfo = c.createOscillator()
  lfo.frequency.value = 0.07
  const lfoG = c.createGain()
  lfoG.gain.value = 0.014
  lfo.connect(lfoG)
  lfoG.connect(bodyGain.gain)
  lfo.start()
  nodes.push(lfo)
  extras.push(lfoG)

  /* СЂРµРґРєРёРµ РЅРµР¶РЅС‹Рµ РєР°РїР»Рё */
  const drop = () => {
    const t0 = c.currentTime
    const o = c.createOscillator()
    o.type = 'sine'
    o.frequency.setValueAtTime(700 + Math.random() * 900, t0)
    const og = c.createGain()
    og.gain.setValueAtTime(0, t0)
    og.gain.linearRampToValueAtTime(0.012 + Math.random() * 0.012, t0 + 0.008)
    og.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.09)
    o.connect(og)
    og.connect(master as AudioNode)
    o.start(t0)
    o.stop(t0 + 0.12)
    timers.push(window.setTimeout(drop, 300 + Math.random() * 2400))
  }
  timers.push(window.setTimeout(drop, 900))

  return { nodes, extras, timers }
}

/* ---------- РєРѕСЃС‚С‘СЂ: С‚С‘РїР»РѕРµ РјСѓСЂР»С‹РєР°РЅСЊРµ + С‚РёС…РѕРµ РїРѕС‚СЂРµСЃРєРёРІР°РЅРёРµ ---------- */
function buildFire(c: AudioContext): Built {
  const nodes: AudioScheduledSourceNode[] = []
  const extras: AudioNode[] = []
  const timers: number[] = []

  const bodyGain = c.createGain()
  bodyGain.gain.value = 0.065
  const lp = c.createBiquadFilter()
  lp.type = 'lowpass'
  lp.frequency.value = 340

  const noise = loopNoise(c, true)
  noise.connect(lp)
  lp.connect(bodyGain)
  bodyGain.connect(master as AudioNode)
  nodes.push(noise)
  extras.push(lp, bodyGain)

  const lfo = c.createOscillator()
  lfo.frequency.value = 0.13
  const lfoG = c.createGain()
  lfoG.gain.value = 0.018
  lfo.connect(lfoG)
  lfoG.connect(bodyGain.gain)
  lfo.start()
  nodes.push(lfo)
  extras.push(lfoG)

  /* СЂРµРґРєРёРµ С‰РµР»С‡РєРё СѓРіРѕР»СЊРєРѕРІ — СЃРѕРІСЃРµРј С‚РёС…РёРµ */
  const crackle = () => {
    const t0 = c.currentTime
    const s = c.createBufferSource()
    s.buffer = noiseBuffer(c, false)
    const bp = c.createBiquadFilter()
    bp.type = 'bandpass'
    bp.frequency.value = 1400 + Math.random() * 2600
    bp.Q.value = 8
    const cg = c.createGain()
    cg.gain.setValueAtTime(0, t0)
    cg.gain.linearRampToValueAtTime(0.015 + Math.random() * 0.015, t0 + 0.006)
    cg.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.05 + Math.random() * 0.06)
    s.connect(bp)
    bp.connect(cg)
    cg.connect(master as AudioNode)
    s.start(t0)
    s.stop(t0 + 0.16)
    timers.push(window.setTimeout(crackle, 200 + Math.random() * 1100))
  }
  timers.push(window.setTimeout(crackle, 500))

  return { nodes, extras, timers }
}

/* ---------- РєР°С„Рµ: РїСЂРёРіР»СѓС€С‘РЅРЅС‹Р№ РіСѓР» + СЂРµРґРєРёР№ Р·РІРѕРЅ С‡Р°С€РєРё ---------- */
function buildCafe(c: AudioContext): Built {
  const nodes: AudioScheduledSourceNode[] = []
  const extras: AudioNode[] = []
  const timers: number[] = []

  const murmurGain = c.createGain()
  murmurGain.gain.value = 0.055
  const lp = c.createBiquadFilter()
  lp.type = 'lowpass'
  lp.frequency.value = 420
  const bp = c.createBiquadFilter()
  bp.type = 'peaking'
  bp.frequency.value = 260
  bp.gain.value = 5
  bp.Q.value = 0.8

  const noise = loopNoise(c, true)
  noise.connect(bp)
  bp.connect(lp)
  lp.connect(murmurGain)
  murmurGain.connect(master as AudioNode)
  nodes.push(noise)
  extras.push(bp, lp, murmurGain)

  /* «РѕР¶РёРІР»РµРЅРёРµ» РіСѓР»Р° — РјРµРґР»РµРЅРЅС‹Р№ Р±Р»СѓР¶РґР°СЋС‰РёР№ С„РёР»СЊС‚СЂ */
  const lfo = c.createOscillator()
  lfo.frequency.value = 0.05
  const lfoG = c.createGain()
  lfoG.gain.value = 60
  lfo.connect(lfoG)
  lfoG.connect(bp.frequency)
  lfo.start()
  nodes.push(lfo)
  extras.push(lfoG)

  /* РёР·СЂРµРґРєР° — РјСЏРіРєРёР№ Р·РІРѕРЅ С‡Р°С€РєРё Рё Р»С‘РіРєРѕРµ РґРІРёР¶РµРЅРёРµ */
  const ping = () => {
    const t0 = c.currentTime
    const o = c.createOscillator()
    o.type = 'triangle'
    o.frequency.setValueAtTime(1500 + Math.random() * 700, t0)
    const og = c.createGain()
    og.gain.setValueAtTime(0, t0)
    og.gain.linearRampToValueAtTime(0.006, t0 + 0.01)
    og.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.35)
    o.connect(og)
    og.connect(master as AudioNode)
    o.start(t0)
    o.stop(t0 + 0.4)
    timers.push(window.setTimeout(ping, 6000 + Math.random() * 14000))
  }
  timers.push(window.setTimeout(ping, 4000))

  return { nodes, extras, timers }
}

function stopEntry(entry: NonNullable<typeof current>): void {
  entry.timers.forEach((id) => window.clearTimeout(id))
  for (const n of entry.nodes) {
    try {
      n.stop()
    } catch {
      /* СѓР¶Рµ РѕСЃС‚Р°РЅРѕРІР»РµРЅ */
    }
  }
  for (const n of [...entry.nodes, ...entry.extras]) {
    try {
      n.disconnect()
    } catch {
      /* ignore */
    }
  }
}

/** Р’РєР»СЋС‡РёС‚СЊ/РІС‹РєР»СЋС‡РёС‚СЊ/СЃРјРµРЅРёС‚СЊ Р°С‚РјРѕСЃС„РµСЂСѓ СЃ РїР»Р°РІРЅС‹Рј РєСЂРѕСЃСЃС„РµР№РґРѕРј. */
export async function setAmbience(kind: AmbienceKind | null): Promise<void> {
  const c = getCtx()
  if (c.state === 'suspended') {
    await c.resume().catch(() => {})
  }
  if (current?.kind === kind) return

  /* РіР°СЃРёРј РїСЂРµРґС‹РґСѓС‰СѓСЋ Р°С‚РјРѕСЃС„РµСЂСѓ */
  const prev = current
  current = null
  if (master) {
    master.gain.cancelScheduledValues(c.currentTime)
    master.gain.setTargetAtTime(0, c.currentTime, 0.3)
  }
  window.setTimeout(() => {
    if (prev) stopEntry(prev)
  }, 1400)

  if (!kind) {
    localStorage.removeItem(STORE_KEY)
    return
  }

  localStorage.setItem(STORE_KEY, kind)
  const built = kind === 'rain' ? buildRain(c) : kind === 'fire' ? buildFire(c) : buildCafe(c)
  current = { kind, ...built }

  /* РїР»Р°РІРЅС‹Р№ РїРѕРґСЉС‘Рј С‡РµСЂРµР· РїР°СѓР·Сѓ — С‡С‚РѕР±С‹ РЅРµ Р±С‹Р»Рѕ С‰РµР»С‡РєР° РїСЂРё СЃРјРµРЅРµ */
  window.setTimeout(() => {
    if (master && current?.kind === kind) {
      master.gain.cancelScheduledValues(c.currentTime)
      master.gain.setTargetAtTime(1, c.currentTime, 0.7)
    }
  }, 450)
}

/** РџРѕСЃР»РµРґРЅРёР№ РІС‹Р±СЂР°РЅРЅС‹Р№ Р·РІСѓРє (РґР»СЏ РІРѕСЃСЃС‚Р°РЅРѕРІР»РµРЅРёСЏ UI). */
export function getAmbience(): AmbienceKind | null {
  const v = localStorage.getItem(STORE_KEY)
  return v === 'rain' || v === 'fire' || v === 'cafe' ? v : null
}
