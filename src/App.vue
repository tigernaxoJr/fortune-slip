<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'
import { deckById, decks, drawFrom, type DeckId, type OracleVerse } from './data/decks'
import { defaultCspPresets, fetchModels, formatStories, interpretOracle, type CspPreset } from './services/ai'

import ParticleCanvas from './components/ParticleCanvas.vue'
import TempleHeader from './components/TempleHeader.vue'
import BlessingSystem from './components/BlessingSystem.vue'
import FortuneStickCylinder from './components/FortuneStickCylinder.vue'

import {
  Sparkles,
  BookOpen,
  Compass,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  Settings,
  X,
  ExternalLink,
  Bot
} from 'lucide-vue-next'

const currentStep = ref<1 | 2 | 3 | 4>(1)
const maxStepReached = ref<1 | 2 | 3 | 4>(1)
const selectedId = ref<DeckId | null>(null)
const question = ref('')
const result = ref<OracleVerse | null>(null)
const resultSection = ref<HTMLElement>()
const isSettingsOpen = ref(false)
const isDrawing = ref(false)
const isInterpreting = ref(false)
const notice = ref('')
const aiAnswer = ref('')
const enableAiInterpretation = ref(true)
const apiKey = ref(localStorage.getItem('oracle-api-key') || '')
const baseUrl = ref(localStorage.getItem('oracle-base-url') || 'https://generativelanguage.googleapis.com/v1beta/openai')
const model = ref(localStorage.getItem('oracle-model') || 'models/gemma-4-26b-a4b-it')
const activeMobileTab = ref<'scroll' | 'ai'>('scroll')
const activeMainTab = ref<'oracle' | 'blessing'>('oracle')

const fetchedModels = ref<string[]>([])
const isFetchingModels = ref(false)
const modelNotice = ref('')

const selectedDeck = computed(() => deckById(selectedId.value ?? 'jiazi'))
const formattedVerseStories = computed(() => formatStories(result.value?.stories))
const showAiPanel = computed(() => enableAiInterpretation.value)

const steps = [
  { num: 1, symbol: '壹', label: '擇聖籤' },
  { num: 2, symbol: '貳', label: '稟心愿' },
  { num: 3, symbol: '參', label: '搖靈籤' },
  { num: 4, symbol: '肆', label: '解佛意' },
] as const

const selectedPresetId = computed(() => {
  const match = defaultCspPresets.find(
    (p) => p.baseUrl.toLowerCase() === baseUrl.value.trim().toLowerCase(),
  )
  return match ? match.id : 'custom'
})

const presetModelsMap: Record<string, string[]> = {
  google: ['models/gemma-4-26b-a4b-it', 'models/gemma-4-31b-it', 'gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-pro'],
  openai: ['gpt-4o-mini', 'gpt-4o', 'gpt-4-turbo', 'gpt-3.5-turbo', 'o1-mini', 'o3-mini'],
  deepseek: ['deepseek-chat', 'deepseek-coder', 'deepseek-reasoner'],
}

const availableModels = computed(() => {
  if (fetchedModels.value.length > 0) {
    return fetchedModels.value
  }
  return presetModelsMap[selectedPresetId.value] || []
})

function isStepDisabled(stepNum: number) {
  if (stepNum === 1) return false
  if (stepNum === 2) return !selectedId.value || maxStepReached.value < 2
  if (stepNum === 3) return maxStepReached.value < 3
  if (stepNum === 4) return !result.value || maxStepReached.value < 4
  return true
}

function chooseDeck(id: DeckId) {
  selectedId.value = id
  result.value = null
  aiAnswer.value = ''
  notice.value = ''
  activeMobileTab.value = 'scroll'
  maxStepReached.value = Math.max(maxStepReached.value, 2) as 1 | 2 | 3 | 4
  goToStep(2)
}

