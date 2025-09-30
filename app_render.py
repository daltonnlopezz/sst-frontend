#!/usr/bin/env python3
"""
Flask web application for SST.2.0 frontend - Render Production Version
Provides web interface for opportunity tracking and email processing
"""

import os
import sys
import json
import logging
from datetime import datetime, timedelta
from flask import Flask, render_template, request, jsonify, redirect, url_for
from flask_cors import CORS

# Add the parent directory to the path to import SST modules
# For Render, we'll need to handle the database differently
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize Flask app
app = Flask(__name__)
CORS(app)

# Mock data for demonstration (replace with actual database connection)
MOCK_OPPORTUNITIES = [
    {
        "notice_id": "DEMO001",
        "title": "IT Services and Support",
        "solicitation_number": "IT-2024-001",
        "full_parent_path_name": "Department of Defense",
        "posted_date": "2024-01-15T10:00:00Z",
        "response_deadline": "2024-02-15T17:00:00Z",
        "type": "Solicitation",
        "naics_code": "541511",
        "active": "Yes",
        "description": "Comprehensive IT services including software development, maintenance, and support for government systems.",
        "point_of_contact": "John Smith, john.smith@dod.mil",
        "ui_link": "https://sam.gov/opp/DEMO001"
    },
    {
        "notice_id": "DEMO002", 
        "title": "Construction Services",
        "solicitation_number": "CONST-2024-002",
        "full_parent_path_name": "General Services Administration",
        "posted_date": "2024-01-20T14:30:00Z",
        "response_deadline": "2024-02-20T16:00:00Z",
        "type": "Solicitation",
        "naics_code": "236220",
        "active": "Yes",
        "description": "Construction and renovation services for federal buildings and facilities.",
        "point_of_contact": "Jane Doe, jane.doe@gsa.gov",
        "ui_link": "https://sam.gov/opp/DEMO002"
    }
]

def get_opportunities():
    """Get opportunities - in production, this would connect to your database"""
    try:
        # Try to import and use the real database
        from database_manager.database import DatabaseManager
        db_manager = DatabaseManager()
        return db_manager.get_all_opportunities()
    except Exception as e:
        logger.warning(f"Could not connect to database: {e}. Using mock data.")
        return MOCK_OPPORTUNITIES

def get_opportunity(notice_id):
    """Get a specific opportunity"""
    try:
        from database_manager.database import DatabaseManager
        db_manager = DatabaseManager()
        return db_manager.get_opportunity(notice_id)
    except Exception as e:
        logger.warning(f"Could not connect to database: {e}. Using mock data.")
        for opp in MOCK_OPPORTUNITIES:
            if opp['notice_id'] == notice_id:
                return opp
        return None

@app.route('/')
def index():
    """Main dashboard page"""
    return render_template('index.html')

