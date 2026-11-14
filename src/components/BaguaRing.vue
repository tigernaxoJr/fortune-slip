<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    size?: number
    showTaiji?: boolean
    showNames?: boolean
    spin?: boolean
    color?: string
    taijiDark?: string
  }>(),
  { size: 240, showTaiji: true, showNames: true, spin: true, color: '#c9a45c', taijiDark: '#0c0907' },
)

// 先天八卦 (Fu Xi order), clockwise from top. Lines listed inner → outer (bottom → top line).
const trigrams = [
  { name: '乾', lines: [1, 1, 1] },
  { name: '兌', lines: [1, 1, 0] },
  { name: '離', lines: [1, 0, 1] },
  { name: '震', lines: [1, 0, 0] },
  { name: '坤', lines: [0, 0, 0] },
  { name: '艮', lines: [0, 0, 1] },
  { name: '坎', lines: [0, 1, 0] },
  { name: '巽', lines: [0, 1, 1] },
]

const R = 100 // viewBox is -120..120
const bars = computed(() =>
  trigrams.flatMap((t, i) =>
    t.lines.flatMap((yang, j) => {
      const y = -(56 + j * 9)
      const angle = i * 45
      return yang
        ? [{ key: `${i}-${j}`, x: -14, w: 28, y, angle }]
        : [
            { key: `${i}-${j}a`, x: -14, w: 11.5, y, angle },
            { key: `${i}-${j}b`, x: 2.5, w: 11.5, y, angle },
          ]
    }),
  ),
)
</script>

<template>
  <svg
    :width="size"
    :height="size"
    viewBox="-120 -120 240 240"
    aria-hidden="true"
    class="block"
  >
    <g :class="spin ? 'animate-spin-slow' : ''" style="transform-origin: 0 0">
      <circle :r="R + 8" fill="none" :stroke="color" stroke-opacity="0.35" stroke-width="0.6" />
      <circle :r="R - 2" fill="none" :stroke="color" stroke-opacity="0.25" stroke-width="0.6" stroke-dasharray="1 3" />
      <circle r="48" fill="none" :stroke="color" stroke-opacity="0.35" stroke-width="0.6" />
      <rect
        v-for="b in bars"
        :key="b.key"
        :x="b.x"
        :y="b.y - 2.6"
        :width="b.w"
        height="5.2"
        rx="0.6"
        :fill="color"
        :transform="`rotate(${b.angle})`"
      />
      <template v-if="showNames">
        <text
          v-for="(t, i) in trigrams"
          :key="t.name"
          x="0"
          :y="-(R - 6)"
          :transform="`rotate(${i * 45})`"
          text-anchor="middle"
          dominant-baseline="middle"
          font-size="11"
          font-family="Noto Serif TC, serif"
          font-weight="700"
          :fill="color"
          fill-opacity="0.85"
        >{{ t.name }}</text>
      </template>
    </g>

    <g v-if="showTaiji" class="animate-spin-slower" style="transform-origin: 0 0">
      <circle r="36" :fill="taijiDark" :stroke="color" stroke-width="1" />
      <path d="M0,-36 A36,36 0 0 1 0,36 A18,18 0 0 1 0,0 A18,18 0 0 0 0,-36 Z" :fill="color" />
      <circle cx="0" cy="-18" r="5" :fill="color" />
      <circle cx="0" cy="18" r="5" :fill="taijiDark" />
    </g>
  </svg>
</template>
