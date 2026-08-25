const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const { initDatabase } = require('./config/database');
const routes = require('./routes');
const errorHandler = require('./middlewares/errorHandler');

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    app: 'Restaurant Management Backend API',
    time: new Date().toISOString()
  });
});

// API Routes
app.use('/api', routes);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} không tồn tại trên hệ thống` });
});

// Global Error Handler
app.use(errorHandler);

// Start server after DB initialization
async function startServer() {
  await initDatabase();

  app.listen(PORT, () => {
    console.log(`
  ═════════════════════════════════════════════════════════════
  🚀 RESTAURANT MANAGEMENT API SERVER ĐANG CHẠY
  📍 Địa chỉ: http://localhost:${PORT}
  📡 API Health: http://localhost:${PORT}/api/health
  🍽️ API Base: http://localhost:${PORT}/api
  ═════════════════════════════════════════════════════════════
    `);

    // Background task: Auto-assign unassigned dishes older than 5 minutes to Head Chef 'Trần Bếp Trưởng'
    setInterval(async () => {
      try {
        const { getPool, isMySQL, getMemoryStore } = require('./config/database');
        if (isMySQL()) {
          const pool = getPool();
          await pool.query(`
            UPDATE order_items 
            SET assigned_chef_name = 'Trần Bếp Trưởng'
            WHERE (assigned_chef_name IS NULL OR assigned_chef_name = '' OR assigned_chef_name = 'Chưa phân công')
              AND status = 'pending'
              AND TIMESTAMPDIFF(SECOND, created_at, CURRENT_TIMESTAMP) >= 300
          `);
        } else {
          const memory = getMemoryStore();
          for (const order of memory.orders || []) {
            for (const item of order.items || []) {
              const itemTime = new Date(item.created_at || order.created_at).getTime();
              if (!item.assigned_chef_name && item.status === 'pending' && (Date.now() - itemTime) >= 300000) {
                item.assigned_chef_name = 'Trần Bếp Trưởng';
              }
            }
          }
        }
      } catch (e) {
        // ignore
      }
    }, 10000);
  });
}

startServer();
