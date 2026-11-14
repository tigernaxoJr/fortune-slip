<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'
import { deckById, decks, drawFrom, type DeckId, type OracleVerse } from './data/decks'
import { defaultCspPresets, fetchModels, formatStories, interpretOracle, type CspPreset } from './services/ai'

import ParticleCanvas from './components/ParticleCanvas.vue'
import TempleHeader from './components/TempleHeader.vue'
import BlessingSystem from './components/BlessingSystem.vue'
import FortuneStickCylinder from './components/FortuneStickCylinder.vue'
import OracleSlip from './components/OracleSlip.vue'
import TalismanReading from './components/TalismanReading.vue'
import BigDipper from './components/BigDipper.vue'
import BaguaRing from './components/BaguaRing.vue'
import { ASSETS } from './assets'

import { ArrowRight, ArrowLeft, RotateCcw, Settings, X, ExternalLink, KeyRound, Trash2, RefreshCw } from 'lucide-vue-next'

const deckNumerals = ['壹', '貳', '參', '肆', '伍', '陸', '柒', '捌']
const hideBrokenImage = (e: Event) => ((e.target as HTMLElement).style.display = 'none')

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
  { num: 4, symbol: '肆', label: '解聖意' },
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
    notice.value = '已啟用神諭靈析，請先寫下疏文；若只想默禱求籤，可關閉神諭靈析。'
    return
  }
  notice.value = ''
  currentStep.value = step
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function nextFromStep2() {
  if (enableAiInterpretation.value && question.value.trim().length < 2) {
    notice.value = '已啟用神諭靈析，請先寫下疏文；若只想默禱求籤，可關閉神諭靈析。'
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

function switchTab(tab: 'oracle' | 'blessing') {
  activeMainTab.value = tab
  window.scrollTo({ top: 0, behavior: 'smooth' })
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
    const qText = question.value.trim() || '信眾心中默禱，求賜總體吉凶趨勢與行事指引'
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
  <div class="min-h-screen text-parchment relative overflow-x-clip font-sans">
    <!-- ambient layers -->
    <div class="fixed inset-0 z-0 pointer-events-none" aria-hidden="true">
      <div class="absolute inset-0 bg-[radial-gradient(120%_70%_at_50%_-10%,#2a1009_0%,#120b08_45%,#0c0907_100%)]"></div>
      <img
        :src="ASSETS.templeHall"
        alt=""
        @error="hideBrokenImage"
        class="absolute inset-0 w-full h-full object-cover opacity-[0.22] mix-blend-luminosity [mask-image:linear-gradient(180deg,#000_0%,rgba(0,0,0,.6)_55%,transparent_100%)]"
      />
      <div class="absolute inset-0 bg-[radial-gradient(80%_60%_at_50%_40%,transparent_0%,rgba(8,5,4,.85)_100%)]"></div>
    </div>
    <ParticleCanvas />

    <TempleHeader
      :current-step="currentStep"
      :max-step-reached="maxStepReached"
      :is-step-disabled="isStepDisabled"
      :steps="steps"
      :active-main-tab="activeMainTab"
      @go-step="goToStep"
      @open-settings="openSettings"
      @reset="resetRitual"
      @switch-tab="switchTab"
    />

    <main class="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-10">
      <Transition name="fade" mode="out-in">
        <div v-if="activeMainTab === 'blessing'" key="blessing" class="py-10">
          <BlessingSystem />
        </div>

        <div v-else key="oracle">
          <Transition name="fade" mode="out-in">
            <!-- ═════════ 壹 擇聖籤 ═════════ -->
            <section v-if="currentStep === 1" key="s1">
              <!-- hero -->
              <div class="relative pt-12 md:pt-20 pb-10 md:pb-14 text-center">
                <img
                  :src="ASSETS.altarHero"
                  alt=""
                  @error="hideBrokenImage"
                  class="absolute left-1/2 top-0 -translate-x-1/2 w-[min(1100px,140vw)] max-w-none opacity-40 pointer-events-none [mask-image:radial-gradient(55%_60%_at_50%_45%,#000_30%,transparent_100%)]"
                />
                <div class="relative mx-auto w-[min(360px,80vw)] opacity-80">
                  <BigDipper />
                </div>
                <p class="relative eyebrow mt-4 rise-in max-sm:!tracking-[0.18em]">Ask the Heavens ・ Receive the Verse</p>
                <h2
                  class="relative font-serif font-black text-gold-leaf mt-5 leading-[1.15] tracking-[0.18em] pl-[0.18em] text-[clamp(2.2rem,7vw,4.4rem)] rise-in"
                  style="animation-delay: 0.1s"
                >
                  <span class="inline-block">心有所問</span><span class="hidden sm:inline text-cinnabar-bright [-webkit-text-fill-color:currentColor] mx-[0.1em]">・</span><br class="sm:hidden" /><span class="inline-block">籤有所示</span>
                </h2>
                <p class="relative mt-5 max-w-xl mx-auto text-mist leading-8 tracking-[0.12em] text-[15px] rise-in" style="animation-delay: 0.2s">
                  焚一炷心香，擇一部聖籤。<br class="sm:hidden" />六部傳統籤詩，承宮廟百年香火。
                </p>
              </div>

              <div class="flex items-center gap-4 mb-8">
                <div class="flex-1 rule-gold"></div>
                <h3 class="font-serif text-lg tracking-[0.5em] pl-[0.5em] text-parchment">
                  <span class="text-cinnabar-bright">壹</span> 擇聖籤
                </h3>
                <div class="flex-1 rule-gold"></div>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                <button
                  v-for="(deck, idx) in decks"
                  :key="deck.id"
                  type="button"
                  @click="chooseDeck(deck.id)"
                  class="group lacquer lacquer-interactive corners text-left p-6 pt-7 overflow-hidden rise-in"
                  :class="selectedId === deck.id ? 'lacquer-selected' : ''"
                  :style="{ animationDelay: `${0.05 * idx}s` }"
                >
                  <span
                    class="absolute -right-3 -bottom-8 font-serif font-black text-[8.5rem] leading-none text-gold/[0.045] select-none pointer-events-none"
                    aria-hidden="true"
                  >{{ deck.count }}</span>

                  <div class="flex items-start justify-between">
                    <span class="seal seal-solid text-sm !rotate-0 !px-1.5 !py-1">{{ deckNumerals[idx] }}</span>
                    <span class="font-cinzel text-[10px] tracking-[0.3em] text-mist pt-1">{{ deck.count }} VERSES</span>
                  </div>

                  <h4 class="font-serif font-bold text-[1.35rem] text-parchment mt-5 tracking-[0.08em]">{{ deck.name }}</h4>
                  <p class="text-[12px] text-smoke mt-1.5 tracking-widest">{{ deck.origin }}</p>

                  <div class="mt-6 pt-4 border-t border-gold/15 flex items-center justify-between">
                    <span class="font-brush text-[15px] text-gold tracking-[0.2em]">{{ deck.guidance }}</span>
                    <ArrowRight class="w-4 h-4 text-gold/70 transition-transform duration-500 group-hover:translate-x-1" />
                  </div>
                </button>
              </div>

              <p v-if="notice" class="text-center text-sm text-[#f0a493] mt-6">{{ notice }}</p>
            </section>

            <!-- ═════════ 貳 稟心愿 ═════════ -->
            <section v-else-if="currentStep === 2" key="s2" class="max-w-2xl mx-auto pt-12 md:pt-16">
              <div class="text-center mb-10">
                <p class="eyebrow">Petition to the Deities</p>
                <h3 class="font-serif font-bold text-3xl md:text-4xl text-gold-leaf mt-3 tracking-[0.2em] pl-[0.2em]">稟告疏文</h3>
                <p class="text-sm text-mist mt-3 tracking-widest">奉請 ・ <span class="text-parchment">{{ selectedDeck.name }}</span></p>
              </div>

              <!-- AI toggle -->
              <div class="lacquer p-5 flex items-center justify-between gap-4">
                <label class="flex items-center gap-4 cursor-pointer select-none">
                  <input v-model="enableAiInterpretation" type="checkbox" class="peer sr-only" />
                  <span
                    class="relative w-12 h-6 rounded-full border transition-colors duration-500 shrink-0 peer-focus-visible:outline peer-focus-visible:outline-gold-bright"
                    :class="enableAiInterpretation ? 'bg-cinnabar border-gold/70' : 'bg-ink border-smoke/50'"
                  >
                    <span
                      class="absolute top-1/2 -translate-y-1/2 w-[18px] h-[18px] rounded-full transition-all duration-500"
                      :class="enableAiInterpretation ? 'left-[26px] bg-gold-bright shadow-[0_0_10px_#ecd294]' : 'left-[3px] bg-smoke'"
                    ></span>
                  </span>
                  <span>
                    <span class="block font-serif font-bold text-parchment tracking-[0.15em]">神諭靈析</span>
                    <span class="block text-xs text-mist mt-0.5">
                      {{ enableAiInterpretation ? '依你所稟之事，由 AI 推演籤意' : '傳統默禱 ・ 不需書寫，直接求籤' }}
                    </span>
                  </span>
                </label>
                <button v-if="enableAiInterpretation" type="button" @click="openSettings" class="btn-ghost !text-xs !px-3 !py-2 shrink-0">
                  <KeyRound class="w-3.5 h-3.5" />
                  <span>{{ apiKey ? '已連線' : '設定金鑰' }}</span>
                </button>
              </div>

              <!-- petition -->
              <Transition name="fade">
                <div v-if="enableAiInterpretation" class="lacquer corners mt-5 p-6">
                  <div class="flex items-center justify-between mb-4 text-xs font-serif tracking-[0.25em]">
                    <span class="text-gold">疏　文</span>
                    <span class="text-smoke">{{ question.length }} / 300</span>
                  </div>
                  <textarea
                    v-model="question"
                    maxlength="300"
                    rows="6"
                    placeholder="弟子某某，近日面臨轉職抉擇，心中猶疑，懇請神明賜籤指點方向……"
                    class="field field-shuwen resize-none"
                  ></textarea>
                  <p class="text-xs text-smoke mt-3 tracking-wide">據實寫下所問之事與處境，所得開示更為貼切。</p>
                </div>
              </Transition>

              <p v-if="notice" class="text-center text-sm text-[#f0a493] mt-5">{{ notice }}</p>

              <div class="flex items-center justify-between gap-4 mt-10">
                <button type="button" @click="goToStep(1)" class="btn-ghost">
                  <ArrowLeft class="w-4 h-4" /><span>重擇聖籤</span>
                </button>
                <button type="button" @click="nextFromStep2" class="btn-cinnabar">
                  <span>呈疏 ・ 往籤筒</span><ArrowRight class="w-4 h-4" />
                </button>
              </div>
            </section>

            <!-- ═════════ 參 搖靈籤 ═════════ -->
            <section v-else-if="currentStep === 3" key="s3" class="pt-12 md:pt-16">
              <FortuneStickCylinder
                :is-drawing="isDrawing"
                :selected-deck-name="selectedDeck.name"
                :selected-deck-count="selectedDeck.count"
                @draw="performRitualAndDraw"
              />
              <div class="text-center mt-8">
                <button v-if="!isDrawing" type="button" @click="goToStep(2)" class="btn-ghost !text-xs">
                  <ArrowLeft class="w-3.5 h-3.5" /><span>修改疏文</span>
                </button>
              </div>
            </section>

            <!-- ═════════ 肆 解聖意 ═════════ -->
            <section v-else-if="currentStep === 4 && result" key="s4" ref="resultSection" class="pt-10 md:pt-14 scroll-mt-28">
              <div class="flex flex-col sm:flex-row items-center sm:items-end justify-between gap-5 mb-10">
                <div class="text-center sm:text-left">
                  <p class="eyebrow">The Verse Bestowed</p>
                  <h3 class="font-serif font-bold text-3xl md:text-4xl text-gold-leaf mt-3 tracking-[0.2em]">聖意垂示</h3>
                </div>
                <button type="button" @click="resetRitual" class="btn-ghost">
                  <RotateCcw class="w-4 h-4" /><span>再求一籤</span>
                </button>
              </div>

              <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                <OracleSlip
                  class="lg:col-span-7 rise-in"
                  :class="showAiPanel ? '' : 'lg:col-start-3 lg:col-span-8'"
                  :deck="selectedDeck"
                  :verse="result"
                  :stories="formattedVerseStories"
                />
                <TalismanReading
                  v-if="showAiPanel"
                  class="lg:col-span-5 lg:sticky lg:top-28 rise-in"
                  style="animation-delay: 0.25s"
                  :question="question"
                  :answer="aiAnswer"
                  :is-interpreting="isInterpreting"
                  :has-key="!!apiKey"
                  :notice="notice"
                  @ask="askAi"
                />
              </div>
            </section>
          </Transition>
        </div>
      </Transition>
    </main>

    <footer class="relative z-10 mt-16">
      <div class="rule-huiwen"></div>
      <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-smoke">
        <div class="flex items-center gap-3">
          <BaguaRing :size="28" :show-names="false" :spin="false" />
          <span class="font-serif text-sm tracking-[0.3em] text-mist">靈籤閣</span>
        </div>
        <p class="font-brush text-sm tracking-[0.35em] text-mist/80">誠則靈 ・ 信則明 ・ 行則通</p>
        <a
          href="http://www.chance.org.tw/%E7%B1%A4%E8%A9%A9%E9%9B%86/%E5%85%AD%E5%8D%81%E7%94%B2%E5%AD%90%E7%B1%A4/%E7%B1%A4%E8%A9%A9%E7%B6%B2%E2%80%A7%E5%85%AD%E5%8D%81%E7%94%B2%E5%AD%90%E7%B1%A4.htm"
          target="_blank"
          rel="noreferrer"
          class="inline-flex items-center gap-1.5 tracking-widest hover:text-gold transition-colors"
        >
          籤文典故參考 <ExternalLink class="w-3 h-3" />
        </a>
      </div>
      <p class="pb-8 text-center text-[11px] text-smoke/70 tracking-wider px-4">籤詩為心靈寄託，重大醫療、法律、財務決定請諮詢專業人士。</p>
    </footer>

    <!-- settings modal -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="isSettingsOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div class="fixed inset-0 bg-black/75 backdrop-blur-md" @click="isSettingsOpen = false"></div>

          <div class="lacquer corners relative z-10 w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 md:p-8" role="dialog" aria-modal="true" aria-labelledby="settings-title">
            <form @submit.prevent="saveSettings">
              <div class="flex items-start justify-between mb-6">
                <div>
                  <p class="eyebrow">Oracle Settings</p>
                  <h3 id="settings-title" class="font-serif font-bold text-2xl text-parchment mt-2 tracking-[0.15em]">神諭靈析設定</h3>
                </div>
                <button type="button" @click="isSettingsOpen = false" class="text-mist hover:text-parchment p-1 cursor-pointer" aria-label="關閉">
                  <X class="w-5 h-5" />
                </button>
              </div>

              <p class="text-xs text-mist leading-6 mb-6">支援 OpenAI 相容 API。金鑰僅儲存在你的瀏覽器（localStorage），不會上傳至本站。</p>

              <label class="block text-xs font-serif tracking-[0.2em] text-gold mb-2">服務商</label>
              <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-5">
                <button
                  v-for="preset in defaultCspPresets"
                  :key="preset.id"
                  type="button"
                  @click="applyPreset(preset)"
                  class="px-2 py-2 rounded-[3px] text-xs border transition-all cursor-pointer truncate"
                  :class="selectedPresetId === preset.id ? 'bg-cinnabar/80 text-gold-bright border-gold/70' : 'bg-ink/60 text-mist border-gold/15 hover:border-gold/40'"
                >{{ preset.name }}</button>
                <button
                  type="button"
                  @click="selectCustomPreset"
                  class="px-2 py-2 rounded-[3px] text-xs border transition-all cursor-pointer"
                  :class="selectedPresetId === 'custom' ? 'bg-cinnabar/80 text-gold-bright border-gold/70' : 'bg-ink/60 text-mist border-gold/15 hover:border-gold/40'"
                >自訂網址</button>
              </div>

              <p v-if="selectedPresetId === 'google'" class="text-xs text-mist leading-6 mb-5 pl-3 border-l-2 border-gold/50">
                Google Gemini 可免費申請金鑰：
                <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" class="text-gold underline underline-offset-4">Google AI Studio</a>
              </p>

              <div class="mb-5">
                <div class="flex justify-between items-center mb-2">
                  <label for="api-key" class="text-xs font-serif tracking-[0.2em] text-gold">API Key</label>
                  <button v-if="apiKey" type="button" @click="clearSettings" class="inline-flex items-center gap-1 text-[11px] text-[#f0a493] hover:underline cursor-pointer">
                    <Trash2 class="w-3 h-3" />清除
                  </button>
                </div>
                <input id="api-key" v-model="apiKey" type="password" placeholder="sk-… / AIza…" required class="field" />
              </div>

              <div class="mb-5">
                <label for="base-url" class="block text-xs font-serif tracking-[0.2em] text-gold mb-2">Base URL</label>
                <input id="base-url" v-model="baseUrl" type="url" placeholder="https://api.openai.com/v1" required class="field" />
              </div>

              <div class="mb-8">
                <div class="flex justify-between items-center mb-2">
                  <label for="model" class="text-xs font-serif tracking-[0.2em] text-gold">模型</label>
                  <button
                    type="button"
                    @click="loadModels"
                    :disabled="isFetchingModels || !apiKey.trim()"
                    class="inline-flex items-center gap-1 text-[11px] text-gold hover:underline disabled:text-smoke disabled:no-underline cursor-pointer disabled:cursor-not-allowed"
                  >
                    <RefreshCw class="w-3 h-3" :class="isFetchingModels ? 'animate-spin' : ''" />
                    {{ isFetchingModels ? '讀取中' : '讀取模型列表' }}
                  </button>
                </div>
                <select v-if="availableModels.length" id="model" v-model="model" class="field">
                  <option v-for="m in availableModels" :key="m" :value="m">{{ m }}</option>
                </select>
                <input v-else id="model" v-model="model" type="text" placeholder="gpt-4o-mini" required class="field" />
                <p v-if="modelNotice" class="text-[11px] mt-2" :class="modelNotice.includes('失敗') ? 'text-[#f0a493]' : 'text-mist'">{{ modelNotice }}</p>
              </div>

              <button type="submit" class="btn-cinnabar w-full">
                <Settings class="w-4 h-4" /><span>儲存設定</span>
              </button>
            </form>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>
