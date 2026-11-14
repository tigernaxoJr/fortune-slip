<script setup lang="ts">
import { computed } from 'vue'
import type { OracleDeck, OracleVerse } from '../data/decks'
import type { FormattedStory } from '../services/ai'
import { ASSETS, cssLayer } from '../assets'

const props = defineProps<{
  deck: OracleDeck
  verse: OracleVerse
  stories: FormattedStory[]
}>()

const numerals = ['〇', '一', '二', '三', '四', '五', '六', '七', '八', '九']
function toHanzi(n: number): string {
  if (n <= 10) return n === 10 ? '十' : numerals[n]
  if (n < 20) return '十' + numerals[n - 10]
  if (n < 100) return numerals[Math.floor(n / 10)] + '十' + (n % 10 ? numerals[n % 10] : '')
  if (n === 100) return '一百'
  return String(n)
}

const hanziNumber = computed(() => toHanzi(props.verse.number))
const longest = computed(() => Math.max(...props.verse.lines.map((l) => [...l].length)))
const verseSize = computed(() =>
  longest.value <= 5 ? 'clamp(1.7rem, 5.2vw, 2.4rem)'
  : longest.value <= 8 ? 'clamp(1.45rem, 4.4vw, 2.05rem)'
  : 'clamp(1.05rem, 3vw, 1.4rem)',
)
const fortuneTone = computed(() => {
  const f = props.verse.fortune ?? ''
  if (f.includes('凶')) return 'ink'
  return 'cinnabar'
})
const paperStyle = { '--paper-asset': cssLayer(ASSETS.paperXuan) }
</script>

<template>
  <article class="paper-xuan rounded-[3px] overflow-hidden" :style="paperStyle">
    <div class="slip-frame"></div>

    <div class="relative px-7 sm:px-10 pt-10 pb-8">
      <!-- top band -->
      <header class="flex items-start justify-between gap-4">
        <div class="font-serif text-[11px] tracking-[0.3em] text-[#7a2a1a]/80 leading-6">
          <div>{{ deck.name }}</div>
          <div class="text-[#5a4632]/70">{{ deck.origin }}</div>
        </div>
        <div
          v-if="verse.fortune"
          class="seal text-2xl sm:text-3xl animate-stamp shrink-0"
          :class="fortuneTone === 'ink' ? '!text-[#2b1d14]' : ''"
          style="animation-delay: 0.6s"
        >
          <span class="writing-vertical tracking-[0.1em]">{{ verse.fortune }}</span>
        </div>
      </header>

      <!-- number -->
      <div class="text-center -mt-2">
        <p class="font-serif text-[11px] tracking-[0.6em] text-[#7a2a1a] pl-[0.6em]">靈籤</p>
        <h3 class="font-brush font-bold text-[#2b1d14] text-4xl sm:text-5xl mt-2 tracking-[0.18em] pl-[0.18em]">
          第{{ hanziNumber }}籤
        </h3>
        <div
          v-if="verse.ganzhi || verse.element"
          class="mt-3 inline-flex items-center gap-3 font-serif text-xs text-[#5a4632]"
        >
          <span v-if="verse.ganzhi" class="px-2 py-0.5 border border-[#a02418]/50 text-[#a02418] tracking-[0.25em] pl-[calc(0.5rem+0.25em)]">{{ verse.ganzhi }}</span>
          <span v-if="verse.element" class="tracking-widest">{{ verse.element }}</span>
        </div>
      </div>

      <!-- verse: vertical, right to left -->
      <div class="relative my-8 sm:my-10 flex justify-center">
        <div class="absolute inset-0 flex items-center justify-center pointer-events-none select-none" aria-hidden="true">
          <span class="font-serif font-black text-[11rem] sm:text-[13rem] leading-none text-[#a02418]/[0.05]">籤</span>
        </div>
        <div
          class="writing-vertical font-brush text-[#1e140d] relative"
          :style="{ fontSize: verseSize, letterSpacing: '0.32em', lineHeight: 2.1 }"
        >
          <p
            v-for="(line, i) in verse.lines"
            :key="i"
            class="rise-in"
            :style="{ animationDelay: `${0.15 + i * 0.18}s` }"
          >{{ line }}</p>
        </div>
      </div>

      <div class="h-px bg-gradient-to-r from-transparent via-[#a02418]/45 to-transparent"></div>

      <!-- stories -->
      <section v-if="stories.length" class="mt-7">
        <h4 class="slip-h">籤詩典故</h4>
        <div class="space-y-4 mt-4">
          <div v-for="(story, idx) in stories" :key="idx" class="text-[13px] leading-7">
            <strong class="font-serif text-[#7a2a1a] tracking-wider">
              {{ story.title || `典故 ${idx + 1}` }}
            </strong>
            <p v-for="(line, lIdx) in story.content" :key="lIdx" class="text-[#3d2b1d]">{{ line }}</p>
          </div>
        </div>
      </section>

      <!-- attributes -->
      <section v-if="verse.attributes && Object.keys(verse.attributes).length" class="mt-8">
        <h4 class="slip-h">諸事指引</h4>
        <dl class="mt-4 grid grid-cols-2 sm:grid-cols-3 border-t border-l border-[#a02418]/25">
          <div
            v-for="(val, key) in verse.attributes"
            :key="key"
            class="flex gap-2 px-3 py-2 border-b border-r border-[#a02418]/25 text-[12.5px]"
          >
            <dt class="font-serif font-bold text-[#7a2a1a] shrink-0">{{ key }}</dt>
            <dd class="text-[#3d2b1d]">{{ val }}</dd>
          </div>
        </dl>
      </section>

      <!-- explanations -->
      <section v-if="verse.explanations?.length" class="mt-8">
        <h4 class="slip-h">傳統解曰</h4>
        <div class="mt-3 text-[13px] text-[#3d2b1d] leading-7 space-y-1">
          <p v-for="(exp, idx) in verse.explanations" :key="idx">{{ exp }}</p>
        </div>
      </section>

      <footer class="mt-10 text-center font-brush text-sm tracking-[0.35em] text-[#7a2a1a]/75">
        先觀其因 再問其果 ・ 吉中藏戒 凶中有路
      </footer>
    </div>
  </article>
</template>

<style scoped>
.slip-h {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-family: var(--font-serif);
  font-weight: 700;
  font-size: 0.85rem;
  letter-spacing: 0.4em;
  color: #a02418;
}
.slip-h::before,
.slip-h::after {
  content: '';
  height: 1px;
  flex: 1;
  background: rgba(160, 36, 24, 0.3);
}
.slip-h::before { flex: 0 0 1.25rem; }
</style>
