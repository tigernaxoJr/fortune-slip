<script setup lang="ts">
// 北斗七星 — 天樞 天璇 天璣 天權 玉衡 開陽 搖光
const stars = [
  { name: '天樞', x: 46, y: 34, r: 2.6 },
  { name: '天璇', x: 40, y: 92, r: 2.3 },
  { name: '天璣', x: 112, y: 108, r: 2.2 },
  { name: '天權', x: 122, y: 58, r: 1.8 },
  { name: '玉衡', x: 184, y: 48, r: 2.5 },
  { name: '開陽', x: 236, y: 56, r: 2.3 },
  { name: '搖光', x: 292, y: 96, r: 2.4 },
]
const path = 'M46,34 L40,92 L112,108 L122,58 Z M122,58 L184,48 L236,56 L292,96'

withDefaults(defineProps<{ labels?: boolean }>(), { labels: false })
</script>

<template>
  <svg viewBox="0 0 330 140" aria-hidden="true" class="block w-full h-auto overflow-visible">
    <defs>
      <radialGradient id="star-glow">
        <stop offset="0" stop-color="#fff3cf" stop-opacity="0.9" />
        <stop offset="1" stop-color="#ecd294" stop-opacity="0" />
      </radialGradient>
    </defs>
    <path :d="path" fill="none" stroke="#c9a45c" stroke-opacity="0.32" stroke-width="0.7" stroke-dasharray="2 3" />
    <g v-for="(s, i) in stars" :key="s.name">
      <circle :cx="s.x" :cy="s.y" :r="s.r * 5" fill="url(#star-glow)" opacity="0.35" />
      <circle
        :cx="s.x"
        :cy="s.y"
        :r="s.r"
        fill="#fff3cf"
        :style="{ animation: `twinkle ${3 + (i % 3)}s ease-in-out ${i * 0.45}s infinite` }"
      />
      <text
        v-if="labels"
        :x="s.x"
        :y="s.y + 16"
        text-anchor="middle"
        font-size="8"
        font-family="Noto Serif TC, serif"
        fill="#a8977a"
        letter-spacing="1"
      >{{ s.name }}</text>
    </g>
  </svg>
</template>
