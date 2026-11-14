<script setup lang="ts">
import { onUnmounted, ref, watch } from 'vue'
import BaguaRing from './BaguaRing.vue'

const props = defineProps<{
  isDrawing: boolean
  selectedDeckName: string
  selectedDeckCount: number
}>()

const emit = defineEmits<{ (e: 'draw'): void }>()

// Ritual narrative shown during the 3s draw.
const stages = [
  { key: 'incense', title: '焚香稟告', sub: '三炷清香 上達天聽' },
  { key: 'shake', title: '搖動籤筒', sub: '心念專一 靈籤自出' },
  { key: 'jiao', title: '擲筊請示', sub: '一陰一陽 ・ 聖筊允准' },
] as const
const stageIndex = ref(-1)
let timers: number[] = []

watch(
  () => props.isDrawing,
  (drawing) => {
    timers.forEach(clearTimeout)
    timers = []
    if (!drawing) {
      stageIndex.value = -1
      return
    }
    stageIndex.value = 0
    timers.push(window.setTimeout(() => (stageIndex.value = 1), 900))
    timers.push(window.setTimeout(() => (stageIndex.value = 2), 2100))
  },
)
onUnmounted(() => timers.forEach(clearTimeout))

function handleDraw() {
  if (props.isDrawing) return
  emit('draw')
}

// sticks fanned inside the cylinder
const sticks = Array.from({ length: 15 }, (_, i) => {
  const t = i - 7
  return { x: 100 + t * 5.2, h: 92 + ((i * 37) % 23), rot: t * 1.6, key: i }
})
</script>