@app.route('/api/opportunities')
def api_opportunities():
    """Get opportunities with pagination and filtering"""
    try:
        # Get query parameters
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 20))
        search = request.args.get('search', '')
        agency = request.args.get('agency', '')
        naics = request.args.get('naics', '')
        active = request.args.get('active', '')
        sort_by = request.args.get('sort_by', 'posted_date')
        sort_order = request.args.get('sort_order', 'desc')
        
        # Get all opportunities
        opportunities = get_opportunities()
        
        # Apply filters
        filtered_opportunities = []
        for opp in opportunities:
            # Search filter
            if search and search.lower() not in (opp.get('title', '') + ' ' + opp.get('description', '')).lower():
                continue
            
            # Agency filter
            if agency and agency not in opp.get('full_parent_path_name', ''):
                continue
            
            # NAICS filter
            if naics and naics not in opp.get('naics_code', ''):
                continue
            
            # Active filter
            if active and active.lower() != opp.get('active', '').lower():
                continue
            
            filtered_opportunities.append(opp)
        
        # Sort opportunities
        if sort_by in ['posted_date', 'response_deadline', 'title']:
            reverse = sort_order == 'desc'
            filtered_opportunities.sort(
                key=lambda x: x.get(sort_by, '') or '', 
                reverse=reverse
            )
        
        # Pagination
        total = len(filtered_opportunities)
        start = (page - 1) * per_page
        end = start + per_page
        paginated_opportunities = filtered_opportunities[start:end]
        
        # Calculate pagination info
        total_pages = (total + per_page - 1) // per_page
        
        return jsonify({
            'opportunities': paginated_opportunities,
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total': total,
                'total_pages': total_pages,
                'has_next': page < total_pages,
                'has_prev': page > 1
            }
        })
        
    except Exception as e:
        logger.error(f"Error getting opportunities: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/opportunities/<notice_id>')
def api_opportunity(notice_id):
    """Get a specific opportunity by notice ID"""
    try:
        opportunity = get_opportunity(notice_id)
        if not opportunity:
            return jsonify({'error': 'Opportunity not found'}), 404
        
        return jsonify(opportunity)
        
    except Exception as e:
        logger.error(f"Error getting opportunity {notice_id}: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/opportunities/<notice_id>/evaluate', methods=['POST'])
def api_evaluate_opportunity(notice_id):
    """Evaluate an opportunity"""
    try:
        opportunity = get_opportunity(notice_id)
        if not opportunity:
            return jsonify({'error': 'Opportunity not found'}), 404
        
        # Generate evaluation
        evaluation = {
            'notice_id': opportunity.get('notice_id'),
            'title': opportunity.get('title'),
            'agency': opportunity.get('full_parent_path_name'),
            'posted_date': opportunity.get('posted_date'),
            'response_deadline': opportunity.get('response_deadline'),
            'type': opportunity.get('type'),
            'set_aside_type': opportunity.get('type_of_set_aside_description'),
            'naics_code': opportunity.get('naics_code'),
            'active': opportunity.get('active'),
            'description': opportunity.get('description', '')[:500] + '...' if opportunity.get('description') and len(opportunity.get('description', '')) > 500 else opportunity.get('description'),
            'point_of_contact': opportunity.get('point_of_contact'),
            'ui_link': opportunity.get('ui_link'),
            'recommendations': generate_evaluation_recommendations(opportunity)
        }
        
        return jsonify(evaluation)
        
    except Exception as e:
        logger.error(f"Error evaluating opportunity {notice_id}: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/stats')
def api_stats():
    """Get system statistics"""
    try:
        opportunities = get_opportunities()
        
        # Calculate stats
        total_opportunities = len(opportunities)
        active_opportunities = len([o for o in opportunities if o.get('active', '').lower() == 'yes'])
        
        # Agency distribution
        agencies = {}
        for opp in opportunities:
            agency = opp.get('full_parent_path_name', 'Unknown')
            agencies[agency] = agencies.get(agency, 0) + 1
        
        # NAICS distribution
        naics_codes = {}
        for opp in opportunities:
            naics = opp.get('naics_code', 'Unknown')
            if naics:
                naics_codes[naics] = naics_codes.get(naics, 0) + 1
        
        # Recent opportunities (last 7 days)
        week_ago = datetime.now() - timedelta(days=7)
        recent_opportunities = 0
        for opp in opportunities:
            posted_date = opp.get('posted_date', '')
            if posted_date:
                try:
                    opp_date = datetime.fromisoformat(posted_date.replace('Z', '+00:00'))
                    if opp_date >= week_ago:
                        recent_opportunities += 1
                except:
                    continue
        
        return jsonify({
            'total_opportunities': total_opportunities,
            'active_opportunities': active_opportunities,
            'recent_opportunities': recent_opportunities,
            'top_agencies': sorted(agencies.items(), key=lambda x: x[1], reverse=True)[:10],
            'top_naics': sorted(naics_codes.items(), key=lambda x: x[1], reverse=True)[:10]
        })
        
    except Exception as e:
        logger.error(f"Error getting stats: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/email/queue')
def api_email_queue():
    """Get email queue status"""
    try:
        # Mock email queue status for demo
        return jsonify({
            'total_items': 0,
            'pending_count': 0,
            'status_counts': {
                'pending': 0,
                'processing': 0,
                'completed': 0,
                'failed': 0
            },
            'is_processing': False
        })
        
    except Exception as e:
        logger.error(f"Error getting email queue status: {e}")
        return jsonify({'error': str(e)}), 500

def generate_evaluation_recommendations(opportunity):
    """Generate evaluation recommendations based on opportunity data"""
    recommendations = []
    
    # Check response deadline
    response_deadline = opportunity.get('response_deadline')
    if response_deadline:
        try:
            deadline_date = datetime.fromisoformat(response_deadline.replace('Z', '+00:00'))
            days_until_deadline = (deadline_date - datetime.now()).days
            
            if days_until_deadline < 7:
                recommendations.append(f"⚠️ URGENT: Response deadline is in {days_until_deadline} days")
            elif days_until_deadline < 14:
                recommendations.append(f"⏰ Response deadline is in {days_until_deadline} days - plan accordingly")
            else:
                recommendations.append(f"✅ Response deadline is in {days_until_deadline} days - good planning time")
        except:
            recommendations.append("📅 Response deadline information available but format unclear")
    
    # Check if active
    active = opportunity.get('active', '')
    if active and active.lower() == 'yes':
        recommendations.append("✅ Opportunity is currently active")
    elif active and active.lower() == 'no':
        recommendations.append("❌ Opportunity is no longer active")
    
    # Check NAICS code
    naics = opportunity.get('naics_code', '')
    if naics:
        recommendations.append(f"🏷️ NAICS Code: {naics}")
    
    return recommendations

if __name__ == '__main__':
    # Get port from environment variable (for Render) or default to 5000
    port = int(os.environ.get('PORT', 5000))
    debug = os.environ.get('FLASK_ENV') != 'production'
    
    app.run(debug=debug, host='0.0.0.0', port=port)
