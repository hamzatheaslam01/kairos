# 🚀 Quick GitHub Upload Checklist

## ✅ Files to INCLUDE

### Root Directory
- ✅ `README.md`
- ✅ `SETUP_GUIDE.md`
- ✅ `GITHUB_PREPARATION.md`
- ✅ `LICENSE`
- ✅ `.gitignore`
- ✅ `package.json`

### Server Folder (`server/`)
- ✅ All `.js` files
- ✅ `package.json`
- ✅ `.env.example` (NO SECRETS!)
- ✅ `config/` folder
- ✅ `controllers/` folder
- ✅ `middleware/` folder
- ✅ `models/` folder
- ✅ `routes/` folder
- ✅ `services/` folder
- ✅ `seeders/` folder

### Client Folder (`client/`)
- ✅ `src/` folder (all React code)
- ✅ `public/` folder (images, icons)
- ✅ `package.json`
- ✅ `index.html`
- ✅ `vite.config.js`
- ✅ `tailwind.config.js`
- ✅ `postcss.config.js`
- ✅ `eslint.config.js`

---

## ❌ Files to EXCLUDE (Never Upload!)

### 🔴 CRITICAL - Security Risk
- ❌ `server/.env` (contains API keys!)
- ❌ `server/database.sqlite` (local database)
- ❌ Any file with passwords or API keys

### 🟡 Build & Dependencies
- ❌ `node_modules/` (all locations)
- ❌ `package-lock.json` (optional)
- ❌ `client/dist/` (build output)
- ❌ `*.log` files

### 🟢 IDE & System Files
- ❌ `.vscode/` folder
- ❌ `.idea/` folder
- ❌ `.DS_Store` (Mac)
- ❌ `Thumbs.db` (Windows)

### 🔵 AI Agent Files
- ❌ `.zencoder/` folder
- ❌ `.zenflow/` folder
- ❌ `.kiro/` folder

---

## 🛠️ Before Uploading - Run These Commands

```bash
# 1. Verify .gitignore is working
node verify-github-ready.js

# 2. Check what will be uploaded
git status

# 3. Make sure no secrets are tracked
git grep -i "password"
git grep -i "api_key"

# 4. Verify .env is ignored
git check-ignore server/.env
# Should output: server/.env
```

---

## 📦 Two Ways to Upload

### Method 1: Using Git (Recommended)

```bash
# Initialize git
git init

# Add all files (respects .gitignore)
git add .

# Commit
git commit -m "Initial commit: KAIROS Event Planning System"

# Create repo on GitHub, then:
git remote add origin https://github.com/yourusername/kairos.git
git branch -M main
git push -u origin main
```

### Method 2: Create ZIP File

**What to ZIP:**
```
ADBMS-ESP/
├── README.md              ✅
├── SETUP_GUIDE.md         ✅
├── LICENSE                ✅
├── .gitignore             ✅
├── package.json           ✅
├── client/                ✅ (exclude node_modules, dist)
└── server/                ✅ (exclude node_modules, .env, database.sqlite)
```

**Windows - Create ZIP:**
1. Select all folders/files EXCEPT:
   - `node_modules` folders
   - `server/.env`
   - `server/database.sqlite`
   - `client/dist`
   - `.vscode`, `.idea`
   - `.zencoder`, `.zenflow`, `.kiro`
2. Right-click → Send to → Compressed (zipped) folder
3. Name it: `kairos-github.zip`

---

## ⚠️ IMPORTANT SECURITY CHECKS

Before uploading, verify:

1. **No API Keys**
   ```bash
   # Search for Groq API key pattern
   grep -r "gsk_" .
   # Should return nothing or only .env.example
   ```

2. **No Passwords**
   ```bash
   # Search for MongoDB credentials
   grep -r "mongodb+srv://" .
   # Should return nothing or only .env.example
   ```

3. **No JWT Secrets**
   ```bash
   # Search for actual JWT secrets
   grep -r "JWT_SECRET" .
   # Should only find .env.example
   ```

4. **Verify .env.example has NO real values**
   - Open `server/.env.example`
   - Ensure all values are placeholders
   - Example: `GROQ_API_KEY=your_groq_api_key_here`

---

## 🎯 Final Checklist

Before pushing to GitHub:

- [ ] `.gitignore` file exists and is comprehensive
- [ ] `server/.env.example` exists with placeholder values
- [ ] `server/.env` is NOT tracked (run: `git check-ignore server/.env`)
- [ ] No `node_modules/` folders are tracked
- [ ] No database files (`.sqlite`) are tracked
- [ ] `README.md` is complete
- [ ] `SETUP_GUIDE.md` is complete
- [ ] `LICENSE` file exists
- [ ] No API keys or secrets in any file
- [ ] Ran `node verify-github-ready.js` successfully
- [ ] Tested setup from scratch in a new folder

---

## 🆘 If You Accidentally Committed Secrets

**STOP! Don't push yet!**

```bash
# Remove file from git (keeps local copy)
git rm --cached server/.env

# Commit the removal
git commit -m "Remove .env from tracking"

# If already pushed to GitHub:
# 1. Delete the repository on GitHub
# 2. Create a new repository
# 3. Push clean version
# 4. Rotate all exposed API keys immediately!
```

---

## ✨ You're Ready When...

✅ All files are organized
✅ No secrets in code
✅ `.gitignore` is working
✅ Documentation is complete
✅ Verification script passes

**Then you can safely upload to GitHub!** 🎉

---

## 📚 Need More Help?

- **Detailed Guide**: See `GITHUB_PREPARATION.md`
- **Setup Instructions**: See `SETUP_GUIDE.md`
- **Project Overview**: See `README.md`

**Remember: Once on GitHub, assume it's public forever!**
