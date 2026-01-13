import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'url';

/**
 * Vite configuration for mirador-annotations
 */
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    base: process.env.GITHUB_PAGES ? (process.env.BASE_PATH || '/mirador-annotations/') : '/',

    ...(
      process.env.GITHUB_PAGES ? {
        build: {
          emptyOutDir: true,
          outDir: 'dist',
          rollupOptions: {
            external: ['__tests__/*', '__mocks__/*'],
            input: fileURLToPath(new URL('./demo/src/index.html', import.meta.url)),
          },
          sourcemap: true,
        },
      }
        : {
          build: {
            lib: {
              entry: './src/index.js',
              fileName: (format) => (format === 'umd' ? 'mirador-annotations.js' : 'mirador-annotations.es.js'),
              formats: ['es', 'umd'],
              name: 'MiradorAnnotation',
            },
            rollupOptions: {
              external: [
                'react',
                'react-dom',
                '@emotion/react',
                '@emotion/styled',
                '@mui/material',
                '@mui/system',
                '@mui/icons-material',
                'mirador',
                'react-i18next',
              ],
              output: {
                assetFileNames: 'mirador-annotations.[ext]',
                globals: {
                  '@emotion/react': 'emotionReact',
                  '@emotion/styled': 'emotionStyled',
                  '@mui/icons-material': 'MuiIcons',
                  '@mui/material': 'MaterialUI',
                  '@mui/system': 'MuiSystem',
                  mirador: 'Mirador',
                  react: 'React',
                  'react-dom': 'ReactDOM',
                  'react-i18next': 'reactI18next',
                },
              },
            },
            sourcemap: true,
          },
        }
    ),

    define: {
      global: 'globalThis',
      'process.env.FIREBASE_API_KEY': JSON.stringify(env.FIREBASE_API_KEY),
      'process.env.FIREBASE_APP_ID': JSON.stringify(env.FIREBASE_APP_ID),
      'process.env.FIREBASE_AUTH_DOMAIN': JSON.stringify(env.FIREBASE_AUTH_DOMAIN),
      'process.env.FIREBASE_MESSAGING_SENDER_ID': JSON.stringify(env.FIREBASE_MESSAGING_SENDER_ID),
      'process.env.FIREBASE_PROJECT_ID': JSON.stringify(env.FIREBASE_PROJECT_ID),
      'process.env.FIREBASE_STORAGE_BUCKET': JSON.stringify(env.FIREBASE_STORAGE_BUCKET),
    },

    esbuild: {
      exclude: [],
      include: [/__tests__\/.*\.(js|jsx)$/, /src\/.*\.jsx?$/],
      loader: 'jsx',
    },

    optimizeDeps: {
      esbuildOptions: {
        plugins: [
          {
            name: 'load-js-files-as-jsx',
            setup(build) {
              build.onLoad({ filter: /(src|__tests__)\/.*\.js$/ }, async (args) => ({
                contents: await fs.readFile(args.path, 'utf8'),
                loader: 'jsx',
              }));
            },
          },
        ],
      },
    },

    plugins: [
      react(),
      {
        closeBundle: async () => {
          if (process.env.GITHUB_PAGES) {
            const distDir = path.resolve('dist');
            const demoSrcDir = path.resolve(distDir, 'demo', 'src');

            try {
              const demoSrcStats = await fs.stat(demoSrcDir);
              if (demoSrcStats.isDirectory()) {
                console.log('Moving files from demo/src to root directory...');
                const files = await fs.readdir(demoSrcDir);
                const copyPromises = files.map(async (file) => {
                  const srcPath = path.join(demoSrcDir, file);
                  const destPath = path.join(distDir, file);
                  const stats = await fs.stat(srcPath);
                  if (stats.isFile()) {
                    await fs.copyFile(srcPath, destPath);
                    console.log(`Copied: ${srcPath} -> ${destPath}`);
                  }
                });
                await Promise.all(copyPromises);
                console.log('Files moved successfully.');
              }
            } catch (err) {
              if (err.code !== 'ENOENT') {
                console.error('Error processing output files:', err);
              }
            }
          }
        },
        name: 'fix-output-structure',
      },
    ],

    resolve: {
      alias: {
        '@tests/': fileURLToPath(new URL('./__tests__', import.meta.url)),
      },
      dedupe: [
        '@emotion/react',
        '@emotion/styled',
        '@emotion/cache',
        'react',
        'react-dom',
      ],
    },

    server: {
      open: '/demo/src/index.html',
      port: 4447,
    },
  };
});
