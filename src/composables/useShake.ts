import { onUnmounted, ref } from 'vue'

type MotionPermission = { requestPermission?: () => Promise<'granted' | 'denied'> }

/**
 * Detects a deliberate shake (several strong jolts within ~1s).
 * iOS requires `enable()` to be called from a tap; Android grants silently.
 */
export function useShake(onShake: () => void, { threshold = 18, jolts = 3, windowMs = 1000 } = {}) {
  const supported =
    typeof window !== 'undefined' &&
    'DeviceMotionEvent' in window &&
    window.matchMedia('(pointer: coarse)').matches
  const active = ref(false)
  const denied = ref(false)

  let hits: number[] = []
  let cooldownUntil = 0

  function onMotion(e: DeviceMotionEvent) {
    const a = e.accelerationIncludingGravity ?? e.acceleration
    if (!a || a.x == null || a.y == null || a.z == null) return
    // subtract gravity (~9.8) from the magnitude
    const force = Math.abs(Math.hypot(a.x, a.y, a.z) - 9.8)
    const now = performance.now()
    if (now < cooldownUntil || force < threshold) return
    hits = hits.filter((t) => now - t < windowMs)
    hits.push(now)
    if (hits.length >= jolts) {
      hits = []
      cooldownUntil = now + 4000
      onShake()
    }
  }

  async function enable() {
    if (!supported || active.value) return active.value
    const DME = window.DeviceMotionEvent as unknown as MotionPermission
    if (typeof DME.requestPermission === 'function') {
      try {
        if ((await DME.requestPermission()) !== 'granted') {
          denied.value = true
          return false
        }
      } catch {
        denied.value = true
        return false
      }
    }
    window.addEventListener('devicemotion', onMotion)
    active.value = true
    return true
  }

  function disable() {
    window.removeEventListener('devicemotion', onMotion)
    active.value = false
  }

  onUnmounted(disable)
  return { supported, active, denied, enable, disable }
}
