#!/usr/bin/env python3
"""
Flask web application for SST.2.0 frontend
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
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from database_manager.database import DatabaseManager
from src.email.queue_manager import QueueManager
from src.email.email_receiver import EmailReceiver, load_config

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize Flask app
app = Flask(__name__)
CORS(app)

# Initialize database manager
db_manager = DatabaseManager()

# Initialize queue manager
queue_manager = QueueManager()

@app.route('/')
def index():
    """Main dashboard page"""
    return render_template('index.html')

@app.route('/api/opportunities')
def get_opportunities():
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
        opportunities = db_manager.get_all_opportunities()
        
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
def get_opportunity(notice_id):
    """Get a specific opportunity by notice ID"""
    try:
        opportunity = db_manager.get_opportunity(notice_id)
        if not opportunity:
            return jsonify({'error': 'Opportunity not found'}), 404
        
        return jsonify(opportunity)
        
    except Exception as e:
        logger.error(f"Error getting opportunity {notice_id}: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/opportunities/<notice_id>/evaluate', methods=['POST'])
def evaluate_opportunity(notice_id):
    """Evaluate an opportunity"""
    try:
        opportunity = db_manager.get_opportunity(notice_id)
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

@app.route('/api/opportunities/<notice_id>/deliverables', methods=['POST'])
def get_deliverables(notice_id):
    """Get deliverables for an opportunity"""
    try:
        opportunity = db_manager.get_opportunity(notice_id)
        if not opportunity:
            return jsonify({'error': 'Opportunity not found'}), 404
        
        # Extract deliverables
        deliverables = {
            'notice_id': opportunity.get('notice_id'),
            'title': opportunity.get('title'),
            'solicitation_number': opportunity.get('solicitation_number'),
            'agency': opportunity.get('full_parent_path_name'),
            'response_deadline': opportunity.get('response_deadline'),
            'type': opportunity.get('type'),
            'description': opportunity.get('description', ''),
            'requirements': extract_deliverables_from_description(opportunity.get('description', '')),
            'ui_link': opportunity.get('ui_link')
        }
        
        return jsonify(deliverables)
        
    except Exception as e:
        logger.error(f"Error getting deliverables for {notice_id}: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/opportunities/<notice_id>/proposal', methods=['POST'])
def get_proposal_requirements(notice_id):
    """Get proposal requirements for an opportunity"""
    try:
        opportunity = db_manager.get_opportunity(notice_id)
        if not opportunity:
            return jsonify({'error': 'Opportunity not found'}), 404
        
        # Extract proposal requirements
        proposal_requirements = {
            'notice_id': opportunity.get('notice_id'),
            'title': opportunity.get('title'),
            'solicitation_number': opportunity.get('solicitation_number'),
            'agency': opportunity.get('full_parent_path_name'),
            'response_deadline': opportunity.get('response_deadline'),
            'type': opportunity.get('type'),
            'set_aside_type': opportunity.get('type_of_set_aside_description'),
            'naics_code': opportunity.get('naics_code'),
            'description': opportunity.get('description', ''),
            'requirements': extract_proposal_requirements_from_description(opportunity.get('description', '')),
            'point_of_contact': opportunity.get('point_of_contact'),
            'ui_link': opportunity.get('ui_link')
        }
        
        return jsonify(proposal_requirements)
        
    except Exception as e:
        logger.error(f"Error getting proposal requirements for {notice_id}: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/email/queue')
def get_email_queue():
    """Get email queue status"""
    try:
        status = queue_manager.get_queue_status()
        return jsonify(status)
        
    except Exception as e:
        logger.error(f"Error getting email queue status: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/email/queue/items')
def get_email_queue_items():
    """Get email queue items"""
    try:
        items = [item.__dict__ for item in queue_manager.queue]
        return jsonify(items)
        
    except Exception as e:
        logger.error(f"Error getting email queue items: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/email/send', methods=['POST'])
def send_email_request():
    """Send an email request for opportunity processing"""
    try:
        data = request.get_json()
        notice_ids = data.get('notice_ids', [])
        request_type = data.get('request_type', 'evaluate')
        user_email = data.get('user_email', '')
        
        if not notice_ids or not user_email:
            return jsonify({'error': 'Notice IDs and user email are required'}), 400
        
        # Create email data
        email_data = {
            'id': f"web_request_{int(datetime.now().timestamp())}",
            'user_id': user_email.split('@')[0],
            'from_email': user_email,
            'request_type': request_type,
            'notice_ids': notice_ids,
            'timestamp': datetime.now().isoformat()
        }
        
        # Add to queue
        item_ids = queue_manager.add_request(email_data)
        
        return jsonify({
            'message': 'Request added to queue',
            'item_ids': item_ids,
            'queue_status': queue_manager.get_queue_status()
        })
        
    except Exception as e:
        logger.error(f"Error sending email request: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/stats')
def get_stats():
    """Get system statistics"""
    try:
        opportunities = db_manager.get_all_opportunities()
        
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
    
    # Check set-aside type
    set_aside = opportunity.get('type_of_set_aside_description', '')
    if set_aside:
        if 'small business' in set_aside.lower():
            recommendations.append("🏢 Small business set-aside opportunity")
        elif 'women' in set_aside.lower():
            recommendations.append("👩 Women-owned business set-aside opportunity")
        elif 'veteran' in set_aside.lower():
            recommendations.append("🎖️ Veteran-owned business set-aside opportunity")
    
    # Check NAICS code
    naics = opportunity.get('naics_code', '')
    if naics:
        recommendations.append(f"🏷️ NAICS Code: {naics}")
    
    # Check if active
    active = opportunity.get('active', '')
    if active and active.lower() == 'yes':
        recommendations.append("✅ Opportunity is currently active")
    elif active and active.lower() == 'no':
        recommendations.append("❌ Opportunity is no longer active")
    
    return recommendations

def extract_deliverables_from_description(description):
    """Extract potential deliverables from opportunity description"""
    deliverables = []
    
    if not description:
        return deliverables
    
    # Look for common deliverable keywords
    deliverable_keywords = [
        'deliverable', 'deliverables', 'report', 'reports', 'document', 'documents',
        'analysis', 'analyses', 'study', 'studies', 'assessment', 'assessments',
        'plan', 'plans', 'strategy', 'strategies', 'proposal', 'proposals',
        'presentation', 'presentations', 'training', 'workshop', 'workshops',
        'software', 'application', 'applications', 'system', 'systems',
        'database', 'databases', 'website', 'websites', 'platform', 'platforms'
    ]
    
    description_lower = description.lower()
    for keyword in deliverable_keywords:
        if keyword in description_lower:
            # Try to extract the context around the keyword
            start = description_lower.find(keyword)
            if start != -1:
                # Extract 50 characters before and after the keyword
                context_start = max(0, start - 50)
                context_end = min(len(description), start + len(keyword) + 50)
                context = description[context_start:context_end].strip()
                deliverables.append(context)
    
    return deliverables[:10]  # Limit to 10 deliverables

def extract_proposal_requirements_from_description(description):
    """Extract proposal requirements from opportunity description"""
    requirements = []
    
    if not description:
        return requirements
    
    # Look for common requirement keywords
    requirement_keywords = [
        'requirement', 'requirements', 'must', 'shall', 'should', 'need', 'needs',
        'experience', 'qualification', 'qualifications', 'certification', 'certifications',
        'license', 'licenses', 'clearance', 'clearances', 'security', 'compliance',
        'timeline', 'schedule', 'deadline', 'deadlines', 'milestone', 'milestones',
        'budget', 'cost', 'pricing', 'price', 'funding', 'payment', 'terms',
        'scope', 'work', 'tasks', 'activities', 'responsibilities', 'duties'
    ]
    
    description_lower = description.lower()
    for keyword in requirement_keywords:
        if keyword in description_lower:
            # Try to extract the context around the keyword
            start = description_lower.find(keyword)
            if start != -1:
                # Extract 100 characters before and after the keyword
                context_start = max(0, start - 100)
                context_end = min(len(description), start + len(keyword) + 100)
                context = description[context_start:context_end].strip()
                requirements.append(context)
    
    return requirements[:15]  # Limit to 15 requirements

if __name__ == '__main__':
    # Get port from environment variable (for Render) or default to 5000
    port = int(os.environ.get('PORT', 5000))
    debug = os.environ.get('FLASK_ENV') != 'production'
    
    app.run(debug=debug, host='0.0.0.0', port=port)



