// Create default admin user
// Password: admin123 (hashed with bcrypt, 10 rounds)

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/geo_attendance';

const userSchema = new mongoose.Schema({
  userId: String,
  name: String,
  email: String,
  password_hash: String,
  role: String,
  department: String,
  phone: String,
  status: String,
  registered_faces: Number,
  created_at: Date,
  updated_at: Date
}, { collection: 'users' });

const User = mongoose.model('User', userSchema);

async function createAdminUser() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Check if admin already exists
    const existing = await User.findOne({ email: 'admin@geo.com' });
    if (existing) {
      console.log('\n⚠️  Admin user already exists!');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('Email: admin@geo.com');
      console.log('User ID:', existing.userId);
      console.log('Name:', existing.name);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      await mongoose.connection.close();
      return;
    }

    // Hash password
    const password = 'admin123';
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create admin user
    const admin = await User.create({
      userId: 'ADMIN001',
      name: 'Admin User',
      email: 'admin@geo.com',
      password_hash: hashedPassword,
      role: 'admin',
      department: 'Administration',
      phone: '+1234567890',
      status: 'active',
      registered_faces: 0,
      created_at: new Date(),
      updated_at: new Date()
    });

    console.log('\n✅ Admin user created successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📧 Email: admin@geo.com');
    console.log('🔑 Password: admin123');
    console.log('👤 User ID:', admin.userId);
    console.log('📛 Name:', admin.name);
    console.log('🎯 Role:', admin.role);
    console.log('🆔 MongoDB ID:', admin._id);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('🔐 Login Credentials:');
    console.log('   Email: admin@geo.com');
    console.log('   Password: admin123\n');

    await mongoose.connection.close();
    console.log('✅ Database connection closed');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

createAdminUser();
