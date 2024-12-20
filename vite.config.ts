import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'

const baseConfig = {
  plugins: [vue()],
}

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
          entry: './src/main.ts',
          name: 'OSMLoChaComponent',
          fileName: 'index',
        },
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
      plugins: [
        vue(),
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
