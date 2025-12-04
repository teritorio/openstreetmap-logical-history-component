import type { UserConfig } from 'vite'
import { resolve } from 'node:path'
import process from 'node:process'
import { sentryVitePlugin } from '@sentry/vite-plugin'
import vue from '@vitejs/plugin-vue'
import { defineConfig, loadEnv } from 'vite'
import dts from 'vite-plugin-dts'

export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd())

  const baseConfig = {
    resolve: {
      alias: {
        '@': resolve(__dirname, './src'),
      },
    },
    plugins: [
      vue(),
      sentryVitePlugin({
        authToken: env.VITE_SENTRY_AUTH_TOKEN,
        sourcemaps: {
          filesToDeleteAfterUpload: [
            './**/*.map',
            '.*/**/public/**/*.map',
            './dist/**/client/**/*.map',
          ],
        },
        telemetry: false,
      }),
    ],
  } satisfies UserConfig

  // Demo build config
  if (command === 'build' && mode === 'demo') {
    return {
      base: '/openstreetmap-logical-history-component/',
      build: {
        outDir: './demo-dist',
        sourcemap: true,
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
    build: {
      sourcemap: true,
    },
    server: {
      proxy: {
        '/api': {
          target: env.VITE_API_ENDPOINT,
          changeOrigin: true,
        },
      },
    },
  }
})
