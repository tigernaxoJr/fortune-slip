# 靈籤閣 · 素材生成 Prompt（暫存）

生成完成後放到 `public/assets/`，**檔名需完全一致**。每張圖都是選用：缺檔時頁面會自動退回程式繪製的版本，所以可以分批補。

整體風格關鍵字（每張都適用）：台灣道教宮廟、夜間、朱漆、金箔、香煙、燭光；低飽和、暖色、電影感；**畫面中不要出現任何文字、浮水印、人物臉部**。

---

## 1. `bg-temple-hall.webp` — 全站背景

- 尺寸：2400 × 1350（16:9），webp，品質 75，目標 < 400 KB
- 用途：固定在最底層，程式會以 22% 不透明度 + luminosity 混合 + 由上往下漸隱 疊上，所以**畫面上半部要有內容、下半部要暗**。

```
Interior of a traditional Taiwanese Taoist temple main hall at night, viewed from the entrance looking toward the altar, deep shadows, ornate carved wooden beams and dougong brackets painted cinnabar red and gold leaf, rows of hanging red lanterns glowing softly, thick incense smoke drifting in volumetric light beams, distant altar candles, rich warm low-key lighting, cinematic, shallow depth of field, film grain, no people, no text, no signage, dark lower third fading to near-black, 16:9
```
Negative：`text, letters, calligraphy, signage, watermark, people, faces, statues close-up, bright daylight, oversaturated, cartoon`

---

## 2. `hero-altar.webp` — 首頁主視覺（標題後方）

- 尺寸：2000 × 1200，webp，< 350 KB
- 用途：置中於標題後方，40% 不透明度，**四周會被橢圓遮罩淡出**，主體請置中、邊緣全黑。

```
Still life on a Taoist temple altar table at night, centered composition: a red lacquered bamboo fortune-stick cylinder (qiantong) filled with wooden fortune sticks, a bronze tripod incense burner with three burning incense sticks, a pair of red crescent divination blocks (jiaobei) on the table, two tall red candles, soft golden candlelight, wisps of smoke curling upward, dark carved wooden backdrop, edges vignetted to pure black, cinematic, photorealistic, warm amber and cinnabar palette, film grain, no text
```
Negative：`text, characters, calligraphy, labels, watermark, people, hands, bright background, cluttered`

---

## 3. `paper-xuan.webp` — 籤詩宣紙紋理

- 尺寸：1600 × 2400（直式），webp，< 300 KB
- 用途：籤詩卡片底紋（multiply 混合），**要淡、均勻、可看清上面的黑字**。

```
Flat scan of aged handmade Chinese xuan rice paper, warm cream color, visible long plant fibers and subtle mottling, faint foxing spots near edges, soft uneven tone, top-down even lighting, no folds, no text, no stains in the center, seamless texture, high detail
```
Negative：`text, writing, ink, characters, strong shadows, folds, tears, vignette, objects`

---

## 4. `paper-talisman.webp` — 符紙紋理（AI 解籤面板）

- 尺寸：1200 × 2400（直式），webp，< 300 KB
- 用途：AI 神諭面板底紋（multiply），請保持**淺黃、乾淨**，紅框和「敕令」程式會畫。

```
Flat scan of a blank Taoist talisman paper (fu paper), bright traditional yellow, thin coarse paper with visible fibers and slight translucency, subtle uneven dye tone, very faint darker edges, top-down even lighting, completely blank, no symbols, no text, no red ink, seamless texture
```
Negative：`text, symbols, talisman script, red ink, stamps, seals, characters, folds, shadows`

---

## 5. `lamp-lotus.png` — 蓮花燈（點燈祈福）

- 尺寸：512 × 512，**透明背景 PNG**，< 150 KB
- 用途：四種燈共用；未點亮時程式會自動灰階、調暗。燈火要點亮的狀態。

```
A single traditional Taoist temple lotus oil lamp, golden lotus-petal shaped holder with gentle engraved details, small warm flame burning in the center with soft glow, three-quarter front view, isolated on transparent background, product render, soft rim light, warm gold and amber tones, no text
```
Negative：`background, table, hands, text, multiple lamps, electric bulb`

---

## 6. `ornament-xiangyun.png` — 祥雲裝飾（預留，尚未使用）

- 尺寸：1200 × 300，透明背景 PNG
- 用途：預留給區塊分隔 / 頁尾，產出後我再接上。

```
Traditional Chinese auspicious cloud (xiangyun) ornament, horizontal symmetrical border motif, thin elegant gold-leaf line art with subtle metallic sheen, swirling ruyi cloud scrolls, isolated on transparent background, flat front view, no text
```

---

## 7. `og-cover.jpg` — 社群分享縮圖

- 尺寸：1200 × 630，jpg，< 250 KB
- 用途：分享到 LINE / FB 時的預覽圖。**標題「靈籤閣」建議生成後自己用設計工具壓上去**（AI 生中文字容易錯）。

```
Cinematic banner of a Taoist temple fortune-telling scene at night: a red lacquered fortune-stick cylinder on the left third with one wooden stick raised above the others, glowing with golden light, incense smoke swirling, faint Bagua trigram ring glowing in gold behind it, deep black and cinnabar red background with warm candlelight, empty dark space on the right two-thirds for a title, no text
```

---

# 音效（選用）

放到 `public/assets/sfx/`，**mp3、檔名完全一致**。沒放檔案時程式會用 Web Audio 即時合成，所以現在已經有聲音（右上角喇叭開啟）；放了檔案就自動改用錄音。適合用 ElevenLabs Sound Effects、Stable Audio 等音效生成工具。

建議：單聲道、44.1 kHz、128 kbps、頭尾不留空白、音量正規化到 -14 LUFS 左右。

## `shake.mp3` — 搖籤筒（約 2.5 秒，程式會在 2.1 秒時截斷）
```
Close-up foley of a bamboo fortune-stick cylinder being shaken rhythmically by hand, dozens of thin wooden sticks rattling and clacking against each other inside a lacquered wooden tube, about four shake cycles, dry room, intimate, no music, no voices
```

## `stick.mp3` — 一支籤落地（約 0.6 秒）
```
A single thin bamboo stick dropping out of a wooden cylinder and clattering onto a wooden altar table, two small bounces, crisp and close, no reverb tail, no music
```

## `jiao.mp3` — 擲筊落地（約 0.8 秒）
```
Two crescent-shaped wooden divination blocks (jiaobei) thrown onto a stone temple floor, solid hollow wooden clack on impact with a couple of small bounces and a short wobble, close-mic foley, slight stone room reflection, no music, no voices
```

## `bell.mp3` — 磬聲／聖筊確認（約 4 秒）
```
A single strike of a bronze Buddhist-Taoist temple bowl bell (qing), soft wooden mallet, warm pure tone with long shimmering decay, gentle temple hall reverb, calm and sacred, no music, no voices
```
