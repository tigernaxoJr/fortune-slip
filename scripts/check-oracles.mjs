import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { defaultCspPresets, fetchModels, formatStories, removeThoughtTags } from '../src/services/ai.ts'

// Check CSP Presets
assert(Array.isArray(defaultCspPresets) && defaultCspPresets.length >= 3, 'CSP presets missing')
const googlePreset = defaultCspPresets.find((p) => p.id === 'google')
assert(googlePreset, 'Google Gemini preset missing')
assert.equal(googlePreset.baseUrl, 'https://generativelanguage.googleapis.com/v1beta/openai')

// Check removeThoughtTags logic
assert.equal(removeThoughtTags('<thought>thinking process...</thought>Final Answer'), 'Final Answer')
assert.equal(removeThoughtTags('<think>some reasoning\nsecond line</think>\n\n解籤內容'), '解籤內容')
assert.equal(removeThoughtTags('<thought>unclosed thinking'), '')

// Check formatStories logic
const rawStories = [
  '(一)韓文公過秦嶺湘子掃霜雪',
  '韓愈。字退之。昌黎人。唐德宗貞元八年進士。諡文公。',
  '因諫迎佛骨。獨怒天子。貶至潮州刺史。',
]
const formatted = formatStories(rawStories)
assert.equal(formatted.length, 1)
assert.equal(formatted[0].title, '韓文公過秦嶺湘子掃霜雪')
assert.equal(formatted[0].content.length, 2)

// Check unnumbered title detection (e.g. 周玉姊可遇陳春生 followed by 2.姜子牙...)
const unnumberedStoriesTest = ['周玉姊可遇陳春生', '2.姜子牙送飯為武吉掩卦']
const formattedUnnumbered = formatStories(unnumberedStoriesTest)
assert.equal(formattedUnnumbered.length, 2)
assert.equal(formattedUnnumbered[0].title, '周玉姊可遇陳春生')
assert.equal(formattedUnnumbered[1].title, '姜子牙送飯為武吉掩卦')

// Check empty story title filtering (e.g. 一、, 二、, 三、, 四、 without content)
const emptyStoriesTest = [
  '1.李存孝打虎',
  '2.石存孝遇李克用收為誼子',
  '一、',
  '二、',
  '三、',
  '四、',
]
const formattedEmpty = formatStories(emptyStoriesTest)
assert.equal(formattedEmpty.length, 2)
assert.equal(formattedEmpty[0].title, '李存孝打虎')
assert.equal(formattedEmpty[1].title, '石存孝遇李克用收為誼子')

// Check fetchModels export
assert.equal(typeof fetchModels, 'function')

const source = readFileSync('src/data/oracleData.ts', 'utf8')
const json = source.match(/export const oracleData = ([\s\S]+) as const/)?.[1]
assert(json, 'oracle data export not found')

const data = JSON.parse(json)
const expected = { jiazi: 60, guanyin: 100, leiyu: 100, baosheng: 60, penghu: 100, asakusa: 100 }

for (const [id, count] of Object.entries(expected)) {
  assert.equal(data[id].length, count, `${id} count`)
  data[id].forEach((verse, index) => {
    assert.equal(verse.number, index + 1, `${id} number ${index + 1}`)
    assert.equal(verse.lines.length, 4, `${id} lines ${index + 1}`)
    verse.lines.forEach((line) => assert(line.length >= 4, `${id} text ${index + 1}`))
    assert(verse.attributes && Object.keys(verse.attributes).length > 0, `${id} verse ${index + 1} has attributes`)
  })
}

assert.equal(Object.values(data).flat().length, 520)
console.log('oracle data: 6 decks, 520 verses, unnumbered story titles & empty filtering verified successfully')
