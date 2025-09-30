#!/usr/bin/env python3
"""
SST 2.0 Backend API Server
Handles user registration, authentication, and database operations
"""

import os
import sys
import json
import sqlite3
import hashlib
import secrets
from datetime import datetime
from flask import Flask, request, jsonify, g
from flask_cors import CORS
import logging

# Add parent directory to path to import database modules
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..'))

try:
    from database_manager.database import DatabaseManager
    from database_manager.create_companies_table import create_companies_table
    from database_manager.create_opportunities_table import create_opportunities_table
except ImportError:
    print("Warning: Database modules not found. Using fallback database operations.")
    DatabaseManager = None

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

# Database configuration
DATABASE_PATH = os.path.join(os.path.dirname(__file__), '..', '..', 'database(s)', 'companies.db')
OPPORTUNITIES_DB_PATH = os.path.join(os.path.dirname(__file__), '..', '..', 'database(s)', 'opportunities.db')

def get_db_connection():
    """Get database connection"""
    conn = sqlite3.connect(DATABASE_PATH)
    conn.row_factory = sqlite3.Row
    return conn

# --- Lightweight schema migration helpers ---

def _table_has_column(conn: sqlite3.Connection, table: str, column: str) -> bool:
    cur = conn.execute(f"PRAGMA table_info({table})")
    cols = [r[1] for r in cur.fetchall()]
    return column in cols

def _ensure_column(conn: sqlite3.Connection, table: str, column: str, ddl: str):
    if not _table_has_column(conn, table, column):
        conn.execute(f"ALTER TABLE {table} ADD COLUMN {column} {ddl}")

def migrate_database():
    """Add any missing columns required by current code to existing tables."""
    try:
        conn = get_db_connection()
        # Companies table required columns
        # Add uuid column without UNIQUE constraint, then create a unique index
        if not _table_has_column(conn, 'companies', 'uuid'):
            conn.execute("ALTER TABLE companies ADD COLUMN uuid TEXT")
            try:
                conn.execute("CREATE UNIQUE INDEX IF NOT EXISTS idx_companies_uuid ON companies(uuid)")
            except Exception:
                pass
        _ensure_column(conn, 'companies', 'name', "TEXT")
        _ensure_column(conn, 'companies', 'primary_psc', "TEXT")
        _ensure_column(conn, 'companies', 'secondary_psc', "TEXT")
        _ensure_column(conn, 'companies', 'psc_description', "TEXT")
        _ensure_column(conn, 'companies', 'primary_keywords', "TEXT DEFAULT ''")
        _ensure_column(conn, 'companies', 'secondary_keywords', "TEXT")
        _ensure_column(conn, 'companies', 'capabilities', "TEXT")
        _ensure_column(conn, 'companies', 'certifications', "TEXT")
        _ensure_column(conn, 'companies', 'created_by', "INTEGER")
        _ensure_column(conn, 'companies', 'updated_at', "DATETIME DEFAULT CURRENT_TIMESTAMP")
        conn.commit()
        conn.close()
        logger.info("Database migration check completed")
    except Exception as e:
        logger.error(f"Database migration failed: {e}")

