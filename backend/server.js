require('dotenv').config();

const express = require('express');
const cors = require('cors');

const connectDB = require('./config/db');
const farmRoutes = require('./routes/farmroutes');
const quickCheckRoutes = require('./routes/quickCheckRoutes');
const marketRoutes = require('./routes/marketRoutes');
const authRoutes = require('./routes/authRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const advisoryRoutes = require('./routes/advisoryRoutes');

const app = express();

// ==============================
// GLOBAL MIDDLEWAR
// ==============================
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Request logging (for debugging)
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.url}`);
  next();
});

// ==============================
// MAIN ROUTES
// ==============================

app.use('/api/auth', authRoutes);
app.use('/api/market', marketRoutes);
app.use('/api/farms', quickCheckRoutes);
app.use('/api/farms', farmRoutes);
app.use('/api/advisory', advisoryRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Connectivity test routes (use from phone browser: http://YOUR_PC_IP:5000/test)
app.get('/test', (req, res) => {
  res.json({ message: 'Backend working' });
});

app.get('/api/test', (req, res) => {
  res.json({ message: 'Backend is reachable from mobile' });
});

// Basic health check (use from phone browser: http://YOUR_PC_IP:5000/health)
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// 404 handler
app.use((req, res) => {
  console.warn(`[404] ${req.method} ${req.url} - Not found`);
  res.status(404).json({ message: 'Not found' });
});

// ==============================
// GLOBAL ERROR HANDLER
// ==============================
app.use((err, req, res, next) => {
  console.error('[ERROR] Uncaught error:', err.message);
  console.error('[ERROR] Stack:', err.stack);
  console.error('[ERROR] Request:', req.method, req.url);

  const statusCode = err.statusCode || err.status || 500;
  res.status(statusCode).json({
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// ==============================
// UNCAUGHT EXCEPTION & REJECTION
// ==============================
process.on('uncaughtException', (err) => {
  console.error('[FATAL] Uncaught Exception:', err.message);
  console.error('[FATAL] Stack:', err.stack);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[FATAL] Unhandled Rejection at:', promise);
  console.error('[FATAL] Reason:', reason);
  process.exit(1);
});

// ==============================
// START SERVER
// ==============================
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();
    console.log('[STARTUP] MongoDB connected successfully');

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Listening on 0.0.0.0 (LAN accessible — use your PC IPv4 in mobile-app/.env)`);
    });
  } catch (error) {
    console.error('[FATAL] Failed to start server:', error.message);
    console.error('[FATAL] Stack:', error.stack);
    process.exit(1);
  }
};

startServer();

module.exports = app;
