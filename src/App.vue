<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'
import { deckById, decks, drawFrom, type DeckId, type OracleVerse } from './data/decks'
import { defaultCspPresets, fetchModels, formatStories, interpretOracle, type CspPreset } from './services/ai'

const currentStep = ref<1 | 2 | 3 | 4>(1)
const maxStepReached = ref<1 | 2 | 3 | 4>(1)
const selectedId = ref<DeckId | null>(null)
const question = ref('')
const result = ref<OracleVerse | null>(null)
const resultSection = ref<HTMLElement>()
const settingsDialog = ref<HTMLDialogElement>()
const isDrawing = ref(false)
const isInterpreting = ref(false)
const notice = ref('')
const aiAnswer = ref('')
const enableAiInterpretation = ref(true)
const apiKey = ref(localStorage.getItem('oracle-api-key') || '')
const baseUrl = ref(localStorage.getItem('oracle-base-url') || 'https://generativelanguage.googleapis.com/v1beta/openai')
const model = ref(localStorage.getItem('oracle-model') || 'models/gemma-4-26b-a4b-it')

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
  await new Promise((resolve) => window.setTimeout(resolve, 3200))
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
  settingsDialog.value?.showModal()
}

function saveSettings() {
  localStorage.setItem('oracle-api-key', apiKey.value.trim())
  localStorage.setItem('oracle-base-url', baseUrl.value.trim())
  localStorage.setItem('oracle-model', model.value.trim())
  settingsDialog.value?.close()
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
  <div class="site-shell temple-theme">
    <!-- 頂部山門與寺廟標題 -->
    <header class="topbar temple-topbar">
      <a class="brand" href="#" aria-label="靈籤閣首頁" @click.prevent="resetRitual">
        <span class="brand-seal temple-seal">靈</span>
        <span>
          <strong>靈籤閣</strong>
          <small>SACRED TEMPLE ORACLE</small>
        </span>
      </a>

      <!-- 參拜儀式步驟切換器 -->
      <nav class="ritual-stepper temple-stepper" aria-label="求籤參拜步驟">
        <button
          v-for="step in steps"
          :key="step.num"
          type="button"
          class="step-node temple-step"
          :class="{
            active: currentStep === step.num,
            completed: currentStep > step.num,
            disabled: isStepDisabled(step.num)
          }"
          :disabled="isStepDisabled(step.num)"
          @click="goToStep(step.num)"
        >
          <span class="step-symbol">{{ step.symbol }}</span>
          <span class="step-text">{{ step.label }}</span>
        </button>
      </nav>

      <button class="settings-link temple-settings-btn" type="button" @click="openSettings">
        <span class="status-dot" :class="{ ready: apiKey }"></span>
        AI 靈析設定
      </button>
    </header>

    <main class="ritual-main temple-main">
      <!-- 步驟 壹：選擇聖籤庫 -->
      <section v-if="currentStep === 1" class="step-view step-one temple-step-view">
        <div class="hero-copy temple-hero">
          <div class="temple-motto">誠心所至 萬法相感 ｜ 佛光普照 聖意開示</div>
          <p class="eyebrow temple-eyebrow"><span></span> 步驟 壹 ・ 擇諸佛聖籤</p>
          <h1>心有所求<br><em>虔誠擇籤</em></h1>
          <p class="hero-lead temple-lead">
            奉請六大名剎靈籤。請屏息靜氣、定心凝神，選擇一套與當下心境最具感應的聖籤。
          </p>
        </div>

        <div class="deck-grid temple-deck-grid" role="list" aria-label="六大籤詩">
          <button
            v-for="deck in decks"
            :key="deck.id"
            type="button"
            class="deck-card temple-deck-card"
            :class="{ selected: selectedId === deck.id }"
            :aria-pressed="selectedId === deck.id"
            @click="chooseDeck(deck.id)"
          >
            <span class="deck-stamp">聖籤</span>
            <span class="deck-count">{{ deck.count }} 籤</span>
            <span class="deck-main">
              <strong>{{ deck.name }}</strong>
              <small>{{ deck.origin }}</small>
            </span>
            <span class="deck-guidance">{{ deck.guidance }}</span>
            <span class="select-mark">卍</span>
          </button>
        </div>

        <div class="step-actions">
          <button class="next-step-btn temple-btn-primary" type="button" @click="nextFromStep1">
            下一步：淨手稟告 <span>➔</span>
          </button>
        </div>
      </section>

      <!-- 步驟 貳：寫下稟告疏文 -->
      <section v-else-if="currentStep === 2" class="step-view step-two temple-step-view">
        <div class="hero-copy temple-hero">
          <p class="eyebrow temple-eyebrow"><span></span> 步驟 貳 ・ 淨心稟告疏文</p>
          <h1>誠心默念<br><em>撰寫疏文</em></h1>
          <p class="hero-lead temple-lead">
            一籤一問，莫求多事。誠心稟告三寶與諸天神佛，將心中困惑明確記錄於疏文中。
          </p>
        </div>

        <!-- AI 解籤服務切換卡片 -->
        <div class="ai-toggle-card temple-ai-toggle" :class="{ active: enableAiInterpretation }">
          <div class="toggle-main-row">
            <label class="toggle-control">
              <input v-model="enableAiInterpretation" type="checkbox" class="toggle-checkbox">
              <span class="toggle-title">✦ 啟用 AI 佛法靈析開示</span>
            </label>
            <button
              v-if="enableAiInterpretation"
              type="button"
              class="inline-settings-btn temple-btn-inline-settings"
              @click="openSettings"
            >
              <span class="status-dot" :class="{ ready: apiKey }"></span>
              ⚙️ 設定 API 金鑰 / 模型
            </button>
          </div>
          <p class="toggle-desc">
            {{ enableAiInterpretation ? '開啟：可於下方撰寫稟告疏文，由 AI 結合您的所求事項與聖籤進行專屬深度開示。' : '關閉（傳統默禱參拜模式）：無須撰寫疏文，請於心中默禱，求籤結果僅呈現傳統聖籤與典故，不呼叫 AI 服務。' }}
          </p>
        </div>

        <!-- 疏文輸入框（僅在啟用 AI 時顯示） -->
        <div v-if="enableAiInterpretation" class="question-box temple-scroll-box">
          <div class="scroll-header">
            <span class="scroll-seal">疏文</span>
            <span class="scroll-required-tag">（AI 解籤必填）</span>
            <div class="selected-deck-pill temple-pill">
              奉請籤庫：<strong>{{ selectedDeck.name }}</strong>（{{ selectedDeck.origin }}）
            </div>
          </div>
          <label class="question-field temple-textarea-wrapper">
            <span class="sr-only">稟告疏文</span>
            <textarea
              v-model="question"
              maxlength="300"
              placeholder="【求籤疏文】信士/信女誠心祈求指點迷津：例如：弟子近日面臨工作抉擇，懇求神佛賜籤指引方向與避坑注意事項..."
              autofocus
            ></textarea>
            <span class="char-count temple-char-count">{{ question.length }} / 300</span>
          </label>
        </div>

        <p v-if="notice" class="notice temple-notice" role="alert">{{ notice }}</p>

        <div class="step-actions dual-actions">
          <button class="back-step-btn temple-btn-secondary" type="button" @click="goToStep(1)">
            ← 重擇聖籤
          </button>
          <button class="next-step-btn temple-btn-primary" type="button" @click="nextFromStep2">
            下一步：誠心搖籤 <span>➔</span>
          </button>
        </div>
      </section>

      <!-- 步驟 參：佛龕搖籤與擲聖筊 -->
      <section v-else-if="currentStep === 3" class="step-view step-three temple-step-view">
        <div class="hero-copy align-center temple-hero">
          <p class="eyebrow center-eyebrow temple-eyebrow"><span></span> 步驟 參 ・ 神龕求靈籤</p>
          <h1>一念既誠<br><em>聖意降臨</em></h1>
          <p class="hero-lead center-lead temple-lead">
            {{ question.trim() ? `默念稟告之事：「${question.trim()}」，誠心搖動竹籤筒求取靈籤。` : '屏息靜氣、定心凝神，搖動竹籤筒求取聖意靈籤。' }}
          </p>
        </div>

        <!-- 儀式進行中階段指示器 -->
        <div class="ritual-progress-bar temple-ritual-progress" :class="{ active: isDrawing }">
          <div class="progress-step" :class="{ active: isDrawing }">
            <span class="step-icon">🧧</span>
            <span>淨手焚香</span>
          </div>
          <span class="progress-arrow">➔</span>
          <div class="progress-step" :class="{ active: isDrawing }">
            <span class="step-icon">🎍</span>
            <span>搖動竹筒</span>
          </div>
          <span class="progress-arrow">➔</span>
          <div class="progress-step" :class="{ active: isDrawing }">
            <span class="step-icon">✨</span>
            <span>靈籤躍出</span>
          </div>
          <span class="progress-arrow">➔</span>
          <div class="progress-step" :class="{ active: isDrawing }">
            <span class="step-icon">☯️</span>
            <span>聖筊應驗</span>
          </div>
        </div>

        <!-- 道教神座主祭壇 -->
        <div class="hero-art ritual-altar temple-shrine-altar" aria-hidden="true">
          <!-- 背景太極八卦金光神輪 -->
          <div class="taoist-bagua-halo" :class="{ glowing: isDrawing }">
            <div class="bagua-ring outer-trigrams">
              <span>乾</span><span>兌</span><span>離</span><span>震</span>
              <span>巽</span><span>坎</span><span>艮</span><span>坤</span>
            </div>
            <div class="bagua-ring inner-circle"></div>
            <div class="taiji-center-mark">☯</div>
          </div>

          <!-- 三足宣德古銅香爐與紫氣祥雲青煙 -->
          <div class="bronze-incense-burner">
            <div class="burner-body">
              <span class="burner-seal">鼎</span>
            </div>
            <div class="smoke-particles">
              <div class="incense incense-one"></div>
              <div class="incense incense-two"></div>
              <div class="incense incense-three"></div>
            </div>
          </div>

          <!-- 古風道教竹籤筒 -->
          <div class="oracle-bamboo-cylinder temple-bamboo-cylinder" :class="{ shaking: isDrawing }">
            <div class="cylinder-band top-band"></div>
            <div class="cylinder-band mid-band"></div>
            <div class="cylinder-band bot-band"></div>

            <!-- 竹筒內的諸靈籤 -->
            <div class="bamboo-slips-bundle">
              <div class="bamboo-slip s1"><span class="slip-tip">朱</span></div>
              <div class="bamboo-slip s2"><span class="slip-tip">朱</span></div>
              <div class="bamboo-slip s3"><span class="slip-tip">朱</span></div>
              <div class="bamboo-slip s4"><span class="slip-tip">朱</span></div>
              <div class="bamboo-slip s5"><span class="slip-tip">朱</span></div>
              <div class="bamboo-slip s6"><span class="slip-tip">朱</span></div>
              <div class="bamboo-slip s7"><span class="slip-tip">朱</span></div>
            </div>

            <div class="pot-mark temple-pot-seal">
              <span class="seal-character">聖籤感應</span>
            </div>
          </div>

          <!-- 躍出浮空的金光靈籤 (搖籤時動畫觸發) -->
          <div class="rising-sacred-stick" :class="{ active: isDrawing }">
            <div class="stick-head">第一籤</div>
            <div class="stick-body">聖意開示</div>
            <div class="stick-glow"></div>
          </div>

          <!-- 擲筊（聖筊）降臨動畫 -->
          <div class="divine-poe-pair" :class="{ active: isDrawing }">
            <div class="poe-block poe-left">
              <span class="poe-face flat">陽</span>
            </div>
            <div class="poe-block poe-right">
              <span class="poe-face convex">陰</span>
            </div>
            <div class="poe-blessing-tag">✦ 聖筊應驗・賜予吉籤 ✦</div>
          </div>

          <!-- 紫檀金邊神案桌底座 -->
          <div class="altar-table-surface temple-altar-base">
            <div class="table-border-gold"></div>
          </div>
        </div>

        <div class="draw-action temple-draw-action">
          <button
            class="draw-button temple-draw-btn"
            type="button"
            :disabled="isDrawing"
            :aria-busy="isDrawing"
            @click="performRitualAndDraw"
          >
            <span v-if="isDrawing" class="shaking-mark temple-shaking-seal">卍</span>
            <span v-else class="button-seal temple-button-seal">籤</span>
            {{ isDrawing ? '諸佛感應・靈籤擲筊中…' : '誠心搖籤・求取聖意' }}
          </button>
          <p v-if="notice" class="notice temple-notice" role="alert">{{ notice }}</p>
        </div>

        <div class="step-actions center-actions">
          <button class="back-step-btn temple-btn-secondary" type="button" @click="goToStep(2)">
            ← 修改稟告疏文
          </button>
        </div>
      </section>

      <!-- 步驟 肆：黃絹聖籤解與 AI 佛意靈析 -->
      <section v-else-if="currentStep === 4 && result" ref="resultSection" class="step-view step-four result-section temple-result-section">
        <div class="result-heading temple-result-heading">
          <p class="kicker temple-kicker">感應聖籤・諸佛靈應</p>
          <div class="heading-main-row">
            <h2>感應所得之聖籤</h2>
            <button type="button" class="temple-reset-btn" @click="resetRitual">
              <span>重新參拜求籤</span>
              <i class="reset-icon">↺</i>
            </button>
          </div>
        </div>

        <div class="result-layout temple-result-layout" :class="{ 'single-scroll': !showAiPanel }">
          <!-- 黃絹聖籤卡片 -->
          <article class="fortune-paper temple-sacred-scroll">
            <div class="paper-corner top-left"></div>
            <div class="paper-corner bottom-right"></div>
            <div class="fortune-meta temple-scroll-meta">
              <span>{{ selectedDeck.name }}</span>
              <span>{{ selectedDeck.origin }}</span>
            </div>
            <div class="number-seal temple-number-seal">
              <small>第</small>
              <strong>{{ result.number }}</strong>
              <small>籤</small>
              <span v-if="result.fortune" class="fortune-rating-tag temple-rating-tag">{{ result.fortune }}</span>
            </div>
            <div v-if="result.ganzhi || result.element" class="ganzhi-banner temple-ganzhi-banner">
              <span v-if="result.ganzhi" class="ganzhi-pill temple-ganzhi-pill">【{{ result.ganzhi }}】</span>
              <span v-if="result.element" class="element-pill temple-element-pill">{{ result.element }}</span>
            </div>
            <div class="poem temple-poem">
              <p v-for="line in result.lines" :key="line">{{ line }}</p>
            </div>

            <!-- 籤詩故事卡片 -->
            <div v-if="formattedVerseStories.length" class="verse-section verse-stories temple-verse-section">
              <div class="section-badge temple-section-badge"><span>典故</span> 籤詩故事</div>
              <div class="story-cards">
                <article
                  v-for="(story, idx) in formattedVerseStories"
                  :key="idx"
                  class="story-card temple-story-card"
                >
                  <h4 class="story-title temple-story-title">
                    <span class="story-index temple-story-index">典故 {{ idx + 1 }}</span>
                    {{ story.title || '典故說明' }}
                  </h4>
                  <div v-if="story.content.length" class="story-body temple-story-body">
                    <p v-for="(line, lIdx) in story.content" :key="lIdx">{{ line }}</p>
                  </div>
                </article>
              </div>
            </div>

            <!-- 諸事指引屬性 -->
            <div v-if="result.attributes && Object.keys(result.attributes).length" class="verse-section verse-attributes temple-verse-section">
              <div class="section-badge temple-section-badge"><span>指引</span> 諸事指引</div>
              <div class="attributes-grid temple-attr-grid">
                <div
                  v-for="(val, key) in result.attributes"
                  :key="key"
                  class="attr-chip temple-attr-chip"
                >
                  <span class="attr-key">{{ key }}</span>
                  <span class="attr-val">{{ val }}</span>
                </div>
              </div>
            </div>

            <!-- 傳統解說明 -->
            <div v-if="result.explanations && result.explanations.length" class="verse-section verse-explanations temple-verse-section">
              <div class="section-badge temple-section-badge"><span>聖意</span> 傳統解曰</div>
              <div class="explanations-content temple-exp-content">
                <p v-for="(exp, idx) in result.explanations" :key="idx">{{ exp }}</p>
              </div>
            </div>

            <p class="paper-foot temple-paper-foot">先觀其因，再問其果；吉中藏戒，凶中有路。</p>
          </article>

          <!-- 右側 AI 佛意靈析面板（有撰寫疏文且開啟 AI 時顯示） -->
          <aside v-if="showAiPanel" class="reading-panel temple-reading-panel">
            <p class="panel-label temple-panel-label">{{ question.trim() ? '信士所稟疏文' : '信士參拜心念' }}</p>
            <blockquote class="temple-blockquote">「{{ question.trim() || '默禱參拜，求賜總體聖意開示' }}」</blockquote>
            <div class="divider temple-divider"><span>開示</span></div>

            <template v-if="aiAnswer">
              <div class="ai-answer temple-ai-answer">{{ aiAnswer }}</div>
              <button class="secondary-button temple-btn-secondary" type="button" :disabled="isInterpreting" @click="askAi">
                重新領受佛意開示
              </button>
            </template>
            <template v-else>
              <h3>✦ 佛法靈析・聖意開示 ✦</h3>
              <p class="reading-copy temple-reading-copy">
                籤詩如鏡，映照當下心念。AI 將結合所稟告疏文與諸佛聖意，
                為您開示指引破局之道。
              </p>
              <ul class="ai-points temple-ai-points">
                <li><span>01</span> 明辨因果起伏</li>
                <li><span>02</span> 對照當下處境</li>
                <li><span>03</span> 賜予行事方略</li>
              </ul>
              <button
                class="ai-button temple-ai-btn"
                type="button"
                :disabled="isInterpreting"
                :aria-busy="isInterpreting"
                @click="askAi"
              >
                <span>✦</span>
                {{ isInterpreting ? '正在凝神領受聖意…' : apiKey ? '請 AI 領受聖意開示' : '設定 API 後領受開示' }}
              </button>
            </template>
          </aside>
        </div>

        <div v-if="!showAiPanel" class="silent-prayer-notice">
          <span class="notice-icon">🌸</span>
          <div class="notice-text">
            <strong>{{ !enableAiInterpretation ? '信士選擇僅參拜求取傳統聖籤：' : '信士以默禱參拜求籤：' }}</strong>
            <span>
              聖籤古意與歷代典故已如上開示。
              <template v-if="!enableAiInterpretation">
                若需 AI 結合疏文開示，可點擊上方「<a href="#" @click.prevent="goToStep(2)">修改稟告疏文</a>」開啟 AI 靈析。
              </template>
              <template v-else>
                如欲領受 AI 結合具體事項之開示，可點擊上方「<a href="#" @click.prevent="goToStep(2)">修改稟告疏文</a>」補寫所求事項。
              </template>
            </span>
          </div>
        </div>
        <p v-if="notice" class="notice result-notice temple-notice" role="alert">{{ notice }}</p>
      </section>
    </main>

    <footer class="temple-footer">
      <a class="brand footer-brand" href="#" @click.prevent="resetRitual"><span class="brand-seal temple-seal">靈</span><strong>靈籤閣</strong></a>
      <p>諸佛聖意 × 心靈寄託 ｜ 靜心參拜</p>
      <a
        href="http://www.chance.org.tw/%E7%B1%A4%E8%A9%A9%E9%9B%86/%E5%85%AD%E5%8D%81%E7%94%B2%E5%AD%90%E7%B1%A4/%E7%B1%A4%E8%A9%A9%E7%B6%B2%E2%80%A7%E5%85%AD%E5%8D%81%E7%94%B2%E5%AD%90%E7%B1%A4.htm"
        target="_blank"
        rel="noreferrer"
      >籤文資料參考 ↗</a>
    </footer>

    <!-- API 設定彈窗 -->
    <dialog ref="settingsDialog" class="settings-dialog temple-dialog">
      <form method="dialog" @submit.prevent="saveSettings">
        <div class="dialog-head">
          <div>
            <p class="kicker temple-kicker">AI 靈析介面設定</p>
            <h2>AI 靈析開示設定</h2>
          </div>
          <button type="button" aria-label="關閉設定" @click="settingsDialog?.close()">×</button>
        </div>
        <p class="dialog-copy">
          支援 OpenAI 相容協定之 <code>/chat/completions</code> 介面。
          設定儲存後會安全保留於瀏覽器本機儲存 (localStorage) 中。
        </p>

        <div class="preset-section">
          <span class="field-title">選擇 AI 服務商預設</span>
          <div class="preset-chips">
            <button
              v-for="preset in defaultCspPresets"
              :key="preset.id"
              type="button"
              class="preset-chip"
              :class="{ active: selectedPresetId === preset.id }"
              @click="applyPreset(preset)"
            >
              {{ preset.name }}
            </button>
            <span class="preset-chip disabled" :class="{ active: selectedPresetId === 'custom' }">
              自訂網址
            </span>
          </div>
        </div>

        <div v-if="selectedPresetId === 'google'" class="free-key-callout">
          <span class="callout-icon">💡</span>
          <div class="callout-text">
            <strong>Gemini 免費 API Key 申請指引：</strong>
            <p>點此前往 <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" class="free-link">Google AI Studio ↗</a> 登入即可免費建立專用 API 金鑰。</p>
          </div>
        </div>

        <label class="model-label">
          <div class="model-label-head">
            <span>API 金鑰 (API Key)</span>
            <button
              v-if="apiKey"
              type="button"
              class="fetch-models-btn"
              @click="clearSettings"
            >
              清除金鑰 🗑️
            </button>
          </div>
          <input v-model="apiKey" type="password" autocomplete="off" :placeholder="selectedPresetId === 'google' ? 'AIzaSy…' : 'sk-…'" required>
        </label>
        <label>
          <span>伺服器網址 (Base URL)</span>
          <input v-model="baseUrl" type="url" inputmode="url" placeholder="https://api.openai.com/v1" required>
        </label>

        <div class="model-group">
          <label class="model-label">
            <div class="model-label-head">
              <span>模型名稱</span>
              <button
                type="button"
                class="fetch-models-btn"
                :disabled="isFetchingModels || !apiKey.trim()"
                @click="loadModels"
              >
                {{ isFetchingModels ? '讀取中…' : '讀取模型列表 ↻' }}
              </button>
            </div>
            <select v-if="availableModels.length" v-model="model" required class="model-select">
              <option v-for="m in availableModels" :key="m" :value="m">{{ m }}</option>
            </select>
            <input v-else v-model="model" type="text" placeholder="gpt-4o-mini / gemini-2.5-flash / deepseek-chat" required>
          </label>
          <p v-if="modelNotice" class="model-status" :class="{ error: modelNotice.includes('失敗') || modelNotice.includes('無法') || modelNotice.includes('請') }">
            {{ modelNotice }}
          </p>
        </div>

        <button class="save-button temple-btn-primary" type="submit">儲存並返回求籤</button>
      </form>
    </dialog>
  </div>
</template>
