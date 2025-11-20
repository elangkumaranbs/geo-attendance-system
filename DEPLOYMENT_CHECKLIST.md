# 🚀 DEPLOYMENT CHECKLIST

## Before You Deploy - Requirements

### ✅ What You Need:

1. **MongoDB Atlas Account** (Free)
   - Sign up at: https://www.mongodb.com/cloud/atlas
   - Create M0 FREE cluster (512MB)
   - Get connection string

2. **Render Account** (Free)
   - Sign up at: https://render.com
   - For Backend & ML Service

3. **Vercel Account** (Free)
   - Sign up at: https://vercel.com
   - For Frontend

4. **GitHub Account** (Optional but Recommended)
   - Push your code to GitHub
   - Enable auto-deployments

---

## 📋 Step-by-Step Deployment Process

### STEP 1: Setup Configuration (Use CLI Tool)

Run the deployment setup tool:
```bash
node scripts/deploy-setup.js
```

**You'll need to provide:**
- MongoDB Atlas connection string
- JWT secret (auto-generated or custom)
- Face similarity threshold (default: 0.70)
- Geofence radius (default: 100m)

---

### STEP 2: Create MongoDB Atlas Database

1. **Go to**: https://mongodb.com/cloud/atlas
2. **Sign up** or log in
3. **Create Organization** → Name it (e.g., "GeoAttendance")
4. **Create Project** → Name it (e.g., "Production")
5. **Build Database** → Choose FREE M0 tier
6. **Select Region** → Choose closest to your users
7. **Create Cluster** → Wait 3-5 minutes

**Security Setup:**
- **Database Access** → Add Database User
  - Username: `geo_admin`
  - Password: Auto-generate and save it
  - Database User Privileges: Read & Write to any database

- **Network Access** → Add IP Address
  - Click "Allow Access from Anywhere"
  - Add: `0.0.0.0/0`
  - (For production, restrict to your server IPs)

**Get Connection String:**
- Click "Connect" → "Connect your application"
- Copy the connection string
- Replace `<password>` with your database password
- Format: `mongodb+srv://geo_admin:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/geo_attendance`

---

### STEP 3: Deploy ML Service (Deploy This FIRST)

#### Option A: Render

1. **Go to**: https://render.com
2. **New +** → **Web Service**
3. **Connect Repository** or **Upload Code**
4. **Settings:**
   ```
   Name: geo-ml-service
   Root Directory: ml-service
   Environment: Python 3
   Build Command: pip install -r requirements.txt
   Start Command: uvicorn app:app --host 0.0.0.0 --port $PORT
   Instance Type: Free
   ```

5. **Environment Variables:**
   ```
   ENVIRONMENT=production
   LOG_LEVEL=info
   MONGODB_URI=<your_mongodb_atlas_uri>
   ```

6. **Deploy** → Wait 5-10 minutes
7. **Copy URL**: `https://geo-ml-service.onrender.com`

#### Option B: Railway

1. **Go to**: https://railway.app
2. **New Project** → **Deploy from GitHub**
3. **Select** ml-service folder
4. **Add variables** (same as above)
5. Railway will auto-deploy using `railway.toml`

**Test ML Service:**
```bash
curl https://your-ml-service.onrender.com/health
# Should return: {"status": "healthy"}
```

---

### STEP 4: Deploy Backend

1. **Go to**: https://render.com
2. **New +** → **Web Service**
3. **Connect Repository** or **Upload Code**
4. **Settings:**
   ```
   Name: geo-attendance-backend
   Root Directory: backend
   Environment: Node
   Build Command: npm install
   Start Command: npm start
   Instance Type: Free
   ```

5. **Environment Variables** (Copy from `backend/.env.production`):
   ```
   NODE_ENV=production
   PORT=5000
   MONGODB_URI=<your_mongodb_atlas_uri>
   JWT_SECRET=<generated_secret_from_cli>
   ML_SERVICE_URL=https://geo-ml-service.onrender.com
   FACE_SIMILARITY_THRESHOLD=0.70
   MAX_FACES_PER_USER=5
   DEFAULT_GEOFENCE_RADIUS=100
   GPS_ACCURACY_THRESHOLD=50
   RATE_LIMIT_WINDOW_MS=900000
   RATE_LIMIT_MAX_REQUESTS=100
   MAX_FILE_SIZE=5242880
   CORS_ORIGIN=<will_add_after_frontend_deployed>
   LOG_LEVEL=info
   ```

6. **Deploy** → Wait 5-10 minutes
7. **Copy URL**: `https://geo-attendance-backend.onrender.com`

**Test Backend:**
```bash
curl https://your-backend.onrender.com/health
# Should return: {"success": true, "message": "Server is running"}
```

---

### STEP 5: Deploy Frontend

