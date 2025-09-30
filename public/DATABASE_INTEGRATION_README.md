# SST 2.0 Database Integration Guide

## 🏢 **How Companies Handle User Registration & Database Updates**

### **Typical Enterprise Flow:**
1. **Frontend Form** → User fills registration form
2. **API Validation** → Frontend sends data to backend API
3. **Backend Processing** → Server validates and processes data
4. **Database Storage** → Data saved to users and companies tables
5. **Session Creation** → User session established
6. **Response** → Frontend receives confirmation

## 🚀 **SST 2.0 Implementation**

### **Architecture Overview:**
```
Frontend (HTML/JS) → API Client → Backend Server → SQLite Database
```

### **Database Schema:**
- **Users Table**: Personal information, authentication
- **Companies Table**: Company details, NAICS, PSC codes, capabilities
- **User_Companies Table**: Many-to-many relationship
- **Sessions Table**: User authentication sessions

## 📁 **File Structure:**

```
SST.2.0/frontend/public/
├── api.js                 # API client for frontend
├── server.py             # Backend Flask server
├── run_server.py         # Server startup script
├── requirements.txt      # Python dependencies
├── auth.js              # Authentication logic (updated)
├── dashboard.js         # Dashboard logic (updated)
└── DATABASE_INTEGRATION_README.md
```

## 🔧 **Setup Instructions:**

### **1. Install Backend Dependencies:**
```bash
cd SST.2.0/frontend/public
pip install -r requirements.txt
```

### **2. Start the Backend Server:**
```bash
python run_server.py
```
The server will run on `http://localhost:5001`

### **3. Access the Frontend:**
Open `index.html` in your browser or serve it via a web server.

## 🔄 **Registration Flow:**

### **When User Registers:**
1. **Frontend** collects all form data
2. **API Client** sends POST request to `/api/auth/register`
3. **Backend Server** receives data and validates
4. **Database Operations:**
   - Creates user record in `users` table
   - Creates company record in `companies` table
   - Links user to company in `user_companies` table
   - Creates session in `user_sessions` table
5. **Response** sent back to frontend
6. **Frontend** redirects to dashboard

### **Database Tables Created:**
```sql
-- Users table
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    uuid TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    phone TEXT,
    job_title TEXT,
    email_verified BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Companies table
CREATE TABLE companies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    uuid TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    duns_number TEXT UNIQUE,
    cage_code TEXT UNIQUE,
    uei TEXT UNIQUE,
    company_size TEXT,
    business_type TEXT,
    address TEXT,
    primary_naics TEXT,
    secondary_naics TEXT,
    primary_psc TEXT,
    secondary_psc TEXT,
    psc_description TEXT,
    primary_keywords TEXT NOT NULL,
    secondary_keywords TEXT,
    capabilities TEXT,
    certifications TEXT,
    is_verified BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER REFERENCES users(id)
);

-- User-Company relationship
CREATE TABLE user_companies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id),
    company_id INTEGER NOT NULL REFERENCES companies(id),
    role TEXT NOT NULL DEFAULT 'owner',
    is_primary BOOLEAN DEFAULT TRUE,
    joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, company_id)
);

-- User sessions
CREATE TABLE user_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id),
    session_token TEXT UNIQUE NOT NULL,
    ip_address TEXT,
    user_agent TEXT,
    expires_at DATETIME NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## 🔐 **Security Features:**

### **Password Security:**
- Passwords hashed with SHA-256 + salt
- No plain text passwords stored
- Secure session tokens

### **Data Validation:**
- Required field validation
- Email format validation
- DUNS/CAGE/UEI format validation
- SQL injection prevention

### **Session Management:**
- Secure session tokens
- Session expiration (30 days)
- IP address tracking
- User agent tracking

## 📊 **API Endpoints:**

### **Authentication:**
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login

### **User Management:**
- `GET /api/users/{id}/profile` - Get user profile
- `PUT /api/users/{id}/profile` - Update user profile

### **Company Management:**
- `GET /api/companies/{id}` - Get company data
- `PUT /api/companies/{id}` - Update company data

### **Statistics:**
- `GET /api/users/{id}/stats` - Get user statistics
- `GET /api/users/{id}/activity` - Get recent activity

### **Health Check:**
- `GET /api/health` - Server health status

## 🎯 **Key Benefits:**

### **1. Proper Data Storage:**
- All user data saved to database
- Company information properly linked
- Data persists across sessions

### **2. Scalability:**
- API-based architecture
- Easy to add new endpoints
- Database can handle multiple users

### **3. Security:**
- Proper password hashing
- Session management
- Data validation

### **4. Maintainability:**
- Clean separation of concerns
- Easy to modify database schema
- API versioning support

## 🔄 **Fallback System:**

The system includes a fallback to localStorage if the API is unavailable:
- Frontend tries API first
- Falls back to localStorage if API fails
- Seamless user experience

## 🚀 **Production Deployment:**

### **For Production:**
1. Use PostgreSQL or MySQL instead of SQLite
2. Add environment variables for database connection
3. Use proper secret keys for password hashing
4. Add rate limiting and CORS configuration
5. Use HTTPS for all communications
6. Add logging and monitoring

### **Environment Variables:**
```bash
DATABASE_URL=postgresql://user:pass@localhost/sst_db
SECRET_KEY=your-secret-key-here
API_BASE_URL=https://your-api-domain.com
```

## 📝 **Testing:**

### **Test Registration:**
1. Start the backend server
2. Open the frontend
3. Fill out registration form
4. Check database for new records

### **Test Login:**
1. Use registered credentials
2. Verify session creation
3. Check dashboard access

This implementation follows enterprise best practices for user registration and database management! 🎉
