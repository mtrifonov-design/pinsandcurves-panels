import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/pinsandcurves-panels/',
  // build: {
  //   terserOptions: {
  //     keep_classnames: true,
  //     keep_fnames: true,
  //   },
  // }
  esbuild: {
    minifyIdentifiers: false,
    keepNames: true,
  },
})
