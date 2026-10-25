/// <reference types="vitest/config" />
import { getViteConfig } from 'astro/config';

export default getViteConfig({
  test: {
    include: ['tests/unit/**/*.test.ts', 'tests/integracion/**/*.test.ts'],
    passWithNoTests: true,
    fileParallelism: false,
  },
});
