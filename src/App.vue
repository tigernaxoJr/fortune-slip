<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'
import { deckById, decks, drawFrom, type DeckId, type OracleVerse } from './data/decks'
import { defaultCspPresets, fetchModels, formatStories, interpretOracle, type CspPreset } from './services/ai'

const currentStep = ref<1 | 2 | 3 | 4>(1)
const selectedId = ref<DeckId>('jiazi')
const question = ref('')
const result = ref<OracleVerse | null>(null)
const resultSection = ref<HTMLElement>()
const settingsDialog = ref<HTMLDialogElement>()
const isDrawing = ref(false)
const isInterpreting = ref(false)
const notice = ref('')
const aiAnswer = ref('')
const apiKey = ref('')
const baseUrl = ref(localStorage.getItem('oracle-base-url') || 'https://api.openai.com/v1')
const model = ref(localStorage.getItem('oracle-model') || 'gpt-4o-mini')

const fetchedModels = ref<string[]>([])
const isFetchingModels = ref(false)
const modelNotice = ref('')

const selectedDeck = computed(() => deckById(selectedId.value))
const formattedVerseStories = computed(() => formatStories(result.value?.stories))

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
  openai: ['gpt-4o-mini', 'gpt-4o', 'gpt-4-turbo', 'gpt-3.5-turbo', 'o1-mini', 'o3-mini'],
  google: ['models/gemma-4-31b-it', 'gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-pro'],
  deepseek: ['deepseek-chat', 'deepseek-coder', 'deepseek-reasoner'],
}

const availableModels = computed(() => {
  if (fetchedModels.value.length > 0) {
    return fetchedModels.value
  }
  return presetModelsMap[selectedPresetId.value] || []
})

function chooseDeck(id: DeckId) {
  selectedId.value = id
  result.value = null
  aiAnswer.value = ''
  notice.value = ''
}

