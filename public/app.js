// SST 2.0 Frontend JavaScript

// Global variables
let currentPage = 1;
let currentPerPage = 20;
let currentSearch = '';
let currentFilters = {};

// Utility functions
function showLoading(text = 'Loading...') {
    document.getElementById('loadingText').textContent = text;
    const modal = new bootstrap.Modal(document.getElementById('loadingModal'));
    modal.show();
}

function hideLoading() {
    const modal = bootstrap.Modal.getInstance(document.getElementById('loadingModal'));
    if (modal) {
        modal.hide();
    }
}

function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    const toastBody = document.getElementById('toastBody');
    
    // Set message
    toastBody.textContent = message;
    
    // Set type-specific styling
    const toastHeader = toast.querySelector('.toast-header');
    const icon = toastHeader.querySelector('i');
    
    // Remove existing type classes
    icon.className = icon.className.replace(/text-(primary|success|danger|warning|info)/g, '');
    
    // Add new type class
    switch (type) {
        case 'success':
            icon.className += ' text-success';
            break;
        case 'error':
        case 'danger':
            icon.className += ' text-danger';
            break;
        case 'warning':
            icon.className += ' text-warning';
            break;
        case 'info':
        default:
            icon.className += ' text-info';
            break;
    }
    
    // Show toast
    const bsToast = new bootstrap.Toast(toast);
    bsToast.show();
}

// API functions
async function apiCall(url, options = {}) {
    try {
        const response = await fetch(url, {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || `HTTP ${response.status}`);
        }
        
        return data;
    } catch (error) {
        console.error('API call failed:', error);
        throw error;
    }
}

// Opportunity functions
async function loadOpportunities(page = 1, perPage = 20, search = '', filters = {}) {
    try {
        const params = new URLSearchParams({
            page: page,
            per_page: perPage,
            search: search,
            ...filters
        });
        
        const data = await apiCall(`/api/opportunities?${params}`);
        return data;
    } catch (error) {
        showToast(`Error loading opportunities: ${error.message}`, 'error');
        throw error;
    }
}

async function getOpportunity(noticeId) {
    try {
        const data = await apiCall(`/api/opportunities/${noticeId}`);
        return data;
    } catch (error) {
        showToast(`Error loading opportunity: ${error.message}`, 'error');
        throw error;
    }
}

async function evaluateOpportunity(noticeId) {
    try {
        const data = await apiCall(`/api/opportunities/${noticeId}/evaluate`, {
            method: 'POST'
        });
        return data;
    } catch (error) {
        showToast(`Error evaluating opportunity: ${error.message}`, 'error');
        throw error;
    }
}

async function getDeliverables(noticeId) {
    try {
        const data = await apiCall(`/api/opportunities/${noticeId}/deliverables`, {
            method: 'POST'
        });
        return data;
    } catch (error) {
        showToast(`Error getting deliverables: ${error.message}`, 'error');
        throw error;
    }
}

async function getProposalRequirements(noticeId) {
    try {
        const data = await apiCall(`/api/opportunities/${noticeId}/proposal`, {
            method: 'POST'
        });
        return data;
    } catch (error) {
        showToast(`Error getting proposal requirements: ${error.message}`, 'error');
        throw error;
    }
}

// Email functions
async function getEmailQueue() {
    try {
        const data = await apiCall('/api/email/queue');
        return data;
    } catch (error) {
        showToast(`Error loading email queue: ${error.message}`, 'error');
        throw error;
    }
}

async function getEmailQueueItems() {
    try {
        const data = await apiCall('/api/email/queue/items');
        return data;
    } catch (error) {
        showToast(`Error loading email queue items: ${error.message}`, 'error');
        throw error;
    }
}

async function sendEmailRequest(userEmail, requestType, noticeIds) {
    try {
        const data = await apiCall('/api/email/send', {
            method: 'POST',
            body: JSON.stringify({
                user_email: userEmail,
                request_type: requestType,
                notice_ids: noticeIds
            })
        });
        return data;
    } catch (error) {
        showToast(`Error sending email request: ${error.message}`, 'error');
        throw error;
    }
}

// Stats functions
async function getStats() {
    try {
        const data = await apiCall('/api/stats');
        return data;
    } catch (error) {
        showToast(`Error loading stats: ${error.message}`, 'error');
        throw error;
    }
}

// UI functions
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString();
    } catch (error) {
        return 'Invalid Date';
    }
}

function formatDateTime(dateString) {
    if (!dateString) return 'N/A';
    
    try {
        const date = new Date(dateString);
        return date.toLocaleString();
    } catch (error) {
        return 'Invalid Date';
    }
}

