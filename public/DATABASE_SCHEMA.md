# SST 2.0 Database Schema - User Authentication & Company Data

## 🔐 **Security Requirements**

- **Encryption**: All sensitive data must be encrypted at rest and in transit
- **Hashing**: Passwords must be hashed using bcrypt or similar (minimum 12 rounds)
- **HTTPS**: All database connections must use SSL/TLS
- **Access Control**: Role-based access control (RBAC) implementation
- **Audit Logging**: All database operations must be logged
- **Backup Encryption**: Database backups must be encrypted

## 📊 **Database Tables**

### **1. Users Table**
```sql
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    uuid TEXT UNIQUE NOT NULL, -- UUID for external references
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL, -- bcrypt hashed password
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    phone TEXT,
    job_title TEXT,
    email_verified BOOLEAN DEFAULT FALSE,
    email_verification_token TEXT,
    password_reset_token TEXT,
    password_reset_expires DATETIME,
    last_login DATETIME,
    is_active BOOLEAN DEFAULT TRUE,
    is_admin BOOLEAN DEFAULT FALSE,
    email_notifications BOOLEAN DEFAULT TRUE,
    newsletter_subscription BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER REFERENCES users(id),
    updated_by INTEGER REFERENCES users(id)
);
```

### **2. Companies Table**
```sql
CREATE TABLE companies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    uuid TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    duns_number TEXT UNIQUE,
    cage_code TEXT UNIQUE,
    uei TEXT UNIQUE,
    company_size TEXT CHECK(company_size IN ('small', 'medium', 'large')),
    business_type TEXT CHECK(business_type IN ('corporation', 'llc', 'partnership', 'sole_proprietorship', 'nonprofit', 'government')),
    address TEXT,
    city TEXT,
    state TEXT,
    zip_code TEXT,
    country TEXT DEFAULT 'USA',
    website TEXT,
    phone TEXT,
    email TEXT,
    primary_naics TEXT,
    secondary_naics TEXT, -- JSON array of NAICS codes
    primary_psc TEXT,
    secondary_psc TEXT, -- JSON array of PSC codes
    psc_description TEXT,
    primary_keywords TEXT NOT NULL, -- Comma-separated keywords
    secondary_keywords TEXT, -- Comma-separated keywords
    capabilities TEXT, -- Company capabilities description
    certifications TEXT, -- Certifications and clearances
    is_verified BOOLEAN DEFAULT FALSE,
    verification_date DATETIME,
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER REFERENCES users(id),
    updated_by INTEGER REFERENCES users(id)
);
```

### **3. User_Companies Table (Many-to-Many)**
```sql
CREATE TABLE user_companies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK(role IN ('owner', 'admin', 'user', 'viewer')),
    is_primary BOOLEAN DEFAULT FALSE, -- Primary company for user
    permissions TEXT, -- JSON object of specific permissions
    joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER REFERENCES users(id),
    UNIQUE(user_id, company_id)
);
```

### **4. User_Sessions Table**
```sql
CREATE TABLE user_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_token TEXT UNIQUE NOT NULL,
    ip_address TEXT,
    user_agent TEXT,
    expires_at DATETIME NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_accessed DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### **5. Audit_Logs Table**
```sql
CREATE TABLE audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER REFERENCES users(id),
    action TEXT NOT NULL, -- 'CREATE', 'READ', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT'
    table_name TEXT NOT NULL,
    record_id INTEGER,
    old_values TEXT, -- JSON of old values
    new_values TEXT, -- JSON of new values
    ip_address TEXT,
    user_agent TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### **6. Email_Verifications Table**
```sql
CREATE TABLE email_verifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    verification_token TEXT UNIQUE NOT NULL,
    expires_at DATETIME NOT NULL,
    is_used BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## 🔧 **Indexes for Performance**

```sql
-- Users table indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_uuid ON users(uuid);
CREATE INDEX idx_users_active ON users(is_active);
CREATE INDEX idx_users_email_verified ON users(email_verified);

-- Companies table indexes
CREATE INDEX idx_companies_name ON companies(name);
CREATE INDEX idx_companies_duns ON companies(duns_number);
CREATE INDEX idx_companies_cage ON companies(cage_code);
CREATE INDEX idx_companies_uei ON companies(uei);
CREATE INDEX idx_companies_naics ON companies(primary_naics);
CREATE INDEX idx_companies_psc ON companies(primary_psc);
CREATE INDEX idx_companies_keywords ON companies(primary_keywords);
CREATE INDEX idx_companies_active ON companies(is_active);

-- User_Companies table indexes
CREATE INDEX idx_user_companies_user ON user_companies(user_id);
CREATE INDEX idx_user_companies_company ON user_companies(company_id);
CREATE INDEX idx_user_companies_primary ON user_companies(is_primary);

