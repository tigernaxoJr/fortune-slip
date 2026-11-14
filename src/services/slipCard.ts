import { verseLines, type OracleDeck, type OracleVerse } from '../data/decks'
import { ASSETS } from '../assets'

/**
 * Renders the drawn verse as a 1080×1920 portrait card (IG story / LINE friendly):
 * rice paper, red double frame, vertical brush-script verse, cinnabar fortune seal.
 * Pure canvas — no server, no extra dependency.
 */
const W = 1080
const H = 1920
const INK = '#21160e'
const RED = '#a52a1b'
const BRUSH = '"LXGW WenKai TC", "Noto Serif TC", serif'
const SERIF = '"Noto Serif TC", serif'

const digits = ['〇', '一', '二', '三', '四', '五', '六', '七', '八', '九']
export function toHanzi(n: number): string {
  if (n <= 10) return n === 10 ? '十' : digits[n]
  if (n < 20) return '十' + digits[n - 10]
  if (n < 100) return digits[Math.floor(n / 10)] + '十' + (n % 10 ? digits[n % 10] : '')
  if (n === 100) return '一百'
  return String(n)
}

function lunarDay(d: number) {
  if (d <= 10) return '初' + (d === 10 ? '十' : digits[d])
  if (d < 20) return '十' + digits[d - 10]
  if (d === 20) return '二十'
  if (d < 30) return '廿' + digits[d - 20]
  return '三十'
}

