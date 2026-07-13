// 便签背景音乐：用 Web Audio 实时合成的小旋律循环，无需音频文件、无版权问题。

export const MUSIC_TRACKS = [
  { id: 'warm', label: '温馨' },
  { id: 'sunny', label: '欢快' },
  { id: 'calm', label: '安静' },
  { id: 'playful', label: '俏皮' },
  { id: 'energetic', label: '元气' },
] as const

export type MusicId = (typeof MUSIC_TRACKS)[number]['id']

export function musicLabel(id: string | null | undefined): string | null {
  return MUSIC_TRACKS.find((t) => t.id === id)?.label ?? null
}

// 旋律记谱：[MIDI 音高, 拍数]，音高 0 表示休止符
type TrackDef = {
  bpm: number
  wave: OscillatorType
  gain: number
  melody: [number, number][]
}

const TRACK_DEFS: Record<MusicId, TrackDef> = {
  // C - Am - F - G 分解和弦，慢速三角波
  warm: {
    bpm: 76,
    wave: 'triangle',
    gain: 0.055,
    melody: [
      [60, 1], [64, 1], [67, 1], [64, 1],
      [57, 1], [60, 1], [64, 1], [60, 1],
      [53, 1], [57, 1], [60, 1], [57, 1],
      [55, 1], [59, 1], [62, 1], [67, 2],
    ],
  },
  // 大调五声音阶，轻快跳跃
  sunny: {
    bpm: 116,
    wave: 'triangle',
    gain: 0.055,
    melody: [
      [67, 0.5], [69, 0.5], [72, 0.5], [69, 0.5],
      [67, 0.5], [64, 0.5], [62, 0.5], [64, 0.5],
      [60, 1], [64, 0.5], [67, 0.5], [69, 1],
      [72, 0.5], [69, 0.5], [67, 1.5], [0, 0.5],
    ],
  },
  // 长音正弦波，安静舒缓
  calm: {
    bpm: 60,
    wave: 'sine',
    gain: 0.06,
    melody: [
      [64, 2], [62, 2], [60, 2], [62, 2],
      [64, 2], [67, 2], [64, 3], [0, 1],
    ],
  },
  // 断奏方波，俏皮跳动
  playful: {
    bpm: 138,
    wave: 'square',
    gain: 0.022,
    melody: [
      [72, 0.25], [0, 0.25], [76, 0.25], [0, 0.25],
      [79, 0.5], [76, 0.25], [0, 0.25],
      [72, 0.25], [0, 0.25], [74, 0.5],
      [71, 0.25], [0, 0.25], [74, 0.25], [0, 0.25],
      [72, 1], [0, 0.5],
    ],
  },
  // 快速音阶跑动
  energetic: {
    bpm: 148,
    wave: 'sawtooth',
    gain: 0.03,
    melody: [
      [60, 0.5], [62, 0.5], [64, 0.5], [67, 0.5],
      [69, 0.5], [67, 0.5], [64, 0.5], [62, 0.5],
      [64, 0.5], [67, 0.5], [69, 0.5], [72, 0.5],
      [69, 1], [67, 1],
    ],
  },
}

let ctx: AudioContext | null = null
let master: GainNode | null = null
let loopTimer: number | null = null
let playingId: MusicId | null = null

function ensureCtx(): AudioContext {
  if (!ctx) {
    ctx = new AudioContext()
    master = ctx.createGain()
    master.connect(ctx.destination)
  }
  if (ctx.state === 'suspended') void ctx.resume()
  return ctx
}

function midiToFreq(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12)
}

/** 排一遍完整旋律，返回结束时刻 */
function scheduleLoop(def: TrackDef, startTime: number): number {
  const c = ctx!
  const beat = 60 / def.bpm
  let t = startTime
  for (const [midi, beats] of def.melody) {
    const dur = beats * beat
    if (midi > 0) {
      const osc = c.createOscillator()
      const g = c.createGain()
      osc.type = def.wave
      osc.frequency.value = midiToFreq(midi)
      g.gain.setValueAtTime(0, t)
      g.gain.linearRampToValueAtTime(def.gain, t + 0.02)
      g.gain.setTargetAtTime(0, t + dur * 0.72, dur * 0.12)
      osc.connect(g)
      g.connect(master!)
      osc.start(t)
      osc.stop(t + dur + 0.3)
    }
    t += dur
  }
  return t
}

export function playTrack(id: MusicId | string | null | undefined): void {
  if (typeof window === 'undefined') return
  const next = (id ?? null) as MusicId | null
  if (playingId === next) return
  stopTrack()
  if (!next || !TRACK_DEFS[next]) return

  const def = TRACK_DEFS[next]
  const c = ensureCtx()
  playingId = next

  const loop = (startAt: number) => {
    const end = scheduleLoop(def, startAt)
    loopTimer = window.setTimeout(
      () => {
        if (playingId === next) loop(end)
      },
      Math.max(0, (end - c.currentTime - 0.25) * 1000),
    )
  }
  loop(c.currentTime + 0.05)
}

export function stopTrack(): void {
  if (loopTimer !== null) {
    clearTimeout(loopTimer)
    loopTimer = null
  }
  playingId = null
  // 断开总线让已排程的音符立即静音，再换一条新总线
  if (ctx && master) {
    master.disconnect()
    master = ctx.createGain()
    master.connect(ctx.destination)
  }
}

export function currentTrack(): MusicId | null {
  return playingId
}
