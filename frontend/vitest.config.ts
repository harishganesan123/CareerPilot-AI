import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

// Component tests only. Kept separate from vite.config.ts so the app's
// dev server and production build configuration are untouched.
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.{ts,tsx}'],
  },
})
