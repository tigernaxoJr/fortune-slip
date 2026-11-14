<script setup lang="ts">
import { ref } from 'vue'
import { Flame, Send } from 'lucide-vue-next'
import { ASSETS } from '../assets'

interface LampItem {
  id: string
  name: string
  deity: string
  benefit: string
  glow: string
}

const lampTypes: LampItem[] = [
  { id: 'guangming', name: '光明燈', deity: '天官大帝', benefit: '照耀前程 ・ 破除陰霾', glow: '255, 196, 92' },
  { id: 'taisui', name: '太歲燈', deity: '值年太歲星君', benefit: '安奉太歲 ・ 消災解厄', glow: '236, 84, 58' },
  { id: 'wenchang', name: '文昌燈', deity: '文昌帝君', benefit: '考運亨通 ・ 金榜題名', glow: '120, 180, 255' },
  { id: 'caishen', name: '財神燈', deity: '五路財神', benefit: '財源廣進 ・ 利路通達', glow: '255, 150, 60' },
]

const litLamps = ref<Set<string>>(new Set(['guangming']))
const isIncenseLit = ref(true)
const customWish = ref('')
const burningWish = ref('')
const wishSaved = ref(false)
const lampImageOk = ref(true)

function toggleLamp(id: string) {
  const next = new Set(litLamps.value)
  next.has(id) ? next.delete(id) : next.add(id)
  litLamps.value = next
}

function lightAllLamps() {
  litLamps.value = new Set(lampTypes.map((l) => l.id))
}

function saveWish() {
  if (!customWish.value.trim()) return
  burningWish.value = customWish.value.trim()
  customWish.value = ''
  wishSaved.value = true
  isIncenseLit.value = true
  window.setTimeout(() => {
    wishSaved.value = false
    burningWish.value = ''
  }, 3200)
}
</script>

