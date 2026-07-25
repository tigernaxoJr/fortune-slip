import OpenAI from 'openai'
import type { OracleDeck, OracleVerse } from '../data/decks'

export interface AiSettings {
  apiKey: string
  baseUrl: string
  model: string
}

export interface CspPreset {
  id: string
  name: string
  baseUrl: string
  defaultModel: string
}

export interface FormattedStory {
  title: string
  content: string[]
}

export const defaultCspPresets: readonly CspPreset[] = [
  {
    id: 'openai',
    name: 'OpenAI',
    baseUrl: 'https://api.openai.com/v1',
    defaultModel: 'gpt-4o-mini',
  },
  {
    id: 'google',
    name: 'Google Gemini',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai',
    defaultModel: 'gemini-2.5-flash',
  },
  {
    id: 'deepseek',
    name: 'DeepSeek',
    baseUrl: 'https://api.deepseek.com/v1',
    defaultModel: 'deepseek-chat',
  },
]

const systemPrompt = `你是一位熟悉華人籤詩文化、語氣沉穩而誠懇的解籤者。請使用繁體中文，根據「使用者所問之事」與籤詩文本一起解讀。不要把籤詩說成必然預言，不恐嚇，不虛構典故；醫療、法律、財務或人身安全議題應提醒尋求合格專業協助。回答請包含：核心籤意、回應所問、可採取的三項行動、需要留意之處。`

const sanitizeEndpoint = (baseUrl: string) => {
  const input = baseUrl.trim()
  if (!input) throw new Error('請填寫 API 網址')
  let urlStr = input.endsWith('/chat/completions')
    ? input.slice(0, -'/chat/completions'.length)
    : input
  urlStr = urlStr.replace(/\/+$/, '')

  const endpoint = new URL(urlStr)
  const local = ['localhost', '127.0.0.1', '[::1]'].includes(endpoint.hostname)
  if (endpoint.protocol !== 'https:' && !local) {
    throw new Error('為保護 API 金鑰，遠端 API 必須使用 HTTPS')
  }
  return endpoint.href
}

function createOpenAIClient(apiKey: string, baseUrl: string) {
  const targetBase = sanitizeEndpoint(baseUrl)
  const isDev = typeof import.meta !== 'undefined' && import.meta.env?.DEV && typeof window !== 'undefined'

  if (isDev) {
    return new OpenAI({
      apiKey: apiKey.trim(),
      baseURL: `${window.location.origin}/api-proxy`,
      dangerouslyAllowBrowser: true,
      defaultHeaders: {
        'x-target-url': targetBase,
      },
    })
  }

  return new OpenAI({
    apiKey: apiKey.trim(),
    baseURL: targetBase,
    dangerouslyAllowBrowser: true,
  })
}

export function removeThoughtTags(text: string): string {
  if (!text) return ''
  return text
    .replace(/<(?:thought|think)[\s\S]*?<\/(?:thought|think)>/gi, '')
    .replace(/<(?:thought|think)[\s\S]*/gi, '')
    .trim()
}

export function formatStories(stories?: readonly string[]): FormattedStory[] {
  if (!stories || !stories.length) return []

  const rawList: FormattedStory[] = []
  let currentStory: FormattedStory | null = null

  for (const item of stories) {
    const trimmed = item.trim()
    if (!trimmed) continue

    const hasNumPrefix = /^(?:\([\d一二三四五六七八九十]+\)|\d+\.|[一二三四五六七八九十]+[、.])/ .test(trimmed)

    if (hasNumPrefix) {
      const cleanTitle = trimmed
        .replace(/^(?:\([\d一二三四五六七八九十]+\)|\d+\.|[一二三四五六七八九十]+[、.])/ , '')
        .replace(/[：:]$/, '')
        .trim()
      if (cleanTitle) {
        currentStory = { title: cleanTitle, content: [] }
        rawList.push(currentStory)
      }
    } else {
      const looksLikeTitle = trimmed.length <= 30 && !/[。；;！!]$/.test(trimmed)

      if (!currentStory || (looksLikeTitle && currentStory.content.length > 0)) {
        currentStory = { title: trimmed, content: [] }
        rawList.push(currentStory)
      } else {
        if (!/^\d+\.?$/.test(trimmed)) {
          currentStory.content.push(trimmed)
        }
      }
    }
  }

  const singleNumberPattern = /^[\d一二三四五六七八九十?]+$/
  return rawList.filter((s) => {
    const cleanTitle = s.title.trim()
    const hasMeaningfulTitle = cleanTitle.length > 0 && !singleNumberPattern.test(cleanTitle)
    const hasContent = s.content.some((c) => c.trim().length > 0)
    return hasMeaningfulTitle || hasContent
  })
}

