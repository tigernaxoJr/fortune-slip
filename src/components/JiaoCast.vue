<script setup lang="ts">
import { computed, onUnmounted, ref } from 'vue'
import { secureIndex } from '../data/decks'
import { haptic, play } from '../services/sensory'

const props = defineProps<{ verseNumber: number }>()
const emit = defineEmits<{ (e: 'confirmed'): void; (e: 'rejected'): void }>()

const MAX_TRIES = 3
type Face = 'flat' | 'round'
type Outcome = 'sheng' | 'xiao' | 'yin'

const outcomes: Record<Outcome, { name: string; desc: string }> = {
  sheng: { name: '聖筊', desc: '一平一凸 ・ 神明允准' },
  xiao: { name: '笑筊', desc: '兩平向上 ・ 神明笑而未答' },
  yin: { name: '陰筊', desc: '兩凸向上 ・ 神明不允' },
}

const tries = ref(0)
const casting = ref(false)
const faces = ref<[Face, Face] | null>(null)
const outcome = ref<Outcome | null>(null)
const history = ref<Outcome[]>([])
let timers: number[] = []
onUnmounted(() => timers.forEach(clearTimeout))

const exhausted = computed(() => tries.value >= MAX_TRIES && outcome.value !== 'sheng')
const triesLeft = computed(() => MAX_TRIES - tries.value)

const hanzi = (n: number) => {
  const d = ['〇', '一', '二', '三', '四', '五', '六', '七', '八', '九']
  if (n <= 10) return n === 10 ? '十' : d[n]
  if (n < 20) return '十' + d[n - 10]
  if (n < 100) return d[Math.floor(n / 10)] + '十' + (n % 10 ? d[n % 10] : '')
  return '一百'
}

function cast() {
  if (casting.value || outcome.value === 'sheng' || exhausted.value) return
  casting.value = true
  outcome.value = null
  faces.value = null
  tries.value++

  const a: Face = secureIndex(2) ? 'flat' : 'round'
  const b: Face = secureIndex(2) ? 'flat' : 'round'

  timers.push(
    window.setTimeout(() => {
      faces.value = [a, b]
      void play('jiao')
      haptic([30, 40, 20])
    }, 950),
    window.setTimeout(() => {
      const o: Outcome = a !== b ? 'sheng' : a === 'flat' ? 'xiao' : 'yin'
      outcome.value = o
      history.value.push(o)
      casting.value = false
      if (o === 'sheng') {
        void play('bell')
        timers.push(window.setTimeout(() => emit('confirmed'), 1500))
      }
    }, 1350),
  )
}
</script>

