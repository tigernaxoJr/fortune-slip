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
    if (attempt === 3) throw error
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
      : /^第[一二三四五六七八九十百零?]+籤?(?:大吉|上吉|吉|中吉|小吉|末吉|末小吉|半吉|平平|凶|小凶|大凶)$/.test(line),
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

const knownKeys = [
  '凡事','作事','家事','家運','婚姻','求兒','六甲','求財','功名','歲君','治病','出外','經商','來人','行舟','移居','失物','求雨','官事','六畜','耕作','築室','墳墓','討海','作塭','魚苗','月令','尋人','遠信','運途','田厝','有孕','病人','行人','丁口','時運','交易','田蠶','山墳','願望','疾病','盼望','蓋新居','搬家','旅行','結婚','交往','遺失物','盼望的人','年冬','詞訟','人人','病','家宅','求謀','招財','孕婦','移徙','養蠶'
]

const parseVerse = (html, id, num) => {
  const lines = extractPoem(html, id)
  const text = plain(html)
  const rawLines = text.split('\n').map((l) => l.trim()).filter(Boolean)

  const noiseIdx = rawLines.findIndex((l) =>
    l.includes('籤詩研究室') || l.includes('夏天食物容易壞掉') || l.includes('籤詩網提醒您')
  )
  const cleanLines = noiseIdx >= 0 ? rawLines.slice(0, noiseIdx) : rawLines

  let fortune = ''
  for (const l of cleanLines) {
    const fMatch = l.match(/(大吉|上吉|中吉|小吉|半吉|末吉|末小吉|平平|大凶|小凶|凶)/)
    if (fMatch && (l.includes('籤') || l.includes('【') || l.length <= 10)) {
      fortune = fMatch[1]
      break
    }
  }

  let ganzhi = ''
  let element = ''
  if (id === 'jiazi') {
    const gzMatch = text.match(/【([甲乙丙丁戊己庚辛壬癸][子丑寅卯辰巳午未申酉戌亥])】/)
    if (gzMatch) ganzhi = gzMatch[1]
    const elMatch = text.match(/(屬[金木水火土][^ \n]*)/)
    if (elMatch) element = elMatch[1]
  }

  const stories = []
  let inStory = false
  for (let i = 0; i < cleanLines.length; i++) {
    const l = cleanLines[i]
    if (l === '故事' || l === '籤詩故事' || l.startsWith('故事')) {
      inStory = true
      continue
    }
    if (inStory) {
      if (
        l.startsWith('解籤參考') ||
        l.startsWith('籤詩網整理') ||
        l.startsWith('籤詩語譯') ||
        l.startsWith('聖意') ||
        l.startsWith('東坡解') ||
        l.startsWith('碧仙註')
      ) {
        inStory = false
      } else if (l.length > 0 && !l.includes('http') && !l.startsWith('資料來源')) {
        stories.push(l)
      }
    } else {
      if (/^(?:\(\d+\)|[一二三四五]、)\s*.+/.test(l)) {
        stories.push(l)
      }
    }
  }

  const attributes = {}
  for (let i = 0; i < cleanLines.length; i++) {
    const l = cleanLines[i]

    if (l.startsWith('聖意')) {
      const target = cleanLines[i + 1] || ''
      const parts = target.split(/[。；;\s]+/).filter(Boolean)
      for (const p of parts) {
        if (p.length >= 2) {
          const k = p.slice(0, 2)
          const v = p.slice(2) || p
          if (k && !attributes[k]) attributes[k] = v
        }
      }
    }

    const colonMatch = l.match(/^([\u4e00-\u9fa5A-Za-z0-9、]+)[：:]\s*(.+)$/)
    if (colonMatch && !['資料來源', '日文漢字', '來源', 'http'].some((k) => colonMatch[1].includes(k))) {
      const key = colonMatch[1].trim()
      const val = colonMatch[2].trim()
      if (key.length <= 10 && val.length < 100) {
        attributes[key] = val
        continue
      }
    }

    const multiSpaceMatch = l.match(/^([\u4e00-\u9fa5]{2,6})\s+(.+)$/)
    if (multiSpaceMatch) {
      const key = multiSpaceMatch[1]
      const val = multiSpaceMatch[2]
      if (knownKeys.some((k) => key.includes(k))) {
        attributes[key] = val
        continue
      }
    }

    if (i < cleanLines.length - 1) {
      const key = cleanLines[i]
      const val = cleanLines[i + 1]
      if (
        knownKeys.includes(key) &&
        !knownKeys.includes(val) &&
        val.length < 40 &&
        !val.includes('籤') &&
        !val.includes('http')
      ) {
        attributes[key] = val
      }
    }
  }

  const explanations = []
  for (let i = 0; i < cleanLines.length; i++) {
    const l = cleanLines[i]
    if (
      ['聖意', '聖意一', '聖意二', '東坡解', '東坡解一', '碧仙註', '解曰', '釋義', '籤詩語譯', '解籤參考', '詩意'].some(
        (prefix) => l.startsWith(prefix)
      )
    ) {
      explanations.push(l)
      if (i + 1 < cleanLines.length && !cleanLines[i + 1].includes('http') && !cleanLines[i + 1].startsWith('故事')) {
        explanations.push(cleanLines[i + 1])
      }
    }
  }

  return {
    number: num,
    lines,
    ...(fortune ? { fortune } : {}),
    ...(ganzhi ? { ganzhi } : {}),
    ...(element ? { element } : {}),
    ...(stories.length ? { stories: [...new Set(stories)].slice(0, 6) } : {}),
    ...(Object.keys(attributes).length ? { attributes } : {}),
    ...(explanations.length ? { explanations: [...new Set(explanations)].slice(0, 6) } : {}),
  }
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
        const v = parseVerse(html, id, index + 1)
        if (v.lines.length !== 4) throw new Error(`${name} #${index + 1}: ${JSON.stringify(v.lines)}`)
        poems[index] = v
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
