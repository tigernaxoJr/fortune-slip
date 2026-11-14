<script setup lang="ts">
import { Sparkles } from 'lucide-vue-next'
import { ASSETS, cssLayer } from '../assets'

defineProps<{
  question: string
  answer: string
  isInterpreting: boolean
  hasKey: boolean
  notice: string
}>()
const emit = defineEmits<{ (e: 'ask'): void }>()

const paperStyle = { '--talisman-asset': cssLayer(ASSETS.paperTalisman) }
</script>

<template>
  <aside class="paper-talisman rounded-[3px] overflow-hidden" :style="paperStyle">
    <!-- cinnabar border like a 符 -->
    <div class="absolute inset-3 border-2 border-[#a82416]/70 pointer-events-none"></div>
    <div class="absolute inset-[18px] border border-[#a82416]/40 pointer-events-none"></div>

    <div class="relative px-7 sm:px-9 pt-9 pb-8">
      <!-- 敕令 header -->
      <div class="flex flex-col items-center">
        <div class="seal seal-solid text-xl px-2 py-1.5 !rotate-0">
          <span class="writing-vertical tracking-[0.15em]">敕令</span>
        </div>
        <p class="eyebrow !text-[#8a2a12] mt-4">Oracle of the Heavens</p>
        <h4 class="font-brush font-bold text-3xl text-[#3a1308] mt-1 tracking-[0.2em] pl-[0.2em]">神諭靈析</h4>
      </div>

      <div class="my-6 h-px bg-[#a82416]/35"></div>

      <!-- 疏文 -->
      <div>
        <p class="font-serif text-[11px] tracking-[0.35em] text-[#8a2a12]/80">信眾所稟疏文</p>
        <p class="font-brush text-[17px] leading-8 text-[#3a1308] mt-2">
          「{{ question.trim() || '信眾心中默禱，求賜總體吉凶趨勢與行事指引' }}」
        </p>
      </div>

      <div class="my-6 h-px bg-[#a82416]/35"></div>

      <!-- answer -->
      <div v-if="answer" class="text-[14.5px] leading-[1.95] text-[#2e1006] whitespace-pre-wrap rise-in">{{ answer }}</div>

      <div v-else-if="isInterpreting" class="py-6 flex flex-col items-center gap-4 text-[#8a2a12]">
        <div class="flex gap-2">
          <span v-for="i in 3" :key="i" class="w-2 h-2 rounded-full bg-[#a82416] animate-breathe" :style="{ animationDelay: `${i * 0.3}s`, animationDuration: '1.4s' }"></span>
        </div>
        <p class="font-brush text-lg tracking-[0.3em]">凝神叩問・恭候聖意</p>
      </div>

      <div v-else class="text-[13.5px] text-[#4a1c0c] leading-7 space-y-4">
        <p>籤詩如鏡，映照當下心念。AI 將以你所稟疏文對照籤詩典故，代為推演聖意，給出趨勢判斷與行動指引。</p>
        <ol class="space-y-2 font-serif">
          <li class="flex items-baseline gap-3"><span class="text-[#a82416] font-bold">壹</span>明辨因果趨勢</li>
          <li class="flex items-baseline gap-3"><span class="text-[#a82416] font-bold">貳</span>對照當下處境</li>
          <li class="flex items-baseline gap-3"><span class="text-[#a82416] font-bold">參</span>賜予趨避與行動方針</li>
        </ol>
      </div>

      <button
        type="button"
        @click="emit('ask')"
        :disabled="isInterpreting"
        class="btn-cinnabar w-full mt-8 text-sm"
      >
        <Sparkles class="w-4 h-4" :class="isInterpreting ? 'animate-spin' : ''" />
        <span>{{ isInterpreting ? '正在凝神領受聖意…' : answer ? '重新叩問聖意' : hasKey ? '請示神諭靈析' : '設定 API 金鑰以請示' }}</span>
      </button>

      <p v-if="notice" class="mt-4 text-xs text-[#7a1408] bg-[#a82416]/10 border border-[#a82416]/40 px-3 py-2 rounded-[2px]">
        {{ notice }}
      </p>
    </div>
  </aside>
</template>
