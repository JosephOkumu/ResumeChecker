# Job Pass Migration Setup Instructions

## Overview
This guide will help you set up the migrated Job Pass application with Google OAuth, MySQL database, and Puter.js AI.

## Prerequisites
- Node.js (v18 or higher)
- MySQL server
- Google Cloud Console account

## 1. Database Setup

### Install MySQL
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install mysql-server

# macOS
brew install mysql

# Windows
# Download from https://dev.mysql.com/downloads/mysql/
```

### Create Database
```bash
mysql -u root -p
```

```sql
CREATE DATABASE job_pass;
CREATE USER 'job_pass_user'@'localhost' IDENTIFIED BY 'your_secure_password';
GRANT ALL PRIVILEGES ON job_pass.* TO 'job_pass_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### Run Schema
```bash
cd server
mysql -u job_pass_user -p job_pass < database/schema.sql
```

## 2. Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google+ API
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client IDs"
5. Set application type to "Web application"
6. Add authorized origins:
   - `http://localhost:5173` (development)
   - Your production domain
7. Copy the Client ID

## 3. Environment Configuration

### Backend (.env)
```bash
cd server
cp .env.example .env
```

Edit `server/.env`:
```env
DB_HOST=localhost
DB_USER=job_pass_user
DB_PASSWORD=your_secure_password
DB_NAME=job_pass

GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

JWT_SECRET=your_jwt_secret_key_here

PORT=3001
FRONTEND_URL=http://localhost:5173
```

### Frontend (.env)
```bash
cp .env.example .env
```

Edit `.env`:
```env
VITE_GOOGLE_CLIENT_ID=your_google_client_id
VITE_API_URL=http://localhost:3001/api
```

## 4. Install Dependencies

### Backend
```bash
cd server
npm install
```

### Frontend
```bash
npm install
```

## 5. Start the Application

### Start Backend Server
```bash
cd server
npm run dev
```

### Start Frontend (in new terminal)
```bash
npm run dev
```

## 6. Test the Migration

1. Open http://localhost:5173
2. Click "Log In" - should show Google OAuth
3. Sign in with Google account
4. Upload a resume (PDF)
5. Test AI analysis with Puter.js

## Key Changes Made

### Authentication
- ✅ Replaced Puter.js auth with Google OAuth
- ✅ JWT tokens for session management
- ✅ User data stored in MySQL

### Storage
- ✅ Replaced Puter.js KV store with MySQL database
- ✅ File uploads stored locally in `server/uploads/`
- ✅ Resume metadata in database

### AI Analysis
- ✅ Kept Puter.js AI for resume analysis
- ✅ Analysis results saved to MySQL
- ✅ Frontend calls Puter.js directly for AI

### Data Flow
```
User → Google OAuth → JWT Token → MySQL Database
                                ↓
                            Puter.js AI (analysis only)
```

## Troubleshooting

### Database Connection Issues
- Check MySQL service is running
- Verify credentials in `.env`
- Check firewall settings

### Google OAuth Issues
- Verify Client ID in both frontend and backend
- Check authorized origins in Google Console
- Ensure HTTPS in production

### File Upload Issues
- Check `server/uploads/` directory permissions
- Verify file size limits in backend

## Production Deployment

1. Set up MySQL on production server
2. Update environment variables
3. Build frontend: `npm run build`
4. Deploy backend with PM2 or similar
5. Set up reverse proxy (nginx)
6. Configure HTTPS
7. Update Google OAuth origins
