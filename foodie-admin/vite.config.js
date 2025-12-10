import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: false, // Cho phép đổi port nếu 5173 bị chiếm
    host: true, // Cho phép truy cập từ network
  },
})
