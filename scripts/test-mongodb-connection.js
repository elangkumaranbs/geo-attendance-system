const mongoose = require('../backend/node_modules/mongoose');

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m'
};

const MONGODB_URI = 'mongodb+srv://elangkumaranbs_db_user:IwT6NYlOAT9MfzBp@geoattendance.losycvq.mongodb.net/geo_attendance?retryWrites=true&w=majority';

console.log(`\n${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
console.log(`${colors.yellow}🔌 Testing MongoDB Atlas Connection...${colors.reset}`);
console.log(`${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`);

async function testConnection() {
  try {
    console.log(`${colors.cyan}📡 Connecting to MongoDB Atlas...${colors.reset}`);
    
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 10000
    });

    console.log(`${colors.green}✅ Connected successfully!${colors.reset}\n`);

    // Test database operations
    console.log(`${colors.cyan}📊 Testing database operations...${colors.reset}`);
    
    // Get database stats
    const db = mongoose.connection.db;
    const stats = await db.stats();
    
    console.log(`${colors.green}✅ Database accessible${colors.reset}`);
    console.log(`   Database: ${stats.db}`);
    console.log(`   Collections: ${stats.collections}`);
    console.log(`   Data Size: ${(stats.dataSize / 1024).toFixed(2)} KB`);
    
    // List collections
    const collections = await db.listCollections().toArray();
    console.log(`\n${colors.cyan}📁 Collections in database:${colors.reset}`);
    if (collections.length === 0) {
      console.log(`   ${colors.yellow}⚠️  No collections yet (database is empty)${colors.reset}`);
      console.log(`   ${colors.cyan}ℹ️  Collections will be created when you run:${colors.reset}`);
      console.log(`      - node scripts/create-admin.js`);
      console.log(`      - node scripts/setup-geofence.js`);
    } else {
      collections.forEach(col => {
        console.log(`   ✓ ${col.name}`);
      });
    }

    console.log(`\n${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
    console.log(`${colors.green}✅ CONNECTION TEST SUCCESSFUL!${colors.reset}`);
    console.log(`${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`);

    console.log(`${colors.yellow}🎯 Next Steps:${colors.reset}`);
    console.log(`   1. Initialize database: node scripts/create-admin.js`);
    console.log(`   2. Setup geofence: node scripts/setup-geofence.js`);
    console.log(`   3. Deploy your services to Render/Vercel\n`);

  } catch (error) {
    console.log(`\n${colors.red}❌ Connection Failed!${colors.reset}\n`);
    console.log(`${colors.red}Error: ${error.message}${colors.reset}\n`);
    
    console.log(`${colors.yellow}🔧 Troubleshooting:${colors.reset}`);
    console.log(`   1. Check your MongoDB Atlas IP whitelist (0.0.0.0/0)`);
    console.log(`   2. Verify username/password are correct`);
    console.log(`   3. Ensure cluster is running (not paused)`);
    console.log(`   4. Check your internet connection\n`);
  } finally {
    await mongoose.connection.close();
    console.log(`${colors.cyan}🔌 Connection closed${colors.reset}\n`);
    process.exit(0);
  }
}

testConnection();