<template>
  <div class="max-w-xl mx-auto text-center">
    <p class="eyebrow">Divination Blocks</p>
    <h3 class="font-serif font-bold text-3xl md:text-4xl text-gold-leaf mt-3 tracking-[0.18em] pl-[0.18em]">擲筊請示</h3>

    <!-- drawn stick -->
    <div class="mt-6 inline-flex items-center gap-4 lacquer px-5 py-3">
      <div class="w-2.5 h-14 rounded-sm bg-gradient-to-b from-cinnabar-bright via-[#e3c78d] to-[#9b7642]"></div>
      <div class="text-left">
        <p class="text-[11px] text-mist tracking-[0.3em]">籤筒已出</p>
        <p class="font-brush text-2xl text-parchment tracking-[0.2em]">第{{ hanzi(props.verseNumber) }}籤</p>
      </div>
    </div>
    <p class="text-sm text-mist mt-4 leading-7 tracking-wide">
      手持雙筊，默問神明：「此籤是否為弟子所求？」<br />
      須得<span class="text-gold-bright">聖筊</span>方可領籤，連三次不允則重新求籤。
    </p>

    <!-- stage -->
    <div class="relative mx-auto mt-6 h-56 w-full max-w-sm">
      <div class="absolute inset-x-6 bottom-6 h-10 rounded-[50%] bg-black/50 blur-xl"></div>
      <div class="absolute inset-x-10 bottom-10 h-px bg-gradient-to-r from-transparent via-gold/30 to-transparent"></div>

      <div class="absolute inset-0 flex items-end justify-center gap-10 pb-12">
        <div
          v-for="i in 2"
          :key="i"
          class="block"
          :class="casting ? (i === 1 ? 'toss-a' : 'toss-b') : ''"
        >
          <svg viewBox="0 0 120 70" class="w-24 sm:w-28 drop-shadow-[0_10px_12px_rgba(0,0,0,0.7)]" aria-hidden="true">
            <defs>
              <radialGradient :id="`round-${i}`" cx="0.4" cy="0.3">
                <stop offset="0" stop-color="#f06a4a" />
                <stop offset="0.45" stop-color="#c0301e" />
                <stop offset="1" stop-color="#5e0f08" />
              </radialGradient>
              <linearGradient :id="`flat-${i}`" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stop-color="#d8a77a" />
                <stop offset="1" stop-color="#a8703f" />
              </linearGradient>
            </defs>
            <!-- crescent outline -->
            <template v-if="!faces || faces[i - 1] === 'round'">
              <path d="M6 46 C 8 4, 112 4, 114 46 C 96 58, 24 58, 6 46 Z" :fill="`url(#round-${i})`" stroke="#3a0805" stroke-width="1" />
              <path d="M26 22 C 46 10, 74 10, 94 20" fill="none" stroke="#ffd2bf" stroke-opacity="0.55" stroke-width="4" stroke-linecap="round" />
              <path d="M14 46 C 36 54, 84 54, 106 46" fill="none" stroke="#2a0503" stroke-opacity="0.5" stroke-width="2" />
            </template>
            <template v-else>
              <path d="M6 46 C 8 4, 112 4, 114 46 C 96 58, 24 58, 6 46 Z" :fill="`url(#flat-${i})`" stroke="#5a3415" stroke-width="1" />
              <path d="M14 44 C 16 14, 104 14, 106 44 C 90 52, 30 52, 14 44 Z" fill="none" stroke="#7a4a20" stroke-opacity="0.45" stroke-width="0.8" />
              <path d="M26 38 C 34 22, 86 22, 94 38" fill="none" stroke="#7a4a20" stroke-opacity="0.3" stroke-width="0.6" />
            </template>
          </svg>
        </div>
      </div>
    </div>

    <!-- result -->
    <div class="h-16 flex flex-col items-center justify-center">
      <Transition name="fade" mode="out-in">
        <div v-if="outcome" :key="tries">
          <p
            class="font-brush text-3xl tracking-[0.35em] pl-[0.35em]"
            :class="outcome === 'sheng' ? 'text-gold-bright' : 'text-mist'"
          >{{ outcomes[outcome].name }}</p>
          <p class="text-xs text-mist tracking-[0.25em] mt-1">{{ outcomes[outcome].desc }}</p>
        </div>
        <p v-else-if="casting" class="font-brush text-xl text-mist tracking-[0.3em]">筊落 ・ 恭候聖意</p>
      </Transition>
    </div>

    <!-- tries -->
    <div class="flex justify-center gap-3 mt-3" aria-label="擲筊紀錄">
      <span
        v-for="n in MAX_TRIES"
        :key="n"
        class="w-2 h-2 rotate-45 border"
        :class="history[n - 1] === 'sheng'
          ? 'bg-gold-bright border-gold-bright'
          : history[n - 1]
            ? 'bg-cinnabar-deep border-cinnabar'
            : 'border-smoke/50'"
      ></span>
    </div>

    <div class="mt-8">
      <button v-if="exhausted" type="button" class="btn-cinnabar" @click="emit('rejected')">
        神明未允此籤 ・ 重新搖籤
      </button>
      <button
        v-else
        type="button"
        class="btn-cinnabar text-base px-10"
        :class="outcome === 'sheng' ? '!filter-none animate-gold-pulse' : ''"
        :disabled="casting || outcome === 'sheng'"
        @click="cast"
      >
        {{ outcome === 'sheng' ? '聖筊允准 ・ 恭請籤詩' : casting ? '筊杯落地…' : tries === 0 ? '擲筊' : `再擲一次（尚餘 ${triesLeft} 次）` }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.toss-a,
.toss-b {
  animation: toss 1s cubic-bezier(0.3, 0, 0.4, 1) both;
}
.toss-b {
  animation-name: tossB;
}
@keyframes toss {
  0% { transform: translate(0, 0) rotate(0); }
  45% { transform: translate(-14px, -150px) rotate(-400deg) scaleY(0.6); }
  85% { transform: translate(-6px, 0) rotate(-700deg) scaleY(1); }
  92% { transform: translate(-4px, -10px) rotate(-714deg); }
  100% { transform: translate(-4px, 0) rotate(-720deg); }
}
@keyframes tossB {
  0% { transform: translate(0, 0) rotate(0); }
  50% { transform: translate(18px, -130px) rotate(460deg) scaleY(0.6); }
  86% { transform: translate(8px, 0) rotate(706deg) scaleY(1); }
  93% { transform: translate(6px, -8px) rotate(716deg); }
  100% { transform: translate(6px, 0) rotate(720deg); }
}
</style>
