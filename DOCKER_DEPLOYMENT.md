# 🐳 Docker Deployment Guide

## Quick Start - Local Docker Testing

### Test Locally with Docker Compose

1. **Set Environment Variables**:
```bash
# Create .env file in root directory
echo "MONGODB_URI=mongodb+srv://elangkumaranbs_db_user:IwT6NYlOAT9MfzBp@geoattendance.losycvq.mongodb.net/geo_attendance?retryWrites=true&w=majority" > .env
echo "JWT_SECRET=your-generated-jwt-secret" >> .env
```

2. **Build and Run All Services**:
```bash
docker-compose up --build
```

3. **Access Services**:
- Frontend: http://localhost:3000
- Backend: http://localhost:5000
- ML Service: http://localhost:8000

4. **Stop Services**:
```bash
docker-compose down
```

---

## 🚀 Deploy to Render with Docker

### Option 1: Using Render Dashboard (Recommended)

#### Step 1: Deploy ML Service

1. **Go to**: https://render.com/dashboard
2. **New +** → **Web Service**
3. **Connect your GitHub repository** (or upload code)
4. **Configuration**:
   ```
   Name: geo-ml-service
   Environment: Docker
   Dockerfile Path: ./ml-service/Dockerfile
   Docker Context: ./ml-service
   Docker Build Context: .
   Branch: main
   Instance Type: Free
   ```

5. **Advanced Settings**:
   - Health Check Path: `/health`
   - Auto-Deploy: Yes

6. **Environment Variables**:
   ```
   ENVIRONMENT=production
   LOG_LEVEL=info
   MONGODB_URI=mongodb+srv://elangkumaranbs_db_user:IwT6NYlOAT9MfzBp@geoattendance.losycvq.mongodb.net/geo_attendance?retryWrites=true&w=majority
   PORT=8000
   ```

7. **Deploy** → Wait 10-15 minutes (first build is slow)
8. **Copy URL**: `https://geo-ml-service-xxxx.onrender.com`

---

#### Step 2: Deploy Backend

1. **New +** → **Web Service**
2. **Configuration**:
   ```
   Name: geo-attendance-backend
   Environment: Docker
   Dockerfile Path: ./backend/Dockerfile
   Docker Context: ./backend
   Branch: main
   Instance Type: Free
   ```

3. **Environment Variables** (from `backend/.env.production`):
   ```
   NODE_ENV=production
   PORT=5000
   MONGODB_URI=mongodb+srv://elangkumaranbs_db_user:IwT6NYlOAT9MfzBp@geoattendance.losycvq.mongodb.net/geo_attendance?retryWrites=true&w=majority
   JWT_SECRET=nM6lw1FHa8bpcms4D5feEX3GyVY790gZoNPjkuixITALdCQBr2tRKOhWqSvzUJ
   ML_SERVICE_URL=https://geo-ml-service-xxxx.onrender.com
   FACE_SIMILARITY_THRESHOLD=0.70
   MAX_FACES_PER_USER=5
   DEFAULT_GEOFENCE_RADIUS=100
   GPS_ACCURACY_THRESHOLD=50
   RATE_LIMIT_WINDOW_MS=900000
   RATE_LIMIT_MAX_REQUESTS=100
   MAX_FILE_SIZE=5242880
   CORS_ORIGIN=https://your-frontend.vercel.app
   LOG_LEVEL=info
   ```

4. **Deploy** → Wait 5-10 minutes
5. **Copy URL**: `https://geo-attendance-backend-xxxx.onrender.com`

---

### Option 2: Using render.yaml Blueprint

1. **Push Code to GitHub**:
```bash
git add .
git commit -m "Add Docker configuration"
git push
```

2. **Go to Render**: https://render.com/dashboard
3. **New +** → **Blueprint**
4. **Connect Repository**
5. **Select** `render-docker.yaml`
6. **Apply** → Render will deploy all services automatically

---

## 🎯 Deploy Frontend (Still use Vercel)

Frontend is better on Vercel (free, fast, optimized for Next.js):

1. **Go to**: https://vercel.com
2. **Import Project**
3. **Settings**:
   ```
   Framework: Next.js
   Root Directory: frontend
   Build Command: npm run build
   Output Directory: .next
   ```

