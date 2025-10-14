/// <reference types="vitest" />
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    // Środowisko testowe
    environment: 'jsdom',
    
    // Globalne setup
    setupFiles: ['./tests/setup.ts'],
    
    // Wzorce plików testowych
    include: [
      'tests/unit/**/*.{test,spec}.{js,ts,tsx}',
      'tests/integration/**/*.{test,spec}.{js,ts,tsx}',
      'src/**/*.{test,spec}.{js,ts,tsx}'
    ],
    
    // Wykluczenia
    exclude: [
      'node_modules',
      'dist',
      'tests/e2e/**/*',
      '.astro'
    ],
    
    // Coverage
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      reportsDirectory: './coverage',
      include: [
        'src/**/*.{js,ts,tsx}'
      ],
      exclude: [
        'src/**/*.d.ts',
        'src/**/*.astro',
        'src/**/*.config.{js,ts}',
        'src/**/*.stories.{js,ts,tsx}',
        'src/**/index.{js,ts}',
        'src/env.d.ts'
      ],
      thresholds: {
        global: {
          branches: 90,
          functions: 90,
          lines: 90,
          statements: 90
        }
      }
    },
    
    // Timeout
    testTimeout: 10000,
    hookTimeout: 10000,
    
    // Watch mode
    watch: false,
    
    // UI mode
    ui: false,
    
    // Reporter
    reporter: ['verbose', 'html'],
    
    // Globals
    globals: true,
    
    // TypeScript
    typecheck: {
      tsconfig: './tsconfig.json'
    }
  },
  
  // Resolve paths
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '~': path.resolve(__dirname, './tests')
    }
  },
  
  // Define globals
  define: {
    'import.meta.vitest': 'undefined'
  }
})
