require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/database');
const groqService = require('./services/groqService');
const cacheService = require('./services/cacheService');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
const authRoutes = require('./routes/auth');
const eventRoutes = require('./routes/events');
const venueRoutes = require('./routes/venues');
const vendorRoutes = require('./routes/vendors');
const cateringRoutes = require('./routes/catering');
const bookingRoutes = require('./routes/bookings');
const quotationRoutes = require('./routes/quotations');
const dealRoutes = require('./routes/deals');
const recommendationRoutes = require('./routes/recommendations');
const reviewRoutes = require('./routes/reviews');
const adminRoutes = require('./routes/admin');
const aiRoutes = require('./routes/ai');

app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/venues', venueRoutes);
app.use('/api/vendors', vendorRoutes);
app.use('/api/catering', cateringRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/quotations', quotationRoutes);
app.use('/api/deals', dealRoutes);
app.use('/api/recommendations', recommendationRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/ai', aiRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {
      database: 'connected',
      groq: groqService.isAvailable() ? 'available' : 'unavailable',
      cache: cacheService.isAvailable() ? 'available' : 'unavailable',
    },
  });
});

// Root route
app.get('/', (req, res) => {
  const groqStatus = groqService.isAvailable();
  const cacheStatus = cacheService.isAvailable();
  
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>KAIROS Event Planner API</title>
        <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 2rem; background-color: #f8fafc; }
            h1 { color: #2563eb; margin-bottom: 0.5rem; }
            .badge { display: inline-block; padding: 0.25rem 0.75rem; border-radius: 9999px; font-size: 0.875rem; font-weight: 500; background-color: #dbeafe; color: #1e40af; margin-right: 0.5rem; margin-bottom: 0.5rem; }
            .badge-db { background-color: #dcfce7; color: #166534; }
            .badge-ai { background-color: #f3e8ff; color: #6b21a8; }
            .badge-cache { background-color: #fef3c7; color: #92400e; }
            .badge-success { background-color: #dcfce7; color: #166534; }
            .badge-error { background-color: #fee2e2; color: #991b1b; }
            .card { background: white; border-radius: 8px; padding: 1.5rem; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); margin-top: 2rem; }
            .endpoint { background: #f1f5f9; padding: 0.75rem; border-radius: 4px; margin-bottom: 0.5rem; font-family: monospace; font-size: 0.875rem; }
            .status { margin-top: 1rem; }
            .status-item { display: flex; justify-content: space-between; padding: 0.5rem 0; border-bottom: 1px solid #e5e7eb; }
        </style>
    </head>
    <body>
        <h1>🎉 KAIROS Event Planner API</h1>
        <p>AI-Powered Event Planning System - Backend Service</p>
        
        <div>
            <span class="badge">v2.0.0</span>
            <span class="badge badge-db">MongoDB</span>
            <span class="badge ${groqStatus ? 'badge-success' : 'badge-error'}">
                Groq AI ${groqStatus ? '✓' : '✗'}
            </span>
            <span class="badge ${cacheStatus ? 'badge-success' : 'badge-cache'}">
                Redis Cache ${cacheStatus ? '✓' : '○'}
            </span>
        </div>

        <div class="card">
            <h2>Service Status</h2>
            <div class="status">
                <div class="status-item">
                    <span>Database</span>
                    <span class="badge badge-success">Connected</span>
                </div>
                <div class="status-item">
                    <span>Groq AI (${process.env.GROQ_PRIMARY_MODEL || 'Not configured'})</span>
                    <span class="badge ${groqStatus ? 'badge-success' : 'badge-error'}">
                        ${groqStatus ? 'Available' : 'Unavailable'}
                    </span>
                </div>
                <div class="status-item">
                    <span>Redis Cache</span>
                    <span class="badge ${cacheStatus ? 'badge-success' : 'badge-cache'}">
                        ${cacheStatus ? 'Connected' : 'Disabled'}
                    </span>
                </div>
            </div>
        </div>

        <div class="card">
            <h2>API Endpoints</h2>
            <h3>Authentication</h3>
            <div class="endpoint">POST /api/auth/login</div>
            <div class="endpoint">POST /api/auth/register</div>
            
            <h3>Events & Planning</h3>
            <div class="endpoint">GET /api/events</div>
            <div class="endpoint">POST /api/events</div>
            <div class="endpoint">GET /api/recommendations?eventId=xxx</div>
            
            <h3>Vendors</h3>
            <div class="endpoint">GET /api/venues</div>
            <div class="endpoint">GET /api/catering</div>
            <div class="endpoint">GET /api/vendors</div>
            <div class="endpoint">GET /api/deals</div>
            
            <h3>AI Features (New!)</h3>
            <div class="endpoint">POST /api/ai/chat</div>
            <div class="endpoint">POST /api/ai/event-plan</div>
            <div class="endpoint">POST /api/ai/explain-recommendation</div>
            <div class="endpoint">POST /api/ai/suggest-alternatives</div>
            <div class="endpoint">POST /api/ai/optimize-budget</div>
            <div class="endpoint">GET /api/ai/stats</div>
        </div>

        <div class="card">
            <h2>Documentation</h2>
            <p>For detailed API documentation, visit <code>/api/docs</code> (coming soon)</p>
            <p>Health check: <code>/health</code></p>
        </div>
    </body>
    </html>
  `);
});

// Start Server
const PORT = process.env.PORT || 5001;

const startServer = async () => {
  try {
    console.log('🚀 Starting KAIROS Event Planner API...\n');
    
    // Connect to MongoDB
    await connectDB();
    
    // Initialize Groq AI Service
    const groqInitialized = groqService.initialize();
    if (!groqInitialized) {
      console.warn('⚠️  Groq AI service not initialized. AI features will be limited.\n');
    }
    
    // Initialize Redis Cache (optional)
    await cacheService.initialize();
    
    // Start Express server
    app.listen(PORT, () => {
      console.log('\n' + '='.repeat(60));
      console.log(`✓ Server running on port ${PORT}`);
      console.log(`✓ Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`✓ Database: MongoDB connected`);
      console.log(`✓ AI Service: ${groqService.isAvailable() ? 'Groq (' + process.env.GROQ_PRIMARY_MODEL + ')' : 'Unavailable'}`);
      console.log(`✓ Cache: ${cacheService.isAvailable() ? 'Redis connected' : 'Disabled'}`);
      console.log('='.repeat(60));
      console.log(`\n📍 API: http://localhost:${PORT}`);
      console.log(`📍 Health: http://localhost:${PORT}/health\n`);
    });
    
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('\n⚠️  SIGTERM received, shutting down gracefully...');
  await cacheService.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('\n⚠️  SIGINT received, shutting down gracefully...');
  await cacheService.close();
  process.exit(0);
});

startServer();