/** e.g. 丙午年 十月初六 — falls back to 2026.11.14 where the Chinese calendar is unavailable. */
export function templeDate(date = new Date()): string {
  try {
    const parts = new Intl.DateTimeFormat('zh-TW-u-ca-chinese', { year: 'numeric', month: 'long', day: 'numeric' }).formatToParts(date)
    const get = (t: string) => parts.find((p) => p.type === t)?.value
    const yearName = get('yearName')
    const month = get('month')
    const day = Number(get('day'))
    if (yearName && month && day) return `${yearName}年 ${month}${lunarDay(day)}`
  } catch {
    /* fall through */
  }
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`
}

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => resolve(null)
    img.src = src
  })
}

function paper(ctx: CanvasRenderingContext2D, texture: HTMLImageElement | null) {
  const g = ctx.createRadialGradient(W / 2, 0, 100, W / 2, H * 0.4, H)
  g.addColorStop(0, '#f8efd9')
  g.addColorStop(0.5, '#f1e6cc')
  g.addColorStop(1, '#dfcca2')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, W, H)

  if (texture) {
    ctx.save()
    ctx.globalCompositeOperation = 'multiply'
    ctx.globalAlpha = 0.9
    const scale = Math.max(W / texture.width, H / texture.height)
    ctx.drawImage(texture, (W - texture.width * scale) / 2, (H - texture.height * scale) / 2, texture.width * scale, texture.height * scale)
    ctx.restore()
  } else {
    // procedural fibres + grain
    ctx.save()
    ctx.globalCompositeOperation = 'multiply'
    for (let i = 0; i < 900; i++) {
      const x = Math.random() * W
      const y = Math.random() * H
      const len = 20 + Math.random() * 90
      const a = Math.random() * Math.PI
      ctx.strokeStyle = `rgba(140, 100, 50, ${0.03 + Math.random() * 0.06})`
      ctx.lineWidth = 0.6 + Math.random() * 1.2
      ctx.beginPath()
      ctx.moveTo(x, y)
      ctx.quadraticCurveTo(x + Math.cos(a) * len * 0.5 + 6, y + Math.sin(a) * len * 0.5, x + Math.cos(a) * len, y + Math.sin(a) * len)
      ctx.stroke()
    }
    const img = ctx.getImageData(0, 0, W, H)
    const d = img.data
    for (let i = 0; i < d.length; i += 4) {
      const n = (Math.random() - 0.5) * 14
      d[i] += n
      d[i + 1] += n
      d[i + 2] += n
    }
    ctx.putImageData(img, 0, 0)
    ctx.restore()
  }

  // aged edges
  const v = ctx.createRadialGradient(W / 2, H / 2, H * 0.32, W / 2, H / 2, H * 0.75)
  v.addColorStop(0, 'rgba(120, 80, 30, 0)')
  v.addColorStop(1, 'rgba(120, 80, 30, 0.28)')
  ctx.fillStyle = v
  ctx.fillRect(0, 0, W, H)
}

function spaced(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, spacing: number) {
  // centred text with letter-spacing
  const chars = [...text]
  const widths = chars.map((c) => ctx.measureText(c).width)
  const total = widths.reduce((a, b) => a + b, 0) + spacing * (chars.length - 1)
  let cx = x - total / 2
  ctx.textAlign = 'left'
  chars.forEach((c, i) => {
    ctx.fillText(c, cx, y)
    cx += widths[i] + spacing
  })
}

function divider(ctx: CanvasRenderingContext2D, y: number, half = 330) {
  const g = ctx.createLinearGradient(W / 2 - half, 0, W / 2 + half, 0)
  g.addColorStop(0, 'rgba(165, 42, 27, 0)')
  g.addColorStop(0.5, 'rgba(165, 42, 27, 0.55)')
  g.addColorStop(1, 'rgba(165, 42, 27, 0)')
  ctx.fillStyle = g
  ctx.fillRect(W / 2 - half, y, half * 2, 2)
  ctx.save()
  ctx.translate(W / 2, y + 1)
  ctx.rotate(Math.PI / 4)
  ctx.fillStyle = RED
  ctx.fillRect(-6, -6, 12, 12)
  ctx.restore()
}

const PUNCT = new Set([...'，。、；：！？,.;:!?'])

function verticalVerse(ctx: CanvasRenderingContext2D, lines: readonly string[], top: number, bottom: number) {
  const longest = Math.max(...lines.map((l) => [...l].length))
  const avail = bottom - top
  const size = Math.min(longest <= 5 ? 128 : longest <= 8 ? 104 : 74, Math.floor(avail / (longest * 1.22)))
  const step = size * 1.22
  const colGap = size * 1.95
  const totalW = colGap * (lines.length - 1)
  ctx.font = `700 ${size}px ${BRUSH}`
  ctx.fillStyle = INK
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  const blockH = step * longest
  const y0 = top + (avail - blockH) / 2 + step / 2
  lines.forEach((line, col) => {
    const x = W / 2 + totalW / 2 - col * colGap // right → left
    ;[...line].forEach((ch, row) => {
      if (PUNCT.has(ch)) {
        ctx.save()
        ctx.font = `700 ${size * 0.8}px ${BRUSH}`
        ctx.fillText(ch, x + size * 0.32, y0 + row * step - size * 0.28)
        ctx.restore()
      } else {
        ctx.fillText(ch, x, y0 + row * step)
      }
    })
  })
  return size
}

function seal(ctx: CanvasRenderingContext2D, text: string, cx: number, cy: number, ink: string) {
  const chars = [...text]
  const size = 56
  const w = size + 40
  const h = chars.length * size * 1.05 + 40
  ctx.save()
  ctx.translate(cx, cy)
  ctx.rotate((-6 * Math.PI) / 180)
  ctx.globalCompositeOperation = 'multiply'
  ctx.globalAlpha = 0.9
  ctx.strokeStyle = ink
  ctx.lineWidth = 7
  ctx.strokeRect(-w / 2, -h / 2, w, h)
  ctx.lineWidth = 2.5
  ctx.strokeRect(-w / 2 + 10, -h / 2 + 10, w - 20, h - 20)
  ctx.fillStyle = ink
  ctx.font = `900 ${size}px ${SERIF}`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  chars.forEach((c, i) => ctx.fillText(c, 0, -h / 2 + 20 + size * 0.55 + i * size * 1.05))
  // ink wear
  ctx.globalCompositeOperation = 'destination-out'
  for (let i = 0; i < 160; i++) {
    ctx.globalAlpha = Math.random() * 0.5
    ctx.beginPath()
    ctx.arc((Math.random() - 0.5) * w, (Math.random() - 0.5) * h, Math.random() * 3.5, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.restore()
}

async function ensureFonts(text: string) {
  if (!document.fonts) return
  await Promise.allSettled([
    document.fonts.load(`700 100px "LXGW WenKai TC"`, text),
    document.fonts.load(`900 64px "Noto Serif TC"`, text),
    document.fonts.load(`700 40px "Noto Serif TC"`, text),
    document.fonts.load(`400 30px "Noto Serif TC"`, text),
  ])
}

export async function renderSlipCard(deck: OracleDeck, verse: OracleVerse): Promise<Blob> {
  const number = `第${toHanzi(verse.number)}籤`
  const date = templeDate()
  const motto = '先觀其因 再問其果 吉中藏戒 凶中有路'
  const lines = verseLines(verse)
  await ensureFonts(
    [deck.name, deck.origin, number, verse.fortune ?? '', verse.ganzhi ?? '', verse.element ?? '', ...lines, date, motto, '靈籤閣聖籤'].join(''),
  )

  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')!
  paper(ctx, await loadImage(ASSETS.paperXuan))

  // red double frame
  ctx.strokeStyle = RED
  ctx.lineWidth = 6
  ctx.strokeRect(54, 54, W - 108, H - 108)
  ctx.lineWidth = 2
  ctx.strokeRect(70, 70, W - 140, H - 140)

  // header
  ctx.textBaseline = 'alphabetic'
  ctx.fillStyle = RED
  ctx.font = `700 30px ${SERIF}`
  spaced(ctx, `靈籤閣 ・ ${deck.name}`, W / 2, 190, 12)

  ctx.fillStyle = INK
  const numLen = [...number].length
  ctx.font = `700 ${numLen <= 4 ? 132 : 112}px ${BRUSH}`
  spaced(ctx, number, W / 2 - (numLen <= 4 ? 0 : 30), 360, numLen <= 4 ? 22 : 14)

  const meta = [verse.ganzhi, verse.element].filter(Boolean).join('　')
  if (meta) {
    ctx.fillStyle = '#5a4632'
    ctx.font = `400 34px ${SERIF}`
    spaced(ctx, meta, W / 2, 440, 10)
  }

  if (verse.fortune) seal(ctx, verse.fortune, W - 158, 250, verse.fortune.includes('凶') ? INK : '#c3301f')

  divider(ctx, 500)

  // big faint watermark
  ctx.save()
  ctx.globalAlpha = 0.05
  ctx.fillStyle = RED
  ctx.font = `900 620px ${SERIF}`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('籤', W / 2, 1040)
  ctx.restore()

  verticalVerse(ctx, lines, 560, 1560)

  divider(ctx, 1610)

  ctx.textBaseline = 'alphabetic'
  ctx.fillStyle = RED
  ctx.font = `400 34px ${BRUSH}`
  spaced(ctx, motto, W / 2, 1700, 8)

  ctx.fillStyle = '#6b563f'
  ctx.font = `400 28px ${SERIF}`
  spaced(ctx, `${deck.origin} ・ ${date}`, W / 2, 1772, 6)

  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('無法產生圖片'))), 'image/jpeg', 0.9),
  )
}
