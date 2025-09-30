#!/usr/bin/env python3
"""
Run the SST.2.0 frontend web application
"""

import os
import sys
import json
import importlib.util

from app import app
#from flask_cors import CORS
#from flask import Flask, request, jsonify, render_template_string



if __name__ == '__main__':
    # Set environment variables
    os.environ['FLASK_ENV'] = 'development'
    os.environ['FLASK_DEBUG'] = '1'
    
    print("🚀 Starting SST 2.0 Frontend")
    print("=" * 50)
    print("🌐 Web Interface: http://localhost:5000")
    print("📊 Dashboard: http://localhost:5000")
    print("📧 Email Processing: Integrated")
    print("🗄️ Database: Connected")
    print("=" * 50)
    print("Press Ctrl+C to stop the server")
    print()
    
    # Run the Flask app
    app.run(
        host='0.0.0.0',
        port=5000,
        debug=True,
        threaded=True
    )



