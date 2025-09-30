// SST 2.0 Dashboard JavaScript

document.addEventListener('DOMContentLoaded', function() {
    // Check authentication and initialize dashboard
    checkAuthentication();
});

// Check if user is authenticated
function checkAuthentication() {
    // Show loading overlay
    document.getElementById('authCheck').classList.remove('d-none');
    
    // Simulate authentication check (replace with actual API call)
    setTimeout(() => {
        const isAuthenticated = checkUserSession();
        
        if (isAuthenticated) {
            // User is authenticated, show dashboard
            showDashboard();
        } else {
            // User not authenticated, show login required
            showLoginRequired();
        }
    }, 1500);
}

// Check user session (replace with actual session validation)
function checkUserSession() {
    // Check localStorage for user data
    const userData = localStorage.getItem('sst_user_data');
    const sessionToken = localStorage.getItem('sst_session_token');
    
    if (userData && sessionToken) {
        try {
            const user = JSON.parse(userData);
            // Validate session token (in real app, this would be server-side validation)
            if (user.email && user.firstName) {
                return true;
            }
        } catch (e) {
            console.error('Invalid user data:', e);
        }
    }
    
    return false;
}

// Show the dashboard
function showDashboard() {
    document.getElementById('authCheck').classList.add('d-none');
    document.getElementById('dashboardContent').classList.remove('d-none');
    
    // Load user data
    loadUserData();
    loadUserStats();
    loadRecentActivity();
}

// Show login required modal
function showLoginRequired() {
    document.getElementById('authCheck').classList.add('d-none');
    document.getElementById('loginRequired').classList.remove('d-none');
}

// Load user data from localStorage
function loadUserData() {
    const userData = JSON.parse(localStorage.getItem('sst_user_data') || '{}');
    
    // Update personal information
    document.getElementById('userFirstName').textContent = userData.firstName || 'User';
    document.getElementById('userFullName').textContent = `${userData.firstName || ''} ${userData.lastName || ''}`.trim() || 'Not provided';
    document.getElementById('userEmail').textContent = userData.email || 'Not provided';
    document.getElementById('userJobTitle').textContent = userData.jobTitle || 'Not provided';
    document.getElementById('userPhone').textContent = userData.phone || 'Not provided';
    
    // Update company information
    document.getElementById('companyName').textContent = userData.companyName || 'Your Company';
    document.getElementById('companyNameDetail').textContent = userData.companyName || 'Not provided';
    document.getElementById('companyDuns').textContent = userData.dunsNumber || 'Not provided';
    document.getElementById('primaryNaics').textContent = userData.primaryNaics || 'Not provided';
    document.getElementById('primaryPsc').textContent = userData.primaryPsc || 'Not provided';
}

// Load user statistics (simulated data)
function loadUserStats() {
    const userData = JSON.parse(localStorage.getItem('sst_user_data') || '{}');
    
    // Simulate user-specific stats based on their data
    const stats = generateUserStats(userData);
    
    // Animate counters
    animateCounter('opportunitiesAnalyzed', stats.opportunitiesAnalyzed);
    animateCounter('proposalsSubmitted', stats.proposalsSubmitted);
    animateCounter('contractsWon', stats.contractsWon);
    animateCounter('winRate', stats.winRate, '%');
}