function goToStep(step: 1 | 2 | 3 | 4) {
  if (step === 2 && !selectedId.value) return
  if (step === 3 && question.value.trim().length < 2) {
    notice.value = '請先淨心稟告所求所問，再行求籤。'
    return
  }
  if (step === 4 && !result.value) {
    performRitualAndDraw()
    return
  }
  notice.value = ''
  currentStep.value = step
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function nextFromStep1() {
  goToStep(2)
}

function nextFromStep2() {
  if (question.value.trim().length < 2) {
    notice.value = '請先誠心寫下稟告之事，再行下一步。'
    return
  }
  notice.value = ''
  goToStep(3)
}

async function performRitualAndDraw() {
  if (question.value.trim().length < 2) {
    notice.value = '請先誠心稟告所求之事，再行求籤。'
    return
  }

  notice.value = ''
  aiAnswer.value = ''
  result.value = null
  isDrawing.value = true
  await new Promise((resolve) => window.setTimeout(resolve, 3200))
  result.value = drawFrom(selectedDeck.value)
  isDrawing.value = false
  currentStep.value = 4
  await nextTick()
  resultSection.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function resetRitual() {
  result.value = null
  aiAnswer.value = ''
  notice.value = ''
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
        const preferredGemma = list.find((m) => m === 'models/gemma-4-31b-it' || m === 'gemma-4-31b-it')
        if (preferredGemma) {
          model.value = preferredGemma
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
  localStorage.setItem('oracle-base-url', baseUrl.value.trim())
  localStorage.setItem('oracle-model', model.value.trim())
  settingsDialog.value?.close()
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
    aiAnswer.value = await interpretOracle(
      { apiKey: apiKey.value, baseUrl: baseUrl.value, model: model.value },
      question.value,
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
            disabled: (step.num === 2 && !selectedId) || (step.num >= 3 && question.trim().length < 2) || (step.num === 4 && !result)
          }"
          :disabled="(step.num === 2 && !selectedId) || (step.num >= 3 && question.trim().length < 2) || (step.num === 4 && !result)"
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

        <div class="question-box temple-scroll-box">
          <div class="scroll-header">
            <span class="scroll-seal">疏文</span>
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
          <p v-if="notice" class="notice temple-notice" role="alert">{{ notice }}</p>
        </div>

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
            默念稟告之事：「{{ question.trim() }}」，誠心搖動竹籤筒求取靈籤。
          </p>
        </div>

        <!-- 佛龕主祭壇 -->
        <div class="hero-art ritual-altar temple-shrine-altar" aria-hidden="true">
          <!-- 蓮花對燈 -->
          <div class="lotus-lamp lamp-left">
            <div class="flame"></div>
            <div class="lotus-base">✿</div>
          </div>
          <div class="lotus-lamp lamp-right">
            <div class="flame"></div>
            <div class="lotus-base">✿</div>
          </div>

          <!-- 佛光日輪 -->
          <div class="sun-disc temple-sun-disc" :class="{ glowing: isDrawing }">
            <span class="buddha-mark">佛</span>
          </div>

          <!-- 宣德爐香煙 -->
          <div class="incense incense-one"></div>
          <div class="incense incense-two"></div>
          <div class="incense incense-three"></div>

          <!-- 竹編籤筒 -->
          <div class="oracle-pot temple-oracle-pot" :class="{ shaking: isDrawing }">
            <i class="stick s1"></i><i class="stick s2"></i><i class="stick s3"></i>
            <i class="stick s4"></i><i class="stick s5"></i><i class="stick s6"></i>
            <div class="pot-mark temple-pot-seal">聖</div>
          </div>
          <div class="altar-line temple-altar-base"></div>
        </div>

        <div class="draw-action temple-draw-action">
          <div class="ritual-line temple-ritual-line">
            <span>淨手焚香</span><i></i><span>誠心默念</span><i></i><span>搖籤求聖意</span>
          </div>
          <button
            class="draw-button temple-draw-btn"
            type="button"
            :disabled="isDrawing"
            :aria-busy="isDrawing"
            @click="performRitualAndDraw"
          >
            <span v-if="isDrawing" class="shaking-mark temple-shaking-seal">聖</span>
            <span v-else class="button-seal temple-button-seal">籤</span>
            {{ isDrawing ? '諸佛感應・靈籤落定中…' : '誠心搖籤・求取聖意' }}
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
          <p class="kicker temple-kicker">SACRED ORACLE</p>
          <div class="heading-main-row">
            <h2>感應所得之聖籤</h2>
            <button type="button" class="temple-reset-btn" @click="resetRitual">
              <span>重新參拜求籤</span>
              <i class="reset-icon">↺</i>
            </button>
          </div>
        </div>

        <div class="result-layout temple-result-layout">
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

          <!-- 右側 AI 佛意靈析面板 -->
          <aside class="reading-panel temple-reading-panel">
            <p class="panel-label temple-panel-label">YOUR PRAYER SCRIPTURE</p>
            <blockquote class="temple-blockquote">「{{ question.trim() }}」</blockquote>
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
            <p class="kicker temple-kicker">OPENAI-COMPATIBLE API</p>
            <h2>AI 靈析開示設定</h2>
          </div>
          <button type="button" aria-label="關閉設定" @click="settingsDialog?.close()">×</button>
        </div>
        <p class="dialog-copy">
          支援 OpenAI 相容的 <code>/chat/completions</code> API。
          金鑰只保留在此分頁記憶中，關閉分頁後即自動清除。
        </p>

        <div class="preset-section">
          <span class="field-title">選擇服務商預設 (CSP)</span>
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
              自訂 Base URL
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

        <label>
          <span>API Key</span>
          <input v-model="apiKey" type="password" autocomplete="off" :placeholder="selectedPresetId === 'google' ? 'AIzaSy…' : 'sk-…'" required>
        </label>
        <label>
          <span>Base URL</span>
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
