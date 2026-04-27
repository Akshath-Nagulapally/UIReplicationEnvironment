/**
 * Builds the app, starts preview on http://localhost:3000, captures screenshot.png
 * in this directory, then stops the server. (Preview mirrors production; no HMR noise.)
 * For interactive dev: `npm run dev` (also uses port 3000).
 */
import { build, preview, loadConfigFromFile, mergeConfig } from 'vite'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'

const root = fileURLToPath(new URL('.', import.meta.url))
const output = path.join(root, 'screenshot.png')
const configPath = path.join(root, 'vite.config.ts')

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

let exitCode = 0
try {
  const browser = await chromium.launch()
  const page = await browser.newPage()
  await page.goto(url, { waitUntil: 'load' })
  await page.screenshot({ path: output, fullPage: true })
  await browser.close()
  console.log(`Wrote ${output}`)
} catch (err) {
  console.error(err)
  exitCode = 1
} finally {
  await server.close()
}
process.exit(exitCode)
