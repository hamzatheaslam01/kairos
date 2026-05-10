# KAIROS Event Planning System - Complete Setup Guide

## 📋 Table of Contents
- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Running the Application](#running-the-application)
- [Database Setup](#database-setup)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)
- [Production Deployment](#production-deployment)

---

## 🔒 Security Notice

This repository is intended for educational and development purposes.

Never commit the following publicly:
- `.env` files
- API keys
- Database credentials
- JWT secrets
- Production access tokens
- Cloud credentials

Before deploying to production:
- Rotate all secrets
- Use strong randomly generated credentials
- Enable HTTPS
- Configure proper CORS restrictions
- Enable database authentication
- Use environment-specific configuration files

## 🎯 Overview

KAIROS is an AI-powered event planning platform that helps users plan events (weddings, corporate events, birthdays) by recommending venues, caterers, and decorators based on their requirements.

**Tech Stack:**
- **Frontend:** React 19 + Vite + TailwindCSS
- **Backend:** Node.js + Express
- **Database:** MongoDB (with Mongoose ODM)
- **AI:** Groq API (LLaMA models)
- **Cache:** Redis (optional)
- **Auth:** JWT-based authentication

---

## 📦 Prerequisites

Before you begin, ensure you have the following installed:

### Required Software
- **Node.js** (v18.0.0 or higher)
  - Download: https://nodejs.org/
  - Verify: `node --version`
  
- **npm** (v9.0.0 or higher, comes with Node.js)
  - Verify: `npm --version`

- **MongoDB** (v6.0 or higher)
  - **Option 1:** MongoDB Atlas (Cloud - Recommended for beginners)
    - Sign up: https://www.mongodb.com/cloud/atlas
    - Create a free cluster
    - Get connection string
  
  - **Option 2:** Local MongoDB Installation
    - Download: https://www.mongodb.com/try/download/community
    - Windows: Install MongoDB Community Server
    - macOS: `brew install mongodb-community`
    - Linux: Follow official docs

- **Git** (for cloning the repository)
  - Download: https://git-scm.com/
  - Verify: `git --version`

### Optional Software
- **Redis** (for caching - improves performance)
  - Windows: Use Redis on WSL or Docker
  - macOS: `brew install redis`
  - Linux: `sudo apt-get install redis-server`
  - Cloud: Redis Labs, Upstash

### API Keys Required
- **Groq API Key** (for AI features)
  - Sign up: https://console.groq.com/
  - Get free API key from dashboard
  - Free tier: 30 requests/minute

---

## 🚀 Installation

### Step 1: Clone the Repository

```bash
# Clone the repository
git clone <your-repo-url>
cd ADBMS-ESP

# Or if you already have the folder
cd ADBMS-ESP
```

### Step 2: Install Backend Dependencies

```bash
# Navigate to server directory
cd server

# Install dependencies
npm install

# Go back to root
cd ..
```

### Step 3: Install Frontend Dependencies

```bash
# Navigate to client directory
cd client

# Install dependencies
npm install

# Go back to root
cd ..
```

---

## ⚙️ Configuration

### Step 1: Backend Environment Variables

Create a `.env` file in the `server` directory:

```bash
cd server
```

Create `server/.env` with the following content:

```env
# Server Configuration
PORT=5001
NODE_ENV=development

# MongoDB Configuration
MONGODB_URI=YOUR_MONGODB_CONNECTION_STRING

# JWT Secret
JWT_SECRET=GENERATE_A_RANDOM_SECRET_BEFORE_DEPLOYMENT

# Groq AI Configuration
GROQ_API_KEY=PASTE_YOUR_GROQ_API_KEY_HERE
GROQ_PRIMARY_MODEL=llama-3.3-70b-versatile
GROQ_FALLBACK_MODEL=llama-3.1-8b-instant

# Redis Configuration (Optional)
# REDIS_URL=redis://localhost:6379
# REDIS_PASSWORD=
# REDIS_ENABLED=false

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

**Important Configuration Notes:**

1. **MongoDB URI:**
   - For **MongoDB Atlas**: Replace `<username>`, `<password>`, and cluster URL
   - For **Local MongoDB**: Use `mongodb://localhost:27017/kairos`

2. **JWT Secret:**
   - Generate a secure random string
   - Example: `openssl rand -base64 32` (on Linux/Mac)
   - Or use: https://randomkeygen.com/

3. **Groq API Key:**
   - Get from: https://console.groq.com/keys
   - Free tier available

### Step 2: Frontend Configuration (Optional)

The frontend uses Vite's proxy to connect to the backend. If your backend runs on a different port, update `client/vite.config.js`:

```javascript
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5001', // Change if backend port differs
        changeOrigin: true,
      },
    },
  },
});
```

---

## 🗄️ Database Setup

### Option 1: Using MongoDB Atlas (Cloud)

1. **Create Account:**
   - Go to https://www.mongodb.com/cloud/atlas
   - Sign up for free account

2. **Create Cluster:**
   - Click "Build a Database"
   - Choose "Free" tier (M0)
   - Select region closest to you
   - Click "Create Cluster"

3. **Create Database User:**
   - Go to "Database Access"
   - Click "Add New Database User"
   - Choose "Password" authentication
   - Set username and password
   - Grant "Read and write to any database"

4. **Whitelist IP Address:**
   - Go to "Network Access"
   - Click "Add IP Address"
   - Click "Allow Access from Anywhere" (for development)
   - Or add your specific IP

5. **Get Connection String:**
   - Go to "Database" → "Connect"
   - Choose "Connect your application"
   - Copy connection string
   - Replace `<password>` with your database user password
   - Add to `server/.env` as `MONGODB_URI`

### Option 2: Using Local MongoDB

1. **Start MongoDB Service:**

   **Windows:**
   ```bash
   # MongoDB should start automatically after installation
   # Or start manually:
   net start MongoDB
   ```

   **macOS:**
   ```bash
   brew services start mongodb-community
   ```

   **Linux:**
   ```bash
   sudo systemctl start mongod
   sudo systemctl enable mongod
   ```

2. **Verify MongoDB is Running:**
   ```bash
   # Connect to MongoDB shell
   mongosh
   
   # You should see MongoDB shell prompt
   # Type 'exit' to quit
   ```

3. **Update .env:**
   ```env
   MONGODB_URI=mongodb://localhost:27017/kairos
   ```

### Step 3: Seed Database with Sample Data

```bash
cd server

# Run seeder script
npm run seed

# You should see:
# ✓ Database connected
# ✓ Seeded 3 cities
# ✓ Seeded 10 venues
# ✓ Seeded 12 vendors
# ✓ Seeded 3 users
# ✓ Seeded 4 events
# ✓ Seeded 2 bookings
```

---

## 🏃 Running the Application

### Development Mode (Recommended)

You'll need **two terminal windows**:

**Terminal 1 - Backend Server:**
```bash
cd server
npm run dev

# You should see:
# ✓ Server running on port 5001
# ✓ Database: MongoDB connected
# ✓ AI Service: Groq (llama-3.3-70b-versatile)
# 📍 API: http://localhost:5001
```

**Terminal 2 - Frontend Development Server:**
```bash
cd client
npm run dev

# You should see:
# VITE v8.0.1  ready in 500 ms
# ➜  Local:   http://localhost:5173/
# ➜  Network: use --host to expose
```

**Access the Application:**
- Frontend: http://localhost:5173
- Backend API: http://localhost:5001
- API Health Check: http://localhost:5001/health

### Production Mode

**Build Frontend:**
```bash
cd client
npm run build

# Creates optimized build in client/dist
```

**Serve Production Build:**
```bash
# Option 1: Use a static server
npm install -g serve
serve -s client/dist -p 3000

# Option 2: Configure Express to serve static files
# (Add to server.js)
```

**Run Backend:**
```bash
cd server
NODE_ENV=production npm start
```

---

## 👥 Demo Accounts

Sample accounts are generated locally during database seeding.

For security reasons, default credentials are not documented publicly.
Create your own local test accounts after setup.

---

## 🧪 Testing

### Test Backend API

```bash
# Health check
curl http://localhost:5001/health

# Register new user
curl -X POST http://localhost:5001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123","full_name":"Test User"}'

# Login
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"your_test_account@example.com","password":"your_password"}'
```

### Test Frontend

1. Open http://localhost:5173
2. Click "Access The Atelier"
3. Login with demo credentials
4. Create a new event
5. View recommendations
6. Make a booking

---

## 🐛 Troubleshooting

### Common Issues

#### 1. MongoDB Connection Failed

**Error:** `MongooseServerSelectionError: connect ECONNREFUSED`

**Solutions:**
- Verify MongoDB is running: `mongosh` (should connect)
- Check `MONGODB_URI` in `.env`
- For Atlas: Verify IP whitelist and credentials
- For Local: Start MongoDB service

#### 2. Port Already in Use

**Error:** `EADDRINUSE: address already in use :::5001`

**Solutions:**
```bash
# Windows - Find and kill process
netstat -ano | findstr :5001
taskkill /PID <PID> /F

# macOS/Linux
lsof -ti:5001 | xargs kill -9

# Or change port in server/.env
PORT=5002
```

#### 3. Groq API Not Working

**Error:** `Groq AI service not initialized`

**Solutions:**
- Verify `GROQ_API_KEY` in `server/.env`
- Check API key is valid at https://console.groq.com/keys
- Check rate limits (30 req/min on free tier)
- AI features will be limited but app still works

#### 4. Frontend Can't Connect to Backend

**Error:** `Network Error` or `Failed to fetch`

**Solutions:**
- Verify backend is running on port 5001
- Check `vite.config.js` proxy configuration
- Verify CORS is enabled in backend
- Check browser console for errors

#### 5. npm install Fails

**Error:** Various dependency errors

**Solutions:**
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and package-lock.json
rm -rf node_modules package-lock.json

# Reinstall
npm install

# If still fails, try legacy peer deps
npm install --legacy-peer-deps
```

#### 6. Vite Build Errors

**Error:** Build fails with module errors

**Solutions:**
```bash
# Clear Vite cache
rm -rf client/node_modules/.vite

# Rebuild
cd client
npm run build
```

---

## 🚀 Production Deployment

### Environment Variables for Production

Update `server/.env` for production:

```env
NODE_ENV=production
PORT=5001

# Use production MongoDB (Atlas recommended)
MONGODB_URI=YOUR_PRODUCTION_DATABASE_URI

# Strong JWT secret
JWT_SECRET=<generate-strong-random-secret>

# Groq API
GROQ_API_KEY=<your-production-key>

# Enable Redis for production
REDIS_URL=redis://your-redis-host:6379
REDIS_ENABLED=true

# Stricter rate limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=50
```

### Deployment Platforms

#### Option 1: Render (Recommended - Free Tier Available)

**Backend:**
1. Push code to GitHub
2. Go to https://render.com
3. Create "New Web Service"
4. Connect GitHub repo
5. Configure:
   - Build Command: `cd server && npm install`
   - Start Command: `cd server && npm start`
   - Add environment variables from `.env`

**Frontend:**
1. Create "New Static Site"
2. Configure:
   - Build Command: `cd client && npm install && npm run build`
   - Publish Directory: `client/dist`

#### Option 2: Vercel (Frontend) + Railway (Backend)

**Frontend on Vercel:**
```bash
cd client
npm install -g vercel
vercel
```

**Backend on Railway:**
1. Go to https://railway.app
2. Create new project from GitHub
3. Add MongoDB and Redis services
4. Configure environment variables

#### Option 3: DigitalOcean App Platform

1. Push to GitHub
2. Create new app on DigitalOcean
3. Configure monorepo with two components
4. Add MongoDB managed database

### Security Checklist for Production

- [ ] Change JWT_SECRET to strong random value
- [ ] Use MongoDB Atlas with IP whitelist
- [ ] Enable HTTPS/SSL
- [ ] Set secure CORS origins
- [ ] Enable rate limiting
- [ ] Use Redis for session management
- [ ] Set up monitoring (e.g., Sentry)
- [ ] Configure proper logging
- [ ] Use environment-specific configs
- [ ] Enable MongoDB authentication
- [ ] Regular security updates

---

## 📚 Additional Resources

### Documentation
- [MongoDB Docs](https://docs.mongodb.com/)
- [Express.js Guide](https://expressjs.com/en/guide/routing.html)
- [React Documentation](https://react.dev/)
- [Vite Guide](https://vitejs.dev/guide/)
- [Groq API Docs](https://console.groq.com/docs)

### Project Structure
```
ADBMS-ESP/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/    # Reusable components
│   │   ├── pages/         # Page components
│   │   ├── lib/           # Utilities
│   │   └── App.jsx        # Main app component
│   ├── public/            # Static assets
│   └── package.json
├── server/                # Express backend
│   ├── config/           # Database config
│   ├── controllers/      # Route controllers
│   ├── middleware/       # Auth, validation
│   ├── models/           # Mongoose models
│   ├── routes/           # API routes
│   ├── services/         # Business logic
│   ├── seeders/          # Database seeders
│   └── server.js         # Entry point
└── package.json          # Root scripts
```

---

## 🆘 Getting Help

If you encounter issues:

1. Check this guide's [Troubleshooting](#troubleshooting) section
2. Review error messages in terminal
3. Check browser console (F12) for frontend errors
4. Verify all environment variables are set
5. Ensure all services (MongoDB, Redis) are running
6. Check API health endpoint: http://localhost:5001/health

---

## 📝 Quick Start Checklist

- [ ] Node.js and npm installed
- [ ] MongoDB installed/configured
- [ ] Groq API key obtained
- [ ] Repository cloned
- [ ] Backend dependencies installed (`cd server && npm install`)
- [ ] Frontend dependencies installed (`cd client && npm install`)
- [ ] `.env` file created in `server/` directory
- [ ] Environment variables configured
- [ ] Database seeded (`cd server && npm run seed`)
- [ ] Backend running (`cd server && npm run dev`)
- [ ] Frontend running (`cd client && npm run dev`)
- [ ] Accessed http://localhost:5173
- [ ] Logged in with a locally created test account

---

**🎉 Congratulations! Your KAIROS Event Planning System is now running!**

Visit http://localhost:5173 and start planning events with AI assistance.
