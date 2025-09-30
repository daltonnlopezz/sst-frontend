#!/usr/bin/env python3
"""
SST 2.0 Backend Server Startup Script
"""

import os
import sys
import subprocess
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def check_dependencies():
    """Check if required dependencies are installed"""
    try:
        import flask  # noqa: F401
        import flask_cors  # noqa: F401
        logger.info("✅ Flask dependencies found")
        return True
    except ImportError as e:
        logger.error(f"❌ Missing dependencies: {e}")
        logger.info("Installing dependencies...")
        
        try:
            subprocess.check_call([sys.executable, "-m", "pip", "install", "-r", "requirements.txt"])
            logger.info("✅ Dependencies installed successfully")
            return True
        except subprocess.CalledProcessError:
            logger.error("❌ Failed to install dependencies")
            return False

def main():
    """Main function to start the server"""
    logger.info("🚀 Starting SST 2.0 Backend Server")
    logger.info("=====================================")
    
    # Check dependencies
    if not check_dependencies():
        logger.error("❌ Cannot start server due to missing dependencies")
        sys.exit(1)
    
    # Set environment variables
    os.environ['FLASK_APP'] = 'server.py'
    os.environ['FLASK_ENV'] = 'development'
    
    # Get port from environment or use default
    port = os.environ.get('PORT', '5001')
    
    logger.info(f"🌐 Server will run on: http://localhost:{port}")
    logger.info(f"📊 API endpoints available at: http://localhost:{port}/api/")
    logger.info(f"❤️  Health check: http://localhost:{port}/api/health")
    logger.info("=====================================")
    logger.info("Press Ctrl+C to stop the server")
    
    try:
        # Import and run the server
        from server import app, init_database
        # Ensure DB tables exist when starting via this script
        init_database()
        app.run(host='0.0.0.0', port=int(port), debug=True)
    except KeyboardInterrupt:
        logger.info("\n🛑 Server stopped by user")
    except Exception as e:
        logger.error(f"❌ Server error: {e}")
        sys.exit(1)

if __name__ == '__main__':
    main()
