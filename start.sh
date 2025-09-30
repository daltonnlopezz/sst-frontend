#!/bin/bash
# Production startup script for Render

# Install dependencies
pip install -r requirements.txt

# Start the application with Gunicorn
gunicorn --bind 0.0.0.0:$PORT app:app
