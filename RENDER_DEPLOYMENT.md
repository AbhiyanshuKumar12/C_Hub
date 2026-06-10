# Render Deployment Guide for SJB Connect

## ⚠️ IMPORTANT: Database Migration

**SQLite won't persist on Render** (ephemeral filesystem). Your options:

### Option A: PostgreSQL (Recommended)
- Render provides free PostgreSQL databases
- Your code already supports it via `pg` dependency
- Data persists permanently

### Option B: Keep SQLite
- Database resets on each deploy
- Only suitable for development/testing

---

## Steps to Deploy on Render

### 1. Push Your Project to GitHub
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR-USERNAME/sjb-connect.git
git push -u origin main
```

### 2. Sign Up on Render
- Go to [render.com](https://render.com)
- Sign up with GitHub account
- Authorize Render to access your repositories

### 3. Create a New Web Service
1. Click "New +" → "Web Service"
2. Select your GitHub repository
3. Configure:
   - **Name:** `sjb-connect`
   - **Environment:** Node
   - **Region:** Choose closest to you
   - **Branch:** main
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Plan:** Free (or paid if needed)

### 4. Set Environment Variables
In the Render dashboard, go to "Environment" and add:

```
DATABASE_URL=postgresql://... (if using PostgreSQL)
SESSION_SECRET=your-super-secret-random-string
CLOUDINARY_NAME=your-cloudinary-name
CLOUDINARY_API_KEY=your-cloudinary-key
CLOUDINARY_API_SECRET=your-cloudinary-secret
NODE_ENV=production
```

### 5. Migrate to PostgreSQL (Recommended)

#### Create a PostgreSQL Database on Render:
1. Click "New +" → "PostgreSQL"
2. Give it a name (e.g., `sjb-connect-db`)
3. Render will provide a `DATABASE_URL`

#### Add to your environment variables on the Web Service

#### Update your server.js to use PostgreSQL:
```javascript
// Replace SQLite setup with PostgreSQL
const { Pool } = require('pg');
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

const db = {
    query: (sql, params = []) => pool.query(sql, params)
};
```

### 6. Deploy
- Push changes to GitHub
- Render automatically builds and deploys
- Your app will be available at: `https://sjb-connect.onrender.com`

---

## File Upload Handling

**Local file uploads won't persist on Render.** Solutions:

### Option 1: Cloudinary (Recommended)
You already have it set up! Ensure:
- `CLOUDINARY_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`

are in environment variables.

### Option 2: AWS S3 or Google Cloud Storage
Store uploaded files in cloud storage instead of `uploads/` folder

---

## Testing Before Deploy
```bash
npm start
# Visit http://localhost:3000
```

## Troubleshooting

**500 Error on Deploy?**
- Check Render logs: Dashboard → Logs
- Common issues:
  - Missing environment variables
  - Database connection error
  - Port not set correctly

**Files/Database Lost After Deploy?**
- This is expected with ephemeral storage
- Use PostgreSQL for persistent data
- Use Cloudinary for file uploads

---

## Free Plan Limitations
- App spins down after 15 minutes of inactivity
- Limited to 400GB/month bandwidth
- Shared CPU resources
- Suitable for hobby projects

Upgrade to paid for production use.
