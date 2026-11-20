const { defineConfig, devices } = require('@playwright/test');
const path = require('node:path');

module.exports = defineConfig({
  testDir: __dirname,
  testMatch: '**/*.spec.cjs',
  timeout: 30000,
  expect: { timeout: 8000 },
  fullyParallel: false,
  workers: process.env.CI ? 2 : undefined,
  retries: 0,
  reporter: [
    ['list'],
    ['html', { outputFolder: path.resolve(__dirname, '..', 'playwright-report'), open: 'never' }],
  ],
  outputDir: path.resolve(__dirname, '..', 'playwright-results'),
  use: {
    baseURL: 'http://127.0.0.1:8765',
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
    actionTimeout: 12000,
    navigationTimeout: 12000,
    reducedMotion: 'reduce',
  },
  projects: [
    { name:'mobile-chromium', use:{...devices['iPhone 13'],browserName:'chromium'} },
    { name:'tablet-chromium', use:{browserName:'chromium',viewport:{width:820,height:1180},deviceScaleFactor:1} },
    { name:'desktop-chromium', use:{browserName:'chromium',viewport:{width:1440,height:900}} },
  ],
  webServer: {
    // The config lives in browser-tests/, but the pages are at repo root.
    cwd: require('node:path').resolve(__dirname,'..'),
    command: 'python3 -m http.server 8765 --bind 127.0.0.1',
    url: 'http://127.0.0.1:8765/',
    reuseExistingServer: !process.env.CI,
    timeout: 15000,
  },
});
