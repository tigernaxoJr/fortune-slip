import { oracleData } from './oracleData'

export type DeckId = keyof typeof oracleData

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
  verses: readonly OracleVerse[]
}

const metadata: Record<DeckId, Omit<OracleDeck, 'verses'>> = {
  jiazi: { id: 'jiazi', name: '六十甲子籤', count: 60, origin: '臺灣媽祖廟常見', guidance: '行止・時運' },
  guanyin: { id: 'guanyin', name: '觀音一百籤', count: 100, origin: '觀音信仰', guidance: '慈悲・抉擇' },
  leiyu: { id: 'leiyu', name: '雷雨師一百籤', count: 100, origin: '關帝廟常見', guidance: '事業・進退' },
  baosheng: { id: 'baosheng', name: '保生大帝六十籤', count: 60, origin: '保生大帝信仰', guidance: '身心・家宅' },
  penghu: { id: 'penghu', name: '澎湖天后宮一百籤', count: 100, origin: '澎湖天后宮', guidance: '平安・遠行' },
  asakusa: { id: 'asakusa', name: '東京淺草觀音寺一百籤', count: 100, origin: '淺草寺漢詩籤', guidance: '境遇・轉機' },
}

export const decks: readonly OracleDeck[] = (Object.keys(metadata) as DeckId[]).map((id) => ({
  ...metadata[id],
  verses: oracleData[id],
}))

export const deckById = (id: DeckId) => decks.find((deck) => deck.id === id) ?? decks[0]

export const secureIndex = (length: number) => {
  if (!Number.isInteger(length) || length < 1) throw new RangeError('籤庫不可為空')
  const range = 2 ** 32
  const ceiling = range - (range % length)
  const value = new Uint32Array(1)
  do crypto.getRandomValues(value)
  while (value[0] >= ceiling)
  return value[0] % length
}

export const drawFrom = (deck: OracleDeck) => deck.verses[secureIndex(deck.verses.length)]
