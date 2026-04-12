require('dotenv').config();
const express = require('express');
const cors = require('cors');
const net = require('net');
const connectDB = require('./config/db');
const authRoutes = require('./routes/auth');
const attendanceRoutes = require('./routes/attendance');

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

// ── Auto-find a free port (no more EADDRINUSE crashes) ──────────────
function findFreePort(startPort, maxAttempts = 20) {
  return new Promise((resolve, reject) => {
    let attempt = 0;

    function tryPort(port) {
      if (attempt >= maxAttempts) {
        return reject(new Error(`Could not find a free port after ${maxAttempts} attempts`));
      }
      attempt++;

      const server = net.createServer();
      server.once('error', (err) => {
        if (err.code === 'EADDRINUSE') {
          console.log(`⚠️  Port ${port} is in use, trying ${port + 1}...`);
          tryPort(port + 1);
        } else {
          reject(err);
        }
      });
      server.once('listening', () => {
        server.close(() => resolve(port));
      });
      server.listen(port);
    }

    tryPort(startPort);
  });
}

// ── Start server ────────────────────────────────────────────────────
async function startServer() {
  // 1. Connect to MongoDB first
  await connectDB();

  // 2. Find a free port (auto-increments if the preferred port is taken)
  const preferredPort = Number(process.env.PORT) || 5000;
  const port = await findFreePort(preferredPort);

  app.listen(port, () => {
    console.log('');
    console.log('🚀 ════════════════════════════════════');
    console.log(`🚀  Server running on port ${port}`);
    console.log(`🚀  API: http://localhost:${port}/api`);
    if (port !== preferredPort) {
      console.log(`🚀  (preferred port ${preferredPort} was busy)`);
    }
    console.log('🚀 ════════════════════════════════════');
    console.log('');
  });
}

startServer().catch((err) => {
  console.error('❌ Failed to start server:', err.message);
  process.exit(1);
});
