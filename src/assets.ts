/**
 * Generated art lives in /public/assets. Every image is optional:
 * components layer it over a procedural fallback, so a missing file
 * only means a slightly plainer look. Prompts: ASSET_PROMPTS.md
 */
export const assetUrl = (name: string) => `${import.meta.env.BASE_URL}assets/${name}`

export const ASSETS = {
  templeHall: assetUrl('bg-temple-hall.webp'),
  altarHero: assetUrl('hero-altar.webp'),
  paperXuan: assetUrl('paper-xuan.webp'),
  paperTalisman: assetUrl('paper-talisman.webp'),
  cloudOrnament: assetUrl('ornament-xiangyun.webp'),
  lotusLamp: assetUrl('lamp-lotus.webp'),
  shrineAltar: assetUrl('bg-shrine-altar.webp'),
  smokeWisp: assetUrl('smoke-wisp.webp'),
} as const

/** CSS custom-property value for an optional background layer. */
export const cssLayer = (url: string) => `url("${url}")`
