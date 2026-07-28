<script setup lang="ts">
import { ref } from 'vue'
import { Flame, Sparkles, HeartHandshake, Check } from 'lucide-vue-next'

export interface LampItem {
  id: string
  name: string
  deity: string
  benefit: string
  color: string
}

const lampTypes: LampItem[] = [
  { id: 'guangming', name: '光明燈', deity: '天官大帝', benefit: '照耀前程・破除陰霾・智慧開朗', color: '#FFB703' },
  { id: 'taisui', name: '太歲燈', deity: '值年太歲星君', benefit: '安奉太歲・消災解厄・趨吉避兇', color: '#E63946' },
  { id: 'wenchang', name: '文昌燈', deity: '文昌帝君', benefit: '考運亨通・金榜題名・仕途順遂', color: '#3A86EF' },
  { id: 'caishen', name: '財神燈', deity: '五路財神', benefit: '財源廣進・事業興旺・利路通達', color: '#FB8500' },
]

const litLamps = ref<Set<string>>(new Set(['guangming']))
const isIncenseLit = ref<boolean>(true)
const incenseCount = ref<number>(3)
const customWish = ref<string>('')
const wishSaved = ref<boolean>(false)

function toggleLamp(id: string) {
  const next = new Set(litLamps.value)
  if (next.has(id)) {
    next.delete(id)
  } else {
    next.add(id)
  }
  litLamps.value = next
}

function lightAllLamps() {
  litLamps.value = new Set(lampTypes.map(l => l.id))
}

function toggleIncense() {
  isIncenseLit.value = !isIncenseLit.value
}

function saveWish() {
  if (!customWish.value.trim()) return
  wishSaved.value = true
  setTimeout(() => {
    wishSaved.value = false
  }, 2500)
}
</script>