function truncateText(text, maxLength = 100) {
    if (!text) return 'N/A';
    
    if (text.length <= maxLength) return text;
    
    return text.substring(0, maxLength) + '...';
}

function getStatusBadgeClass(status) {
    switch (status?.toLowerCase()) {
        case 'yes':
        case 'active':
        case 'completed':
            return 'bg-success';
        case 'no':
        case 'inactive':
        case 'failed':
            return 'bg-danger';
        case 'pending':
        case 'processing':
            return 'bg-warning';
        default:
            return 'bg-secondary';
    }
}

function getStatusBadgeText(status) {
    switch (status?.toLowerCase()) {
        case 'yes':
            return 'Active';
        case 'no':
            return 'Inactive';
        case 'pending':
            return 'Pending';
        case 'processing':
            return 'Processing';
        case 'completed':
            return 'Completed';
        case 'failed':
            return 'Failed';
        default:
            return status || 'Unknown';
    }
}

// Table functions
function createOpportunityTable(opportunities, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    const table = document.createElement('table');
    table.className = 'table table-bordered table-hover';
    
    // Create header
    const thead = document.createElement('thead');
    thead.innerHTML = `
        <tr>
            <th>Notice ID</th>
            <th>Title</th>
            <th>Agency</th>
            <th>Posted Date</th>
            <th>Deadline</th>
            <th>Status</th>
            <th>Actions</th>
        </tr>
    `;
    
    // Create body
    const tbody = document.createElement('tbody');
    
    if (opportunities.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center text-muted">
                    <i class="fas fa-inbox me-2"></i>No opportunities found
                </td>
            </tr>
        `;
    } else {
        opportunities.forEach(opp => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td><code>${opp.notice_id || 'N/A'}</code></td>
                <td>${truncateText(opp.title, 50)}</td>
                <td>${truncateText(opp.full_parent_path_name, 30)}</td>
                <td>${formatDate(opp.posted_date)}</td>
                <td>${formatDate(opp.response_deadline)}</td>
                <td>
                    <span class="badge ${getStatusBadgeClass(opp.active)}">
                        ${getStatusBadgeText(opp.active)}
                    </span>
                </td>
                <td>
                    <div class="btn-group btn-group-sm" role="group">
                        <button class="btn btn-outline-primary" onclick="viewOpportunity('${opp.notice_id}')" title="View Details">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn btn-outline-success" onclick="evaluateOpportunity('${opp.notice_id}')" title="Evaluate">
                            <i class="fas fa-search"></i>
                        </button>
                        <button class="btn btn-outline-info" onclick="getDeliverables('${opp.notice_id}')" title="Deliverables">
                            <i class="fas fa-list"></i>
                        </button>
                    </div>
                </td>
            `;
            tbody.appendChild(row);
        });
    }
    
    table.appendChild(thead);
    table.appendChild(tbody);
    
    // Clear container and add table
    container.innerHTML = '';
    container.appendChild(table);
}

// Modal functions
function showOpportunityModal(opportunity) {
    const modal = document.getElementById('opportunityModal');
    if (!modal) return;
    
    const title = modal.querySelector('#opportunityModalTitle');
    const body = modal.querySelector('#opportunityModalBody');
    
    if (title) {
        title.innerHTML = `
            <i class="fas fa-file-alt me-2"></i>${opportunity.title || 'Opportunity Details'}
        `;
    }
    
    if (body) {
        body.innerHTML = `
            <div class="row">
                <div class="col-md-6">
                    <h6>Basic Information</h6>
                    <table class="table table-sm">
                        <tr><td><strong>Notice ID:</strong></td><td><code>${opportunity.notice_id || 'N/A'}</code></td></tr>
                        <tr><td><strong>Title:</strong></td><td>${opportunity.title || 'N/A'}</td></tr>
                        <tr><td><strong>Agency:</strong></td><td>${opportunity.full_parent_path_name || 'N/A'}</td></tr>
                        <tr><td><strong>Type:</strong></td><td>${opportunity.type || 'N/A'}</td></tr>
                        <tr><td><strong>NAICS Code:</strong></td><td>${opportunity.naics_code || 'N/A'}</td></tr>
                        <tr><td><strong>Set-Aside:</strong></td><td>${opportunity.type_of_set_aside_description || 'N/A'}</td></tr>
                    </table>
                </div>
                <div class="col-md-6">
                    <h6>Timeline</h6>
                    <table class="table table-sm">
                        <tr><td><strong>Posted Date:</strong></td><td>${formatDate(opportunity.posted_date)}</td></tr>
                        <tr><td><strong>Response Deadline:</strong></td><td>${formatDate(opportunity.response_deadline)}</td></tr>
                        <tr><td><strong>Active:</strong></td><td><span class="badge ${getStatusBadgeClass(opportunity.active)}">${getStatusBadgeText(opportunity.active)}</span></td></tr>
                    </table>
                    
                    <h6>Contact Information</h6>
                    <p class="small">${opportunity.point_of_contact || 'No contact information available'}</p>
                    
                    ${opportunity.ui_link ? `<a href="${opportunity.ui_link}" target="_blank" class="btn btn-sm btn-outline-primary">View on SAM.gov</a>` : ''}
                </div>
            </div>
            
            ${opportunity.description ? `
            <div class="mt-3">
                <h6>Description</h6>
                <div class="border p-3 rounded" style="max-height: 300px; overflow-y: auto;">
                    ${opportunity.description}
                </div>
            </div>
            ` : ''}
        `;
    }
    
    const bsModal = new bootstrap.Modal(modal);
    bsModal.show();
}

