# GitHub Repository Preparation Guide

## 📦 What to Include in Your GitHub Repository

### ✅ **MUST INCLUDE** - Essential Files

#### Root Directory
```
✅ README.md                    # Project overview and documentation
✅ SETUP_GUIDE.md              # Detailed setup instructions
✅ .gitignore                  # Git ignore rules
✅ package.json                # Root workspace scripts
✅ LICENSE                     # License file (create if missing)
```

#### Server Directory (`server/`)
```
✅ server/package.json         # Backend dependencies
✅ server/server.js            # Main server file
✅ server/.env.example         # Example environment variables (NO SECRETS!)
✅ server/config/              # Configuration files
✅ server/controllers/         # Route controllers
✅ server/middleware/          # Auth, validation middleware
✅ server/models/              # Mongoose models
✅ server/routes/              # API routes
✅ server/services/            # Business logic (Groq, cache, etc.)
✅ server/seeders/             # Database seeders
✅ server/seed_data.js         # Seed data script
```

#### Client Directory (`client/`)
```
✅ client/package.json         # Frontend dependencies
✅ client/index.html           # HTML entry point
✅ client/vite.config.js       # Vite configuration
✅ client/tailwind.config.js   # Tailwind configuration
✅ client/postcss.config.js    # PostCSS configuration
✅ client/eslint.config.js     # ESLint configuration
✅ client/src/                 # Source code
   ✅ client/src/App.jsx
   ✅ client/src/main.jsx
   ✅ client/src/index.css
   ✅ client/src/components/   # React components
   ✅ client/src/pages/        # Page components
   ✅ client/src/lib/          # Utilities
✅ client/public/              # Static assets (images, icons)
```

#### Documentation (Optional but Recommended)
```
✅ CONTRIBUTING.md             # Contribution guidelines
✅ CODE_OF_CONDUCT.md          # Code of conduct
✅ CHANGELOG.md                # Version history
✅ docs/                       # Additional documentation
```

---

## ❌ **MUST EXCLUDE** - Never Commit These

### 🔴 Critical - Security Risk
```
❌ server/.env                 # Contains API keys and secrets!
❌ server/database.sqlite      # Local database file
❌ .env files anywhere         # All environment files
❌ API keys or tokens          # In any file
❌ Passwords or credentials    # In any file
```

### 🟡 Build Artifacts & Dependencies
```
❌ node_modules/               # All node_modules folders
❌ package-lock.json           # Lock files (optional to exclude)
❌ client/dist/                # Build output
❌ client/build/               # Build output
❌ *.log                       # Log files
❌ .cache/                     # Cache directories
```

### 🟢 IDE & OS Files
```
❌ .vscode/                    # VS Code settings
❌ .idea/                      # IntelliJ settings
❌ .DS_Store                   # macOS files
❌ Thumbs.db                   # Windows files
❌ *.swp, *.swo                # Vim swap files
```

### 🔵 AI Agent Files
```
❌ .zencoder/                  # AI agent files
❌ .zenflow/                   # AI agent files
❌ .kiro/                      # AI agent files
```

---

## 🛠️ Step-by-Step: Prepare for GitHub

### Step 1: Create `.env.example` Files

Create example environment files WITHOUT secrets:

**`server/.env.example`:**
```env
# Server Configuration
PORT=5001
NODE_ENV=development

# MongoDB Configuration
# Option 1: MongoDB Atlas (Cloud - Recommended)
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/kairos?retryWrites=true&w=majority

# Option 2: Local MongoDB
# MONGODB_URI=mongodb://localhost:27017/kairos

# JWT Secret (Generate a secure random string)
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production

# Groq AI Configuration (Get free API key from https://console.groq.com/)
GROQ_API_KEY=your_groq_api_key_here
GROQ_PRIMARY_MODEL=llama-3.3-70b-versatile
GROQ_FALLBACK_MODEL=llama-3.1-8b-instant

# Redis Configuration (Optional - for caching)
# REDIS_URL=redis://localhost:6379
# REDIS_PASSWORD=
# REDIS_ENABLED=false

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### Step 2: Create LICENSE File

Create `LICENSE` in root directory. For MIT License:

```
MIT License

Copyright (c) 2024 [Your Name]

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

### Step 3: Verify .gitignore

Ensure your `.gitignore` is comprehensive (already updated).

### Step 4: Clean Up Sensitive Data

```bash
# Check for accidentally committed secrets
git log --all --full-history -- "*/.env"

# If found, you'll need to remove them from history
# Use git-filter-repo or BFG Repo-Cleaner
```

### Step 5: Test Locally

```bash
# Clone to a new directory to test
cd ..
git clone file:///path/to/ADBMS-ESP test-clone
cd test-clone

# Try to set up from scratch
cd server
cp .env.example .env
# Edit .env with your credentials
npm install
npm run seed
npm run dev

# In another terminal
cd client
npm install
npm run dev
```

---

## 📋 Pre-Upload Checklist

Before pushing to GitHub, verify:

- [ ] `.gitignore` is properly configured
- [ ] No `.env` files are tracked
- [ ] No `node_modules/` folders are tracked
- [ ] No database files (`.sqlite`, `.db`) are tracked
- [ ] No API keys or secrets in any file
- [ ] `server/.env.example` exists with placeholder values
- [ ] `README.md` is complete and accurate
- [ ] `SETUP_GUIDE.md` is complete
- [ ] `LICENSE` file exists
- [ ] All documentation is up to date
- [ ] Code is clean and commented
- [ ] No personal information in code