def init_database():
    """Initialize database tables"""
    try:
        conn = get_db_connection()
        
        # Create users table
        conn.execute('''
            CREATE TABLE IF NOT EXISTS users (
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
            )
        ''')
        
        # Create companies table
        conn.execute('''
            CREATE TABLE IF NOT EXISTS companies (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                uuid TEXT UNIQUE,
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
                primary_keywords TEXT,
                secondary_keywords TEXT,
                capabilities TEXT,
                certifications TEXT,
                is_verified BOOLEAN DEFAULT FALSE,
                is_active BOOLEAN DEFAULT TRUE,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                created_by INTEGER REFERENCES users(id)
            )
        ''')
        
        # Create user_companies table (many-to-many)
        conn.execute('''
            CREATE TABLE IF NOT EXISTS user_companies (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
                role TEXT NOT NULL DEFAULT 'owner',
                is_primary BOOLEAN DEFAULT TRUE,
                joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(user_id, company_id)
            )
        ''')
        
        # Create sessions table
        conn.execute('''
            CREATE TABLE IF NOT EXISTS user_sessions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                session_token TEXT UNIQUE NOT NULL,
                ip_address TEXT,
                user_agent TEXT,
                expires_at DATETIME NOT NULL,
                is_active BOOLEAN DEFAULT TRUE,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        conn.commit()
        conn.close()
        logger.info("Database initialized successfully")
        
        # Ensure migrations for older DBs
        migrate_database()
        
    except Exception as e:
        logger.error(f"Database initialization failed: {e}")

def hash_password(password):
    """Hash password using SHA-256 with salt"""
    salt = secrets.token_hex(16)
    password_hash = hashlib.sha256((password + salt).encode()).hexdigest()
    return f"{salt}:{password_hash}"

def verify_password(password, stored_hash):
    """Verify password against stored hash"""
    try:
        salt, password_hash = stored_hash.split(':')
        return hashlib.sha256((password + salt).encode()).hexdigest() == password_hash
    except:
        return False

def generate_uuid():
    """Generate a UUID"""
    return secrets.token_urlsafe(16)

def generate_session_token():
    """Generate a session token"""
    return secrets.token_urlsafe(32)

def get_opportunities_connection():
    conn = sqlite3.connect(OPPORTUNITIES_DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

@app.before_request
def before_request():
    """Initialize database connection for each request"""
    g.db = get_db_connection()

@app.teardown_request
def teardown_request(exception):
    """Close database connection after each request"""
    if hasattr(g, 'db'):
        g.db.close()

# API Routes

@app.route('/api/auth/register', methods=['POST'])
def register_user():
    """Register a new user and company"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['firstName', 'lastName', 'email', 'password', 'companyName', 'primaryNaics', 'primaryKeywords']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        # Check if user already exists
        existing_user = g.db.execute(
            'SELECT id FROM users WHERE email = ?', (data['email'],)
        ).fetchone()
        
        if existing_user:
            return jsonify({'error': 'User already exists with this email address'}), 409
        
        # Generate UUIDs
        user_uuid = generate_uuid()
        company_uuid = generate_uuid()
        
        # Hash password
        password_hash = hash_password(data['password'])
        
        # Insert user
        user_result = g.db.execute('''
            INSERT INTO users (uuid, email, password_hash, first_name, last_name, phone, job_title, email_verified, is_active)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            user_uuid, data['email'], password_hash, data['firstName'], data['lastName'],
            data.get('phone'), data.get('jobTitle'), False, True
        ))
        
        user_id = user_result.lastrowid
        
        # Insert company
        company_result = g.db.execute('''
            INSERT INTO companies (uuid, name, duns_number, cage_code, uei, company_size, business_type, address,
                                 primary_naics, secondary_naics, primary_psc, secondary_psc, psc_description,
                                 primary_keywords, secondary_keywords, capabilities, certifications,
                                 is_verified, is_active, created_by)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            company_uuid, data['companyName'], data.get('dunsNumber'), data.get('cageCode'), data.get('uei'),
            data.get('companySize'), data.get('businessType'), data.get('address'),
            data['primaryNaics'], data.get('secondaryNaics'), data.get('primaryPsc'), data.get('secondaryPsc'),
            data.get('pscDescription'), data['primaryKeywords'], data.get('secondaryKeywords'),
            data.get('capabilities'), data.get('certifications'), False, True, user_id
        ))
        
        company_id = company_result.lastrowid
        
        # Link user to company
        g.db.execute('''
            INSERT INTO user_companies (user_id, company_id, role, is_primary)
            VALUES (?, ?, ?, ?)
        ''', (user_id, company_id, 'owner', True))
        
        # Create session
        session_token = generate_session_token()
        expires_at = datetime.now().timestamp() + (30 * 24 * 60 * 60)  # 30 days
        
        g.db.execute('''
            INSERT INTO user_sessions (user_id, session_token, ip_address, user_agent, expires_at, is_active)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (user_id, session_token, request.remote_addr, request.headers.get('User-Agent'), expires_at, True))
        
        g.db.commit()
        
        # Return user data (without password)
        user_data = {
            'id': user_id,
            'uuid': user_uuid,
            'email': data['email'],
            'firstName': data['firstName'],
            'lastName': data['lastName'],
            'phone': data.get('phone'),
            'jobTitle': data.get('jobTitle'),
            'companyId': company_id,
            'createdAt': datetime.now().isoformat()
        }
        
        return jsonify({
            'success': True,
            'user': user_data,
            'sessionToken': session_token,
            'message': 'User registered successfully'
        }), 201
        
    except Exception as e:
        logger.error(f"Registration error: {e}")
        return jsonify({'error': 'Registration failed'}), 500