// Generate user-specific stats based on their profile
function generateUserStats(userData) {
    // Base stats
    let opportunitiesAnalyzed = Math.floor(Math.random() * 500) + 100;
    let proposalsSubmitted = Math.floor(Math.random() * 50) + 10;
    let contractsWon = Math.floor(Math.random() * 20) + 5;
    
    // Adjust based on user profile
    if (userData.companySize === 'large') {
        opportunitiesAnalyzed *= 2;
        proposalsSubmitted *= 1.5;
        contractsWon *= 1.3;
    } else if (userData.companySize === 'small') {
        opportunitiesAnalyzed *= 0.7;
        proposalsSubmitted *= 0.8;
        contractsWon *= 0.9;
    }
    
    // Adjust based on how long they've been using the system
    const joinDate = new Date(userData.createdAt || Date.now());
    const daysSinceJoin = Math.floor((Date.now() - joinDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysSinceJoin > 30) {
        opportunitiesAnalyzed *= 1.2;
        proposalsSubmitted *= 1.1;
    }
    
    const winRate = Math.round((contractsWon / proposalsSubmitted) * 100);
    
    return {
        opportunitiesAnalyzed: Math.floor(opportunitiesAnalyzed),
        proposalsSubmitted: Math.floor(proposalsSubmitted),
        contractsWon: Math.floor(contractsWon),
        winRate: Math.min(winRate, 100)
    };
}

// Load recent activity
function loadRecentActivity() {
    const userData = JSON.parse(localStorage.getItem('sst_user_data') || '{}');
    const activities = generateRecentActivity(userData);
    
    const timeline = document.getElementById('activityTimeline');
    timeline.innerHTML = '';
    
    if (activities.length === 0) {
        timeline.innerHTML = `
            <div class="text-center py-4">
                <i class="fas fa-inbox text-muted mb-3" style="font-size: 2rem;"></i>
                <p class="text-muted">No recent activity. Start by searching for opportunities!</p>
            </div>
        `;
        return;
    }
    
    activities.forEach(activity => {
        const activityElement = document.createElement('div');
        activityElement.className = 'activity-item';
        activityElement.innerHTML = `
            <div class="activity-time">${activity.time}</div>
            <div class="activity-description">${activity.description}</div>
            <span class="activity-status ${activity.status}">${activity.statusText}</span>
        `;
        timeline.appendChild(activityElement);
    });
}

// Generate recent activity based on user data
function generateRecentActivity(userData) {
    const activities = [];
    const now = new Date();
    
    // Generate activities based on user's company and profile
    const companyName = userData.companyName || 'Your Company';
    const primaryNaics = userData.primaryNaics || '541511';
    const primaryPsc = userData.primaryPsc || 'R425';
    
    // Sample activities
    const sampleActivities = [
        {
            time: '2 hours ago',
            description: `Analyzed opportunity for ${companyName} in NAICS ${primaryNaics}`,
            status: 'success',
            statusText: 'Completed'
        },
        {
            time: '1 day ago',
            description: `Submitted proposal for PSC ${primaryPsc} contract`,
            status: 'info',
            statusText: 'Pending'
        },
        {
            time: '3 days ago',
            description: `Received email analysis for Notice ID 123456789`,
            status: 'success',
            statusText: 'Processed'
        },
        {
            time: '1 week ago',
            description: `Won contract for ${companyName} worth $250,000`,
            status: 'success',
            statusText: 'Won'
        },
        {
            time: '2 weeks ago',
            description: `Updated company profile with new capabilities`,
            status: 'info',
            statusText: 'Updated'
        }
    ];
    
    // Return random subset of activities
    return sampleActivities.slice(0, Math.floor(Math.random() * 3) + 2);
}

// Animate counter
function animateCounter(elementId, target, suffix = '') {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    const duration = 2000;
    const increment = target / (duration / 16);
    let current = 0;
    
    const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
            element.textContent = target + suffix;
            clearInterval(timer);
        } else {
            element.textContent = Math.floor(current) + suffix;
        }
    }, 16);
}

// Logout function
function logout() {
    // Clear user data
    localStorage.removeItem('sst_user_data');
    localStorage.removeItem('sst_session_token');
    
    // Redirect to login page
    window.location.href = 'auth.html';
}

// Add logout button to navigation
function addLogoutButton() {
    const navbar = document.querySelector('.navbar-nav');
    if (navbar) {
        const logoutItem = document.createElement('li');
        logoutItem.className = 'nav-item';
        logoutItem.innerHTML = `
            <a class="nav-link" href="#" onclick="logout(); return false;">
                <i class="fas fa-sign-out-alt me-1"></i>Logout
            </a>
        `;
        navbar.appendChild(logoutItem);
    }
}

// Initialize logout button when dashboard loads
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(addLogoutButton, 2000);
});

console.log('SST 2.0 Dashboard loaded! 📊');
