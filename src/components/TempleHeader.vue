<script setup lang="ts">
import { Settings, Volume2, VolumeX } from 'lucide-vue-next'
import { play, preloadSounds, soundEnabled } from '../services/sensory'
import BaguaRing from './BaguaRing.vue'

defineProps<{
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

function toggleSound() {
  soundEnabled.value = !soundEnabled.value
  if (soundEnabled.value) {
    preloadSounds()
    void play('bell')
  }
}

const tabs = [
  { id: 'oracle', label: '求籤解意' },
  { id: 'blessing', label: '點燈祈福' },
] as const
</script>

<template>
  <header class="sticky top-0 z-40 w-full">
    <div class="absolute inset-0 bg-ink/80 backdrop-blur-xl"></div>
    <div class="absolute inset-x-0 bottom-0 rule-gold opacity-60"></div>

    <div class="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 md:h-[72px] flex items-center justify-between gap-3">
      <!-- brand -->
      <button type="button" @click="emit('reset')" class="flex items-center gap-3 group shrink-0 cursor-pointer">
        <div class="relative w-10 h-10 md:w-11 md:h-11 transition-transform duration-700 group-hover:rotate-45">
          <BaguaRing :size="44" :show-names="false" :spin="false" class="w-full h-full" />
        </div>
        <div class="text-left">
          <h1 class="font-serif font-black text-xl md:text-2xl tracking-[0.25em] text-gold-leaf leading-none">靈籤閣</h1>
          <p class="hidden sm:block font-cinzel text-[9px] tracking-[0.35em] text-mist mt-1.5">TAOIST ORACLE HALL</p>
        </div>
      </button>

      <!-- tabs -->
      <nav class="flex items-center gap-1 sm:gap-6 shrink-0" aria-label="主選單">
        <button
          v-for="t in tabs"
          :key="t.id"
          type="button"
          @click="emit('switch-tab', t.id)"
          class="relative px-2 py-2 font-serif text-sm md:text-[15px] tracking-[0.2em] transition-colors cursor-pointer"
          :class="activeMainTab === t.id ? 'text-gold-bright' : 'text-mist hover:text-parchment'"
        >
          {{ t.label }}
          <span
            class="absolute left-1/2 -bottom-0.5 h-[2px] -translate-x-1/2 bg-cinnabar-bright transition-all duration-500"
            :class="activeMainTab === t.id ? 'w-6' : 'w-0'"
          ></span>
        </button>
      </nav>

      <!-- step progress (desktop) -->
      <ol v-if="activeMainTab === 'oracle'" class="hidden xl:flex items-center">
        <li v-for="(s, i) in steps" :key="s.num" class="flex items-center">
          <button
            type="button"
            @click="emit('go-step', s.num as 1 | 2 | 3 | 4)"
            :disabled="isStepDisabled(s.num)"
            class="flex items-center gap-2 px-1.5 py-1 font-serif text-xs tracking-[0.15em] transition-colors disabled:cursor-not-allowed cursor-pointer"
            :class="currentStep === s.num ? 'text-parchment' : isStepDisabled(s.num) ? 'text-smoke/60' : 'text-mist hover:text-parchment'"
          >
            <span
              class="w-6 h-6 flex items-center justify-center text-[11px] font-bold rotate-45 border transition-all duration-500"
              :class="currentStep === s.num
                ? 'bg-cinnabar border-gold-bright text-gold-bright shadow-[0_0_14px_rgba(210,58,38,0.6)]'
                : s.num < currentStep || (!isStepDisabled(s.num) && s.num <= maxStepReached)
                  ? 'border-gold/60 text-gold'
                  : 'border-smoke/40 text-smoke/70'"
            >
              <span class="-rotate-45">{{ s.symbol }}</span>
            </span>
            <span>{{ s.label }}</span>
          </button>
          <span v-if="i < steps.length - 1" class="w-5 h-px mx-1" :class="s.num < maxStepReached ? 'bg-gold/50' : 'bg-smoke/30'"></span>
        </li>
      </ol>

      <div class="flex items-center gap-2 shrink-0">
      <button
        type="button"
        @click="toggleSound"
        class="btn-ghost !p-2.5"
        :class="soundEnabled ? '!text-gold-bright !border-gold/50' : ''"
        :aria-pressed="soundEnabled"
        :title="soundEnabled ? '關閉音效' : '開啟音效'"
        :aria-label="soundEnabled ? '關閉音效' : '開啟音效'"
      >
        <Volume2 v-if="soundEnabled" class="w-4 h-4" />
        <VolumeX v-else class="w-4 h-4" />
      </button>
      <button
        type="button"
        @click="emit('open-settings')"
        class="btn-ghost !p-2.5"
        title="AI 神諭設定"
        aria-label="AI 神諭設定"
      >
        <Settings class="w-4 h-4" />
      </button>
      </div>
    </div>

    <!-- step progress (mobile) -->
    <ol
      v-if="activeMainTab === 'oracle'"
      class="relative xl:hidden flex items-center justify-between max-w-md mx-auto px-5 pb-2.5 pt-1"
    >
      <li v-for="s in steps" :key="s.num">
        <button
          type="button"
          @click="emit('go-step', s.num as 1 | 2 | 3 | 4)"
          :disabled="isStepDisabled(s.num)"
          class="flex items-center gap-1.5 font-serif text-[12px] tracking-widest disabled:cursor-not-allowed"
          :class="currentStep === s.num ? 'text-gold-bright' : isStepDisabled(s.num) ? 'text-smoke/60' : 'text-mist'"
        >
          <span
            class="w-1.5 h-1.5 rotate-45"
            :class="currentStep === s.num ? 'bg-cinnabar-bright shadow-[0_0_8px_#d23a26]' : 'bg-current opacity-60'"
          ></span>
          {{ s.label }}
        </button>
      </li>
    </ol>
  </header>
</template>
