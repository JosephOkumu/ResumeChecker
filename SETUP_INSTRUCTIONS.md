# JobPass Migration Setup Instructions

## Overview
This guide will help you set up the migrated JobPass application with Google OAuth, MySQL database, and Gemini AI.

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

# Gemini AI Configuration
GEMINI_API_KEY=your_gemini_api_key_here

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

## 5. Gemini AI Setup

### Get Gemini API Key
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Click "Create API Key"
3. Select or create a Google Cloud project
4. Copy the generated API key
5. Add it to your `server/.env` file as `GEMINI_API_KEY=your_key_here`

### Test Configuration
```bash
cd server
npm run check-env
```

This will verify all environment variables are properly configured.

### Test AI Endpoint
After starting the server, you can test the AI endpoint:
```bash
# Test Gemini AI status (requires authentication)
curl -X GET http://localhost:3001/api/ai/test \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 6. Start the Application

### Start Backend Server
```bash
cd server
npm run dev
```

### Start Frontend (in new terminal)
```bash
npm run dev
```

## 7. Test the Migration

1. Open http://localhost:5173
2. Click "Log In" - should show Google OAuth
3. Sign in with Google account
4. Upload a resume (PDF)
5. Test AI analysis with Gemini AI

## Key Changes Made