<template>
  <div class="max-w-5xl mx-auto">
    <div class="text-center mb-12">
      <p class="eyebrow">Lamps &amp; Incense</p>
      <h3 class="font-serif font-bold text-3xl md:text-4xl text-gold-leaf mt-3 tracking-[0.2em] pl-[0.2em]">點燈祈福</h3>
      <p class="text-sm text-mist mt-3 tracking-[0.15em]">一爐清香達天聽 ・ 一盞明燈照前程</p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
      <!-- 香爐 -->
      <div class="lg:col-span-5 lacquer corners p-6 flex flex-col items-center text-center">
        <span class="font-serif text-xs tracking-[0.4em] text-gold">天公爐</span>

        <div class="relative w-full h-72 flex items-end justify-center mt-2">
          <!-- burning petition rising -->
          <Transition name="fade">
            <p
              v-if="burningWish"
              class="wish-burn absolute bottom-40 left-1/2 -translate-x-1/2 w-56 font-brush text-sm leading-6 text-gold-bright/90"
            >{{ burningWish }}</p>
          </Transition>

          <!-- smoke -->
          <div v-if="isIncenseLit" class="absolute bottom-[184px] left-1/2 -translate-x-1/2 flex gap-5 pointer-events-none">
            <span
              v-for="n in 3"
              :key="n"
              class="block w-2 h-20 rounded-full bg-gradient-to-t from-[#d9cbb0]/50 via-[#d9cbb0]/15 to-transparent blur-[3px] animate-incense-smoke"
              :style="{ animationDelay: `${n * 0.9}s` }"
            ></span>
          </div>

          <svg viewBox="0 0 220 220" class="relative w-56 h-56" aria-hidden="true">
            <defs>
              <linearGradient id="bronze" x1="0" x2="1">
                <stop offset="0" stop-color="#2a1b0c" />
                <stop offset="0.3" stop-color="#7a5a2c" />
                <stop offset="0.42" stop-color="#c9a45c" />
                <stop offset="0.6" stop-color="#6a4b22" />
                <stop offset="1" stop-color="#1e1308" />
              </linearGradient>
              <radialGradient id="ember">
                <stop offset="0" stop-color="#fff1c2" />
                <stop offset="0.4" stop-color="#ff9a3c" />
                <stop offset="1" stop-color="#ff5a1f" stop-opacity="0" />
              </radialGradient>
            </defs>
            <!-- incense sticks -->
            <g v-for="(x, i) in [88, 110, 132]" :key="x">
              <rect :x="x - 1.4" :y="34 + (i === 1 ? -6 : 0)" width="2.8" height="86" fill="#8a3a1a" />
              <rect :x="x - 1.4" :y="100 + (i === 1 ? -6 : 0)" width="2.8" height="20" fill="#c23b22" />
              <circle
                v-if="isIncenseLit"
                :cx="x"
                :cy="34 + (i === 1 ? -6 : 0)"
                r="6"
                fill="url(#ember)"
                class="animate-candle-flicker"
                :style="{ animationDelay: `${i * 0.4}s`, transformOrigin: `${x}px ${34 + (i === 1 ? -6 : 0)}px` }"
              />
              <circle v-else :cx="x" :cy="34 + (i === 1 ? -6 : 0)" r="1.6" fill="#3a2a1a" />
            </g>
            <!-- 鼎 handles -->
            <path d="M48 118 q-14 -2 -14 -18 q0 -8 8 -8" fill="none" stroke="url(#bronze)" stroke-width="6" stroke-linecap="round" />
            <path d="M172 118 q14 -2 14 -18 q0 -8 -8 -8" fill="none" stroke="url(#bronze)" stroke-width="6" stroke-linecap="round" />
            <!-- body -->
            <ellipse cx="110" cy="118" rx="66" ry="10" fill="#4a3216" />
            <path d="M44 118 Q46 176 110 180 Q174 176 176 118 Z" fill="url(#bronze)" />
            <ellipse cx="110" cy="118" rx="62" ry="7" fill="#140b05" />
            <!-- ash -->
            <ellipse cx="110" cy="119" rx="56" ry="4.5" fill="#6d665c" opacity="0.7" />
            <!-- legs -->
            <path d="M68 172 L60 204 L72 204 L80 176 Z M152 172 L160 204 L148 204 L140 176 Z M104 180 L104 206 L116 206 L116 180 Z" fill="url(#bronze)" />
            <!-- 回紋 band -->
            <path
              d="M58 136 h8 v6 h-5 v-3 M74 138 h8 v6 h-5 v-3 M90 139 h8 v6 h-5 v-3 M106 139.5 h8 v6 h-5 v-3 M122 139 h8 v6 h-5 v-3 M138 138 h8 v6 h-5 v-3 M154 136 h8 v6 h-5 v-3"
              fill="none" stroke="#ecd294" stroke-opacity="0.6" stroke-width="0.8"
            />
            <text x="110" y="160" text-anchor="middle" font-family="Noto Serif TC, serif" font-weight="900" font-size="15" fill="#ecd294" fill-opacity="0.85" letter-spacing="4">天公爐</text>
          </svg>
        </div>

        <p class="text-sm text-mist leading-7 mt-2 min-h-14">
          {{ isIncenseLit ? '香煙裊裊，上達天聽。靜心凝神，稟明所祈。' : '點燃三炷清香，敬天、敬神、敬祖。' }}
        </p>

        <button type="button" @click="isIncenseLit = !isIncenseLit" class="btn-ghost mt-4">
          <Flame class="w-4 h-4" :class="isIncenseLit ? 'text-[#ff9a3c]' : ''" />
          <span>{{ isIncenseLit ? '清香正燃' : '點燃三炷清香' }}</span>
        </button>
      </div>

      <!-- 燈 -->
      <div class="lg:col-span-7 flex flex-col gap-4">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1">
          <button
            v-for="lamp in lampTypes"
            :key="lamp.id"
            type="button"
            @click="toggleLamp(lamp.id)"
            :aria-pressed="litLamps.has(lamp.id)"
            class="lacquer lacquer-interactive text-left p-5 overflow-hidden flex items-center gap-5"
            :class="litLamps.has(lamp.id) ? 'lacquer-selected' : 'opacity-80 hover:opacity-100'"
          >
            <!-- lamp glow -->
            <div
              class="absolute -left-10 top-1/2 -translate-y-1/2 w-44 h-44 rounded-full blur-2xl pointer-events-none transition-opacity duration-700"
              :style="{ background: `radial-gradient(circle, rgba(${lamp.glow}, .35), transparent 70%)` }"
              :class="litLamps.has(lamp.id) ? 'opacity-100' : 'opacity-0'"
            ></div>

            <div class="relative w-16 h-20 shrink-0 flex items-end justify-center">
              <img
                v-if="lampImageOk"
                :src="ASSETS.lotusLamp"
                alt=""
                @error="lampImageOk = false"
                class="w-16 h-16 object-contain transition-[filter] duration-700"
                :class="litLamps.has(lamp.id) ? '' : 'grayscale brightness-50'"
              />
              <template v-else>
                <!-- fallback: oil lamp -->
                <svg viewBox="0 0 64 80" class="w-16 h-20">
                  <g v-if="litLamps.has(lamp.id)" class="animate-candle-flicker" style="transform-origin: 32px 46px">
                    <ellipse cx="32" cy="34" rx="10" ry="16" :fill="`rgba(${lamp.glow}, .25)`" />
                    <path d="M32 18 C38 30 38 40 32 46 C26 40 26 30 32 18 Z" fill="#ffd27a" />
                    <path d="M32 28 C35 35 35 41 32 45 C29 41 29 35 32 28 Z" fill="#fff6dc" />
                  </g>
                  <line x1="32" y1="44" x2="32" y2="50" stroke="#2a1a10" stroke-width="1.5" />
                  <path d="M12 50 Q32 46 52 50 Q50 62 32 64 Q14 62 12 50 Z" fill="#a8843f" />
                  <path d="M12 50 Q32 54 52 50" fill="none" stroke="#ecd294" stroke-width="1" />
                  <path d="M26 64 L22 76 L42 76 L38 64 Z" fill="#7a5a2c" />
                </svg>
              </template>
            </div>

            <div class="relative min-w-0">
              <h4 class="font-serif font-bold text-lg text-parchment tracking-[0.15em]">{{ lamp.name }}</h4>
              <p class="text-xs text-smoke mt-0.5 tracking-wider">奉祀 {{ lamp.deity }}</p>
              <p class="text-[13px] text-mist mt-3 font-brush tracking-wider">{{ lamp.benefit }}</p>
              <p class="text-[11px] mt-2 tracking-[0.2em]" :class="litLamps.has(lamp.id) ? 'text-gold' : 'text-smoke'">
                {{ litLamps.has(lamp.id) ? '燈火長明' : '點此安燈' }}
              </p>
            </div>
          </button>
        </div>

        <button type="button" @click="lightAllLamps" class="btn-ghost justify-center">
          <span>全殿點燈</span>
        </button>
      </div>
    </div>

    <!-- 疏文 -->
    <form class="lacquer corners mt-6 p-5 flex flex-col md:flex-row items-stretch gap-4" @submit.prevent="saveWish">
      <label for="wish" class="sr-only">祈福疏文</label>
      <input
        id="wish"
        v-model="customWish"
        type="text"
        maxlength="80"
        placeholder="寫下祈福心願（例：願家人平安康健，學業事業順遂）"
        class="field flex-1 font-brush !text-base"
      />
      <button type="submit" class="btn-cinnabar shrink-0 !py-3">
        <Send class="w-4 h-4" />
        <span>{{ wishSaved ? '疏文已焚化上達' : '焚疏上達' }}</span>
      </button>
    </form>
  </div>
</template>

<style scoped>
.wish-burn {
  animation: burnUp 3.2s ease-in forwards;
}
@keyframes burnUp {
  0% { opacity: 0; transform: translate(-50%, 20px); filter: blur(0); }
  20% { opacity: 1; }
  100% { opacity: 0; transform: translate(-50%, -120px) scale(0.9); filter: blur(6px); color: #ff9a3c; }
}
</style>