<template>
  <div class="glass-temple-card rounded-2xl p-6 md:p-8 max-w-4xl mx-auto my-8 border border-[#D4AF37]/30 shadow-2xl relative overflow-hidden">
    <!-- Traditional Ornamental Background Pattern -->
    <div class="absolute -top-16 -right-16 w-48 h-48 bg-[#8B0000]/15 rounded-full blur-3xl pointer-events-none"></div>
    <div class="absolute -bottom-16 -left-16 w-48 h-48 bg-[#D4AF37]/10 rounded-full blur-3xl pointer-events-none"></div>

    <!-- Header Title -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#D4AF37]/20">
      <div>
        <div class="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-[#D4AF37] font-semibold mb-1">
          <Sparkles class="w-4 h-4 text-[#D4AF37]" />
          <span>BLESSING SYSTEM ・ 誠心祈福</span>
        </div>
        <h3 class="text-2xl md:text-3xl font-bold font-serif text-[#F3E5AB] flex items-center gap-3">
          線上點燈與立香祈福
        </h3>
      </div>
      
      <div class="flex items-center gap-3">
        <button
          @click="toggleIncense"
          class="px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 flex items-center gap-2 border cursor-pointer"
          :class="isIncenseLit 
            ? 'bg-[#8B0000]/80 text-[#F3E5AB] border-[#D4AF37] shadow-[0_0_15px_rgba(212,175,55,0.4)]' 
            : 'bg-stone-900/80 text-stone-400 border-stone-700 hover:border-stone-500'"
        >
          <Flame class="w-4 h-4" :class="isIncenseLit ? 'text-amber-400 animate-pulse' : 'text-stone-500'" />
          <span>{{ isIncenseLit ? '清香正燃 (點香中)' : '點燃三柱清香' }}</span>
        </button>

        <button
          @click="lightAllLamps"
          class="px-4 py-2 rounded-xl text-sm font-medium border border-[#D4AF37]/50 text-[#F3E5AB] bg-[#D4AF37]/10 hover:bg-[#D4AF37]/20 hover:border-[#D4AF37] transition-all flex items-center gap-2 cursor-pointer"
        >
          <Sparkles class="w-4 h-4 text-[#D4AF37]" />
          <span>全殿光明點亮</span>
        </button>
      </div>
    </div>

    <!-- Main Content Area: Incense Altar & Lamp Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 my-8 items-stretch">
      
      <!-- Left Column: Traditional Incense Burner (立香區) -->
      <div class="lg:col-span-5 bg-[#121212]/90 rounded-xl p-6 border border-[#D4AF37]/20 flex flex-col justify-between items-center text-center relative">
        <span class="text-xs tracking-widest text-amber-200/60 font-serif mb-2">【 鼎香煙繚 誠心叩拜 】</span>
        
        <!-- Incense Burner & Flames -->
        <div class="my-6 relative flex flex-col items-center justify-end h-48 w-full">
          <!-- Rising Smoke Layer -->
          <div v-if="isIncenseLit" class="absolute bottom-32 flex justify-center gap-4 w-full pointer-events-none">
            <div v-for="n in incenseCount" :key="n" class="w-1.5 h-16 bg-gradient-to-t from-amber-400/40 via-stone-300/20 to-transparent rounded-full animate-incense-smoke" :style="{ animationDelay: `${n * 0.4}s` }"></div>
          </div>

          <!-- Incense Sticks -->
          <div class="flex justify-center gap-3 items-end mb-1">
            <div v-for="n in incenseCount" :key="n" class="relative flex flex-col items-center">
              <!-- Ember Glow Wick -->
              <div 
                v-if="isIncenseLit" 
                class="w-2 h-2.5 rounded-full bg-amber-400 animate-candle-flicker mb-0.5 shadow-[0_0_12px_#FF9900]"
                :style="{ animationDelay: `${n * 0.3}s` }"
              ></div>
              <div v-else class="w-1.5 h-2 bg-stone-600 mb-0.5"></div>
              <!-- Stick Body -->
              <div class="w-1 h-28 bg-gradient-to-b from-amber-900 via-amber-800 to-amber-950 rounded-t-sm border-x border-amber-700/50"></div>
            </div>
          </div>

          <!-- Bronze Incense Burner Container -->
          <div class="w-36 h-16 bg-gradient-to-r from-[#3A2810] via-[#634823] to-[#2B1B0A] rounded-b-2xl rounded-t-sm border-2 border-[#D4AF37]/50 shadow-[0_10px_25px_rgba(0,0,0,0.8)] relative flex items-center justify-center">
            <div class="w-28 h-2 border-b border-[#D4AF37]/30 absolute top-2"></div>
            <div class="w-10 h-10 rounded-full border border-[#D4AF37]/40 flex items-center justify-center text-[#D4AF37] font-serif text-xs font-bold bg-black/40">
              香鼎
            </div>
          </div>
        </div>

        <p class="text-xs text-stone-300 font-sans leading-relaxed">
          {{ isIncenseLit ? '一爐真香，達信神明。靜心凝神，誠懇稟明所祈求之事。' : '點燃爐香，靈煙直達九霄，福佑心願所成。' }}
        </p>
      </div>

      <!-- Right Column: Lamp Grid (光明燈 / 太歲燈 / 文昌燈 / 財神燈) -->
      <div class="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div
          v-for="lamp in lampTypes"
          :key="lamp.id"
          @click="toggleLamp(lamp.id)"
          class="rounded-xl p-5 border transition-all duration-300 cursor-pointer relative overflow-hidden flex flex-col justify-between"
          :class="litLamps.has(lamp.id)
            ? 'bg-gradient-to-b from-[#2A1616] to-[#160D0D] border-[#D4AF37] shadow-[0_0_20px_rgba(212,175,55,0.25)]'
            : 'bg-stone-900/60 border-stone-800/80 hover:border-stone-700 opacity-75 hover:opacity-100'"
        >
          <!-- Active Glow Accent -->
          <div 
            v-if="litLamps.has(lamp.id)" 
            class="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-full blur-xl pointer-events-none"
          ></div>

          <!-- Top Row: Flame Icon & Candle Lamp -->
          <div class="flex items-start justify-between mb-3">
            <div class="flex items-center gap-3">
              <!-- Candle Lamp Graphic -->
              <div class="relative w-9 h-12 flex flex-col items-center justify-end">
                <!-- Candle Flame -->
                <div
                  v-if="litLamps.has(lamp.id)"
                  class="w-4 h-6 rounded-full bg-gradient-to-t from-amber-500 via-yellow-300 to-white animate-candle-flicker mb-1 shadow-[0_0_15px_#FFB703]"
                ></div>
                <div v-else class="w-1.5 h-3 bg-stone-600 rounded-t-full mb-1"></div>
                
                <!-- Candle Base Holder -->
                <div class="w-7 h-5 bg-gradient-to-r from-amber-700 via-amber-600 to-amber-900 rounded-sm border border-[#D4AF37]/40"></div>
              </div>

              <div>
                <h4 class="font-serif text-lg font-bold text-[#F3E5AB]">
                  {{ lamp.name }}
                </h4>
                <p class="text-xs text-stone-400 font-sans">
                  奉祀：{{ lamp.deity }}
                </p>
              </div>
            </div>

            <div 
              class="w-6 h-6 rounded-full border flex items-center justify-center transition-all"
              :class="litLamps.has(lamp.id) ? 'bg-[#8B0000] border-[#D4AF37] text-[#D4AF37]' : 'border-stone-700 text-transparent'"
            >
              <Check class="w-3.5 h-3.5 stroke-[3]" />
            </div>
          </div>

          <!-- Benefit Description -->
          <p class="text-xs text-stone-300/90 font-sans mt-2 pt-2 border-t border-stone-800">
            {{ lamp.benefit }}
          </p>

          <!-- Status Indicator Tag -->
          <div class="mt-3 flex items-center justify-between text-[11px]">
            <span :class="litLamps.has(lamp.id) ? 'text-amber-400 font-medium' : 'text-stone-500'">
              {{ litLamps.has(lamp.id) ? '● 燭火高照・吉星庇佑' : '○ 點擊開燈安奉' }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Bottom Wish Input Area -->
    <div class="mt-6 pt-6 border-t border-[#D4AF37]/20 flex flex-col md:flex-row items-center gap-4">
      <div class="relative flex-1 w-full">
        <input
          v-model="customWish"
          type="text"
          placeholder="寫下祈福心願疏文（例：求求家人平安健康、學業事業順利...）"
          class="w-full bg-[#121212]/90 border border-[#D4AF37]/30 rounded-xl px-4 py-3 text-sm text-[#F3E5AB] placeholder-stone-500 focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] transition-all font-sans"
          @keyup.enter="saveWish"
        />
      </div>

      <button
        @click="saveWish"
        class="w-full md:w-auto px-6 py-3 bg-gradient-to-r from-[#8B0000] to-[#5C0000] hover:from-[#A00000] hover:to-[#700000] border border-[#D4AF37] rounded-xl text-[#F3E5AB] text-sm font-semibold flex items-center justify-center gap-2 shadow-[0_4px_15px_rgba(139,0,0,0.4)] transition-all cursor-pointer"
      >
        <HeartHandshake class="w-4 h-4 text-amber-300" />
        <span>{{ wishSaved ? '疏文已呈遞神明 ✓' : '稟告呈遞心願' }}</span>
      </button>
    </div>
  </div>
</template>
