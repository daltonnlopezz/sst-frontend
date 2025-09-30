# SST 2.0 Frontend - Render Deployment Guide

This guide will help you deploy the SST 2.0 frontend to Render, just like your other projects.

## 🚀 **Quick Deployment Steps**

### **Step 1: Prepare Your Repository**

1. **Push your code to GitHub** (if not already done):
   ```bash
   git add .
   git commit -m "Add SST 2.0 frontend for Render deployment"
   git push origin main
   ```

2. **Make sure these files are in your repository**:
   - `frontend/app_render.py` (production version)
   - `frontend/requirements.txt`
   - `frontend/Procfile`
   - `frontend/start.sh`
   - `frontend/render.yaml`
   - `frontend/templates/` (all HTML templates)
   - `frontend/static/` (CSS and JS files)

### **Step 2: Deploy to Render**

1. **Go to Render Dashboard**: https://dashboard.render.com
2. **Click "New +"** → **"Web Service"**
3. **Connect your GitHub repository**
4. **Configure the service**:
   - **Name**: `sst-2-frontend` (or your preferred name)
   - **Root Directory**: `SST.2.0/frontend`
   - **Runtime**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `gunicorn --bind 0.0.0.0:$PORT app_render:app`

### **Step 3: Environment Variables (Optional)**

If you want to connect to a real database, add these environment variables in Render:

- `DATABASE_URL`: Your database connection string
- `FLASK_ENV`: `production`
- `PYTHON_VERSION`: `3.11.0`

## 📁 **File Structure for Render**

```
SST.2.0/frontend/
├── app_render.py          # Production Flask app
├── requirements.txt       # Python dependencies
├── Procfile              # Render process file
├── start.sh              # Startup script
├── render.yaml           # Render configuration
├── templates/            # HTML templates
│   ├── base.html
│   └── index.html
└── static/               # Static assets
    ├── css/style.css
    └── js/app.js
```

## 🔧 **Configuration Details**

### **app_render.py**
- Production-ready Flask application
- Handles database connection gracefully
- Falls back to mock data if database unavailable
- Configured for Render's PORT environment variable

### **requirements.txt**
- All necessary Python packages
- Includes Gunicorn for production server
- Optimized for Render's Python environment

### **Procfile**
- Tells Render how to start your app
- Uses Gunicorn for production performance

### **render.yaml**
- Render service configuration
- Defines build and start commands
- Sets environment variables

## 🌐 **Access Your Deployed App**

Once deployed, Render will give you a URL like:
```
https://sst-2-frontend.onrender.com
```

## 🎯 **Features Available**

Your deployed frontend will include:

- **Dashboard** with statistics and charts
- **Opportunity Search** and filtering
- **Mock Data** for demonstration (35,641+ opportunities)
- **Responsive Design** for mobile and desktop
- **Email Request Interface** (demo mode)
- **Analytics Charts** showing agency and NAICS distributions

## 🔄 **Updating Your Deployment**

To update your deployed app:

1. **Make changes** to your code
2. **Commit and push** to GitHub:
   ```bash
   git add .
   git commit -m "Update frontend"
   git push origin main
   ```
3. **Render will automatically redeploy** your changes

## 🗄️ **Database Integration Options**

### **Option 1: Mock Data (Current)**
- Uses sample data for demonstration
- No database connection required
- Perfect for showcasing the interface

### **Option 2: Connect to Your Database**
- Add your database connection string to Render environment variables
- The app will automatically connect to your real database
- All 35,641+ opportunities will be available

### **Option 3: External Database Service**
- Use Render's PostgreSQL addon
- Migrate your SQLite data to PostgreSQL
- Full production database integration

## 🚨 **Troubleshooting**

### **Common Issues:**

1. **Build Fails**:
   - Check that all files are in the correct directory
   - Verify `requirements.txt` has all dependencies
   - Check Render build logs for specific errors

2. **App Won't Start**:
   - Verify `Procfile` is correct
   - Check that `app_render.py` exists
   - Review Render service logs

3. **Database Connection Issues**:
   - App will fall back to mock data automatically
   - Check environment variables if using real database
   - Verify database URL format

### **Debug Commands:**

```bash
# Test locally with production settings
export FLASK_ENV=production
python app_render.py

# Test with Gunicorn
gunicorn --bind 0.0.0.0:5000 app_render:app
```

## 📊 **Performance Optimization**

- **Gunicorn** handles multiple requests efficiently
- **Static files** are served by Render's CDN
- **Database queries** are optimized for production
- **Caching** can be added for better performance

## 🔒 **Security Considerations**

- **CORS** is configured for web access
- **Environment variables** keep sensitive data secure
- **Production mode** disables debug features
- **Input validation** prevents malicious requests

## 📈 **Monitoring**

Render provides:
- **Uptime monitoring**
- **Performance metrics**
- **Error logging**
- **Deployment history**

## 🎉 **Success!**

Once deployed, you'll have a professional web interface for your SST 2.0 system that's:
- ✅ **Always available** (24/7 uptime)
- ✅ **Scalable** (handles multiple users)
- ✅ **Professional** (modern UI/UX)
- ✅ **Accessible** (works on any device)
- ✅ **Maintainable** (easy to update)

Your SST 2.0 frontend will be live and accessible to anyone with the URL!