<template>
  <div class="max-w-2xl mx-auto text-center">
    <p class="eyebrow">Ritual of the Cylinder</p>
    <h3 class="font-serif font-bold text-3xl md:text-4xl text-gold-leaf mt-3 tracking-[0.12em]">
      {{ selectedDeckName }}
    </h3>
    <p class="text-sm text-mist mt-2 tracking-widest">
      全套 {{ selectedDeckCount }} 首 ・ 默念姓名生辰與所問之事
    </p>

    <!-- altar -->
    <div class="relative mx-auto mt-6 w-[320px] h-[360px] sm:w-[380px] sm:h-[400px]">
      <div class="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div class="absolute w-[280px] h-[280px] rounded-full bg-cinnabar/25 blur-[70px] animate-breathe"></div>
        <BaguaRing :size="340" :show-taiji="false" class="opacity-60 max-sm:scale-[0.85]" />
      </div>

      <button
        type="button"
        class="absolute inset-x-0 bottom-6 mx-auto w-[200px] h-[300px] group"
        :class="isDrawing ? '' : 'cursor-pointer'"
        :aria-label="isDrawing ? '搖籤中' : '點擊搖籤'"
        :disabled="isDrawing"
        @click="handleDraw"
      >
        <!-- ground shadow -->
        <div class="absolute bottom-0 left-1/2 -translate-x-1/2 w-40 h-5 rounded-[50%] bg-black/80 blur-md"></div>

        <div
          class="relative w-full h-full transition-transform duration-500"
          :class="isDrawing ? 'animate-shake-stick' : 'group-hover:-translate-y-1 group-hover:-rotate-2'"
        >
          <svg viewBox="0 0 200 300" class="w-full h-full overflow-visible">
            <defs>
              <linearGradient id="lacquer" x1="0" x2="1">
                <stop offset="0" stop-color="#3a0906" />
                <stop offset="0.18" stop-color="#7d170e" />
                <stop offset="0.36" stop-color="#c1321f" />
                <stop offset="0.44" stop-color="#d9563a" />
                <stop offset="0.6" stop-color="#9a2214" />
                <stop offset="0.85" stop-color="#5a0f09" />
                <stop offset="1" stop-color="#2a0604" />
              </linearGradient>
              <linearGradient id="goldband" x1="0" x2="1">
                <stop offset="0" stop-color="#5a431f" />
                <stop offset="0.35" stop-color="#e9cf8c" />
                <stop offset="0.45" stop-color="#fff3cf" />
                <stop offset="0.7" stop-color="#a8843f" />
                <stop offset="1" stop-color="#3d2c12" />
              </linearGradient>
              <linearGradient id="bamboo" x1="0" x2="1">
                <stop offset="0" stop-color="#8c6a3a" />
                <stop offset="0.45" stop-color="#e3c78d" />
                <stop offset="1" stop-color="#9b7642" />
              </linearGradient>
              <radialGradient id="medal" cx="0.4" cy="0.35">
                <stop offset="0" stop-color="#fff3cf" />
                <stop offset="0.5" stop-color="#d4b26a" />
                <stop offset="1" stop-color="#6e5225" />
              </radialGradient>
              <clipPath id="above-rim">
                <rect x="0" y="-200" width="200" height="300" />
              </clipPath>
            </defs>

            <!-- sticks -->
            <g clip-path="url(#above-rim)">
              <g v-for="s in sticks" :key="s.key" :transform="`rotate(${s.rot} ${s.x} 140)`">
                <rect :x="s.x - 2.6" :y="140 - s.h" width="5.2" :height="s.h + 20" rx="1.2" fill="url(#bamboo)" />
                <rect :x="s.x - 2.6" :y="140 - s.h" width="5.2" height="11" rx="1.2" fill="#b02a1e" />
                <line :x1="s.x - 2.6" :x2="s.x + 2.6" :y1="140 - s.h / 2" :y2="140 - s.h / 2" stroke="#6b4a22" stroke-width="0.6" />
              </g>
            </g>

            <!-- the chosen stick rising -->
            <g v-if="isDrawing" class="stick-rise">
              <rect x="96.5" y="20" width="7" height="140" rx="1.5" fill="url(#bamboo)" stroke="#fff3cf" stroke-opacity="0.5" stroke-width="0.6" />
              <rect x="96.5" y="20" width="7" height="14" rx="1.5" fill="#d23a26" />
              <circle cx="100" cy="27" r="20" fill="#ecd294" opacity="0.18" />
            </g>

            <!-- barrel -->
            <path d="M42 100 L48 278 Q100 292 152 278 L158 100 Z" fill="url(#lacquer)" />
            <!-- lacquer sheen -->
            <path d="M74 106 L77 274" stroke="#ffd8b8" stroke-opacity="0.22" stroke-width="5" stroke-linecap="round" />
            <!-- rim -->
            <ellipse cx="100" cy="100" rx="58" ry="12" fill="url(#goldband)" />
            <ellipse cx="100" cy="100" rx="52" ry="8.5" fill="#140805" />
            <!-- bands -->
            <path d="M43.2 122 Q100 136 156.8 122 L156.4 130 Q100 144 43.6 130 Z" fill="url(#goldband)" />
            <path d="M47.2 250 Q100 264 152.8 250 L152.4 258 Q100 272 47.6 258 Z" fill="url(#goldband)" />
            <!-- 回紋 between bands -->
            <path
              d="M56 142 h8 v6 h-5 v-3 M70 143 h8 v6 h-5 v-3 M84 144 h8 v6 h-5 v-3 M98 144.5 h8 v6 h-5 v-3 M112 144 h8 v6 h-5 v-3 M126 143 h8 v6 h-5 v-3 M140 142 h8 v6 h-5 v-3"
              fill="none" stroke="#e9cf8c" stroke-opacity="0.55" stroke-width="0.8"
            />
            <!-- medallion -->
            <circle cx="100" cy="196" r="34" fill="url(#medal)" />
            <circle cx="100" cy="196" r="29" fill="#7d170e" stroke="#2a0604" stroke-width="1" />
            <circle cx="100" cy="196" r="25" fill="none" stroke="#e9cf8c" stroke-opacity="0.7" stroke-width="0.6" stroke-dasharray="2 2" />
            <text x="100" y="197" text-anchor="middle" dominant-baseline="central" font-family="Noto Serif TC, serif" font-weight="900" font-size="30" fill="#ecd294">籤</text>
          </svg>
        </div>
      </button>
    </div>

    <!-- narrative -->
    <div class="h-20 mt-2 flex flex-col items-center justify-center">
      <Transition name="fade" mode="out-in">
        <div v-if="isDrawing && stageIndex >= 0" :key="stages[stageIndex].key" class="flex items-center gap-4">
          <!-- 筊杯 -->
          <svg v-if="stages[stageIndex].key === 'jiao'" viewBox="0 0 64 28" class="w-14 h-7" aria-hidden="true">
            <path d="M4 22 Q16 0 28 22 Z" fill="#b02a1e" stroke="#ecd294" stroke-width="0.8" />
            <path d="M36 8 Q48 30 60 8 Z" fill="none" stroke="#b02a1e" stroke-width="2" />
          </svg>
          <div>
            <p class="font-brush text-2xl text-gold-bright tracking-[0.3em]">{{ stages[stageIndex].title }}</p>
            <p class="text-xs text-mist tracking-[0.25em] mt-1">{{ stages[stageIndex].sub }}</p>
          </div>
        </div>
        <p v-else class="text-sm text-mist tracking-[0.2em]">雙手合十 ・ 靜心三息 ・ 再請籤筒</p>
      </Transition>
    </div>

    <button type="button" @click="handleDraw" :disabled="isDrawing" class="btn-cinnabar text-base px-10 mt-2">
      {{ isDrawing ? '籤筒晃動・誠心叩問' : '誠心搖籤' }}
    </button>
  </div>
</template>

<style scoped>
.stick-rise {
  animation: stickRise 3s var(--ease-ritual) forwards;
}
@keyframes stickRise {
  0%, 55% { transform: translateY(70px); opacity: 0; }
  70% { opacity: 1; }
  100% { transform: translateY(-36px); opacity: 1; }
}
</style>
