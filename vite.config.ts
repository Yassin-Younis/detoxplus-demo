import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { viteSingleFile } from 'vite-plugin-singlefile'

export default defineConfig({
  base: './',
  plugins: [react(), viteSingleFile()],
  build: {
    // inline every asset (fonts, voice clips) so dist/index.html is one file
    assetsInlineLimit: 100_000_000,
  },
})
