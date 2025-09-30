#!/usr/bin/env python3
"""
Test script for SST.2.0 frontend
Tests the web application and API endpoints
"""

import os
import sys
import json
import requests
import time
from datetime import datetime

# Add the current directory to the path to import modules
sys.path.append(os.path.dirname(__file__))

def test_api_endpoints():
    """Test all API endpoints"""
    print("🧪 Testing API Endpoints")
    print("=" * 50)
    
    base_url = "http://localhost:5000"
    
    # Test stats endpoint
    print("\n📊 Testing stats endpoint...")
    try:
        response = requests.get(f"{base_url}/api/stats")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Stats loaded: {data.get('total_opportunities', 0)} opportunities")
        else:
            print(f"❌ Stats failed: {response.status_code}")
    except Exception as e:
        print(f"❌ Stats error: {e}")
    
    # Test opportunities endpoint
    print("\n📋 Testing opportunities endpoint...")
    try:
        response = requests.get(f"{base_url}/api/opportunities?per_page=5")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Opportunities loaded: {len(data.get('opportunities', []))} items")
        else:
            print(f"❌ Opportunities failed: {response.status_code}")
    except Exception as e:
        print(f"❌ Opportunities error: {e}")
    
    # Test email queue endpoint
    print("\n📧 Testing email queue endpoint...")
    try:
        response = requests.get(f"{base_url}/api/email/queue")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Email queue loaded: {data.get('total_items', 0)} items")
        else:
            print(f"❌ Email queue failed: {response.status_code}")
    except Exception as e:
        print(f"❌ Email queue error: {e}")

def test_frontend_files():
    """Test if all frontend files exist"""
    print("\n\n🧪 Testing Frontend Files")
    print("=" * 50)
    
    required_files = [
        'app.py',
        'run_frontend.py',
        'requirements.txt',
        'README.md',
        'templates/base.html',
        'templates/index.html',
        'static/css/style.css',
        'static/js/app.js'
    ]
    
    for file_path in required_files:
        full_path = os.path.join(os.path.dirname(__file__), file_path)
        if os.path.exists(full_path):
            print(f"✅ {file_path}")
        else:
            print(f"❌ {file_path} - Missing!")

def test_database_connection():
    """Test database connection"""
    print("\n\n🧪 Testing Database Connection")
    print("=" * 50)
    
    try:
        # Import database manager
        sys.path.append(os.path.join(os.path.dirname(__file__), '..'))
        from database_manager.database import DatabaseManager
        
        db_manager = DatabaseManager()
        opportunities = db_manager.get_all_opportunities()
        
        print(f"✅ Database connected: {len(opportunities)} opportunities found")
        
        if opportunities:
            sample = opportunities[0]
            print(f"   Sample opportunity: {sample.get('notice_id', 'N/A')}")
            print(f"   Title: {sample.get('title', 'N/A')[:50]}...")
        
    except Exception as e:
        print(f"❌ Database connection failed: {e}")

def test_email_integration():
    """Test email integration"""
    print("\n\n🧪 Testing Email Integration")
    print("=" * 50)
    
    try:
        # Import email modules
        sys.path.append(os.path.join(os.path.dirname(__file__), '..'))
        from src.email.queue_manager import QueueManager
        
        queue_manager = QueueManager()
        status = queue_manager.get_queue_status()
        
        print(f"✅ Email queue manager loaded")
        print(f"   Total items: {status.get('total_items', 0)}")
        print(f"   Pending: {status.get('pending_count', 0)}")
        print(f"   Processing: {status.get('status_counts', {}).get('processing', 0)}")
        print(f"   Completed: {status.get('status_counts', {}).get('completed', 0)}")
        
    except Exception as e:
        print(f"❌ Email integration failed: {e}")

def test_web_interface():
    """Test web interface accessibility"""
    print("\n\n🧪 Testing Web Interface")
    print("=" * 50)
    
    base_url = "http://localhost:5000"
    
    try:
        # Test main page
        response = requests.get(base_url, timeout=5)
        if response.status_code == 200:
            print("✅ Main page accessible")
            
            # Check if it's HTML
            if 'text/html' in response.headers.get('content-type', ''):
                print("✅ HTML content returned")
            else:
                print("❌ Non-HTML content returned")
        else:
            print(f"❌ Main page failed: {response.status_code}")
            
    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to web server")
        print("   Make sure the frontend is running: python run_frontend.py")
    except Exception as e:
        print(f"❌ Web interface error: {e}")

def main():
    """Run all tests"""
    print("🚀 SST 2.0 Frontend Test Suite")
    print("=" * 60)
    
    # Test files
    test_frontend_files()
    
    # Test database
    test_database_connection()
    
    # Test email integration
    test_email_integration()
    
    # Test web interface
    test_web_interface()
    
    # Test API endpoints
    test_api_endpoints()
    
    print("\n\n✅ Test Suite Completed")
    print("=" * 60)
    print("If all tests passed, the frontend is ready to use!")
    print("\nNext steps:")
    print("1. Start the frontend: python run_frontend.py")
    print("2. Open your browser: http://localhost:5000")
    print("3. Start the SST.2.0 backend: python main.py")
    print("4. Configure email settings if needed")

if __name__ == "__main__":
    main()



