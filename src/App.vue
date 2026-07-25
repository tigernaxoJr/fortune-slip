<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'
import { deckById, decks, drawFrom, type DeckId, type OracleVerse } from './data/decks'
import { defaultCspPresets, fetchModels, interpretOracle, type CspPreset } from './services/ai'

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

const selectedPresetId = computed(() => {
  const match = defaultCspPresets.find(
    (p) => p.baseUrl.toLowerCase() === baseUrl.value.trim().toLowerCase(),
  )
  return match ? match.id : 'custom'
})

function chooseDeck(id: DeckId) {
  selectedId.value = id
  result.value = null
  aiAnswer.value = ''
  notice.value = ''
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
    if (list.length > 0 && !list.includes(model.value)) {
      model.value = list[0]
    }
    modelNotice.value = `已成功讀取 ${list.length} 個可用模型`
  } catch (err) {
    modelNotice.value = err instanceof Error ? err.message : '讀取模型失敗'
  } finally {
    isFetchingModels.value = false
  }
}

async function drawOracle() {
  if (question.value.trim().length < 2) {
    notice.value = '請先在心中定下所問之事，再誠心求籤。'
    return
  }

  notice.value = ''
  aiAnswer.value = ''
  result.value = null
  isDrawing.value = true
  await new Promise((resolve) => window.setTimeout(resolve, 720))
  result.value = drawFrom(selectedDeck.value)
  isDrawing.value = false
  await nextTick()
  resultSection.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
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
  <div class="site-shell">
    <header class="topbar">
      <a class="brand" href="#" aria-label="靈籤閣首頁">
        <span class="brand-seal">問</span>
        <span>
          <strong>靈籤閣</strong>
          <small>THE ORACLE PAVILION</small>
        </span>
      </a>
      <nav aria-label="主要導覽">
        <a href="#draw">誠心求籤</a>
        <a href="#collections">六大籤庫</a>
        <a href="#guidance">解籤須知</a>
      </nav>
      <button class="settings-link" type="button" @click="openSettings">
        <span class="status-dot" :class="{ ready: apiKey }"></span>
        AI 解籤設定
      </button>
    </header>

    <main>
      <section class="hero">
        <div class="hero-copy">
          <p class="eyebrow"><span></span> 一念既誠・萬象自明</p>
          <h1>心有所問<br><em>籤有所示</em></h1>
          <p class="hero-lead">
            收錄六套傳統籤詩，為徬徨的此刻留一盞燈。不是預言命運，
            而是借一首古詩，看見你尚未察覺的關鍵。
          </p>
          <div class="hero-actions">
            <a class="primary-cta" href="#draw">開始求籤 <span>↓</span></a>
            <span class="quiet-note">靜心・默念・只問一事</span>
          </div>
        </div>

        <div class="hero-art" aria-hidden="true">
          <div class="sun-disc">
            <span>誠</span>
          </div>
          <div class="incense incense-one"></div>
          <div class="incense incense-two"></div>
          <div class="oracle-pot">
            <i class="stick s1"></i><i class="stick s2"></i><i class="stick s3"></i>
            <i class="stick s4"></i><i class="stick s5"></i><i class="stick s6"></i>
            <div class="pot-mark">靈</div>
          </div>
          <div class="altar-line"></div>
        </div>
      </section>

      <section id="draw" class="draw-section">
        <div class="section-intro">
          <p class="kicker">SINCERE QUESTIONS · QUIET ANSWERS</p>
          <h2>誠心求一籤</h2>
          <p>選一套籤詩，將此刻最想問的事寫下來。</p>
        </div>

        <div id="collections" class="step-block">
          <div class="step-title">
            <span>壹</span>
            <div>
              <h3>選擇籤庫</h3>
              <p>依信仰或直覺，擇一即可</p>
            </div>
          </div>
          <div class="deck-grid" role="list" aria-label="六大籤詩">
            <button
              v-for="deck in decks"
              :key="deck.id"
              type="button"
              class="deck-card"
              :class="{ selected: selectedId === deck.id }"
              :aria-pressed="selectedId === deck.id"
              @click="chooseDeck(deck.id)"
            >
              <span class="deck-count">{{ deck.count }}</span>
              <span class="deck-main">
                <strong>{{ deck.name }}</strong>
                <small>{{ deck.origin }}</small>
              </span>
              <span class="deck-guidance">{{ deck.guidance }}</span>
              <span class="select-mark">✓</span>
            </button>
          </div>
        </div>

        <div class="step-block question-block">
          <div class="step-title">
            <span>貳</span>
            <div>
              <h3>寫下所問之事</h3>
              <p>一籤一問，描述越具體，AI 解讀越貼近</p>
            </div>
          </div>
          <label class="question-field">
            <span class="sr-only">所問之事</span>
            <textarea
              v-model="question"
              maxlength="300"
              placeholder="例如：我正在考慮轉換工作，未來三個月應把握什麼、又該留意什麼？"
            ></textarea>
            <span class="char-count">{{ question.length }} / 300</span>
          </label>
        </div>

        <div class="draw-action">
          <div class="ritual-line"><span>淨心</span><i></i><span>默念</span><i></i><span>求籤</span></div>
          <button
            class="draw-button"
            type="button"
            :disabled="isDrawing"
            :aria-busy="isDrawing"
            @click="drawOracle"
          >
            <span v-if="isDrawing" class="shaking-mark">筊</span>
            <span v-else class="button-seal">籤</span>
            {{ isDrawing ? '靜候一念落定…' : '誠心求一籤' }}
          </button>
          <p v-if="notice" class="notice" role="alert">{{ notice }}</p>
        </div>
      </section>

      <section v-if="result" ref="resultSection" class="result-section">
        <div class="result-heading">
          <div>
            <p class="kicker">YOUR ORACLE</p>
            <h2>此刻所得之籤</h2>
          </div>
          <button type="button" class="text-button" @click="drawOracle">重新求籤 ↻</button>
        </div>

        <div class="result-layout">
          <article class="fortune-paper">
            <div class="paper-corner top-left"></div>
            <div class="paper-corner bottom-right"></div>
            <div class="fortune-meta">
              <span>{{ selectedDeck.name }}</span>
              <span>{{ selectedDeck.origin }}</span>
            </div>
            <div class="number-seal">
              <small>第</small>
              <strong>{{ result.number }}</strong>
              <small>籤</small>
              <span v-if="result.fortune" class="fortune-rating-tag">{{ result.fortune }}</span>
            </div>
            <div v-if="result.ganzhi || result.element" class="ganzhi-banner">
              <span v-if="result.ganzhi" class="ganzhi-pill">【{{ result.ganzhi }}】</span>
              <span v-if="result.element" class="element-pill">{{ result.element }}</span>
            </div>
            <div class="poem">
              <p v-for="line in result.lines" :key="line">{{ line }}</p>
            </div>

            <div v-if="result.stories && result.stories.length" class="verse-section verse-stories">
              <div class="section-badge"><span>典故</span> 籤詩故事</div>
              <ul class="story-list">
                <li v-for="(story, idx) in result.stories" :key="idx">{{ story }}</li>
              </ul>
            </div>

            <div v-if="result.attributes && Object.keys(result.attributes).length" class="verse-section verse-attributes">
              <div class="section-badge"><span>屬性</span> 諸事指引</div>
              <div class="attributes-grid">
                <div
                  v-for="(val, key) in result.attributes"
                  :key="key"
                  class="attr-chip"
                >
                  <span class="attr-key">{{ key }}</span>
                  <span class="attr-val">{{ val }}</span>
                </div>
              </div>
            </div>

            <div v-if="result.explanations && result.explanations.length" class="verse-section verse-explanations">
              <div class="section-badge"><span>聖意</span> 傳統解曰</div>
              <div class="explanations-content">
                <p v-for="(exp, idx) in result.explanations" :key="idx">{{ exp }}</p>
              </div>
            </div>

            <p class="paper-foot">先觀其因，再問其果；吉中藏戒，凶中有路。</p>
          </article>

          <aside class="reading-panel">
            <p class="panel-label">YOUR QUESTION</p>
            <blockquote>「{{ question.trim() }}」</blockquote>
            <div class="divider"><span>解</span></div>

            <template v-if="aiAnswer">
              <div class="ai-answer">{{ aiAnswer }}</div>
              <button class="secondary-button" type="button" :disabled="isInterpreting" @click="askAi">
                重新解讀
              </button>
            </template>
            <template v-else>
              <h3>讓 AI 結合所問之事解籤</h3>
              <p class="reading-copy">
                籤詩重在映照處境。AI 會從詩句中的轉折、提醒與行動方向，
                回應你真正所問的事。
              </p>
              <ul class="ai-points">
                <li><span>01</span> 不只判斷吉凶</li>
                <li><span>02</span> 對照當下處境</li>
                <li><span>03</span> 給出可行一步</li>
              </ul>
              <button
                class="ai-button"
                type="button"
                :disabled="isInterpreting"
                :aria-busy="isInterpreting"
                @click="askAi"
              >
                <span>✦</span>
                {{ isInterpreting ? '正在細讀籤意…' : apiKey ? '請 AI 為我解籤' : '設定 API 後解籤' }}
              </button>
            </template>
          </aside>
        </div>
        <p v-if="notice" class="notice result-notice" role="alert">{{ notice }}</p>
      </section>

      <section id="guidance" class="guidance-section">
        <div>
          <p class="kicker">READ WITH CLARITY</p>
          <h2>籤不是答案，<br>是重新看事情的角度。</h2>
        </div>
        <ol>
          <li><span>一</span><strong>一次只問一件事</strong><p>讓問題具體，籤意才有落點。</p></li>
          <li><span>二</span><strong>先看關鍵，再看吉凶</strong><p>找出左右結果的因素，比標籤更重要。</p></li>
          <li><span>三</span><strong>把行動留在自己手中</strong><p>籤詩供思考，不替代專業判斷與現實選擇。</p></li>
        </ol>
      </section>
    </main>

    <footer>
      <a class="brand footer-brand" href="#"><span class="brand-seal">問</span><strong>靈籤閣</strong></a>
      <p>傳統籤詩 × 當代省思</p>
      <a
        href="http://www.chance.org.tw/%E7%B1%A4%E8%A9%A9%E9%9B%86/%E5%85%AD%E5%8D%81%E7%94%B2%E5%AD%90%E7%B1%A4/%E7%B1%A4%E8%A9%A9%E7%B6%B2%E2%80%A7%E5%85%AD%E5%8D%81%E7%94%B2%E5%AD%90%E7%B1%A4.htm"
        target="_blank"
        rel="noreferrer"
      >籤文資料參考 ↗</a>
    </footer>

    <dialog ref="settingsDialog" class="settings-dialog">
      <form method="dialog" @submit.prevent="saveSettings">
        <div class="dialog-head">
          <div>
            <p class="kicker">OPENAI-COMPATIBLE API</p>
            <h2>AI 解籤設定</h2>
          </div>
          <button type="button" aria-label="關閉設定" @click="settingsDialog?.close()">×</button>
        </div>
        <p class="dialog-copy">
          支援 OpenAI 相容的 <code>/chat/completions</code> API。
          金鑰只保留在此分頁記憶中，關閉分頁後即清除。
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

        <label>
          <span>API Key</span>
          <input v-model="apiKey" type="password" autocomplete="off" placeholder="sk-…" required>
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
            <select v-if="fetchedModels.length" v-model="model" required class="model-select">
              <option v-for="m in fetchedModels" :key="m" :value="m">{{ m }}</option>
            </select>
            <input v-else v-model="model" type="text" placeholder="gpt-4o-mini / gemini-2.5-flash / deepseek-chat" required>
          </label>
          <p v-if="modelNotice" class="model-status" :class="{ error: modelNotice.includes('失敗') || modelNotice.includes('無法') || modelNotice.includes('請') }">
            {{ modelNotice }}
          </p>
        </div>

        <p class="security-note"><span>●</span> 遠端服務僅允許 HTTPS，避免金鑰在傳輸途中外洩。</p>
        <button class="save-button" type="submit">儲存並返回求籤</button>
      </form>
    </dialog>
  </div>
</template>
