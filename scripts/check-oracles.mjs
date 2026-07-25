import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

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
console.log('oracle data: 6 decks, 520 verses, all attributes verified successfully')
