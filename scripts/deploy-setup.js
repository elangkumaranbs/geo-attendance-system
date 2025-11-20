#!/usr/bin/env node

const readline = require('readline');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  red: '\x1b[31m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function generateJWTSecret() {
  const crypto = require('crypto');
  return crypto.randomBytes(32).toString('hex');
}

async function main() {
  console.clear();
  log('\n🚀 GEO ATTENDANCE SYSTEM - DEPLOYMENT SETUP', 'bright');
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n', 'cyan');

  log('This tool will help you configure your project for deployment.\n', 'blue');

  // Collect deployment information
  log('📋 Step 1: Database Configuration', 'yellow');
  const mongoUri = await question('MongoDB Atlas Connection String: ');

  log('\n📋 Step 2: Service URLs', 'yellow');
  const mlServiceUrl = await question('ML Service URL (leave empty if not deployed yet): ') || 'https://your-ml-service.onrender.com';
  const backendUrl = await question('Backend API URL (leave empty if not deployed yet): ') || 'https://your-backend.onrender.com';
  const frontendUrl = await question('Frontend URL (leave empty if not deployed yet): ') || 'https://your-frontend.vercel.app';

  log('\n🔐 Step 3: Security', 'yellow');
  const generateJWT = await question('Generate new JWT secret? (y/n): ');
  const jwtSecret = generateJWT.toLowerCase() === 'y' ? await generateJWTSecret() : await question('Enter JWT Secret (min 32 chars): ');

  log('\n⚙️ Step 4: Configuration', 'yellow');
  const threshold = await question('Face similarity threshold (default 0.70): ') || '0.70';
  const geofenceRadius = await question('Geofence radius in meters (default 100): ') || '100';

  // Update backend .env.production
  log('\n✍️  Writing backend configuration...', 'cyan');
  const backendEnv = `# Production Environment Configuration
NODE_ENV=production
PORT=5000

# Database
MONGODB_URI=${mongoUri}

# JWT Configuration
JWT_SECRET=${jwtSecret}
JWT_EXPIRE=7d
JWT_REFRESH_EXPIRE=30d

# ML Service
ML_SERVICE_URL=${mlServiceUrl}

# Face Recognition Settings
FACE_SIMILARITY_THRESHOLD=${threshold}
MAX_FACES_PER_USER=5

# Geofence Settings
DEFAULT_GEOFENCE_RADIUS=${geofenceRadius}
GPS_ACCURACY_THRESHOLD=50

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# File Upload
MAX_FILE_SIZE=5242880

# CORS Origin
CORS_ORIGIN=${frontendUrl}

# Log Level
LOG_LEVEL=info
`;

  fs.writeFileSync(path.join(__dirname, '..', 'backend', '.env.production'), backendEnv);
  log('✅ Backend .env.production created', 'green');

  // Update frontend .env.production
  log('✍️  Writing frontend configuration...', 'cyan');
  const frontendEnv = `NEXT_PUBLIC_API_URL=${backendUrl}
NEXT_PUBLIC_ML_SERVICE_URL=${mlServiceUrl}
NEXT_PUBLIC_APP_NAME=Geo Attendance System
NEXT_PUBLIC_ENVIRONMENT=production
`;

  fs.writeFileSync(path.join(__dirname, '..', 'frontend', '.env.production'), frontendEnv);
  log('✅ Frontend .env.production created', 'green');

  // Update ml-service .env
  log('✍️  Writing ML service configuration...', 'cyan');
  const mlEnv = `# ML Service Configuration
ENVIRONMENT=production
LOG_LEVEL=info
MONGODB_URI=${mongoUri}
`;

  fs.writeFileSync(path.join(__dirname, '..', 'ml-service', '.env'), mlEnv);
  log('✅ ML Service .env created', 'green');

  // Create deployment summary
  log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'cyan');
  log('📊 DEPLOYMENT CONFIGURATION SUMMARY', 'bright');
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n', 'cyan');

  log('Database:', 'yellow');
  log(`  MongoDB: ${mongoUri.includes('mongodb+srv') ? '✅ Atlas' : '⚠️  Local'}`, 'cyan');

  log('\nService URLs:', 'yellow');
  log(`  ML Service: ${mlServiceUrl}`, 'cyan');
  log(`  Backend API: ${backendUrl}`, 'cyan');
  log(`  Frontend: ${frontendUrl}`, 'cyan');

  log('\nSecurity:', 'yellow');
  log(`  JWT Secret: ${jwtSecret.substring(0, 10)}...`, 'cyan');
  log(`  Face Threshold: ${threshold}`, 'cyan');
  log(`  Geofence Radius: ${geofenceRadius}m`, 'cyan');

  log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'cyan');
  log('\n🎯 NEXT STEPS:', 'bright');
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n', 'cyan');

  log('1️⃣  Deploy ML Service first:', 'yellow');
  log('   • Go to https://render.com or https://railway.app', 'blue');
  log('   • Create new Web Service', 'blue');
  log('   • Upload ml-service folder', 'blue');
  log('   • Copy the deployed URL\n', 'blue');

  log('2️⃣  Deploy Backend:', 'yellow');
  log('   • Go to https://render.com', 'blue');
  log('   • Create new Web Service', 'blue');
  log('   • Upload backend folder', 'blue');
  log('   • Add environment variables from .env.production', 'blue');
  log('   • Update ML_SERVICE_URL with actual URL\n', 'blue');

  log('3️⃣  Deploy Frontend:', 'yellow');
  log('   • Go to https://vercel.com', 'blue');
  log('   • Import your repository', 'blue');
  log('   • Select frontend folder as root', 'blue');
  log('   • Add environment variables from .env.production', 'blue');
  log('   • Update NEXT_PUBLIC_API_URL with backend URL\n', 'blue');

  log('4️⃣  Initialize Database:', 'yellow');
  log('   • Run: node scripts/create-admin.js', 'blue');
  log('   • Run: node scripts/setup-geofence.js\n', 'blue');

  log('5️⃣  Test Your Deployment:', 'yellow');
  log('   • Visit your frontend URL', 'blue');
  log('   • Login with admin@geo.com / admin123', 'blue');
  log('   • Try marking attendance\n', 'blue');

  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'cyan');
  log('\n💾 Configuration files saved:', 'green');
  log('  ✓ backend/.env.production', 'cyan');
  log('  ✓ frontend/.env.production', 'cyan');
  log('  ✓ ml-service/.env', 'cyan');
  log('\n📖 Full deployment guide: DEPLOYMENT.md\n', 'yellow');

  rl.close();
}

main().catch(err => {
  log(`\n❌ Error: ${err.message}`, 'red');
  rl.close();
  process.exit(1);
});
