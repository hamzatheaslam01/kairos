#!/usr/bin/env node

/**
 * GitHub Readiness Verification Script
 * Run this before pushing to GitHub to ensure no secrets are committed
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 KAIROS GitHub Readiness Check\n');
console.log('='.repeat(60));

let errors = 0;
let warnings = 0;

// Check 1: .gitignore exists
console.log('\n✓ Checking .gitignore...');
if (fs.existsSync('.gitignore')) {
  console.log('  ✅ .gitignore found');
} else {
  console.log('  ❌ .gitignore NOT FOUND!');
  errors++;
}

// Check 2: .env files are NOT tracked
console.log('\n✓ Checking for .env files...');
const envFiles = [
  'server/.env',
  'client/.env',
  '.env'
];

envFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`  ⚠️  ${file} exists (should be in .gitignore)`);
    warnings++;
  }
});

// Check 3: .env.example exists
console.log('\n✓ Checking for .env.example...');
if (fs.existsSync('server/.env.example')) {
  console.log('  ✅ server/.env.example found');
} else {
  console.log('  ❌ server/.env.example NOT FOUND!');
  errors++;
}

// Check 4: Essential documentation
console.log('\n✓ Checking documentation...');
const docs = ['README.md', 'SETUP_GUIDE.md', 'LICENSE'];
docs.forEach(doc => {
  if (fs.existsSync(doc)) {
    console.log(`  ✅ ${doc} found`);
  } else {
    console.log(`  ❌ ${doc} NOT FOUND!`);
    errors++;
  }
});

// Check 5: node_modules should not exist (or be ignored)
console.log('\n✓ Checking for node_modules...');
const nodeModulesDirs = [
  'node_modules',
  'server/node_modules',
  'client/node_modules'
];

nodeModulesDirs.forEach(dir => {
  if (fs.existsSync(dir)) {
    console.log(`  ⚠️  ${dir} exists (should be in .gitignore)`);
    warnings++;
  }
});

// Check 6: Database files should not exist
console.log('\n✓ Checking for database files...');
if (fs.existsSync('server/database.sqlite')) {
  console.log('  ⚠️  server/database.sqlite exists (should be in .gitignore)');
  warnings++;
}

// Check 7: Build directories should not exist
console.log('\n✓ Checking for build directories...');
const buildDirs = ['client/dist', 'client/build'];
buildDirs.forEach(dir => {
  if (fs.existsSync(dir)) {
    console.log(`  ⚠️  ${dir} exists (should be in .gitignore)`);
    warnings++;
  }
});

// Check 8: Scan for potential secrets in code
console.log('\n✓ Scanning for potential secrets...');
const secretPatterns = [
  /api[_-]?key\s*=\s*['"][^'"]{20,}['"]/gi,
  /password\s*=\s*['"][^'"]+['"]/gi,
  /secret\s*=\s*['"][^'"]{20,}['"]/gi,
  /mongodb\+srv:\/\/[^:]+:[^@]+@/gi
];

function scanFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    secretPatterns.forEach(pattern => {
      if (pattern.test(content)) {
        console.log(`  ⚠️  Potential secret found in: ${filePath}`);
        warnings++;
      }
    });
  } catch (err) {
    // Ignore files that can't be read
  }
}

function scanDirectory(dir, exclude = []) {
  try {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (exclude.some(ex => filePath.includes(ex))) {
        return;
      }
      
      if (stat.isDirectory()) {
        scanDirectory(filePath, exclude);
      } else if (file.endsWith('.js') || file.endsWith('.jsx') || file.endsWith('.ts') || file.endsWith('.tsx')) {
        scanFile(filePath);
      }
    });
  } catch (err) {
    // Ignore directories that can't be read
  }
}

const excludeDirs = ['node_modules', 'dist', 'build', '.git', '.vscode', '.idea'];
scanDirectory('server', excludeDirs);
scanDirectory('client/src', excludeDirs);

// Summary
console.log('\n' + '='.repeat(60));
console.log('\n📊 SUMMARY\n');

if (errors === 0 && warnings === 0) {
  console.log('✅ All checks passed! Your repository is ready for GitHub.');
  console.log('\n🚀 Next steps:');
  console.log('   1. git add .');
  console.log('   2. git commit -m "Initial commit"');
  console.log('   3. git push -u origin main');
} else {
  if (errors > 0) {
    console.log(`❌ ${errors} error(s) found - MUST FIX before pushing!`);
  }
  if (warnings > 0) {
    console.log(`⚠️  ${warnings} warning(s) found - Review before pushing`);
  }
  console.log('\n📖 See GITHUB_PREPARATION.md for detailed instructions');
}

console.log('\n' + '='.repeat(60));

process.exit(errors > 0 ? 1 : 0);
