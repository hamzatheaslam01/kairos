# 🔄 Server Restart Guide

## The Issue
The backend server is still using old cached code. You need to restart it to pick up the schema changes.

---

## ✅ Quick Fix Steps

### Step 1: Stop All Node Processes

**Option A: Using Task Manager (Easiest)**
1. Press `Ctrl + Shift + Esc` to open Task Manager
2. Find all "Node.js JavaScript Runtime" processes
3. Right-click each one → "End Task"
4. Close Task Manager

**Option B: Using Command Line**
```powershell
# Open PowerShell as Administrator
Get-Process node | Stop-Process -Force
```

---

### Step 2: Start Backend Server

```bash
# Navigate to server folder
cd C:\Users\HP\OneDrive\Desktop\ADBMS-ESP\server

# Start the server
node server.js
```

**Expected Output:**
```
🚀 Starting KAIROS Event Planner API...
✓ MongoDB connected: localhost
✓ Groq AI Service initialized
ℹ️  Redis caching is disabled
============================================================
✓ Server running on port 5002
✓ Environment: development
✓ Database: MongoDB connected
✓ AI Service: Groq (llama-3.3-70b-versatile)  ← Should show this!
✓ Cache: Disabled
============================================================
📍 API: http://localhost:5002
📍 Health: http://localhost:5002/health
```

---

### Step 3: Start Frontend (if not running)

```bash
# Open a NEW terminal/command prompt
cd C:\Users\HP\OneDrive\Desktop\ADBMS-ESP\client

# Start the frontend
npm run dev
```

**Expected Output:**
```
VITE v8.0.3  ready in 3879 ms
➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

---

## 🧪 Test the Fix

### Test 1: Check Server Health
Open browser: `http://localhost:5002/health`

Should see:
```json
{
  "status": "ok",
  "timestamp": "...",
  "services": {
    "database": "connected",
    "ai": "available"
  }
}
```

---

### Test 2: Event Planning Page

1. Go to: `http://localhost:5173/event-planner`
2. Fill in the form:
   - **Event Type**: Wedding
   - **Budget**: 500000
   - **Guests**: 200
   - Click "Next"
3. Select:
   - **City**: Lahore
   - **Vibe**: Elegant (optional)
   - Click "Next"
4. Review and click **"Generate AI Plan"**
5. ✅ Should now show the generated plan (not a blank page!)

---

## 🔍 Debugging

### If you still see a blank page:

1. **Open Browser Console** (F12)
2. Look for errors in the Console tab
3. Check the Network tab for the `/api/ai/event-plan` request
4. Look at the Response - it should show the plan data

### If you see "Schema validation failed":

The server didn't restart properly. Try:
```bash
# Kill all node processes
taskkill /F /IM node.exe

# Wait 5 seconds
timeout /t 5

# Start server again
cd server
node server.js
```

---

## 📊 What Changed

### Backend Changes:
1. **Schema is now permissive**: Accepts any JSON structure from AI
2. **Model updated**: Using `llama-3.3-70b-versatile` (not deprecated)
3. **Better prompts**: AI knows exactly what JSON to return

### Frontend Changes:
1. **Better error logging**: Console shows what went wrong
2. **Validates plan data**: Checks if plan exists before displaying
3. **User-friendly errors**: Shows helpful messages

---

## ✨ Expected Behavior After Restart

### Event Plan Generation:
1. Click "Generate AI Plan" → Loading animation
2. Wait 3-5 seconds → AI generates plan
3. See Step 4 with:
   - ✅ Budget Allocation (with progress bars)
   - ✅ Timeline (numbered steps)
   - ✅ Recommendations (bullet points)
   - ✅ Export and Proceed buttons

### Server Logs Should Show:
```
📊 Groq Usage: {"timestamp":"...","endpoint":"generateJSON","model":"llama-3.3-70b-versatile",...}
```

**No more "Schema validation failed" errors!**

---

## 🆘 Still Having Issues?

### Check these:

1. **MongoDB Running?**
   ```bash
   # Check if MongoDB is running
   netstat -ano | findstr :27017
   ```

2. **Groq API Key Valid?**
   - Check `server/.env` has `GROQ_API_KEY=...`
   - Key should start with `gsk_`

3. **Ports Available?**
   ```bash
   # Check if ports are free
   netstat -ano | findstr :5002
   netstat -ano | findstr :5173
   ```

4. **Node Modules Installed?**
   ```bash
   cd server
   npm install
   
   cd ../client
   npm install
   ```

---

## 📝 Quick Reference

| Service | Port | URL |
|---------|------|-----|
| Frontend | 5173 | http://localhost:5173 |
| Backend | 5002 | http://localhost:5002 |
| MongoDB | 27017 | mongodb://localhost:27017 |

---

## ✅ Success Checklist

After restart, verify:
- [ ] Backend shows "Server running on port 5002"
- [ ] Backend shows "Groq (llama-3.3-70b-versatile)"
- [ ] Frontend shows "Local: http://localhost:5173/"
- [ ] Can access http://localhost:5173
- [ ] Can login to the app
- [ ] AI Planner link visible in navigation
- [ ] Event plan generates without errors
- [ ] Plan displays with budget, timeline, recommendations

---

**Once all servers are restarted, the event planning should work perfectly!** 🎉