function goToStep(step: 1 | 2 | 3 | 4) {
  if (isStepDisabled(step)) return
  if (step === 3 && enableAiInterpretation.value && question.value.trim().length < 2) {
    notice.value = '您已開啟 AI 靈析，請填寫稟告疏文；若無撰寫文字，請關閉 AI 靈析即可切換為傳統參拜模式。'
    return
  }
  notice.value = ''
  currentStep.value = step
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function nextFromStep1() {
  if (!selectedId.value) {
    notice.value = '請先點選欲參拜求取之諸佛聖籤庫。'
    return
  }
  maxStepReached.value = Math.max(maxStepReached.value, 2) as 1 | 2 | 3 | 4
  goToStep(2)
}

function nextFromStep2() {
  if (enableAiInterpretation.value && question.value.trim().length < 2) {
    notice.value = '您已開啟 AI 靈析，請填寫稟告疏文；若無撰寫文字，請關閉 AI 靈析即可切換為傳統參拜模式。'
    return
  }
  notice.value = ''
  maxStepReached.value = Math.max(maxStepReached.value, 3) as 1 | 2 | 3 | 4
  goToStep(3)
}

async function performRitualAndDraw() {
  notice.value = ''
  aiAnswer.value = ''
  result.value = null
  isDrawing.value = true
  activeMobileTab.value = 'scroll'
  await new Promise((resolve) => window.setTimeout(resolve, 3000))
  result.value = drawFrom(selectedDeck.value)
  isDrawing.value = false
  maxStepReached.value = 4
  currentStep.value = 4
  await nextTick()
  resultSection.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function resetRitual() {
  result.value = null
  aiAnswer.value = ''
  notice.value = ''
  selectedId.value = null
  question.value = ''
  activeMobileTab.value = 'scroll'
  maxStepReached.value = 1
  currentStep.value = 1
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function applyPreset(preset: CspPreset) {
  baseUrl.value = preset.baseUrl
  model.value = preset.defaultModel
  fetchedModels.value = []
  modelNotice.value = ''
}

function selectCustomPreset() {
  fetchedModels.value = []
  modelNotice.value = '已切換至自訂網址模式，可自由填寫相容 OpenAI 的 Base URL 與模型名稱'
}

async function loadModels() {
  if (!apiKey.value.trim()) {
    modelNotice.value = '請先填寫 API Key 再讀取模型列表'
    return
  }
  modelNotice.value = ''
  isFetchingModels.value = true
  try {
    const list = await fetchModels({ apiKey: apiKey.value, baseUrl: baseUrl.value })
    fetchedModels.value = list
    if (list.length > 0) {
      if (selectedPresetId.value === 'google') {
        const preferredGemma26b = list.find((m) => m === 'models/gemma-4-26b-a4b-it' || m === 'gemma-4-26b-a4b-it')
        const preferredGemma31b = list.find((m) => m === 'models/gemma-4-31b-it' || m === 'gemma-4-31b-it')
        if (preferredGemma26b) {
          model.value = preferredGemma26b
        } else if (preferredGemma31b) {
          model.value = preferredGemma31b
        } else if (!list.includes(model.value)) {
          model.value = list[0]
        }
      } else if (!list.includes(model.value)) {
        model.value = list[0]
      }
    }
    modelNotice.value = `已成功讀取 ${list.length} 個可用模型`
  } catch (err) {
    modelNotice.value = err instanceof Error ? err.message : '讀取模型失敗'
  } finally {
    isFetchingModels.value = false
  }
}

function openSettings() {
  isSettingsOpen.value = true
}

function saveSettings() {
  localStorage.setItem('oracle-api-key', apiKey.value.trim())
  localStorage.setItem('oracle-base-url', baseUrl.value.trim())
  localStorage.setItem('oracle-model', model.value.trim())
  isSettingsOpen.value = false
}

function clearSettings() {
  apiKey.value = ''
  localStorage.removeItem('oracle-api-key')
  modelNotice.value = '已清除 API 金鑰'
}

async function askAi() {
  if (!result.value) return
  if (!apiKey.value.trim()) {
    openSettings()
    return
  }

  notice.value = ''
  aiAnswer.value = ''
  isInterpreting.value = true
  try {
    const qText = question.value.trim() || '信士心中默禱，求賜總體吉凶趨勢與行事指引'
    aiAnswer.value = await interpretOracle(
      { apiKey: apiKey.value, baseUrl: baseUrl.value, model: model.value },
      qText,
      selectedDeck.value,
      result.value,
    )
  } catch (error) {
    notice.value = error instanceof Error ? error.message : '解籤時發生未預期的錯誤'
  } finally {
    isInterpreting.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-[#121212] text-[#F3E5AB] relative overflow-hidden font-sans">
    <!-- HTML5 Canvas Background Smoke Particle Layer -->
    <ParticleCanvas />

    <!-- Temple Topbar Navigation -->
    <TempleHeader
      :current-step="currentStep"
      :max-step-reached="maxStepReached"
      :is-step-disabled="isStepDisabled"
      :steps="steps"
      :active-main-tab="activeMainTab"
      @go-step="goToStep"
      @open-settings="openSettings"
      @reset="resetRitual"
      @switch-tab="(tab) => activeMainTab = tab"
    />

    <!-- Main Container -->
    <main class="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
      
      <!-- Tab B: Standalone Blessing System View -->
      <div v-if="activeMainTab === 'blessing'" class="transition-all duration-500 my-4">
        <BlessingSystem />
      </div>

      <!-- Tab A: Oracle Flow (Step 1 to Step 4) -->
      <div v-else>
        <!-- Sleek Compact Hero Section -->
        <div class="text-center max-w-2xl mx-auto my-3 md:my-4">
          <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#D4AF37]/30 bg-[#8B0000]/20 text-xs font-serif text-[#D4AF37] tracking-wider backdrop-blur-sm">
            <Sparkles class="w-3.5 h-3.5 text-amber-300" />
            <span>奉請傳統六大名剎聖籤 ｜ 誠心凝神默禱 領受 AI 智慧開示</span>
          </div>
        </div>

        <!-- Step 1: Choose Deck (擇聖籤) -->
        <Transition name="fade" mode="out-in">
          <section v-if="currentStep === 1" class="my-4">
            <div class="text-center mb-6">
              <span class="text-xs uppercase tracking-widest text-[#D4AF37] font-semibold">STEP 1</span>
              <h3 class="text-2xl md:text-3xl font-bold font-serif text-[#F3E5AB] mt-1">
                步驟 壹 ・ 選擇聖籤庫
              </h3>
            </div>

            <!-- Deck Cards Grid -->
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 my-8">
              <div
                v-for="deck in decks"
                :key="deck.id"
                @click="chooseDeck(deck.id)"
                class="glass-temple-card rounded-2xl p-6 cursor-pointer relative overflow-hidden flex flex-col justify-between group"
                :class="selectedId === deck.id ? 'glass-temple-card-active' : ''"
              >
                <div>
                  <div class="flex items-center justify-between mb-4">
                    <span class="px-2.5 py-1 rounded bg-[#8B0000] text-[#F3E5AB] border border-[#D4AF37]/50 text-xs font-serif font-bold">
                      {{ deck.name }}
                    </span>
                    <span class="text-xs text-amber-300 font-sans bg-black/40 px-2 py-1 rounded border border-amber-500/20">
                      {{ deck.count }} 籤
                    </span>
                  </div>

                  <h4 class="text-xl font-bold font-serif text-[#F3E5AB] mb-1 group-hover:text-amber-300 transition-colors">
                    {{ deck.name }}
                  </h4>
                  <p class="text-xs text-stone-400 font-sans mb-3">
                    來源：{{ deck.origin }}
                  </p>

                  <p class="text-xs text-stone-300/90 leading-relaxed font-sans bg-stone-900/60 p-3 rounded-xl border border-stone-800">
                    主求指引：<strong class="text-amber-200">{{ deck.guidance }}</strong>
                  </p>
                </div>

                <div class="mt-6 flex items-center justify-between pt-3 border-t border-[#D4AF37]/20 text-xs">
                  <span class="text-stone-400">點擊點選聖籤</span>
                  <span class="text-[#D4AF37] font-bold group-hover:translate-x-1 transition-transform flex items-center gap-1">
                    參拜求籤 ➔
                  </span>
                </div>
              </div>
            </div>

            <div v-if="notice" class="text-center p-3 rounded-xl bg-red-950/80 border border-red-500/40 text-red-200 text-sm max-w-md mx-auto my-4">
              {{ notice }}
            </div>

            <div class="text-center my-6">
              <button
                @click="nextFromStep1"
                class="px-8 py-3.5 rounded-xl font-serif text-base font-bold bg-gradient-to-r from-[#8B0000] to-[#5C0000] border border-[#D4AF37] text-[#F3E5AB] hover:from-[#A00000] shadow-[0_0_20px_rgba(139,0,0,0.5)] transition-all cursor-pointer inline-flex items-center gap-2"
              >
                <span>下一步：撰寫稟告疏文</span>
                <ArrowRight class="w-4 h-4" />
              </button>
            </div>
          </section>

          <!-- Step 2: Write Question / AI Prayer Document (稟心愿) -->
          <section v-else-if="currentStep === 2" class="my-10 max-w-3xl mx-auto">
            <div class="text-center mb-6">
              <span class="text-xs uppercase tracking-widest text-[#D4AF37] font-semibold">STEP 2</span>
              <h3 class="text-2xl md:text-3xl font-bold font-serif text-[#F3E5AB] mt-1">
                步驟 貳 ・ 淨心稟告疏文
              </h3>
            </div>

            <!-- AI Toggle Glassmorphic Card -->
            <div class="glass-temple-card rounded-2xl p-6 mb-6 border border-[#D4AF37]/40">
              <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#D4AF37]/20">
                <label class="flex items-center gap-3 cursor-pointer">
                  <input
                    v-model="enableAiInterpretation"
                    type="checkbox"
                    class="w-5 h-5 accent-[#8B0000] rounded cursor-pointer"
                  />
                  <span class="text-lg font-serif font-bold text-[#F3E5AB] flex items-center gap-2">
                    <Sparkles class="w-5 h-5 text-amber-300" />
                    啟用 AI 佛法靈析開示
                  </span>
                </label>

                <button
                  v-if="enableAiInterpretation"
                  @click="openSettings"
                  class="px-3 py-1.5 rounded-lg border border-[#D4AF37]/40 text-xs text-amber-200 bg-stone-900/80 hover:bg-[#8B0000]/40 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Settings class="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span>{{ apiKey ? 'API 已連線' : '設定 API 金鑰' }}</span>
                </button>
              </div>

              <p class="text-xs text-stone-300 font-sans mt-3 leading-relaxed">
                {{ enableAiInterpretation 
                  ? '已開啟 AI 靈析：請於下方寫下心中困惑或所求事項，AI 將針對您的具體事項解析籤詩。' 
                  : '已關閉 AI 靈析：切換為傳統默禱參拜模式，無須輸入文字，直接搖籤求取典故聖籤。' }}
              </p>
            </div>

            <!-- Scroll Paper Textarea -->
            <div v-if="enableAiInterpretation" class="glass-temple-card rounded-2xl p-6 border border-[#D4AF37]/40 relative">
              <div class="flex items-center justify-between mb-3 text-xs text-amber-200/80 font-serif">
                <span>【 信士祈福稟告疏文 】</span>
                <span>奉請籤庫：{{ selectedDeck.name }}</span>
              </div>

              <textarea
                v-model="question"
                maxlength="300"
                rows="5"
                placeholder="信士/信女誠心祈求神佛指點迷津：例如弟子近日面臨轉職抉擇，懇求神佛賜籤指引方向..."
                class="w-full bg-[#121212]/90 border border-[#D4AF37]/30 rounded-xl p-4 text-sm text-[#F3E5AB] placeholder-stone-500 focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] font-sans leading-relaxed transition-all resize-none"
              ></textarea>

              <div class="flex justify-between items-center mt-2 text-xs text-stone-400">
                <span>提示：誠心寫下真實困惑，所獲得之開示將更貼切。</span>
                <span>{{ question.length }} / 300</span>
              </div>
            </div>

            <div v-if="notice" class="text-center p-3 rounded-xl bg-red-950/80 border border-red-500/40 text-red-200 text-sm my-4">
              {{ notice }}
            </div>

            <!-- Action Buttons -->
            <div class="flex items-center justify-between gap-4 mt-8">
              <button
                @click="goToStep(1)"
                class="px-5 py-3 rounded-xl text-sm font-serif border border-stone-700 text-stone-300 hover:border-stone-500 transition-all flex items-center gap-2 cursor-pointer"
              >
                <ArrowLeft class="w-4 h-4" />
                <span>重擇聖籤庫</span>
              </button>

              <button
                @click="nextFromStep2"
                class="px-8 py-3.5 rounded-xl font-serif text-base font-bold bg-gradient-to-r from-[#8B0000] to-[#5C0000] border border-[#D4AF37] text-[#F3E5AB] hover:from-[#A00000] shadow-[0_0_20px_rgba(139,0,0,0.5)] transition-all cursor-pointer inline-flex items-center gap-2"
              >
                <span>下一步：誠心搖籤</span>
                <ArrowRight class="w-4 h-4" />
              </button>
            </div>
          </section>

          <!-- Step 3: Shake Fortune Stick Cylinder (搖靈籤) -->
          <section v-else-if="currentStep === 3" class="my-10">
            <FortuneStickCylinder
              :is-drawing="isDrawing"
              :selected-deck-name="selectedDeck.name"
              :selected-deck-count="selectedDeck.count"
              @draw="performRitualAndDraw"
            />

            <div class="text-center my-6">
              <button
                @click="goToStep(2)"
                class="px-5 py-2.5 rounded-xl text-xs font-serif border border-stone-700 text-stone-400 hover:text-stone-200 transition-all cursor-pointer"
              >
                ← 修改稟告疏文
              </button>
            </div>
          </section>

          <!-- Step 4: Oracle Slip & AI Interpretation (解佛意) -->
          <section v-else-if="currentStep === 4 && result" ref="resultSection" class="my-10">
            
            <!-- Result Section Header -->
            <div class="flex flex-col sm:flex-row items-center justify-between gap-4 pb-6 mb-8 border-b border-[#D4AF37]/30">
              <div>
                <span class="text-xs uppercase tracking-widest text-[#D4AF37] font-semibold">DIVINE ORACLE VERSE</span>
                <h3 class="text-3xl md:text-4xl font-bold font-serif text-[#F3E5AB] mt-0.5">
                  諸佛聖籤感應開示
                </h3>
              </div>

              <button
                @click="resetRitual"
                class="px-5 py-2.5 rounded-xl border border-[#D4AF37]/40 bg-[#8B0000]/60 text-[#F3E5AB] text-sm font-serif hover:bg-[#8B0000] transition-all flex items-center gap-2 cursor-pointer shadow-lg"
              >
                <RotateCcw class="w-4 h-4 text-amber-300" />
                <span>重新參拜求籤</span>
              </button>
            </div>

            <!-- Layout Grid: Fortune Slip (Left) & AI Interpretation (Right) -->
            <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              <!-- Left: Authentic Fortune Paper Slip (黃絹聖籤) -->
              <div class="lg:col-span-7 glass-temple-card rounded-2xl p-6 md:p-8 border-2 border-[#D4AF37]/50 shadow-2xl relative overflow-hidden">
                <!-- Watermark Background -->
                <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-stone-800/10 font-serif text-9xl font-black pointer-events-none select-none">
                  聖籤
                </div>

                <!-- Top Meta -->
                <div class="flex items-center justify-between text-xs text-amber-200/80 font-serif pb-4 border-b border-[#D4AF37]/20">
                  <span>{{ selectedDeck.name }}</span>
                  <span>{{ selectedDeck.origin }}</span>
                </div>

                <!-- Verse Number & Rating Stamp -->
                <div class="my-6 text-center">
                  <div class="inline-flex items-center gap-3 px-6 py-2 rounded-xl bg-[#8B0000]/80 border border-[#D4AF37] shadow-[0_0_15px_rgba(139,0,0,0.6)]">
                    <span class="text-amber-200 font-serif text-lg font-bold">
                      第 {{ result.number }} 籤
                    </span>
                    <span v-if="result.fortune" class="px-2.5 py-0.5 rounded bg-[#D4AF37] text-red-950 font-serif text-xs font-black">
                      {{ result.fortune }}
                    </span>
                  </div>

                  <!-- Ganzhi & Element -->
                  <div v-if="result.ganzhi || result.element" class="mt-3 flex justify-center gap-2 text-xs font-serif">
                    <span v-if="result.ganzhi" class="text-amber-300">【{{ result.ganzhi }}】</span>
                    <span v-if="result.element" class="text-stone-300">五行：{{ result.element }}</span>
                  </div>
                </div>

                <!-- Verse Poem Lines -->
                <div class="my-8 py-6 px-4 bg-[#121212]/90 rounded-xl border border-[#D4AF37]/30 text-center font-serif">
                  <div class="space-y-3 text-lg md:text-xl text-[#F3E5AB] font-bold tracking-widest">
                    <p v-for="line in result.lines" :key="line" class="leading-relaxed">
                      {{ line }}
                    </p>
                  </div>
                </div>

                <!-- Stories (典故) -->
                <div v-if="formattedVerseStories.length" class="my-6 pt-4 border-t border-[#D4AF37]/20">
                  <h4 class="text-sm font-serif font-bold text-[#D4AF37] flex items-center gap-2 mb-3">
                    <BookOpen class="w-4 h-4 text-amber-400" />
                    <span>籤詩故事典故</span>
                  </h4>
                  <div class="space-y-3">
                    <div
                      v-for="(story, idx) in formattedVerseStories"
                      :key="idx"
                      class="bg-stone-900/60 p-3.5 rounded-xl border border-stone-800 text-xs leading-relaxed"
                    >
                      <strong class="text-amber-200 font-serif block mb-1">
                        {{ story.title || `典故 ${idx + 1}` }}
                      </strong>
                      <p v-for="(line, lIdx) in story.content" :key="lIdx" class="text-stone-300 font-sans">
                        {{ line }}
                      </p>
                    </div>
                  </div>
                </div>

                <!-- Attributes Guide (諸事指引) -->
                <div v-if="result.attributes && Object.keys(result.attributes).length" class="my-6 pt-4 border-t border-[#D4AF37]/20">
                  <h4 class="text-sm font-serif font-bold text-[#D4AF37] flex items-center gap-2 mb-3">
                    <Compass class="w-4 h-4 text-amber-400" />
                    <span>諸事運勢指引</span>
                  </h4>
                  <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    <div
                      v-for="(val, key) in result.attributes"
                      :key="key"
                      class="bg-stone-900/80 p-2.5 rounded-lg border border-stone-800 text-xs flex justify-between items-center"
                    >
                      <span class="text-stone-400 font-serif">{{ key }}</span>
                      <span class="text-amber-200 font-medium">{{ val }}</span>
                    </div>
                  </div>
                </div>

                <!-- Traditional Explanations (解曰) -->
                <div v-if="result.explanations && result.explanations.length" class="my-6 pt-4 border-t border-[#D4AF37]/20">
                  <h4 class="text-sm font-serif font-bold text-[#D4AF37] flex items-center gap-2 mb-2">
                    <span>傳統解曰</span>
                  </h4>
                  <div class="text-xs text-stone-300 font-sans leading-relaxed space-y-1">
                    <p v-for="(exp, idx) in result.explanations" :key="idx">{{ exp }}</p>
                  </div>
                </div>

                <div class="mt-6 pt-4 border-t border-[#D4AF37]/20 text-center text-[11px] text-stone-500 font-serif">
                  先觀其因，再問其果；吉中藏戒，凶中有路。
                </div>
              </div>

              <!-- Right: AI Interpretation Panel (AI 靈析) -->
              <div v-if="showAiPanel" class="lg:col-span-5 glass-temple-card rounded-2xl p-6 md:p-8 border border-[#D4AF37]/40 shadow-2xl">
                <div class="flex items-center gap-2 text-xs text-[#D4AF37] font-semibold tracking-widest uppercase mb-2">
                  <Bot class="w-4 h-4 text-amber-300" />
                  <span>AI SACRED WISDOM</span>
                </div>

                <h4 class="text-2xl font-bold font-serif text-[#F3E5AB] mb-4">
                  AI 佛法靈析開示
                </h4>

                <!-- User Prayer Note -->
                <div class="bg-stone-900/80 p-3.5 rounded-xl border border-stone-800 text-xs text-amber-200/90 font-serif mb-6">
                  <span class="text-stone-400 block text-[10px] mb-1">信士所稟疏文：</span>
                  「{{ question.trim() || '信士心中默禱，求賜總體吉凶趨勢與行事指引' }}」
                </div>

                <!-- AI Output Content -->
                <div v-if="aiAnswer" class="my-6 bg-[#121212]/90 p-5 rounded-xl border border-[#D4AF37]/30 text-sm text-[#F3E5AB] leading-relaxed whitespace-pre-wrap font-sans space-y-3">
                  {{ aiAnswer }}
                </div>

                <div v-else class="my-6 text-xs text-stone-300 font-sans leading-relaxed space-y-3">
                  <p>籤詩如鏡，映照當下心念。AI 將結合您所稟告之疏文與聖籤典故，為您提供深度開示與破局行動建議。</p>
                  <ul class="space-y-2 text-stone-400">
                    <li class="flex items-center gap-2"><span class="text-amber-400 font-bold">01.</span> 明辨因果趨勢</li>
                    <li class="flex items-center gap-2"><span class="text-amber-400 font-bold">02.</span> 對照當下處境</li>
                    <li class="flex items-center gap-2"><span class="text-amber-400 font-bold">03.</span> 賜予避坑與行動方針</li>
                  </ul>
                </div>

                <button
                  @click="askAi"
                  :disabled="isInterpreting"
                  class="w-full py-3.5 rounded-xl font-serif text-sm font-bold transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer"
                  :class="isInterpreting
                    ? 'bg-stone-800 text-stone-500 border border-stone-700 cursor-not-allowed'
                    : 'bg-gradient-to-r from-[#8B0000] to-[#5C0000] border border-[#D4AF37] text-[#F3E5AB] hover:from-[#A00000] shadow-[0_0_20px_rgba(139,0,0,0.5)]'"
                >
                  <Sparkles class="w-4 h-4 text-amber-300" :class="isInterpreting ? 'animate-spin' : ''" />
                  <span>{{ isInterpreting ? '正在凝神領受聖意…' : aiAnswer ? '重新領受 AI 靈析開示' : apiKey ? '請 AI 領受聖意開示' : '設定 API 金鑰領受開示' }}</span>
                </button>

                <p v-if="notice" class="mt-4 text-xs text-red-300 bg-red-950/60 p-2.5 rounded-lg border border-red-800">
                  {{ notice }}
                </p>
              </div>
            </div>
          </section>
        </Transition>
      </div>
    </main>

    <!-- Footer Section -->
    <footer class="relative z-10 border-t border-[#D4AF37]/20 py-8 bg-[#121212]/95 mt-16 text-center text-xs text-stone-400 font-serif">
      <div class="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div class="flex items-center gap-2">
          <div class="w-6 h-6 border border-[#D4AF37] bg-[#8B0000] text-[#F3E5AB] flex items-center justify-center font-bold text-xs">
            籤
          </div>
          <span class="text-stone-300 font-bold">靈籤閣</span>
          <span>× 傳統求籤與 AI 靈析</span>
        </div>

        <p class="text-stone-500">
          諸佛聖意 × 心靈寄託 ｜ 誠心參拜
        </p>

        <a
          href="http://www.chance.org.tw/%E7%B1%A4%E8%A9%A9%E9%9B%86/%E5%85%AD%E5%8D%81%E7%94%B2%E5%AD%90%E7%B1%A4/%E7%B1%A4%E8%A9%A9%E7%B6%B2%E2%80%A7%E5%85%AD%E5%8D%81%E7%94%B2%E5%AD%90%E7%B1%A4.htm"
          target="_blank"
          rel="noreferrer"
          class="text-amber-400/80 hover:text-amber-300 flex items-center gap-1 transition-colors"
        >
          <span>籤文典故參考資料</span>
          <ExternalLink class="w-3 h-3" />
        </a>
      </div>
    </footer>

    <!-- API Settings Modal Overlay -->
    <Teleport to="body">
      <Transition name="fade">
        <div
          v-if="isSettingsOpen"
          class="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
        >
          <!-- Backdrop -->
          <div
            class="fixed inset-0 bg-black/80 backdrop-blur-sm"
            @click="isSettingsOpen = false"
          ></div>

          <!-- Modal Window -->
          <div
            class="relative z-10 bg-[#1A1A1A] text-[#F3E5AB] border-2 border-[#D4AF37] rounded-2xl p-6 md:p-8 max-w-lg w-full shadow-2xl overflow-y-auto max-h-[90vh]"
          >
            <form @submit.prevent="saveSettings">
              <div class="flex items-center justify-between pb-4 border-b border-[#D4AF37]/30 mb-6">
                <h3 class="text-xl font-bold font-serif text-[#F3E5AB] flex items-center gap-2">
                  <Settings class="w-5 h-5 text-[#D4AF37]" />
                  <span>AI 靈析服務設定</span>
                </h3>
                <button
                  type="button"
                  @click="isSettingsOpen = false"
                  class="text-stone-400 hover:text-stone-200 p-1 cursor-pointer"
                >
                  <X class="w-5 h-5" />
                </button>
              </div>

              <p class="text-xs text-stone-300 font-sans mb-4 leading-relaxed">
                支援 OpenAI 相容協定 API 介面。API 金鑰將安全存儲於您本地瀏覽器 (localStorage)。
              </p>

              <!-- Provider Presets -->
              <div class="mb-4">
                <label class="block text-xs font-serif text-amber-200 mb-2">選擇 AI 服務商預設：</label>
                <div class="grid grid-cols-4 gap-1.5">
                  <button
                    v-for="preset in defaultCspPresets"
                    :key="preset.id"
                    type="button"
                    @click="applyPreset(preset)"
                    class="px-2 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer text-center whitespace-nowrap overflow-hidden text-ellipsis"
                    :class="selectedPresetId === preset.id
                      ? 'bg-[#8B0000] text-[#F3E5AB] border-[#D4AF37]'
                      : 'bg-stone-900 text-stone-400 border-stone-800 hover:border-stone-600'"
                  >
                    {{ preset.name }}
                  </button>

                  <button
                    type="button"
                    @click="selectCustomPreset"
                    class="px-2 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer text-center whitespace-nowrap"
                    :class="selectedPresetId === 'custom'
                      ? 'bg-[#8B0000] text-[#F3E5AB] border-[#D4AF37]'
                      : 'bg-stone-900 text-stone-400 border-stone-800 hover:border-stone-600'"
                  >
                    自訂網址
                  </button>
                </div>
              </div>

              <div v-if="selectedPresetId === 'google'" class="bg-amber-950/40 p-3 rounded-xl border border-amber-500/30 text-xs text-amber-200 mb-4">
                💡 <strong>Google Gemini 免費金鑰：</strong>
                前往 <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" class="underline text-amber-300">Google AI Studio ↗</a> 即可免費申請。
              </div>

              <!-- API Key Input -->
              <div class="mb-4">
                <div class="flex justify-between items-center mb-1 text-xs text-amber-200 font-serif">
                  <label>API Key 金鑰：</label>
                  <button
                    v-if="apiKey"
                    type="button"
                    @click="clearSettings"
                    class="text-red-400 hover:underline text-[11px] cursor-pointer"
                  >
                    清除金鑰 🗑️
                  </button>
                </div>
                <input
                  v-model="apiKey"
                  type="password"
                  placeholder="請輸入 API 金鑰 (sk-... / AIzaSy...)"
                  required
                  class="w-full bg-[#121212] border border-[#D4AF37]/40 rounded-xl px-3.5 py-2.5 text-xs text-[#F3E5AB] focus:outline-none focus:border-[#D4AF37]"
                />
              </div>

              <!-- Base URL Input -->
              <div class="mb-4">
                <label class="block text-xs font-serif text-amber-200 mb-1">Base URL (伺服器網址)：</label>
                <input
                  v-model="baseUrl"
                  type="url"
                  placeholder="https://api.openai.com/v1"
                  required
                  class="w-full bg-[#121212] border border-[#D4AF37]/40 rounded-xl px-3.5 py-2.5 text-xs text-[#F3E5AB] focus:outline-none focus:border-[#D4AF37]"
                />
              </div>

              <!-- Model Select / Input -->
              <div class="mb-6">
                <div class="flex justify-between items-center mb-1 text-xs text-amber-200 font-serif">
                  <label>選擇/輸入模型：</label>
                  <button
                    type="button"
                    @click="loadModels"
                    :disabled="isFetchingModels || !apiKey.trim()"
                    class="text-amber-400 hover:underline text-[11px] disabled:text-stone-600 cursor-pointer"
                  >
                    {{ isFetchingModels ? '讀取中…' : '連線讀取模型列表 ↻' }}
                  </button>
                </div>
                <select
                  v-if="availableModels.length"
                  v-model="model"
                  class="w-full bg-[#121212] border border-[#D4AF37]/40 rounded-xl px-3.5 py-2.5 text-xs text-[#F3E5AB] focus:outline-none focus:border-[#D4AF37]"
                >
                  <option v-for="m in availableModels" :key="m" :value="m">{{ m }}</option>
                </select>
                <input
                  v-else
                  v-model="model"
                  type="text"
                  placeholder="models/gemma-4-26b-a4b-it / gpt-4o-mini"
                  required
                  class="w-full bg-[#121212] border border-[#D4AF37]/40 rounded-xl px-3.5 py-2.5 text-xs text-[#F3E5AB] focus:outline-none focus:border-[#D4AF37]"
                />

                <p v-if="modelNotice" class="text-[11px] mt-1.5" :class="modelNotice.includes('失敗') ? 'text-red-400' : 'text-amber-300'">
                  {{ modelNotice }}
                </p>
              </div>

              <!-- Save Button -->
              <button
                type="submit"
                class="w-full py-3 rounded-xl bg-gradient-to-r from-[#8B0000] to-[#5C0000] border border-[#D4AF37] text-[#F3E5AB] text-sm font-serif font-bold hover:from-[#A00000] shadow-lg transition-all cursor-pointer"
              >
                儲存設定並返回求籤
              </button>
            </form>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.35s ease, transform 0.35s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(10px);
}
</style>