@app.route('/api/auth/login', methods=['POST'])
def login_user():
    """Authenticate user and create session"""
    try:
        data = request.get_json()
        
        if not data.get('email') or not data.get('password'):
            return jsonify({'error': 'Email and password are required'}), 400
        
        # Get user from database
        user = g.db.execute('''
            SELECT id, uuid, email, password_hash, first_name, last_name, phone, job_title, is_active
            FROM users WHERE email = ?
        ''', (data['email'],)).fetchone()
        
        if not user:
            return jsonify({'error': 'Invalid credentials'}), 401
        
        if not user['is_active']:
            return jsonify({'error': 'Account is deactivated'}), 401
        
        # Verify password
        if not verify_password(data['password'], user['password_hash']):
            return jsonify({'error': 'Invalid credentials'}), 401
        
        # Create session
        session_token = generate_session_token()
        expires_at = datetime.now().timestamp() + (30 * 24 * 60 * 60)  # 30 days
        
        g.db.execute('''
            INSERT INTO user_sessions (user_id, session_token, ip_address, user_agent, expires_at, is_active)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (user['id'], session_token, request.remote_addr, request.headers.get('User-Agent'), expires_at, True))
        
        g.db.commit()
        
        # Return user data
        user_data = {
            'id': user['id'],
            'uuid': user['uuid'],
            'email': user['email'],
            'firstName': user['first_name'],
            'lastName': user['last_name'],
            'phone': user['phone'],
            'jobTitle': user['job_title']
        }
        
        return jsonify({
            'success': True,
            'user': user_data,
            'sessionToken': session_token,
            'message': 'Login successful'
        }), 200
        
    except Exception as e:
        logger.error(f"Login error: {e}")
        return jsonify({'error': 'Login failed'}), 500

@app.route('/api/users/<int:user_id>/profile', methods=['GET'])
def get_user_profile(user_id):
    """Get user profile"""
    try:
        user = g.db.execute('''
            SELECT id, uuid, email, first_name, last_name, phone, job_title, created_at
            FROM users WHERE id = ? AND is_active = TRUE
        ''', (user_id,)).fetchone()
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        return jsonify({
            'id': user['id'],
            'uuid': user['uuid'],
            'email': user['email'],
            'firstName': user['first_name'],
            'lastName': user['last_name'],
            'phone': user['phone'],
            'jobTitle': user['job_title'],
            'createdAt': user['created_at']
        }), 200
        
    except Exception as e:
        logger.error(f"Get profile error: {e}")
        return jsonify({'error': 'Failed to get profile'}), 500

@app.route('/api/companies/<int:company_id>', methods=['GET'])
def get_company(company_id):
    """Get company information"""
    try:
        company = g.db.execute('''
            SELECT * FROM companies WHERE id = ? AND is_active = TRUE
        ''', (company_id,)).fetchone()
        
        if not company:
            return jsonify({'error': 'Company not found'}), 404
        
        return jsonify(dict(company)), 200
        
    except Exception as e:
        logger.error(f"Get company error: {e}")
        return jsonify({'error': 'Failed to get company'}), 500

@app.route('/api/users/<int:user_id>/stats', methods=['GET'])
def get_user_stats(user_id):
    """Get user statistics"""
    try:
        # This would typically query actual data from opportunities table
        # For now, return mock data
        stats = {
            'opportunitiesAnalyzed': 150,
            'proposalsSubmitted': 25,
            'contractsWon': 8,
            'winRate': 32
        }
        
        return jsonify(stats), 200
        
    except Exception as e:
        logger.error(f"Get stats error: {e}")
        return jsonify({'error': 'Failed to get stats'}), 500

@app.route('/api/opportunities', methods=['GET'])
def list_opportunities():
    """Server-side paginated, sortable opportunities list (read-only)."""
    try:
        start = int(request.args.get('start', 0))
        length = int(request.args.get('length', 25))
        search = (request.args.get('search') or '').strip()
        order_col = request.args.get('order_col', '8')  # default posted
        order_dir = request.args.get('order_dir', 'desc').lower()
        order_dir = 'DESC' if order_dir == 'desc' else 'ASC'

        # Map DataTables column index to DB column
        # 0 interested (virtual), 1 notice_id, 2 title, 3 agency, 4 department,
        # 5 naics, 6 psc, 7 type, 8 posted_date, 9 response_due_date, 10 setaside
        col_map = {
            '1': 'notice_id',
            '2': 'title',
            '3': 'agency',
            '4': 'department',
            '5': 'naics',
            '6': 'psc',
            '7': 'notice_type',
            '8': 'posted_date',
            '9': 'response_due_date',
            '10': 'setaside'
        }
        order_by = col_map.get(str(order_col), 'posted_date')

        where_clause = ''
        params = []
        if search:
            where_clause = """
            WHERE (
                COALESCE(notice_id,'') LIKE ? OR
                COALESCE(title,'') LIKE ? OR
                COALESCE(agency,'') LIKE ? OR
                COALESCE(department,'') LIKE ? OR
                COALESCE(naics,'') LIKE ? OR
                COALESCE(psc,'') LIKE ?
            )
            """
            like = f"%{search}%"
            params.extend([like, like, like, like, like, like])

        count_sql = f"SELECT COUNT(1) as cnt FROM opportunities {where_clause}"
        data_sql = f"""
            SELECT
                notice_id,
                title,
                agency,
                department,
                naics,
                psc,
                notice_type,
                posted_date,
                response_due_date,
                setaside
            FROM opportunities
            {where_clause}
            ORDER BY {order_by} {order_dir}
            LIMIT ? OFFSET ?
        """

        with get_opportunities_connection() as conn:
            cur = conn.execute(count_sql, params)
            total = cur.fetchone()['cnt']

            cur = conn.execute(data_sql, params + [length, start])
            rows = [dict(r) for r in cur.fetchall()]

        return jsonify({
            'data': rows,
            'recordsTotal': total,
            'recordsFiltered': total
        })
    except Exception as e:
        logger.error(f"List opportunities error: {e}")
        return jsonify({'data': [], 'recordsTotal': 0, 'recordsFiltered': 0, 'error': 'Failed to load data'}), 500

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({'status': 'healthy', 'timestamp': datetime.now().isoformat()}), 200

if __name__ == '__main__':
    # Initialize database
    init_database()
    
    # Run the server
    port = int(os.environ.get('PORT', 5001))
    app.run(host='0.0.0.0', port=port, debug=True)
