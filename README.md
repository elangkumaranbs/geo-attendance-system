# GEO-Enabled Smart Attendance System

Enterprise-grade attendance tracking with AI-powered face recognition and GPS geofencing.

## 🚀 Features

- **AI Face Recognition**: 70% similarity threshold using CNN-based FaceNet
- **GPS Geofencing**: Real-time location validation with 100m radius
- **Admin Dashboard**: User management, attendance reports, analytics
- **Student Portal**: Quick attendance marking with face verification
- **Reports & Analytics**: Export attendance data, print reports, date filters
- **Responsive Design**: Works on desktop, tablet, and mobile devices

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, React, TailwindCSS
- **Backend**: Node.js, Express, MongoDB
- **ML Service**: Python, FastAPI, PyTorch, FaceNet
- **Authentication**: JWT with 7-day expiry
- **Face Recognition**: InceptionResnetV1 (512-D embeddings)

## ⚡ Quick Start (Local)

### Prerequisites
- Node.js 18+
- Python 3.9+
- MongoDB
- Conda (for ML service)

### 1. Clone & Install
```bash
# Install backend
cd backend
npm install

# Install frontend
cd ../frontend
npm install

# Install ML service
cd ../ml-service
pip install -r requirements.txt
```

### 2. Configure Environment
Update `.env` files in backend, frontend, and ml-service folders with your settings.

### 3. Start Services
```bash
# Easy way - use the batch file
./restart-all-services.bat

# Or start individually
cd backend && npm run dev
cd frontend && npm run dev
cd ml-service && uvicorn app:app --port 8000
```

### 4. Create Admin & Setup Geofence
```bash
cd scripts
node create-admin.js
node setup-geofence.js
```

### 5. Access System
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **ML Service**: http://localhost:8000
- **Admin Login**: admin@geo.com / admin123

## 🌐 Deploy to Production

See **[DEPLOYMENT.md](./DEPLOYMENT.md)** for complete hosting guide.

**Quick Deploy**:
- Frontend: Vercel (Free)
- Backend: Render (Free)
- ML Service: Render (Free)
- Database: MongoDB Atlas (Free)

**Total Cost: $0/month** ✅

## 📊 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `POST /api/auth/verify` - Verify JWT token

### Attendance
- `POST /api/attendance/mark` - Mark attendance with face & location
- `GET /api/attendance/today` - Get today's attendance
- `GET /api/attendance/user/:userId` - Get user attendance history

### Admin
- `GET /api/admin/attendance` - Get all attendance records
- `GET /api/admin/users` - Get all users
- `POST /api/admin/users` - Create new user
- `POST /api/admin/face/register` - Register face for user

### Geofence
- `GET /api/geofence` - Get all geofences
- `POST /api/geofence/validate` - Validate location

## 🎯 Default Credentials

**Admin Account**:
- Email: admin@geo.com
- Password: admin123
- User ID: ADMIN001

**Test Student**:
- Email: student@test.com
- Password: student123
- User ID: STU001

⚠️ **Change these in production!**

## 📱 Usage Flow

1. **Student logs in** → Dashboard
2. **Clicks "Mark Attendance"**
3. **System checks GPS location** → Must be in geofence
4. **Captures face photo** → Verifies against registered face
5. **Marks attendance** → Shows success with timestamp
6. **Admin views reports** → Filter, export, print

## 🔒 Security Features

- JWT authentication with httpOnly cookies
- Password hashing with bcrypt
- Rate limiting (100 requests per 15 min)
- Helmet.js security headers
- CORS protection
- Input validation & sanitization
- Face data encryption

## 📈 Performance

- Face recognition: ~2-3 seconds
- Average response time: <200ms
- Database queries: Optimized with indexes
- Image processing: Compressed to <5MB

## 🤝 Contributing

This is a production-ready system. Fork and customize for your needs.

## 📄 License

MIT License - Free to use and modify

## 🆘 Support

For issues or questions:
1. Check [DEPLOYMENT.md](./DEPLOYMENT.md)
2. Review API documentation
3. Check browser console for errors
4. Verify all services are running

## 🎉 Credits

Built with modern web technologies and AI-powered face recognition.

---

**Made with ❤️ for efficient attendance management**
