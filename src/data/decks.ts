// oracleData.ts (~500 KB) is loaded on demand so it never blocks first paint.
type OracleData = typeof import('./oracleData').oracleData

export type DeckId = keyof OracleData

export interface OracleVerse {
  number: number
  lines: readonly string[]
  fortune?: string
  ganzhi?: string
  element?: string
  stories?: readonly string[]
  attributes?: Record<string, string>
  explanations?: readonly string[]
}

export interface OracleDeck {
  id: DeckId
  name: string
  count: number
  origin: string
  guidance: string
}

export const decks: readonly OracleDeck[] = [
  { id: 'jiazi', name: '六十甲子籤', count: 60, origin: '臺灣媽祖廟常見', guidance: '行止・時運' },
  { id: 'guanyin', name: '觀音一百籤', count: 100, origin: '觀音信仰', guidance: '慈悲・抉擇' },
  { id: 'leiyu', name: '雷雨師一百籤', count: 100, origin: '關帝廟常見', guidance: '事業・進退' },
  { id: 'baosheng', name: '保生大帝六十籤', count: 60, origin: '保生大帝信仰', guidance: '身心・家宅' },
  { id: 'penghu', name: '澎湖天后宮一百籤', count: 100, origin: '澎湖天后宮', guidance: '平安・遠行' },
  { id: 'asakusa', name: '東京淺草觀音寺一百籤', count: 100, origin: '淺草寺漢詩籤', guidance: '境遇・轉機' },
]

const MARKER = /^\s*[\[【(（].*[\]】)）]\s*$/

/**
 * Verse lines for display. Some source entries carry section markers inside `lines`
 * (e.g. 「【籤詩一】」 at the start, or 「[詩解]」 followed by an explanation):
 * a leading marker is dropped, and everything from a later marker on is cut.
 */
export function verseLines(verse: OracleVerse): string[] {
  const lines = verse.lines.map((l) => l.trim()).filter(Boolean)
  const out: string[] = []
  for (const [i, line] of lines.entries()) {
    if (MARKER.test(line)) {
      if (out.length === 0 && i === 0) continue
      break
    }
    out.push(line)
  }
  return out.length ? out : [...verse.lines]
}

export const deckById = (id: DeckId) => decks.find((deck) => deck.id === id) ?? decks[0]

let dataPromise: Promise<OracleData> | null = null

/** Start (or reuse) the download of all verse data. Safe to call repeatedly. */
export function loadOracleData(): Promise<OracleData> {
  dataPromise ??= import('./oracleData').then((m) => m.oracleData)
  dataPromise.catch(() => (dataPromise = null)) // allow retry after a network error
  return dataPromise
}

export const secureIndex = (length: number) => {
  if (!Number.isInteger(length) || length < 1) throw new RangeError('籤庫不可為空')
  const range = 2 ** 32
  const ceiling = range - (range % length)
  const value = new Uint32Array(1)
  do crypto.getRandomValues(value)
  while (value[0] >= ceiling)
  return value[0] % length
}

export async function drawFrom(deck: OracleDeck): Promise<OracleVerse> {
  const verses: readonly OracleVerse[] = (await loadOracleData())[deck.id]
  return verses[secureIndex(verses.length)]
}
