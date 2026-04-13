import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { existsSync, readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const backendRoot = path.resolve(__dirname, '../backend');
const devPortFile = path.join(backendRoot, '.dev-port');

/** Preferred PORT from backend/.env (used before .dev-port exists or as fallback). */
function readBackendPortFromEnvFile() {
  const envPath = path.join(backendRoot, '.env');
  try {
    if (!existsSync(envPath)) return 5000;
    const text = readFileSync(envPath, 'utf8');
    const m = text.match(/^\s*PORT\s*=\s*(\d+)/m);
    if (m) {
      const n = Number(m[1]);
      if (Number.isInteger(n) && n > 0 && n < 65536) return n;
    }
  } catch {
    /* ignore */
  }
  return 5000;
}

function resolveApiProxyTarget() {
  try {
    if (existsSync(devPortFile)) {
      const p = Number(readFileSync(devPortFile, 'utf8').trim());
      if (Number.isInteger(p) && p > 0 && p < 65536) {
        return `http://127.0.0.1:${p}`;
      }
    }
  } catch {
    /* ignore */
  }
  return `http://127.0.0.1:${readBackendPortFromEnvFile()}`;
}

/** Dynamic proxy: backend may bump PORT when .env PORT is busy (writes backend/.dev-port). */
function devApiProxyPlugin(envOverride) {
  return {
    name: 'dev-api-proxy',
    configureServer(server) {
      const fallback = `http://127.0.0.1:${readBackendPortFromEnvFile()}`;
      const proxy = createProxyMiddleware({
        pathFilter: '/api',
        target: fallback,
        changeOrigin: true,
        router: () => envOverride || resolveApiProxyTarget(),
      });
      server.middlewares.use(proxy);
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const apiTargetOverride = env.VITE_DEV_PROXY_TARGET || '';
  // Default to root for cloud hosts (e.g. Vercel). Override for GitHub Pages if needed.
  const basePath = env.VITE_BASE_PATH || '/';

  return {
    plugins: [
      react(),
      ...(mode === 'development' ? [devApiProxyPlugin(apiTargetOverride)] : []),
    ],
    base: basePath,
    server: {
      port: 5173,
    },
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
    },
  };
});
