/**
 * Capture a full-page PNG (screenshot.png in this directory).
 *
 * Local app (build + preview on :3000, then screenshot):
 *   npm run capture.mjs
 *
 * Arbitrary URL (no build — opens the URL in Playwright):
 *   npm run capture.mjs -- https://example.com/path
 */
import { build, preview, loadConfigFromFile, mergeConfig } from 'vite'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'

const root = fileURLToPath(new URL('.', import.meta.url))
const output = path.join(root, 'screenshot.png')
const configPath = path.join(root, 'vite.config.ts')

/** First positional arg after `node capture.mjs` (after npm `--`, args start here). */
const urlFromCli = process.argv[2]?.trim()
const useExternalUrl =
  urlFromCli &&
  (urlFromCli.startsWith('http://') || urlFromCli.startsWith('https://'))

let exitCode = 0
try {
  const browser = await chromium.launch()
  const page = await browser.newPage()

  if (useExternalUrl) {
    await page.goto(urlFromCli, { waitUntil: 'load' })
    await page.screenshot({ path: output, fullPage: true })
  } else {
    const loaded = await loadConfigFromFile(
      { command: 'build', mode: 'production' },
      configPath,
      root,
    )
    if (!loaded) throw new Error(`Could not load ${configPath}`)

    await build(mergeConfig(loaded.config, { configFile: false, mode: 'production' }))

    const server = await preview(
      mergeConfig(loaded.config, {
        configFile: false,
        mode: 'production',
        preview: { port: 3000, strictPort: true },
      }),
    )
    const url = server.resolvedUrls?.local[0] ?? 'http://localhost:3000/'
    try {
      await page.goto(url, { waitUntil: 'load' })
      await page.screenshot({ path: output, fullPage: true })
    } finally {
      await server.close()
    }
  }

  await browser.close()
  console.log(`Wrote ${output}`)
} catch (err) {
  console.error(err)
  exitCode = 1
}
process.exit(exitCode)