1. **Go to**: https://vercel.com
2. **Add New...** → **Project**
3. **Import Git Repository** (or upload)
4. **Settings:**
   ```
   Framework Preset: Next.js
   Root Directory: frontend
   Build Command: npm run build (auto-detected)
   Output Directory: .next (auto-detected)
   Install Command: npm install (auto-detected)
   ```

5. **Environment Variables:**
   ```
   NEXT_PUBLIC_API_URL=https://geo-attendance-backend.onrender.com
   NEXT_PUBLIC_ML_SERVICE_URL=https://geo-ml-service.onrender.com
   NEXT_PUBLIC_APP_NAME=Geo Attendance System
   NEXT_PUBLIC_ENVIRONMENT=production
   ```

6. **Deploy** → Wait 2-3 minutes
7. **Copy URL**: `https://your-project.vercel.app`

---

### STEP 6: Update CORS in Backend

1. Go back to **Render** → Your Backend Service
2. Update environment variable:
   ```
   CORS_ORIGIN=https://your-project.vercel.app
   ```
3. **Manual Deploy** → Redeploy backend

---

### STEP 7: Initialize Database

**Connect to Production MongoDB:**

Update `backend/.env` temporarily to point to production:
```env
MONGODB_URI=<your_production_mongodb_uri>
```

**Create Admin Account:**
```bash
cd scripts
node create-admin.js
```

**Setup Geofence:**
```bash
node setup-geofence.js
```

Edit geofence coordinates for your location:
- Open `scripts/setup-geofence.js`
- Update latitude/longitude
- Update radius
- Run the script

**Restore local .env:**
```bash
# Change MONGODB_URI back to localhost for local development
```

---

### STEP 8: Test Complete System

1. **Visit Frontend**: https://your-project.vercel.app
2. **Login**: admin@geo.com / admin123
3. **Test Features:**
   - ✅ Login works
   - ✅ Dashboard loads
   - ✅ Create test student
   - ✅ Register face for student
   - ✅ Mark attendance (if in geofence)
   - ✅ View reports
   - ✅ Export CSV

---

## 🔄 Update URLs After Deployment

After all services are deployed, you need to update URLs:

### Frontend → Backend
Update in Vercel:
```
NEXT_PUBLIC_API_URL=https://geo-attendance-backend.onrender.com
```

### Backend → ML Service
Update in Render:
```
ML_SERVICE_URL=https://geo-ml-service.onrender.com
```

### Backend → Frontend (CORS)
Update in Render:
```
CORS_ORIGIN=https://your-project.vercel.app
```

---

## 🎯 Quick Reference

### Your Deployment URLs:
```
Frontend:    https://__________.vercel.app
Backend:     https://__________.onrender.com
ML Service:  https://__________.onrender.com
Database:    mongodb+srv://__________.mongodb.net
```

### Admin Login:
```
Email:    admin@geo.com
Password: admin123
User ID:  ADMIN001
```

⚠️ **Change admin password after first login!**

---

## 🆘 Troubleshooting

### Backend won't start:
- Check MongoDB connection string
- Verify all environment variables
- Check Render logs

### Frontend shows errors:
- Verify API_URL is correct
- Check backend is running
- Open browser console for errors

### Face recognition fails:
- Verify ML service is running
- Check ML_SERVICE_URL in backend
- Test ML service /health endpoint

### CORS errors:
- Update CORS_ORIGIN in backend
- Redeploy backend after change

### Database connection fails:
- Check MongoDB Atlas IP whitelist
- Verify database user credentials
- Ensure connection string format is correct

---

## 💰 Cost Breakdown

| Service | Platform | Plan | Cost |
|---------|----------|------|------|
| Frontend | Vercel | Hobby | **FREE** |
| Backend | Render | Free | **FREE** |
| ML Service | Render/Railway | Free | **FREE** |
| Database | MongoDB Atlas | M0 | **FREE** |
| **TOTAL** | | | **$0/month** |

**Free Tier Limits:**
- Vercel: 100GB bandwidth/month
- Render: 750 hours/month
- MongoDB: 512MB storage

---

## 📈 Production Tips

1. **Enable Auto-Deploy**:
   - Connect GitHub to Vercel/Render
   - Push to main branch = auto deploy

2. **Monitor Services**:
   - Check Render/Vercel dashboards
   - Set up email alerts

3. **Backup Database**:
   - MongoDB Atlas auto-backups (every 24hrs)
   - Download manual backups weekly

4. **Update Regularly**:
   - Update npm packages
   - Update Python packages
   - Security patches

5. **Change Default Credentials**:
   - Change admin password
   - Update JWT secret
   - Use environment-specific secrets

---

## ✅ Deployment Complete!

Your system is now live at:
- **App**: https://your-project.vercel.app
- **API**: https://your-backend.onrender.com

Share with your users and start tracking attendance! 🎉
