<script setup lang="ts">
import { ref } from 'vue'
import { Sparkles, Dices } from 'lucide-vue-next'

const props = defineProps<{
  isDrawing: boolean
  selectedDeckName: string
  selectedDeckCount: number
}>()

const emit = defineEmits<{
  (e: 'draw'): void
}>()

const stickSelected = ref<number | null>(null)

function handleDraw() {
  if (props.isDrawing) return
  stickSelected.value = Math.floor(Math.random() * props.selectedDeckCount) + 1
  emit('draw')
}
</script>

<template>
  <div class="glass-temple-card rounded-2xl p-6 md:p-10 max-w-xl mx-auto my-8 border border-[#D4AF37]/30 shadow-2xl text-center relative overflow-hidden">
    <!-- Ambient Background Glow -->
    <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-[#8B0000]/20 rounded-full blur-3xl pointer-events-none"></div>

    <!-- Header Section -->
    <div class="mb-6">
      <div class="inline-flex items-center gap-1.5 text-xs tracking-widest text-[#D4AF37] font-semibold mb-2">
        <Sparkles class="w-3.5 h-3.5 text-[#D4AF37]" />
        <span>RITUAL CYLINDER ・ 誠心求籤</span>
      </div>
      <h3 class="text-2xl md:text-3xl font-bold font-serif text-[#F3E5AB]">
        {{ selectedDeckName }}
      </h3>
      <p class="text-xs text-stone-400 font-sans mt-1">
        全套共 {{ selectedDeckCount }} 首聖籤 ・ 誠心叩問神明
      </p>
    </div>

    <!-- Fortune Stick Cylinder Container -->
    <div class="relative my-10 flex flex-col items-center justify-center h-64">
      <!-- 3D Cylinder Container with Shake Animation -->
      <div
        class="relative w-44 h-56 transition-transform duration-300 flex flex-col items-center justify-end"
        :class="isDrawing ? 'animate-shake-stick' : 'hover:scale-105 cursor-pointer'"
        @click="handleDraw"
      >
        <!-- Drawn Stick Rising out -->
        <div
          v-if="isDrawing"
          class="absolute -top-16 z-30 w-4 h-36 bg-gradient-to-b from-[#F3E5AB] via-[#D4AF37] to-[#8B4513] rounded-t-sm border border-[#D4AF37] shadow-[0_0_20px_rgba(212,175,55,0.8)] transition-all duration-700 animate-bounce flex flex-col items-center pt-2"
        >
          <span class="text-[10px] font-bold text-red-950 font-serif writing-vertical-tb">吉籤</span>
        </div>

        <!-- Bamboo Sticks Bundle Inside Cylinder -->
        <div class="absolute top-2 w-36 h-28 flex justify-center items-end gap-1.5 z-10 overflow-hidden">
          <div
            v-for="i in 11"
            :key="i"
            class="w-2.5 bg-gradient-to-b from-[#E6C280] via-[#C49A50] to-[#8B5A2B] rounded-t-sm border-t border-amber-200/60 shadow-sm"
            :style="{
              height: `${75 + (i % 5) * 8}%`,
              transform: `rotate(${(i - 6) * 3}deg) translateY(${(i % 3) * 2}px)`
            }"
          ></div>
        </div>

        <!-- Upper Rim Metal Ring -->
        <div class="w-44 h-6 bg-gradient-to-r from-[#AA7C11] via-[#FFF5C0] to-[#AA7C11] rounded-t-xl z-20 border-b border-[#5C0000] shadow-md flex items-center justify-center">
          <div class="w-36 h-2 bg-stone-900/80 rounded-full"></div>
        </div>

        <!-- Cylinder Wooden Barrel Body -->
        <div class="w-40 h-44 bg-gradient-to-b from-[#4A2E16] via-[#2A1608] to-[#180A03] border-x-2 border-b-2 border-[#D4AF37]/60 shadow-2xl z-20 relative flex flex-col items-center justify-center rounded-b-xl">
          <!-- Metallic Seal Ornament -->
          <div class="w-20 h-20 rounded-full border-2 border-[#D4AF37] bg-[#8B0000]/80 shadow-[inset_0_0_15px_rgba(0,0,0,0.8)] flex flex-col items-center justify-center">
            <span class="text-[#F3E5AB] font-serif text-xl font-black tracking-widest">聖籤</span>
            <span class="text-[9px] text-[#D4AF37] font-serif tracking-tighter">求解答</span>
          </div>

          <!-- Gold Trim Stripes -->
          <div class="w-full h-1 bg-[#D4AF37]/40 absolute top-4"></div>
          <div class="w-full h-1 bg-[#D4AF37]/40 absolute bottom-4"></div>
        </div>

        <!-- Base Shadow -->
        <div class="w-36 h-4 bg-black/60 rounded-full blur-sm absolute -bottom-2 z-0"></div>
      </div>
    </div>

    <!-- Action Button -->
    <div class="mt-4">
      <button
        @click="handleDraw"
        :disabled="isDrawing"
        class="w-full sm:w-auto px-8 py-3.5 rounded-xl font-serif text-base font-bold transition-all duration-300 flex items-center justify-center gap-3 mx-auto cursor-pointer"
        :class="isDrawing
          ? 'bg-stone-800 text-stone-500 border border-stone-700 cursor-not-allowed'
          : 'bg-gradient-to-r from-[#8B0000] via-[#A00000] to-[#5C0000] border-2 border-[#D4AF37] text-[#F3E5AB] shadow-[0_0_25px_rgba(212,175,55,0.4)] hover:shadow-[0_0_35px_rgba(212,175,55,0.7)] hover:scale-105'"
      >
        <Dices class="w-5 h-5 text-amber-300" :class="isDrawing ? 'animate-spin' : ''" />
        <span>{{ isDrawing ? '籤筒晃動中・誠心叩問...' : '誠心點擊搖籤筒求籤' }}</span>
      </button>
    </div>
  </div>
</template>
