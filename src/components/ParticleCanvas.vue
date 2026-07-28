<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'

const canvasRef = ref<HTMLCanvasElement | null>(null)
let animId: number | null = null

interface Particle {
  x: number
  y: number
  radius: number
  color: string
  vx: number
  vy: number
  alpha: number
  maxAlpha: number
  life: number
  maxLife: number
}

onMounted(() => {
  const canvas = canvasRef.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  let width = (canvas.width = window.innerWidth)
  let height = (canvas.height = window.innerHeight)

  const handleResize = () => {
    if (!canvas) return
    width = canvas.width = window.innerWidth
    height = canvas.height = window.innerHeight
  }

  window.addEventListener('resize', handleResize)

  const particles: Particle[] = []
  const maxParticles = 60

  const colors = [
    'rgba(212, 175, 55, ', // Gold
    'rgba(243, 229, 171, ', // Soft Light Gold
    'rgba(180, 160, 140, ', // Incense Smoke Gray
    'rgba(139, 0, 0, ',     // Cinnabar Crimson Glow
  ]

  function createParticle(): Particle {
    const isGold = Math.random() < 0.65
    const colorPrefix = isGold
      ? colors[Math.floor(Math.random() * 2)]
      : colors[Math.floor(Math.random() * 2) + 2]

    const maxLife = 180 + Math.random() * 240
    return {
      x: Math.random() * width,
      y: height + Math.random() * 50,
      radius: Math.random() * 14 + 4,
      color: colorPrefix,
      vx: (Math.random() - 0.5) * 0.4,
      vy: -(Math.random() * 0.5 + 0.3),
      alpha: 0,
      maxAlpha: Math.random() * 0.35 + 0.1,
      life: 0,
      maxLife,
    }
  }

  for (let i = 0; i < maxParticles; i++) {
    const p = createParticle()
    p.y = Math.random() * height
    p.life = Math.random() * p.maxLife
    particles.push(p)
  }

  function draw() {
    if (!ctx) return
    ctx.clearRect(0, 0, width, height)

    // Subtle radial dark gradient glow at center
    const bgGradient = ctx.createRadialGradient(
      width / 2,
      height * 0.35,
      10,
      width / 2,
      height * 0.35,
      Math.max(width, height) * 0.85,
    )
    bgGradient.addColorStop(0, 'rgba(139, 0, 0, 0.08)')
    bgGradient.addColorStop(0.5, 'rgba(26, 26, 26, 0.4)')
    bgGradient.addColorStop(1, 'rgba(18, 18, 18, 0.95)')

    ctx.fillStyle = bgGradient
    ctx.fillRect(0, 0, width, height)

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i]
      p.life++
      p.x += p.vx + Math.sin(p.life * 0.02) * 0.3
      p.y += p.vy

      const progress = p.life / p.maxLife
      if (progress < 0.2) {
        p.alpha = (progress / 0.2) * p.maxAlpha
      } else if (progress > 0.7) {
        p.alpha = ((1 - progress) / 0.3) * p.maxAlpha
      } else {
        p.alpha = p.maxAlpha
      }

      ctx.save()
      ctx.beginPath()
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2)
      ctx.fillStyle = `${p.color}${Math.max(0, p.alpha)})`

      // Add blur effect for smoke feel
      ctx.shadowColor = p.color.includes('212, 175, 55')
        ? 'rgba(212, 175, 55, 0.6)'
        : 'rgba(200, 180, 160, 0.3)'
      ctx.shadowBlur = p.radius * 1.8
      ctx.fill()
      ctx.restore()

      if (p.life >= p.maxLife || p.y < -50) {
        particles[i] = createParticle()
      }
    }

    animId = requestAnimationFrame(draw)
  }

  draw()

  onUnmounted(() => {
    window.removeEventListener('resize', handleResize)
    if (animId) cancelAnimationFrame(animId)
  })
})
</script>

<template>
  <canvas
    ref="canvasRef"
    class="fixed inset-0 pointer-events-none z-0 block w-full h-full"
  />
</template>
