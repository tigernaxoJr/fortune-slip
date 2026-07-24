import { mkdirSync, writeFileSync } from 'node:fs'

const base = 'http://www.chance.org.tw/籤詩集/'
const decks = [
  ['jiazi', '六十甲子籤', 60],
  ['guanyin', '觀音一百籤', 100],
  ['leiyu', '雷雨師一百籤', 100],
  ['baosheng', '保生大帝六十籤', 60],
  ['penghu', '澎湖天后宮一百籤', 100],
  ['asakusa', '淺草觀音寺一百籤', 100],
]

const decodeEntities = (value) =>
  value
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')

const plain = (value) =>
  decodeEntities(
    value
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/(?:p|div|td|tr|font|h\d)>/gi, '\n')
      .replace(/<[^>]+>/g, ''),
  )
    .replace(/\r/g, '')
    .replace(/[ \t　]+/g, ' ')
    .replace(/\n+/g, '\n')
    .trim()

const fetchBig5 = async (url, attempt = 0) => {
  try {
    const response = await fetch(encodeURI(url))
    if (!response.ok) throw new Error(`${response.status} ${url}`)
    return new TextDecoder('big5').decode(await response.arrayBuffer())
  } catch (error) {
    if (attempt === 2) throw error
    await new Promise((resolve) => setTimeout(resolve, 300 * (attempt + 1)))
    return fetchBig5(url, attempt + 1)
  }
}

const bracketPoem = (title) => {
  const body = title.match(/【([^】]+)(?:】|$)/)?.[1]
  if (!body) return []
  return body
    .split(/[，,。；;、\s]+/)
    .map((line) => line.trim())
    .filter((line) => line.length >= 4)
    .slice(0, 4)
}

const fontPoem = (html) =>
  [...html.matchAll(
    /<font(?=[^>]*face="標楷體")(?=[^>]*size="(?:5|6|7)")[^>]*>([\s\S]*?)<\/font>/gi,
  )]
    .map((match) => plain(match[1]))
    .flatMap((line) => line.split(/\s+/))
    .filter((line) => line.length >= 4 && line.length <= 16)
    .slice(-4)

const bodyPoem = (html, id) => {
  const lines = plain(html)
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
  const marker = lines.findIndex((line) =>
    (id === 'penghu' || id === 'baosheng')
      ? /^第[一二三四五六七八九十百零?]+籤$/.test(line)
      : /^第[一二三四五六七八九十百零?]+籤?(?:大吉|吉|中吉|小吉|末吉|末小吉|半吉|凶|小凶)$/.test(line),
  )
  if (marker < 0) return []
  return lines
    .slice(marker + 1)
    .map((line) => line.replace(/\s+/g, ''))
    .filter((line) => line.length >= 4 && line.length <= 16 && !line.includes('日文漢字'))
    .slice(0, 4)
}

const extractPoem = (html, id) => {
  const title = plain(html.match(/<title>([\s\S]*?)<\/title>/i)?.[1] ?? '')
  const poem = bracketPoem(title)
  if (poem.length === 4) return poem
  if (id === 'baosheng') { const font = fontPoem(html); if (font.length === 4) return font }
  return bodyPoem(html, id)
}

const pageNumber = (url) => Number(url.match(/第(\d+)籤/)?.[1])

const scrapeDeck = async ([id, name, expected]) => {
  const index = `${base}${name}/籤詩網‧${name}.htm`
  const html = await fetchBig5(index)
  const links = [
    ...new Set(
      [...html.matchAll(/href="([^"]*_+第\d+籤\.htm)"/gi)].map((match) =>
        decodeURI(new URL(match[1], encodeURI(index)).href),
      ),
    ),
  ].sort((a, b) => pageNumber(a) - pageNumber(b))

  if (links.length !== expected) throw new Error(`${name}: expected ${expected}, found ${links.length}`)

  const poems = Array(expected)
  let cursor = 0
  await Promise.all(
    Array.from({ length: 12 }, async () => {
      while (cursor < links.length) {
        const index = cursor++
        const html = await fetchBig5(links[index])
        const lines = extractPoem(html, id)
        if (lines.length !== 4) throw new Error(`${name} #${index + 1}: ${JSON.stringify(lines)}`)
        poems[index] = { number: index + 1, lines }
      }
    }),
  )

  console.log(`${name}: ${poems.length}`)
  return [id, poems]
}

const data = Object.fromEntries(await Promise.all(decks.map(scrapeDeck)))
mkdirSync('src/data', { recursive: true })
writeFileSync(
  'src/data/oracleData.ts',
  `// Generated from the user-provided chance.org.tw reference.\nexport const oracleData = ${JSON.stringify(data, null, 2)} as const\n`,
)


