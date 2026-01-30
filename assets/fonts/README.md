How to self-host Inter & JetBrains Mono fonts

1) Download woff2 files (subset for web) from the font provider or Google Fonts download option. Recommended weights:
   - Inter: 400, 600, 800
   - JetBrains Mono: 400, 500

2) Place files in this folder and name them exactly:
   - Inter-400.woff2
   - Inter-600.woff2
   - Inter-800.woff2
   - JetBrainsMono-400.woff2
   - JetBrainsMono-500.woff2

3) Verify in browser: look for successful fetches for /assets/fonts/*.woff2 in DevTools network tab.

Notes & best practices:
- Subset fonts (only glyphs/weights you need) to reduce file size.
- Set proper Cache-Control headers via your CDN (1 year with content hashed filenames).
- If you prefer automatic downloads, use a build step to fetch and subset fonts (not included here).