---

## 🚀 Creating the GitHub Repository

### Option 1: Using Git Command Line

```bash
# Initialize git (if not already done)
cd ADBMS-ESP
git init

# Add all files (respecting .gitignore)
git add .

# Check what will be committed
git status

# Commit
git commit -m "Initial commit: KAIROS Event Planning System"

# Create repository on GitHub, then:
git remote add origin https://github.com/yourusername/kairos.git
git branch -M main
git push -u origin main
```

### Option 2: Using GitHub Desktop

1. Open GitHub Desktop
2. File → Add Local Repository
3. Select `ADBMS-ESP` folder
4. Click "Publish repository"
5. Choose public/private
6. Uncheck "Keep this code private" if you want it public
7. Click "Publish Repository"

### Option 3: Create ZIP for Manual Upload

If you want to create a clean ZIP file:

```bash
# Windows PowerShell
cd ADBMS-ESP
git archive --format=zip --output=kairos-github.zip HEAD

# Or manually create ZIP excluding:
# - node_modules/
# - .env files
# - database.sqlite
# - dist/ folders
# - .vscode/, .idea/
# - .zencoder/, .zenflow/, .kiro/
```

---

## 📁 Final Directory Structure for GitHub

```
ADBMS-ESP/
├── .gitignore                 ✅ Include
├── README.md                  ✅ Include
├── SETUP_GUIDE.md            ✅ Include
├── LICENSE                    ✅ Include
├── package.json              ✅ Include
├── GITHUB_PREPARATION.md     ✅ Include (this file)
│
├── client/                    ✅ Include entire folder
│   ├── public/               ✅ Include (assets)
│   ├── src/                  ✅ Include (source code)
│   ├── .gitignore            ✅ Include
│   ├── index.html            ✅ Include
│   ├── package.json          ✅ Include
│   ├── vite.config.js        ✅ Include
│   ├── tailwind.config.js    ✅ Include
│   ├── postcss.config.js     ✅ Include
│   ├── eslint.config.js      ✅ Include
│   ├── node_modules/         ❌ Exclude (in .gitignore)
│   ├── dist/                 ❌ Exclude (in .gitignore)
│   └── package-lock.json     ❌ Exclude (optional)
│
└── server/                    ✅ Include entire folder
    ├── config/               ✅ Include
    ├── controllers/          ✅ Include
    ├── middleware/           ✅ Include
    ├── models/               ✅ Include
    ├── routes/               ✅ Include
    ├── services/             ✅ Include
    ├── seeders/              ✅ Include
    ├── .env.example          ✅ Include (NO SECRETS!)
    ├── package.json          ✅ Include
    ├── server.js             ✅ Include
    ├── seed_data.js          ✅ Include
    ├── .env                  ❌ Exclude (in .gitignore)
    ├── database.sqlite       ❌ Exclude (in .gitignore)
    ├── node_modules/         ❌ Exclude (in .gitignore)
    └── package-lock.json     ❌ Exclude (optional)
```

---

## 🔒 Security Best Practices

### Before Pushing to GitHub:

1. **Scan for Secrets:**
   ```bash
   # Install git-secrets
   git secrets --scan
   
   # Or use online tools
   # - GitGuardian
   # - TruffleHog
   ```

2. **Review All Files:**
   ```bash
   # List all files that will be committed
   git ls-files
   
   # Check for sensitive patterns
   grep -r "password" .
   grep -r "api_key" .
   grep -r "secret" .
   ```

3. **Use Environment Variables:**
   - Never hardcode secrets
   - Always use `.env` files
   - Provide `.env.example` with placeholders

4. **Add Security Warnings:**
   - In README.md
   - In SETUP_GUIDE.md
   - In code comments

---

## 📊 Repository Size Optimization

### Check Repository Size:
```bash
# Check size of all files
du -sh .

# Check size by directory
du -sh *

# Find large files
find . -type f -size +10M
```

### If Repository is Too Large:

1. **Remove Large Files:**
   - Move large assets to cloud storage (Cloudinary, AWS S3)
   - Use Git LFS for large files
   - Compress images

2. **Clean Git History:**
   ```bash
   # Remove large files from history
   git filter-repo --strip-blobs-bigger-than 10M
   ```

---

## ✅ Final Verification Commands

Run these before pushing:

```bash
# 1. Check git status
git status

# 2. Verify .gitignore is working
git check-ignore -v node_modules/
git check-ignore -v server/.env
git check-ignore -v server/database.sqlite

# 3. List all tracked files
git ls-files

# 4. Check for large files
git ls-files | xargs ls -lh | sort -k5 -hr | head -20

# 5. Verify no secrets
git grep -i "password"
git grep -i "api_key"
git grep -i "secret"
```

---

## 🎉 You're Ready!

Once you've completed all steps:

1. ✅ `.gitignore` configured
2. ✅ `.env.example` created
3. ✅ No secrets in code
4. ✅ Documentation complete
5. ✅ LICENSE added
6. ✅ Verified with checklist

**You can safely push to GitHub!**

```bash
git add .
git commit -m "Initial commit: KAIROS Event Planning System"
git push -u origin main
```

---

## 📞 Need Help?

If you encounter issues:
- Check GitHub's [.gitignore templates](https://github.com/github/gitignore)
- Review [GitHub's security best practices](https://docs.github.com/en/code-security)
- Use [GitGuardian](https://www.gitguardian.com/) to scan for secrets

**Remember: Once pushed to GitHub, assume it's public forever. Never commit secrets!**
