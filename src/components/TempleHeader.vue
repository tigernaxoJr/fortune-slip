<script setup lang="ts">
import { Settings } from 'lucide-vue-next'

const props = defineProps<{
  currentStep: number
  maxStepReached: number
  isStepDisabled: (step: number) => boolean
  steps: readonly { num: number; symbol: string; label: string }[]
}>()

const emit = defineEmits<{
  (e: 'go-step', step: 1 | 2 | 3 | 4): void
  (e: 'open-settings'): void
  (e: 'reset'): void
}>()
</script>

<template>
  <header class="sticky top-0 z-40 w-full bg-[#121212]/90 backdrop-blur-md border-b border-[#D4AF37]/30 shadow-xl">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
      
      <!-- Brand Logo / Temple Seal -->
      <div 
        @click="emit('reset')" 
        class="flex items-center gap-3 cursor-pointer group"
      >
        <!-- Square Temple Seal Stamp Logo -->
        <div class="w-11 h-11 border-2 border-[#D4AF37] bg-[#8B0000] rounded-sm flex items-center justify-center text-[#F3E5AB] font-serif font-black text-xl shadow-[0_0_15px_rgba(139,0,0,0.6)] group-hover:scale-105 transition-transform">
          籤
        </div>
        <div>
          <h1 class="text-xl md:text-2xl font-bold font-serif text-temple-gold tracking-wide">
            諸佛聖籤
          </h1>
          <p class="text-[10px] text-stone-400 font-sans tracking-widest uppercase">
            Traditional Oracle & AI Interpretation
          </p>
        </div>
      </div>

      <!-- Step Navigation Indicator (Desktop) -->
      <nav class="hidden md:flex items-center gap-2 lg:gap-4">
        <button
          v-for="s in steps"
          :key="s.num"
          @click="emit('go-step', s.num as 1|2|3|4)"
          :disabled="isStepDisabled(s.num)"
          class="px-3.5 py-2 rounded-xl text-sm font-serif transition-all duration-300 flex items-center gap-2 border cursor-pointer"
          :class="currentStep === s.num
            ? 'bg-[#8B0000]/90 text-[#F3E5AB] border-[#D4AF37] shadow-[0_0_15px_rgba(212,175,55,0.35)]'
            : isStepDisabled(s.num)
              ? 'bg-transparent text-stone-600 border-transparent cursor-not-allowed'
              : 'bg-stone-900/60 text-stone-300 border-stone-800 hover:border-[#D4AF37]/50 hover:text-[#F3E5AB]'"
        >
          <span 
            class="w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center"
            :class="currentStep === s.num ? 'bg-[#D4AF37] text-[#121212]' : 'bg-stone-800 text-stone-400'"
          >
            {{ s.symbol }}
          </span>
          <span>{{ s.label }}</span>
        </button>
      </nav>

      <!-- Settings & Action Button -->
      <div class="flex items-center gap-3">
        <button
          @click="emit('open-settings')"
          class="p-2.5 rounded-xl border border-[#D4AF37]/30 text-stone-300 hover:text-[#F3E5AB] hover:border-[#D4AF37] bg-stone-900/80 hover:bg-[#8B0000]/30 transition-all cursor-pointer flex items-center gap-2 text-xs font-medium"
          title="設定 AI 靈析 API 金鑰"
        >
          <Settings class="w-4 h-4 text-[#D4AF37]" />
          <span class="hidden sm:inline">AI 靈析設定</span>
        </button>
      </div>
    </div>

    <!-- Mobile Step Navigation Bar -->
    <div class="md:hidden flex items-center justify-around px-2 py-2 border-t border-[#D4AF37]/20 bg-[#1A1A1A]/95">
      <button
        v-for="s in steps"
        :key="s.num"
        @click="emit('go-step', s.num as 1|2|3|4)"
        :disabled="isStepDisabled(s.num)"
        class="px-2 py-1 text-xs font-serif flex flex-col items-center gap-0.5 rounded transition-all cursor-pointer"
        :class="currentStep === s.num
          ? 'text-[#D4AF37] font-bold'
          : isStepDisabled(s.num)
            ? 'text-stone-600 cursor-not-allowed'
            : 'text-stone-400'"
      >
        <span class="w-5 h-5 rounded-full text-[10px] flex items-center justify-center font-bold" :class="currentStep === s.num ? 'bg-[#8B0000] text-[#D4AF37] border border-[#D4AF37]' : 'bg-stone-800'">
          {{ s.symbol }}
        </span>
        <span>{{ s.label }}</span>
      </button>
    </div>
  </header>
</template>
