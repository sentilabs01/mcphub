import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const gatewayPort = env.VITE_GATEWAY_PORT || '3002';

  return {
    plugins: [react()],
    optimizeDeps: {
      exclude: ['lucide-react'],
    },
    server: {
      proxy: {
        '/api': `http://localhost:${gatewayPort}`,
        '/mcp': `http://localhost:${gatewayPort}`,
      },
    },
  };
});