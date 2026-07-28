<script setup lang="ts">
import { Settings, Compass, Flame } from 'lucide-vue-next'

const props = defineProps<{
  currentStep: number
  maxStepReached: number
  isStepDisabled: (step: number) => boolean
  steps: readonly { num: number; symbol: string; label: string }[]
  activeMainTab: 'oracle' | 'blessing'
}>()

const emit = defineEmits<{
  (e: 'go-step', step: 1 | 2 | 3 | 4): void
  (e: 'open-settings'): void
  (e: 'reset'): void
  (e: 'switch-tab', tab: 'oracle' | 'blessing'): void
}>()
</script>

<template>
  <header class="sticky top-0 z-40 w-full bg-[#121212]/90 backdrop-blur-md border-b border-[#D4AF37]/30 shadow-xl">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 md:h-20 flex items-center justify-between gap-4">
      
      <!-- Brand Logo / Temple Seal -->
      <div 
        @click="emit('reset')" 
        class="flex items-center gap-2.5 cursor-pointer group shrink-0"
      >
        <!-- Square Temple Seal Stamp Logo -->
        <div class="w-9 h-9 md:w-11 md:h-11 border-2 border-[#D4AF37] bg-[#8B0000] rounded-sm flex items-center justify-center text-[#F3E5AB] font-serif font-black text-lg md:text-xl shadow-[0_0_15px_rgba(139,0,0,0.6)] group-hover:scale-105 transition-transform">
          籤
        </div>
        <div>
          <h1 class="text-lg md:text-xl font-bold font-serif text-temple-gold tracking-wide">
            諸佛聖籤
          </h1>
          <p class="hidden sm:block text-[9px] text-stone-400 font-sans tracking-widest uppercase">
            Sacred Temple Oracle
          </p>
        </div>
      </div>

      <!-- Main Dual Tab Switcher (虔誠求籤解意 VS 線上點燈與立香) -->
      <div class="flex items-center p-1 rounded-xl bg-[#1A1A1A]/90 border border-[#D4AF37]/30 shadow-inner shrink-0">
        <button
          @click="emit('switch-tab', 'oracle')"
          class="px-3 md:px-4 py-1.5 rounded-lg text-xs md:text-sm font-serif font-bold transition-all duration-300 flex items-center gap-1.5 cursor-pointer"
          :class="activeMainTab === 'oracle'
            ? 'bg-[#8B0000] text-[#F3E5AB] border border-[#D4AF37] shadow-[0_0_12px_rgba(212,175,55,0.4)]'
            : 'text-stone-400 hover:text-stone-200'"
        >
          <Compass class="w-3.5 h-3.5 text-amber-400" />
          <span>求籤解意</span>
        </button>
        <button
          @click="emit('switch-tab', 'blessing')"
          class="px-3 md:px-4 py-1.5 rounded-lg text-xs md:text-sm font-serif font-bold transition-all duration-300 flex items-center gap-1.5 cursor-pointer"
          :class="activeMainTab === 'blessing'
            ? 'bg-[#8B0000] text-[#F3E5AB] border border-[#D4AF37] shadow-[0_0_12px_rgba(212,175,55,0.4)]'
            : 'text-stone-400 hover:text-stone-200'"
        >
          <Flame class="w-3.5 h-3.5 text-amber-400 animate-pulse" />
          <span>線上點燈祈福</span>
        </button>
      </div>

      <!-- Step Navigation Indicator (Desktop) -->
      <nav v-if="activeMainTab === 'oracle'" class="hidden lg:flex items-center gap-2">
        <button
          v-for="s in steps"
          :key="s.num"
          @click="emit('go-step', s.num as 1|2|3|4)"
          :disabled="isStepDisabled(s.num)"
          class="px-3 py-1.5 rounded-lg text-xs font-serif transition-all duration-300 flex items-center gap-1.5 border cursor-pointer"
          :class="currentStep === s.num
            ? 'bg-[#8B0000]/90 text-[#F3E5AB] border-[#D4AF37] shadow-[0_0_12px_rgba(212,175,55,0.35)]'
            : isStepDisabled(s.num)
              ? 'bg-transparent text-stone-600 border-transparent cursor-not-allowed'
              : 'bg-stone-900/60 text-stone-300 border-stone-800 hover:border-[#D4AF37]/50 hover:text-[#F3E5AB]'"
        >
          <span 
            class="w-4 h-4 rounded-full text-[10px] font-bold flex items-center justify-center"
            :class="currentStep === s.num ? 'bg-[#D4AF37] text-[#121212]' : 'bg-stone-800 text-stone-400'"
          >
            {{ s.symbol }}
          </span>
          <span>{{ s.label }}</span>
        </button>
      </nav>

      <!-- Settings & Action Button -->
      <div class="flex items-center gap-2 shrink-0">
        <button
          @click="emit('open-settings')"
          class="p-2 rounded-xl border border-[#D4AF37]/30 text-stone-300 hover:text-[#F3E5AB] hover:border-[#D4AF37] bg-stone-900/80 hover:bg-[#8B0000]/30 transition-all cursor-pointer flex items-center gap-1.5 text-xs font-medium"
          title="設定 AI 靈析 API 金鑰"
        >
          <Settings class="w-4 h-4 text-[#D4AF37]" />
          <span class="hidden xl:inline">AI 設定</span>
        </button>
      </div>
    </div>

    <!-- Mobile Step Navigation Bar (Only for Oracle tab) -->
    <div v-if="activeMainTab === 'oracle'" class="lg:hidden flex items-center justify-around px-2 py-1.5 border-t border-[#D4AF37]/20 bg-[#1A1A1A]/95">
      <button
        v-for="s in steps"
        :key="s.num"
        @click="emit('go-step', s.num as 1|2|3|4)"
        :disabled="isStepDisabled(s.num)"
        class="px-2 py-0.5 text-xs font-serif flex items-center gap-1.5 rounded transition-all cursor-pointer"
        :class="currentStep === s.num
          ? 'text-[#D4AF37] font-bold'
          : isStepDisabled(s.num)
            ? 'text-stone-600 cursor-not-allowed'
            : 'text-stone-400'"
      >
        <span class="w-4 h-4 rounded-full text-[10px] flex items-center justify-center font-bold" :class="currentStep === s.num ? 'bg-[#8B0000] text-[#D4AF37] border border-[#D4AF37]' : 'bg-stone-800'">
          {{ s.symbol }}
        </span>
        <span>{{ s.label }}</span>
      </button>
    </div>
  </header>
</template>
