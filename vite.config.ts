import type { UserConfig } from 'vite'
import { resolve } from 'node:path'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'

const baseConfig = {
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  plugins: [vue()],
} satisfies UserConfig

export default defineConfig(({ command, mode }) => {
  // Demo build config
  if (command === 'build' && mode === 'demo') {
    return {
      base: '/openstreetmap-logical-history-component/',
      build: {
        outDir: './demo-dist',
      },
      ...baseConfig,
    }
  }

  // Library build config
  if (command === 'build') {
    return {
      build: {
        lib: {
          entry: './src/index.ts',
          name: 'OSMLoChaComponent',
          fileName: 'index',
        },
        copyPublicDir: false,
        sourcemap: true,
        rollupOptions: {
          external: ['maplibre-gl', 'vue'],
          output: {
            globals: {
              'vue': 'Vue',
              'maplibre-gl': 'maplibregl',
            },
          },
        },
      },
      ...baseConfig,
      plugins: [
        ...baseConfig.plugins,
        dts({
          rollupTypes: true,
        }),
      ],
    }
  }

  // Local Development config
  return {
    ...baseConfig,
    server: {
      proxy: {
        '/api': {
          target: 'https://osm-logical-history-dev.teritorio.xyz',
          changeOrigin: true,
        },
      },
    },
  }
})
