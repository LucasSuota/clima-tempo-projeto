import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { loadEnv } from 'vite';
import { defineConfig } from 'vitest/config';

export default defineConfig(({ mode }) => {
  // Reads PORT from the root .env (the same file the server uses) so both ports never diverge.
  const serverPort = loadEnv(mode, '..', '').PORT ?? '3333';

  return {
    plugins: [react(), tailwindcss()],
    server: {
      // The server's CORS_ORIGIN expects 5173: fail instead of silently moving to another port.
      port: 5173,
      strictPort: true,
      proxy: { '/api': `http://localhost:${serverPort}` },
    },
    test: {
      environment: 'node',
      include: ['test/**/*.test.ts'],
    },
  };
});
