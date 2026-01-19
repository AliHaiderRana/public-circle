import path from "path"
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    extensions: ['.mjs', '.js', '.mts', '.ts', '.jsx', '.tsx', '.json'],
  },
  optimizeDeps: {
    include: [
      'react-email-editor',
      'dayjs',
      'react-router-dom',
      'lucide-react',
      'axios',
      'swr',
    ],
    exclude: [],
  },
  build: {
    commonjsOptions: {
      include: [/react-email-editor/, /node_modules/],
    },
  },
})
