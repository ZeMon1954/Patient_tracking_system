const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();
const { runDailyCheck } = require('./services/cronJobs'); // Start cron jobs and import manual trigger

const pool = require('./db');
const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());

// Serve static files for uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);

// ✅ เพิ่มตรงนี้
const serviceUnitsRouter = require('./routes/serviceUnits');
app.use('/api/service-units', serviceUnitsRouter);

// ✅ Users Management
const usersRouter = require('./routes/users');
app.use('/api/users', usersRouter);

// ✅ Reports
const reportsRouter = require('./routes/reports');
app.use('/api/reports', reportsRouter);

// ✅ Patients
const patientsRouter = require('./routes/patients');
app.use('/api/patients', patientsRouter);

// ✅ Referrals
const referralsRouter = require('./routes/referrals');
app.use('/api/referrals', referralsRouter);

// ✅ Tracking
const trackingRouter = require('./routes/tracking');
app.use('/api/tracking', trackingRouter);

// ✅ Dashboard
const dashboardRouter = require('./routes/dashboard');
app.use('/api/dashboard', dashboardRouter);

// ✅ Notifications
const notificationsRouter = require('./routes/notifications');
app.use('/api/notifications', notificationsRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  // 🔥 รันตรวจสอบทันทีตอนเปิด Server เพื่อให้แจ้งเตือนเคสขาดนัดได้เลย
  setTimeout(() => {
    runDailyCheck().catch(err => console.error('Initial check failed:', err));
  }, 3000);
});