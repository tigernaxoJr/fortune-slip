# Vue 3 + TypeScript + Vite

This template should help get you started developing with Vue 3 and TypeScript in Vite. The template uses Vue 3 `<script setup>` SFCs, check out the [script setup docs](https://v3.vuejs.org/api/sfc-script-setup.html#sfc-script-setup) to learn more.

Learn more about the recommended Project Setup and IDE Support in the [Vue Docs TypeScript Guide](https://vuejs.org/guide/typescript/overview.html#project-setup).

## 原始 prompt

```
建立一個純前端網站(pnpm, vite, typescript, vue3)，參考網站:
http://www.chance.org.tw/%E7%B1%A4%E8%A9%A9%E9%9B%86/%E5%85%AD%E5%8D%81%E7%94%B2%E5%AD%90%E7%B1%A4/%E7%B1%A4%E8%A9%A9%E7%B6%B2%E2%80%A7%E5%85%AD%E5%8D%81%E7%94%B2%E5%AD%90%E7%B1%A4.htm
可以讓人抽:
六十甲子籤
觀音一百籤
雷雨師一百籤
保生大帝六十籤|
澎湖天后宮一百籤
東京淺草觀音寺一百籤
在程式面上保持模組化以抽換各種籤詩
在 UI 上要有中國傳統寺廟的感覺，帶入一些現代化高級感
保留AI解簽機制，讓人輸入 APIkey 去使用 opencompatible api ，搭配使用者所問之事漢所求得之籤詩給出解答。
```

## TODO

- [x] 必須包含網址中籤詩的各項屬性，包含籤詩故事、移居, 年冬 詞訟, 歲君, 六甲, 尋, 人人, 病, 作事... 等等
- [x] 解籤得到 <thought> tag, 避免顯示, 最好是用操作 llm api 的套件處理
- [x] 加入兩個預設 csp ，包含 openai compatible api url 給使用者選擇，然後可以透過 url, apikey 讀取 csp 的 models 給使用者選
