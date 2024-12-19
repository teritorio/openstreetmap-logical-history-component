import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'

const baseConfig = {
  root: 'demo',
  publicDir: '../public',
}

export default defineConfig(({ command, mode }) => {
  // Demo build config
  if (command === 'build' && mode === 'demo') {
    return {
      base: '/openstreetmap-logical-history-component/',
      build: {
        outDir: '../demo-dist',
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
        sourcemap: true,
        rollupOptions: {
          external: ['maplibre-gl'], // Exclude maplibre-gl from the bundle
          output: {
            globals: {
              'maplibre-gl': 'maplibregl', // Define the global variable for maplibre-gl in the browser
            },
          },
        },
      },
      plugins: [
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
