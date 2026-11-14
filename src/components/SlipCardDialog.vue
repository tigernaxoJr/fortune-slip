<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { Download, Share2, X } from 'lucide-vue-next'
import type { OracleDeck, OracleVerse } from '../data/decks'
import { renderSlipCard, toHanzi } from '../services/slipCard'

const props = defineProps<{ open: boolean; deck: OracleDeck; verse: OracleVerse }>()
const emit = defineEmits<{ (e: 'close'): void }>()

const url = ref('')
const file = ref<File | null>(null)
const error = ref('')
const rendering = ref(false)
const shared = ref('')

const fileName = computed(() => `靈籤閣-${props.deck.name}-第${toHanzi(props.verse.number)}籤.jpg`)
const canShare = computed(() => {
  if (!file.value || typeof navigator.canShare !== 'function') return false
  try {
    return navigator.canShare({ files: [file.value] })
  } catch {
    return false
  }
})

function clear() {
  if (url.value) URL.revokeObjectURL(url.value)
  url.value = ''
  file.value = null
}

async function render() {
  clear()
  error.value = ''
  shared.value = ''
  rendering.value = true
  try {
    const blob = await renderSlipCard(props.deck, props.verse)
    file.value = new File([blob], fileName.value, { type: 'image/jpeg' })
    url.value = URL.createObjectURL(blob)
  } catch (e) {
    error.value = e instanceof Error ? e.message : '籤詩卡產生失敗'
  } finally {
    rendering.value = false
  }
}

watch(
  () => [props.open, props.verse] as const,
  ([open]) => {
    if (open) void render()
  },
  { immediate: true },
)
const onKey = (e: KeyboardEvent) => {
  if (e.key === 'Escape' && props.open) emit('close')
}
onMounted(() => window.addEventListener('keydown', onKey))
onUnmounted(() => {
  window.removeEventListener('keydown', onKey)
  clear()
})

function download() {
  if (!url.value) return
  const a = document.createElement('a')
  a.href = url.value
  a.download = fileName.value
  document.body.appendChild(a)
  a.click()
  a.remove()
}

async function share() {
  if (!file.value) return
  try {
    await navigator.share({ files: [file.value], title: '靈籤閣', text: `我在靈籤閣求得${props.deck.name}第${toHanzi(props.verse.number)}籤` })
    shared.value = '已開啟分享'
  } catch (e) {
    if ((e as DOMException)?.name !== 'AbortError') download()
  }
}
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="open" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="fixed inset-0 bg-black/80 backdrop-blur-md" @click="emit('close')"></div>

        <div class="lacquer corners relative z-10 w-full max-w-md max-h-[94vh] flex flex-col p-5 sm:p-6" role="dialog" aria-modal="true" aria-labelledby="card-title">
          <div class="flex items-start justify-between mb-4">
            <div>
              <p class="eyebrow">Keep the Verse</p>
              <h3 id="card-title" class="font-serif font-bold text-xl text-parchment mt-1.5 tracking-[0.15em]">籤詩卡</h3>
            </div>
            <button type="button" class="text-mist hover:text-parchment p-1 cursor-pointer" aria-label="關閉" @click="emit('close')">
              <X class="w-5 h-5" />
            </button>
          </div>

          <div class="relative flex-1 min-h-0 flex items-center justify-center">
            <img
              v-if="url"
              :src="url"
              :alt="`${deck.name}第${verse.number}籤籤詩卡`"
              class="max-h-[62vh] w-auto rounded-[2px] shadow-[0_30px_60px_-20px_rgba(0,0,0,0.9)] rise-in"
            />
            <div v-else-if="rendering" class="aspect-[9/16] h-[62vh] max-w-full rounded-[2px] bg-paper/10 border border-gold/15 flex items-center justify-center">
              <p class="font-brush text-gold tracking-[0.3em]">研墨落筆中…</p>
            </div>
            <p v-else-if="error" class="text-sm text-[#f0a493]">{{ error }}</p>
          </div>

          <div class="grid gap-3 mt-5" :class="canShare ? 'grid-cols-2' : 'grid-cols-1'">
            <button type="button" class="btn-ghost justify-center" :disabled="!url" @click="download">
              <Download class="w-4 h-4" /><span>儲存圖片</span>
            </button>
            <button v-if="canShare" type="button" class="btn-cinnabar !py-2.5 !px-4 text-sm" @click="share">
              <Share2 class="w-4 h-4" /><span>分享</span>
            </button>
          </div>
          <p class="text-[11px] text-smoke text-center mt-3 tracking-wider">
            {{ shared || '1080 × 1920 直式，適合限時動態與 LINE' }}
          </p>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
