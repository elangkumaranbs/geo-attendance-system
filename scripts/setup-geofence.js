const { MongoClient } = require('mongodb');

async function createGeofence() {
  const uri = 'mongodb://localhost:27017';
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');

    const db = client.db('geo_attendance');
    const geofences = db.collection('geofences');

    // Delete existing geofences
    await geofences.deleteMany({});
    console.log('🗑️ Cleared existing geofences');

    // Create new geofence with your coordinates
    const geofence = {
      name: "Campus Main Area",
      description: "Primary attendance geofence - 500m radius",
      type: "campus",
      center: {
        latitude: 11.357389,
        longitude: 77.499597
      },
      radius: 500,
      active: true,
      allowed_times: {
        enabled: false,
        start: "00:00",
        end: "23:59"
      },
      allowed_days: {
        enabled: false,
        days: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]
      },
      allowed_roles: ["student", "employee", "admin"],
      wifi_ssids: {
        enabled: false,
        ssids: []
      },
      color: "#3B82F6",
      created_by: "system",
      created_at: new Date(),
      updated_at: new Date()
    };

    await geofences.insertOne(geofence);

    console.log('\n✅ Geofence created successfully!');
    console.log('📍 Location: Lat 11.357389, Lon 77.499597');
    console.log('📏 Radius: 500 meters');
    console.log('🟢 Status: Active for all roles, all times');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.close();
  }
}

createGeofence();
