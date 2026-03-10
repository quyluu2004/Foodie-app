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
  build: {
    // ========================================
    // 🚀 Code Splitting & Bundle Optimization
    // ========================================
    rollupOptions: {
      output: {
        // Tách vendor libraries thành chunks riêng
        manualChunks: {
          // React core — cached lâu dài vì ít thay đổi
          'vendor-react': ['react', 'react-dom'],
          // Router — tách riêng vì dùng toàn app
          'vendor-router': ['react-router-dom'],
          // Charting — thư viện lớn, chỉ dùng trong Dashboard/Analytics
          'vendor-charts': ['recharts'],
          // Socket.IO — chỉ dùng trong Chat/Notifications
          'vendor-socket': ['socket.io-client'],
          // Icons
          'vendor-icons': ['lucide-react'],
        },
      },
    },
    // Tối ưu chunk size
    chunkSizeWarningLimit: 500, // Cảnh báo nếu chunk > 500KB
    // Source maps cho production debugging
    sourcemap: false,
  },
})