// Event handlers
function viewOpportunity(noticeId) {
    showLoading('Loading opportunity details...');
    
    getOpportunity(noticeId)
        .then(opportunity => {
            showOpportunityModal(opportunity);
        })
        .catch(error => {
            console.error('Error loading opportunity:', error);
        })
        .finally(() => {
            hideLoading();
        });
}

function evaluateOpportunity(noticeId) {
    showLoading('Evaluating opportunity...');
    
    evaluateOpportunity(noticeId)
        .then(evaluation => {
            showEvaluationResults(evaluation);
        })
        .catch(error => {
            console.error('Error evaluating opportunity:', error);
        })
        .finally(() => {
            hideLoading();
        });
}

function getDeliverables(noticeId) {
    showLoading('Getting deliverables...');
    
    getDeliverables(noticeId)
        .then(deliverables => {
            showDeliverablesResults(deliverables);
        })
        .catch(error => {
            console.error('Error getting deliverables:', error);
        })
        .finally(() => {
            hideLoading();
        });
}

function getProposalRequirements(noticeId) {
    showLoading('Getting proposal requirements...');
    
    getProposalRequirements(noticeId)
        .then(requirements => {
            showProposalRequirementsResults(requirements);
        })
        .catch(error => {
            console.error('Error getting proposal requirements:', error);
        })
        .finally(() => {
            hideLoading();
        });
}

// Results display functions
function showEvaluationResults(evaluation) {
    const modal = document.getElementById('opportunityModal');
    if (!modal) return;
    
    const body = modal.querySelector('#opportunityModalBody');
    if (!body) return;
    
    body.innerHTML = `
        <div class="alert alert-info">
            <h6><i class="fas fa-search me-2"></i>Evaluation Results</h6>
            <p class="mb-0">${evaluation.title}</p>
        </div>
        
        <div class="row">
            <div class="col-md-6">
                <h6>Opportunity Details</h6>
                <table class="table table-sm">
                    <tr><td><strong>Agency:</strong></td><td>${evaluation.agency || 'N/A'}</td></tr>
                    <tr><td><strong>Posted Date:</strong></td><td>${formatDate(evaluation.posted_date)}</td></tr>
                    <tr><td><strong>Response Deadline:</strong></td><td>${formatDate(evaluation.response_deadline)}</td></tr>
                    <tr><td><strong>Type:</strong></td><td>${evaluation.type || 'N/A'}</td></tr>
                    <tr><td><strong>Set-Aside:</strong></td><td>${evaluation.set_aside_type || 'N/A'}</td></tr>
                    <tr><td><strong>NAICS:</strong></td><td>${evaluation.naics_code || 'N/A'}</td></tr>
                    <tr><td><strong>Status:</strong></td><td><span class="badge ${getStatusBadgeClass(evaluation.active)}">${getStatusBadgeText(evaluation.active)}</span></td></tr>
                </table>
            </div>
            <div class="col-md-6">
                <h6>Recommendations</h6>
                <ul class="list-group">
                    ${evaluation.recommendations.map(rec => `<li class="list-group-item">${rec}</li>`).join('')}
                </ul>
            </div>
        </div>
        
        ${evaluation.description ? `
        <div class="mt-3">
            <h6>Description</h6>
            <div class="border p-3 rounded" style="max-height: 200px; overflow-y: auto;">
                ${evaluation.description}
            </div>
        </div>
        ` : ''}
        
        ${evaluation.ui_link ? `
        <div class="mt-3">
            <a href="${evaluation.ui_link}" target="_blank" class="btn btn-primary">
                <i class="fas fa-external-link-alt me-1"></i>View on SAM.gov
            </a>
        </div>
        ` : ''}
    `;
}

