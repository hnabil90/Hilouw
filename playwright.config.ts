import 'dotenv/config'
import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  workers: 1,
  timeout: 30000,
  use: { baseURL: 'http://127.0.0.1:3200', browserName: 'chromium', trace: 'retain-on-failure' },
  outputDir: '.tools/browser-results',
  reporter: 'list',
  webServer: {
    command: 'node node_modules/next/dist/bin/next start -H 127.0.0.1 -p 3200',
    url: 'http://127.0.0.1:3200/api/health',
    timeout: 90000,
    reuseExistingServer: false,
    env: { NEXT_TELEMETRY_DISABLED: '1', RESEND_API_KEY: 'test-only-browser-mock', CONTACT_FROM: 'test@example.invalid', CONTACT_TO: 'test@example.invalid', TRUST_PROXY: 'true' },
  },
})
