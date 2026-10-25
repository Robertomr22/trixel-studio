import { existsSync } from 'node:fs';
import { defineConfig, devices } from '@playwright/test';

// Las pruebas usan .env.test (valores locales, nunca los de producción).
if (existsSync('.env.test')) process.loadEnvFile('.env.test');

const puerto = Number(process.env.PUERTO_PRUEBAS ?? 4399);

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'informes/playwright' }]],
  outputDir: 'informes/playwright-resultados',
  // Los módulos con base de datos aportan su preparación (migraciones en la BD de pruebas).
  ...(existsSync('tests/e2e/preparar.ts') && { globalSetup: './tests/e2e/preparar.ts' }),
  use: {
    baseURL: `http://127.0.0.1:${puerto}`,
    locale: 'es-ES',
    timezoneId: 'Europe/Madrid',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'movil', use: { ...devices['Desktop Chrome'], viewport: { width: 390, height: 844 } } },
    { name: 'tablet', use: { ...devices['Desktop Chrome'], viewport: { width: 820, height: 1180 } } },
    { name: 'escritorio', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } } },
  ],
  webServer: {
    command: `npm run preview -- --port ${puerto} --host 127.0.0.1 --ignore-lock`,
    url: `http://127.0.0.1:${puerto}`,
    reuseExistingServer: false,
    timeout: 60_000,
    env: { ...(process.env as Record<string, string>), PORT: String(puerto), HOST: '127.0.0.1' },
  },
});
