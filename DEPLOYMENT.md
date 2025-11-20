# 🚀 GEO-ENABLED ATTENDANCE SYSTEM - DEPLOYMENT GUIDE

## Quick Deploy Options

### 1️⃣ Backend API (Node.js + MongoDB)

#### Option A: Render.com (Recommended - Free)
1. Create account at [render.com](https://render.com)
2. Click "New +" → "Web Service"
3. Connect your repository or upload code
4. Settings:
   - **Name**: geo-attendance-backend
   - **Environment**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free
5. Add Environment Variables:
   ```
   NODE_ENV=production
   MONGODB_URI=<your_mongodb_atlas_uri>
   JWT_SECRET=<generate_random_32char_string>
   ML_SERVICE_URL=<your_ml_service_url>
   CORS_ORIGIN=<your_frontend_url>
   ```
6. Deploy! ✅

#### Option B: Railway.app
1. Go to [railway.app](https://railway.app)
2. "New Project" → "Deploy from GitHub"
3. Select backend folder
4. Add environment variables (same as above)
5. Deploy automatically

### 2️⃣ Frontend (Next.js)

#### Vercel (Recommended - Free)
1. Create account at [vercel.com](https://vercel.com)
2. Click "Add New..." → "Project"
3. Import your repository
4. Settings:
   - **Framework Preset**: Next.js
   - **Root Directory**: frontend
   - **Build Command**: `npm run build`
   - **Output Directory**: .next
5. Add Environment Variables:
   ```
   NEXT_PUBLIC_API_URL=https://your-backend.onrender.com
   NEXT_PUBLIC_ML_SERVICE_URL=https://your-ml-service.onrender.com
   ```
6. Deploy! ✅

### 3️⃣ ML Service (FastAPI + Python)

#### Option A: Render.com
1. "New +" → "Web Service"
2. Settings:
   - **Name**: geo-ml-service
   - **Environment**: Python 3
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn app:app --host 0.0.0.0 --port $PORT`
3. Deploy! ✅

#### Option B: Railway.app
1. Use the `railway.toml` config included
2. Deploy from GitHub
3. Automatic deployment ✅

### 4️⃣ Database - MongoDB Atlas (Free)

1. Create account at [mongodb.com/cloud/atlas](https://mongodb.com/cloud/atlas)
2. Create FREE cluster (M0)
3. Create Database User:
   - Username: `geo_admin`
   - Password: Generate secure password
4. Network Access:
   - Click "Add IP Address"
   - Choose "Allow Access from Anywhere" (0.0.0.0/0)
5. Get Connection String:
   - Click "Connect" → "Connect your application"
   - Copy connection string
   - Replace `<password>` with your password
   - Use this in `MONGODB_URI` environment variable

## 📋 Pre-Deployment Checklist

- [ ] MongoDB Atlas cluster created
- [ ] Connection string obtained
- [ ] JWT_SECRET generated (min 32 characters)
- [ ] All `.env.production` files configured
- [ ] CORS_ORIGIN updated with frontend URL
- [ ] API_URL updated in frontend env
- [ ] ML_SERVICE_URL configured in backend

## 🔐 Security Notes

**IMPORTANT**: Never commit these files with real credentials:
- `.env`
- `.env.production`
- `.env.local`

## 🌐 URLs After Deployment

After deployment, your system will have 3 URLs:
1. **Frontend**: `https://your-app.vercel.app`
2. **Backend API**: `https://your-backend.onrender.com`
3. **ML Service**: `https://your-ml-service.onrender.com`

Update these in your environment variables accordingly.

## 🧪 Testing Deployment

1. Visit frontend URL
2. Login with admin credentials
3. Try marking attendance
4. Check face verification works
5. Verify geofence validation

## 💰 Cost Estimate

- Frontend (Vercel): **FREE** ✅
- Backend (Render): **FREE** ✅
- ML Service (Render): **FREE** ✅
- MongoDB Atlas (M0): **FREE** ✅

**Total Monthly Cost: $0** 🎉

## ⚡ Quick Commands

### Generate JWT Secret
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Test Backend Locally
```bash
cd backend
npm start
```

### Test Frontend Locally
```bash
cd frontend
npm run build
npm start
```

### Test ML Service Locally
```bash
cd ml-service
uvicorn app:app --host 0.0.0.0 --port 8000
```

## 🆘 Troubleshooting

### Backend won't start
- Check MongoDB connection string
- Verify all environment variables are set
- Check logs in Render dashboard

### Frontend can't connect to backend
- Verify NEXT_PUBLIC_API_URL is correct
- Check CORS settings in backend
- Ensure backend is deployed and running

### Face recognition fails
- Verify ML_SERVICE_URL in backend
- Check ML service is deployed and running
- Test ML service health endpoint: `/health`

## 🎯 Next Steps

1. Deploy ML Service first
2. Deploy Backend with ML Service URL
3. Deploy Frontend with Backend URL
4. Test complete flow
5. Share your app! 🚀

---

**Need help?** Check deployment platform docs:
- [Render Documentation](https://render.com/docs)
- [Vercel Documentation](https://vercel.com/docs)
- [Railway Documentation](https://docs.railway.app)