4. **Environment Variables**:
   ```
   NEXT_PUBLIC_API_URL=https://geo-attendance-backend-xxxx.onrender.com
   NEXT_PUBLIC_ML_SERVICE_URL=https://geo-ml-service-xxxx.onrender.com
   NEXT_PUBLIC_APP_NAME=Geo Attendance System
   NEXT_PUBLIC_ENVIRONMENT=production
   ```

5. **Deploy** → 2-3 minutes

---

## 🐳 Docker Commands Reference

### Build Individual Services

```bash
# Build ML Service
docker build -t geo-ml-service ./ml-service

# Build Backend
docker build -t geo-backend ./backend

# Build Frontend
docker build -t geo-frontend ./frontend
```

### Run Individual Containers

```bash
# Run ML Service
docker run -p 8000:8000 -e MONGODB_URI="your-uri" geo-ml-service

# Run Backend
docker run -p 5000:5000 -e MONGODB_URI="your-uri" -e JWT_SECRET="your-secret" geo-backend

# Run Frontend
docker run -p 3000:3000 -e NEXT_PUBLIC_API_URL="http://localhost:5000" geo-frontend
```

### Useful Commands

```bash
# View running containers
docker ps

# View logs
docker logs <container-id>

# Stop all containers
docker-compose down

# Remove all images
docker-compose down --rmi all

# Clean build cache
docker system prune -a
```

---

## 📊 Render Docker vs Native Comparison

| Feature | Docker Deploy | Native Deploy |
|---------|--------------|---------------|
| Setup Time | Longer (first build) | Faster |
| Consistency | ✅ Identical everywhere | May vary |
| Dependencies | ✅ All bundled | Manual install |
| Disk Space | More (~500MB-1GB) | Less |
| Best For | Production | Development |

---

## 🔍 Health Checks

All Docker containers include health checks:

**ML Service**:
```bash
curl https://your-ml-service.onrender.com/health
# Expected: {"status": "healthy"}
```

**Backend**:
```bash
curl https://your-backend.onrender.com/health
# Expected: {"success": true, "message": "Server is running"}
```

**Frontend**:
```bash
curl https://your-frontend.vercel.app
# Expected: 200 OK
```

---

## 🆘 Troubleshooting

### Docker Build Fails

**ML Service taking too long:**
- First build can take 10-15 minutes
- Downloads ~1GB of PyTorch/dependencies
- Be patient, subsequent builds are cached

**Backend build fails:**
- Check package.json is valid
- Ensure all dependencies are listed
- Verify Dockerfile syntax

### Container Crashes

**Check logs in Render:**
1. Go to your service
2. Click "Logs" tab
3. Look for error messages

**Common Issues:**
- Missing environment variables
- MongoDB connection failed
- Port conflicts

### Out of Memory

**Render Free Tier Limits:**
- 512MB RAM per service
- If crashing, optimize:
  - Use Alpine images
  - Remove unused dependencies
  - Reduce concurrent workers

---

## 💡 Tips

1. **First Deployment**: ML service takes 10-15 minutes (large dependencies)
2. **Subsequent Deploys**: 2-3 minutes (Docker cache)
3. **Auto-Deploy**: Enable in Render for automatic updates on git push
4. **Monitoring**: Check Render dashboard for metrics
5. **Logs**: Enable in Render settings for debugging

---

## ✅ Deployment Checklist

- [ ] Docker installed locally (for testing)
- [ ] Code pushed to GitHub
- [ ] MongoDB Atlas connection string ready
- [ ] JWT secret generated
- [ ] ML Service deployed → URL copied
- [ ] Backend deployed → ML URL added → URL copied
- [ ] Frontend deployed → Backend URL added
- [ ] Backend CORS updated with Frontend URL
- [ ] Database initialized (admin + geofence)
- [ ] All health checks passing
- [ ] Login tested successfully

---

## 🎉 You're Done!

Your containerized application is now running on:
- **ML Service**: Render (Docker)
- **Backend**: Render (Docker)
- **Frontend**: Vercel (Optimized)

**Total Cost: $0/month** 🚀