function showDeliverablesResults(deliverables) {
    const modal = document.getElementById('opportunityModal');
    if (!modal) return;
    
    const body = modal.querySelector('#opportunityModalBody');
    if (!body) return;
    
    body.innerHTML = `
        <div class="alert alert-success">
            <h6><i class="fas fa-list me-2"></i>Deliverables Table</h6>
            <p class="mb-0">${deliverables.title}</p>
        </div>
        
        <div class="row">
            <div class="col-md-6">
                <h6>Opportunity Details</h6>
                <table class="table table-sm">
                    <tr><td><strong>Notice ID:</strong></td><td><code>${deliverables.notice_id || 'N/A'}</code></td></tr>
                    <tr><td><strong>Agency:</strong></td><td>${deliverables.agency || 'N/A'}</td></tr>
                    <tr><td><strong>Response Deadline:</strong></td><td>${formatDate(deliverables.response_deadline)}</td></tr>
                    <tr><td><strong>Type:</strong></td><td>${deliverables.type || 'N/A'}</td></tr>
                </table>
            </div>
            <div class="col-md-6">
                <h6>Links</h6>
                ${deliverables.ui_link ? `
                <a href="${deliverables.ui_link}" target="_blank" class="btn btn-primary">
                    <i class="fas fa-external-link-alt me-1"></i>View on SAM.gov
                </a>
                ` : ''}
            </div>
        </div>
        
        <div class="mt-3">
            <h6>Deliverables</h6>
            <div class="border p-3 rounded">
                ${deliverables.requirements.length > 0 ? 
                    deliverables.requirements.map(req => `<div class="mb-2"><i class="fas fa-check text-success me-2"></i>${req}</div>`).join('') :
                    '<p class="text-muted">No specific deliverables identified in the description.</p>'
                }
            </div>
        </div>
        
        ${deliverables.description ? `
        <div class="mt-3">
            <h6>Description</h6>
            <div class="border p-3 rounded" style="max-height: 200px; overflow-y: auto;">
                ${deliverables.description}
            </div>
        </div>
        ` : ''}
    `;
}

function showProposalRequirementsResults(requirements) {
    const modal = document.getElementById('opportunityModal');
    if (!modal) return;
    
    const body = modal.querySelector('#opportunityModalBody');
    if (!body) return;
    
    body.innerHTML = `
        <div class="alert alert-warning">
            <h6><i class="fas fa-file-alt me-2"></i>Proposal Requirements</h6>
            <p class="mb-0">${requirements.title}</p>
        </div>
        
        <div class="row">
            <div class="col-md-6">
                <h6>Opportunity Details</h6>
                <table class="table table-sm">
                    <tr><td><strong>Notice ID:</strong></td><td><code>${requirements.notice_id || 'N/A'}</code></td></tr>
                    <tr><td><strong>Agency:</strong></td><td>${requirements.agency || 'N/A'}</td></tr>
                    <tr><td><strong>Response Deadline:</strong></td><td>${formatDate(requirements.response_deadline)}</td></tr>
                    <tr><td><strong>Type:</strong></td><td>${requirements.type || 'N/A'}</td></tr>
                    <tr><td><strong>Set-Aside:</strong></td><td>${requirements.set_aside_type || 'N/A'}</td></tr>
                    <tr><td><strong>NAICS:</strong></td><td>${requirements.naics_code || 'N/A'}</td></tr>
                </table>
            </div>
            <div class="col-md-6">
                <h6>Contact Information</h6>
                <p class="small">${requirements.point_of_contact || 'No contact information available'}</p>
                
                ${requirements.ui_link ? `
                <a href="${requirements.ui_link}" target="_blank" class="btn btn-primary">
                    <i class="fas fa-external-link-alt me-1"></i>View on SAM.gov
                </a>
                ` : ''}
            </div>
        </div>
        
        <div class="mt-3">
            <h6>Proposal Requirements</h6>
            <div class="border p-3 rounded">
                ${requirements.requirements.length > 0 ? 
                    requirements.requirements.map(req => `<div class="mb-2"><i class="fas fa-arrow-right text-primary me-2"></i>${req}</div>`).join('') :
                    '<p class="text-muted">No specific requirements identified in the description.</p>'
                }
            </div>
        </div>
        
        ${requirements.description ? `
        <div class="mt-3">
            <h6>Description</h6>
            <div class="border p-3 rounded" style="max-height: 200px; overflow-y: auto;">
                ${requirements.description}
            </div>
        </div>
        ` : ''}
    `;
}

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    console.log('SST 2.0 Frontend initialized');
    
    // Add fade-in animation to main content
    const main = document.querySelector('main');
    if (main) {
        main.classList.add('fade-in');
    }
    
    // Initialize tooltips
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
    
    // Initialize popovers
    const popoverTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="popover"]'));
    popoverTriggerList.map(function (popoverTriggerEl) {
        return new bootstrap.Popover(popoverTriggerEl);
    });
});



