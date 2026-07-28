<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'

const canvasRef = ref<HTMLCanvasElement | null>(null)
let animId: number | null = null

interface SmokeCloud {
  x: number
  y: number
  baseRadius: number
  maxRadius: number
  vx: number
  vy: number
  alpha: number
  maxAlpha: number
  life: number
  maxLife: number
  swayFreq: number
  swayAmp: number
  hueType: 'gold' | 'silver' | 'amber'
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

  const particles: SmokeCloud[] = []
  const maxParticles = 28 // Fewer, larger, silky clean clouds for premium feel

  function createCloud(initialSpawn = false): SmokeCloud {
    const maxLife = 350 + Math.random() * 350
    const startY = initialSpawn ? Math.random() * height : height + Math.random() * 80
    const randType = Math.random()
    const hueType = randType < 0.5 ? 'gold' : randType < 0.8 ? 'silver' : 'amber'

    return {
      x: Math.random() * width,
      y: startY,
      baseRadius: 40 + Math.random() * 30,
      maxRadius: 120 + Math.random() * 80,
      vx: (Math.random() - 0.5) * 0.2,
      vy: -(Math.random() * 0.35 + 0.2),
      alpha: 0,
      maxAlpha: 0.05 + Math.random() * 0.04, // Extremely low opacity for crystal-clean silk veil
      life: initialSpawn ? Math.random() * maxLife : 0,
      maxLife,
      swayFreq: 0.008 + Math.random() * 0.01,
      swayAmp: 0.5 + Math.random() * 0.8,
      hueType,
    }
  }

  for (let i = 0; i < maxParticles; i++) {
    particles.push(createCloud(true))
  }

  function draw() {
    if (!ctx) return
    ctx.clearRect(0, 0, width, height)

    // Clean Dark Slate Background
    ctx.fillStyle = '#121212'
    ctx.fillRect(0, 0, width, height)

    // Subtle Cinnabar Crimson Radial Ambient Vignette
    const bgGradient = ctx.createRadialGradient(
      width / 2,
      height * 0.3,
      100,
      width / 2,
      height * 0.5,
      Math.max(width, height) * 0.7,
    )
    bgGradient.addColorStop(0, 'rgba(139, 0, 0, 0.06)')
    bgGradient.addColorStop(1, 'rgba(18, 18, 18, 0)')

    ctx.fillStyle = bgGradient
    ctx.fillRect(0, 0, width, height)

    // Use 'screen' composite mode so overlapping clouds create clean ethereal light instead of muddy dark spots!
    ctx.globalCompositeOperation = 'screen'

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i]
      p.life++
      
      p.x += p.vx + Math.sin(p.life * p.swayFreq) * p.swayAmp
      p.y += p.vy

      const progress = p.life / p.maxLife

      // Smooth fade in & fade out
      if (progress < 0.25) {
        p.alpha = (progress / 0.25) * p.maxAlpha
      } else if (progress > 0.65) {
        p.alpha = ((1 - progress) / 0.35) * p.maxAlpha
      } else {
        p.alpha = p.maxAlpha
      }

      ctx.save()

      const currentRadius = p.baseRadius + (p.maxRadius - p.baseRadius) * progress

      const smokeGrad = ctx.createRadialGradient(
        p.x,
        p.y,
        0,
        p.x,
        p.y,
        currentRadius,
      )

      const alphaVal = Math.max(0, p.alpha)

      if (p.hueType === 'gold') {
        // Champagne Gold Wisps
        smokeGrad.addColorStop(0, `rgba(243, 229, 171, ${alphaVal})`)
        smokeGrad.addColorStop(0.5, `rgba(212, 175, 55, ${alphaVal * 0.4})`)
        smokeGrad.addColorStop(1, 'rgba(212, 175, 55, 0)')
      } else if (p.hueType === 'silver') {
        // Pearl Silver-White Wisps
        smokeGrad.addColorStop(0, `rgba(235, 230, 225, ${alphaVal * 0.9})`)
        smokeGrad.addColorStop(0.5, `rgba(190, 185, 180, ${alphaVal * 0.3})`)
        smokeGrad.addColorStop(1, 'rgba(190, 185, 180, 0)')
      } else {
        // Warm Cinnabar Amber Wisps
        smokeGrad.addColorStop(0, `rgba(255, 200, 140, ${alphaVal * 0.8})`)
        smokeGrad.addColorStop(0.5, `rgba(212, 140, 70, ${alphaVal * 0.3})`)
        smokeGrad.addColorStop(1, 'rgba(212, 140, 70, 0)')
      }

      ctx.beginPath()
      ctx.arc(p.x, p.y, currentRadius, 0, Math.PI * 2)
      ctx.fillStyle = smokeGrad
      ctx.fill()

      ctx.restore()

      if (p.life >= p.maxLife || p.y < -120) {
        particles[i] = createCloud(false)
      }
    }

    // Reset composite mode to default
    ctx.globalCompositeOperation = 'source-over'

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
