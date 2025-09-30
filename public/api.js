// SST 2.0 API Client
// This handles communication between frontend and backend

class SSTAPI {
    constructor() {
        // Determine API base URL robustly
        const urlParams = new URLSearchParams(window.location.search);
        const override = urlParams.get('apiBase');
        const origin = window.location.origin;
        // If loaded from file:// or an override is provided, use fallback/override
        if (override) {
            this.baseURL = override.replace(/\/$/, '');
        } else if (origin === 'null' || origin === '' || window.location.protocol === 'file:') {
            this.baseURL = 'http://localhost:5001';
        } else {
            this.baseURL = origin;
        }
        this.apiURL = `${this.baseURL}/api`;
        console.log('[SSTAPI] Using API base:', this.apiURL);
    }

    // Generic API call method
    async apiCall(endpoint, method = 'GET', data = null) {
        const url = `${this.apiURL}${endpoint}`;
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        };

        if (data) {
            options.body = JSON.stringify(data);
        }

        try {
            const response = await fetch(url, options);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('API call failed:', error);
            throw error;
        }
    }

    // User Registration
    async registerUser(userData) {
        try {
            const response = await this.apiCall('/auth/register', 'POST', userData);
            return response;
        } catch (error) {
            // Fallback to localStorage for demo purposes
            console.warn('API unavailable, using localStorage fallback');
            return this.registerUserFallback(userData);
        }
    }

    // User Login
    async loginUser(credentials) {
        try {
            const response = await this.apiCall('/auth/login', 'POST', credentials);
            return response;
        } catch (error) {
            // Fallback to localStorage for demo purposes
            console.warn('API unavailable, using localStorage fallback');
            return this.loginUserFallback(credentials);
        }
    }

    // Get User Profile
    async getUserProfile(userId) {
        try {
            const response = await this.apiCall(`/users/${userId}/profile`);
            return response;
        } catch (error) {
            console.warn('API unavailable, using localStorage fallback');
            return this.getUserProfileFallback(userId);
        }
    }

    // Update User Profile
    async updateUserProfile(userId, profileData) {
        try {
            const response = await this.apiCall(`/users/${userId}/profile`, 'PUT', profileData);
            return response;
        } catch (error) {
            console.warn('API unavailable, using localStorage fallback');
            return this.updateUserProfileFallback(userId, profileData);
        }
    }

    // Get Company Data
    async getCompanyData(companyId) {
        try {
            const response = await this.apiCall(`/companies/${companyId}`);
            return response;
        } catch (error) {
            console.warn('API unavailable, using localStorage fallback');
            return this.getCompanyDataFallback(companyId);
        }
    }

    // Update Company Data
    async updateCompanyData(companyId, companyData) {
        try {
            const response = await this.apiCall(`/companies/${companyId}`, 'PUT', companyData);
            return response;
        } catch (error) {
            console.warn('API unavailable, using localStorage fallback');
            return this.updateCompanyDataFallback(companyId, companyData);
        }
    }

    // Get User Statistics
    async getUserStats(userId) {
        try {
            const response = await this.apiCall(`/users/${userId}/stats`);
            return response;
        } catch (error) {
            console.warn('API unavailable, using localStorage fallback');
            return this.getUserStatsFallback(userId);
        }
    }

    // Get Recent Activity
    async getRecentActivity(userId) {
        try {
            const response = await this.apiCall(`/users/${userId}/activity`);
            return response;
        } catch (error) {
            console.warn('API unavailable, using localStorage fallback');
            return this.getRecentActivityFallback(userId);
        }
    }

    // Fallback methods for when API is unavailable
    registerUserFallback(userData) {
        const existingUsers = JSON.parse(localStorage.getItem('sst_users') || '[]');
        
        // Check if user already exists
        if (existingUsers.find(u => u.email === userData.email)) {
            throw new Error('User already exists with this email address.');
        }

        // Generate user ID
        const userId = this.generateId();
        const companyId = this.generateId();
        
        // Prepare user data
        const user = {
            id: userId,
            companyId: companyId,
            ...userData,
            createdAt: new Date().toISOString(),
            isActive: true
        };

        // Prepare company data
        const company = {
            id: companyId,
            name: userData.companyName,
            dunsNumber: userData.dunsNumber,
            cageCode: userData.cageCode,
            uei: userData.uei,
            companySize: userData.companySize,
            businessType: userData.businessType,
            address: userData.address,
            primaryNaics: userData.primaryNaics,
            secondaryNaics: userData.secondaryNaics,
            primaryPsc: userData.primaryPsc,
            secondaryPsc: userData.secondaryPsc,
            pscDescription: userData.pscDescription,
            primaryKeywords: userData.primaryKeywords,
            secondaryKeywords: userData.secondaryKeywords,
            capabilities: userData.capabilities,
            certifications: userData.certifications,
            isVerified: false,
            isActive: true,
            createdAt: new Date().toISOString(),
            createdBy: userId
        };

        // Save to localStorage
        existingUsers.push(user);
        localStorage.setItem('sst_users', JSON.stringify(existingUsers));
        
        const existingCompanies = JSON.parse(localStorage.getItem('sst_companies') || '[]');
        existingCompanies.push(company);
        localStorage.setItem('sst_companies', JSON.stringify(existingCompanies));

        // Create session
        const sessionToken = this.generateSessionToken();
        localStorage.setItem('sst_user_data', JSON.stringify(user));
        localStorage.setItem('sst_session_token', sessionToken);

        return {
            success: true,
            user: user,
            company: company,
            sessionToken: sessionToken
        };
    }

    loginUserFallback(credentials) {
        const existingUsers = JSON.parse(localStorage.getItem('sst_users') || '[]');
        const user = existingUsers.find(u => u.email === credentials.email);
        
        if (!user) {
            throw new Error('User not found. Please register first.');
        }

        // Create session
        const sessionToken = this.generateSessionToken();
        localStorage.setItem('sst_user_data', JSON.stringify(user));
        localStorage.setItem('sst_session_token', sessionToken);

        return {
            success: true,
            user: user,
            sessionToken: sessionToken
        };
    }

    getUserProfileFallback(userId) {
        const userData = JSON.parse(localStorage.getItem('sst_user_data') || '{}');
        return userData;
    }

    updateUserProfileFallback(userId, profileData) {
        const userData = JSON.parse(localStorage.getItem('sst_user_data') || '{}');
        const updatedUser = { ...userData, ...profileData };
        localStorage.setItem('sst_user_data', JSON.stringify(updatedUser));
        return { success: true, user: updatedUser };
    }

    getCompanyDataFallback(companyId) {
        const companies = JSON.parse(localStorage.getItem('sst_companies') || '[]');
        return companies.find(c => c.id === companyId) || null;
    }

    updateCompanyDataFallback(companyId, companyData) {
        const companies = JSON.parse(localStorage.getItem('sst_companies') || '[]');
        const companyIndex = companies.findIndex(c => c.id === companyId);
        
        if (companyIndex !== -1) {
            companies[companyIndex] = { ...companies[companyIndex], ...companyData };
            localStorage.setItem('sst_companies', JSON.stringify(companies));
            return { success: true, company: companies[companyIndex] };
        }
        
        throw new Error('Company not found');
    }

    getUserStatsFallback(userId) {
        const userData = JSON.parse(localStorage.getItem('sst_user_data') || '{}');
        return this.generateUserStats(userData);
    }

    getRecentActivityFallback(userId) {
        const userData = JSON.parse(localStorage.getItem('sst_user_data') || '{}');
        return this.generateRecentActivity(userData);
    }

    // Utility methods
    generateId() {
        return 'user_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
    }

    generateSessionToken() {
        return 'sess_' + Math.random().toString(36).substr(2, 15) + Date.now().toString(36);
    }

    generateUserStats(userData) {
        let opportunitiesAnalyzed = Math.floor(Math.random() * 500) + 100;
        let proposalsSubmitted = Math.floor(Math.random() * 50) + 10;
        let contractsWon = Math.floor(Math.random() * 20) + 5;
        
        if (userData.companySize === 'large') {
            opportunitiesAnalyzed *= 2;
            proposalsSubmitted *= 1.5;
            contractsWon *= 1.3;
        } else if (userData.companySize === 'small') {
            opportunitiesAnalyzed *= 0.7;
            proposalsSubmitted *= 0.8;
            contractsWon *= 0.9;
        }
        
        const winRate = Math.round((contractsWon / proposalsSubmitted) * 100);
        
        return {
            opportunitiesAnalyzed: Math.floor(opportunitiesAnalyzed),
            proposalsSubmitted: Math.floor(proposalsSubmitted),
            contractsWon: Math.floor(contractsWon),
            winRate: Math.min(winRate, 100)
        };
    }

    generateRecentActivity(userData) {
        const activities = [];
        const companyName = userData.companyName || 'Your Company';
        const primaryNaics = userData.primaryNaics || '541511';
        const primaryPsc = userData.primaryPsc || 'R425';
        
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
        
        return sampleActivities.slice(0, Math.floor(Math.random() * 3) + 2);
    }
}

// Create global API instance
window.sstAPI = new SSTAPI();

console.log('SST 2.0 API Client loaded! 🚀');