export async function fetchModels(settings: { apiKey: string; baseUrl: string }): Promise<string[]> {
  if (!settings.apiKey.trim()) throw new Error('請填寫 API Key 後再讀取模型列表')

  // Native CORS fallback for Google Gemini API on GitHub Pages / production hosts
  if (settings.baseUrl.includes('generativelanguage.googleapis.com')) {
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${settings.apiKey.trim()}`)
      if (res.ok) {
        const data = await res.json()
        if (Array.isArray(data.models)) {
          const models = data.models
            .map((m: any) => m.name || m.id)
            .filter((id: string): id is string => typeof id === 'string' && id.length > 0)
            .sort((a: string, b: string) => a.localeCompare(b))
          if (models.length > 0) return models
        }
      }
    } catch {
      // Fallback to OpenAI SDK method below
    }
  }

  const openai = createOpenAIClient(settings.apiKey, settings.baseUrl)

  try {
    const response: any = await openai.models.list()
    const rawArray = Array.isArray(response?.data) ? response.data : Array.isArray(response) ? response : []

    const models = rawArray
      .map((item: any) => (typeof item === 'string' ? item : item?.id || item?.name || ''))
      .filter((id: string): id is string => typeof id === 'string' && id.length > 0)
      .sort((a: string, b: string) => a.localeCompare(b))

    if (!models.length) throw new Error('伺服器未回傳可用的模型列表')
    return models
  } catch (error) {
    if (error instanceof Error && error.message) {
      if (error.name === 'APIConnectionError' || error.message.includes('fetch')) {
        throw new Error('跨網域 (CORS) 限制：Google OpenAI 相容端點在瀏覽器端發起請求時會被 CORS 阻擋。請使用預載選單中的熱門模型，即可直接連線。')
      }
      throw error
    }
    throw error
  }
}

export async function interpretOracle(
  settings: AiSettings,
  question: string,
  deck: OracleDeck,
  verse: OracleVerse,
) {
  if (!settings.apiKey.trim()) throw new Error('請先設定 API Key')
  if (!settings.model.trim()) throw new Error('請填寫模型名稱')

  const storiesText = verse.stories?.length ? `\n籤詩故事：\n${verse.stories.join('\n')}` : ''
  const attrText = verse.attributes && Object.keys(verse.attributes).length
    ? `\n籤詩屬性：\n${Object.entries(verse.attributes).map(([k, v]) => `${k}：${v}`).join('；')}`
    : ''
  const expText = verse.explanations?.length ? `\n傳統解說明：\n${verse.explanations.join('\n')}` : ''

  const userContent = `所問之事：${question.trim()}\n籤庫：${deck.name}\n籤號：第 ${verse.number} 籤${verse.fortune ? `（${verse.fortune}）` : ''}${verse.ganzhi ? ` 【${verse.ganzhi}】` : ''}${verse.element ? ` ${verse.element}` : ''}\n籤詩：\n${verse.lines.join('\n')}${storiesText}${attrText}${expText}`

  // Native CORS-friendly Google Gemini REST API fallback for GitHub Pages
  if (settings.baseUrl.includes('generativelanguage.googleapis.com')) {
    try {
      const modelName = settings.model.trim()
      const formattedModelPath = modelName.startsWith('models/') ? modelName : `models/${modelName}`
      const googleNativeUrl = `https://generativelanguage.googleapis.com/v1beta/${formattedModelPath}:generateContent?key=${settings.apiKey.trim()}`

      const res = await fetch(googleNativeUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [{ text: `${systemPrompt}\n\n${userContent}` }],
            },
          ],
          generationConfig: {
            temperature: 0.55,
          },
        }),
      })

      if (res.ok) {
        const data = await res.json()
        const candidateText = data?.candidates?.[0]?.content?.parts?.[0]?.text
        if (typeof candidateText === 'string' && candidateText.length > 0) {
          const cleaned = removeThoughtTags(candidateText)
          if (cleaned) return cleaned
        }
      }
    } catch {
      // Fallback to OpenAI SDK
    }
  }

  const openai = createOpenAIClient(settings.apiKey, settings.baseUrl)

  try {
    const completion = await openai.chat.completions.create({
      model: settings.model.trim(),
      temperature: 0.55,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userContent },
      ],
    })

    const rawContent = completion.choices?.[0]?.message?.content
    const text = typeof rawContent === 'string' ? rawContent : ''

    const cleaned = removeThoughtTags(text)
    if (!cleaned) throw new Error('API 沒有回傳解籤內容')
    return cleaned
  } catch (error) {
    if (error instanceof Error && error.message) {
      if (error.name === 'APIConnectionError' || error.message.includes('fetch')) {
        throw new Error('無法連線；請確認網址、網路與 API 是否允許瀏覽器跨網域請求')
      }
      throw error
    }
    throw error
  }
}