-- Sessions table indexes
CREATE INDEX idx_sessions_user ON user_sessions(user_id);
CREATE INDEX idx_sessions_token ON user_sessions(session_token);
CREATE INDEX idx_sessions_expires ON user_sessions(expires_at);
CREATE INDEX idx_sessions_active ON user_sessions(is_active);

-- Audit logs indexes
CREATE INDEX idx_audit_user ON audit_logs(user_id);
CREATE INDEX idx_audit_table ON audit_logs(table_name);
CREATE INDEX idx_audit_created ON audit_logs(created_at);
```

## 🛡️ **Security Implementation**

### **Password Security**
```python
import bcrypt
import secrets

def hash_password(password: str) -> str:
    """Hash password using bcrypt with 12 rounds"""
    salt = bcrypt.gensalt(rounds=12)
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    """Verify password against hash"""
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def generate_secure_token() -> str:
    """Generate cryptographically secure token"""
    return secrets.token_urlsafe(32)
```

### **Data Encryption**
```python
from cryptography.fernet import Fernet
import os

def encrypt_sensitive_data(data: str) -> str:
    """Encrypt sensitive data using Fernet"""
    key = os.environ.get('ENCRYPTION_KEY')
    f = Fernet(key)
    return f.encrypt(data.encode()).decode()

def decrypt_sensitive_data(encrypted_data: str) -> str:
    """Decrypt sensitive data"""
    key = os.environ.get('ENCRYPTION_KEY')
    f = Fernet(key)
    return f.decrypt(encrypted_data.encode()).decode()
```

## 📋 **Data Collection Fields**

### **Personal Information**
- ✅ First Name (required)
- ✅ Last Name (required)
- ✅ Email Address (required, unique)
- ✅ Phone Number (optional)
- ✅ Job Title (optional)

### **Company Information**
- ✅ Company Name (required)
- ✅ DUNS Number (optional, 9 digits)
- ✅ CAGE Code (optional, 5 characters)
- ✅ Unique Entity ID (UEI) (optional, 12 characters)
- ✅ Company Size (small/medium/large)
- ✅ Business Type (corporation/LLC/partnership/etc.)
- ✅ Business Address (optional)

### **NAICS Codes**
- ✅ Primary NAICS Code (required)
- ✅ Secondary NAICS Codes (optional, up to 5)

### **PSC Codes**
- ✅ Primary PSC Code (optional, 4 characters)
- ✅ Secondary PSC Codes (optional, up to 10)
- ✅ PSC Services Description (optional)

### **Keywords & Capabilities**
- ✅ Primary Keywords (required, comma-separated)
- ✅ Secondary Keywords (optional, comma-separated)
- ✅ Company Capabilities (optional, detailed description)
- ✅ Certifications & Clearances (optional)

### **Security & Preferences**
- ✅ Password (required, strength validation)
- ✅ Email Notifications (boolean)
- ✅ Newsletter Subscription (boolean)
- ✅ Terms & Conditions Agreement (required)
- ✅ Data Processing Consent (required)

## 🔄 **API Endpoints (Future Implementation)**

### **Authentication**
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/logout` - User logout
- `POST /api/auth/refresh` - Refresh token
- `POST /api/auth/forgot-password` - Password reset request
- `POST /api/auth/reset-password` - Password reset

### **User Management**
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `GET /api/users/companies` - Get user's companies
- `POST /api/users/companies` - Add company to user

### **Company Management**
- `GET /api/companies` - List companies
- `POST /api/companies` - Create company
- `PUT /api/companies/{id}` - Update company
- `DELETE /api/companies/{id}` - Delete company

## 🚨 **Security Checklist**

- [ ] **Database Encryption**: All data encrypted at rest
- [ ] **Connection Security**: SSL/TLS for all connections
- [ ] **Password Hashing**: bcrypt with 12+ rounds
- [ ] **Session Management**: Secure session tokens
- [ ] **Input Validation**: All inputs validated and sanitized
- [ ] **SQL Injection Prevention**: Parameterized queries only
- [ ] **Rate Limiting**: API rate limiting implemented
- [ ] **Audit Logging**: All operations logged
- [ ] **Access Control**: RBAC implemented
- [ ] **Data Backup**: Encrypted backups with retention policy
- [ ] **Security Headers**: Proper HTTP security headers
- [ ] **CORS Configuration**: Proper CORS settings
- [ ] **Environment Variables**: Sensitive data in environment variables
- [ ] **Regular Updates**: Security patches applied regularly

## 📊 **Database Migration Script**

```sql
-- Create tables in order (respecting foreign key dependencies)
-- 1. Users table
-- 2. Companies table  
-- 3. User_Companies table
-- 4. User_Sessions table
-- 5. Audit_Logs table
-- 6. Email_Verifications table
-- 7. Create indexes
-- 8. Insert default admin user
-- 9. Set up triggers for audit logging
```

This schema provides a comprehensive, secure foundation for user authentication and company data management in SST 2.0! 🔐
