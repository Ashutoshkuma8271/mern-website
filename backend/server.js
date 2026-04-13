require('dotenv').config();
const express = require('express');
const cors = require('cors');
const net = require('net');
const fs = require('fs');
const path = require('path');
const connectDB = require('./config/db');
const authRoutes = require('./models/routes/auth');
const attendanceRoutes = require('./models/routes/attendance');

const app = express();

// Middleware — allow any localhost origin so the frontend port doesn't matter
app.use(cors({
  origin: (origin, cb) => cb(null, true),
  credentials: true,
}));
// Increase JSON body size limit for face descriptors (128 floats = ~1KB per descriptor)
app.use(express.json({ limit: '10mb' }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/attendance', attendanceRoutes);

// Health check
app.get('/', (req, res) => {
  res.json({
    status: 'running',
    message: 'API is healthy 🚀',
    timestamp: new Date().toISOString(),
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.originalUrl} not found` });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.stack);
  res.status(500).json({ message: 'Internal server error' });
});

// ── Port helpers (dev: Vite reads backend/.dev-port for the proxy) ──
const devPortFile = path.join(__dirname, '.dev-port');

function findFreePort(startPort, maxAttempts = 40) {
  return new Promise((resolve, reject) => {
    let attempt = 0;
    function tryPort(port) {
      if (attempt >= maxAttempts) {
        return reject(
          new Error(`No free TCP port found starting at ${startPort} (tried ${maxAttempts} ports).`)
        );
      }
      attempt += 1;
      const probe = net.createServer();
      probe.once('error', (err) => {
        if (err.code === 'EADDRINUSE') tryPort(port + 1);
        else reject(err);
      });
      probe.once('listening', () => {
        probe.close(() => resolve(port));
      });
      probe.listen(port);
    }
    tryPort(startPort);
  });
}

function writeDevPortFile(port) {
  try {
    fs.writeFileSync(devPortFile, String(port), 'utf8');
  } catch (e) {
    console.warn('Could not write .dev-port (Vite proxy may be wrong until restart):', e.message);
  }
}

function clearDevPortFile() {
  try {
    fs.unlinkSync(devPortFile);
  } catch {
    /* missing file is fine */
  }
}

// ── Start server ────────────────────────────────────────────────────
async function startServer() {
  await connectDB();

  const preferredPort = Number(process.env.PORT) || 5000;
  const port = await findFreePort(preferredPort);
  writeDevPortFile(port);

  if (port !== preferredPort) {
    console.log(
      `⚠️  Port ${preferredPort} was busy; using ${port} instead. (frontend dev proxy reads backend/.dev-port)`
    );
  }

  const server = app.listen(port, () => {
    console.log('');
    console.log('🚀 ════════════════════════════════════');
    console.log(`🚀  Server running on port ${port}`);
    console.log(`🚀  API: http://localhost:${port}/api`);
    console.log('🚀 ════════════════════════════════════');
    console.log('');
  });

  const shutdown = () => {
    clearDevPortFile();
    process.exit(0);
  };
  process.once('SIGINT', shutdown);
  process.once('SIGTERM', shutdown);

  server.on('error', (err) => {
    clearDevPortFile();
    if (err.code === 'EADDRINUSE') {
      console.error(`❌ Port ${port} became busy before listen finished. Try again.`);
    } else {
      console.error('❌ Server error:', err.message);
    }
    process.exit(1);
  });
}

startServer().catch((err) => {
  console.error('❌ Failed to start server:', err.message);
  process.exit(1);
});
