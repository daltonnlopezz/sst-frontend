// SST 2.0 Authentication JavaScript

document.addEventListener('DOMContentLoaded', function() {
    // Initialize authentication functionality
    initializeAuth();
});

function initializeAuth() {
    // Password visibility toggles
    setupPasswordToggles();
    
    // Password strength indicator
    setupPasswordStrength();
    
    // Form validation
    setupFormValidation();
    
    // Form submissions
    setupFormSubmissions();
    
    // Auto-format inputs
    setupInputFormatting();
}

// Password visibility toggles
function setupPasswordToggles() {
    const toggleLoginPassword = document.getElementById('toggleLoginPassword');
    const loginPassword = document.getElementById('loginPassword');
    const togglePassword = document.getElementById('togglePassword');
    const password = document.getElementById('password');
    
    if (toggleLoginPassword && loginPassword) {
        toggleLoginPassword.addEventListener('click', function() {
            togglePasswordVisibility(loginPassword, toggleLoginPassword);
        });
    }
    
    if (togglePassword && password) {
        togglePassword.addEventListener('click', function() {
            togglePasswordVisibility(password, togglePassword);
        });
    }
}

function togglePasswordVisibility(input, button) {
    const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
    input.setAttribute('type', type);
    
    const icon = button.querySelector('i');
    icon.classList.toggle('fa-eye');
    icon.classList.toggle('fa-eye-slash');
}

// Password strength indicator
function setupPasswordStrength() {
    const passwordInput = document.getElementById('password');
    const strengthBar = document.getElementById('passwordStrength');
    const strengthText = document.getElementById('passwordStrengthText');
    
    if (passwordInput && strengthBar && strengthText) {
        passwordInput.addEventListener('input', function() {
            const strength = calculatePasswordStrength(this.value);
            updatePasswordStrength(strength, strengthBar, strengthText);
        });
    }
}

function calculatePasswordStrength(password) {
    let score = 0;
    let feedback = [];
    
    // Length check
    if (password.length >= 8) score += 1;
    else feedback.push('At least 8 characters');
    
    if (password.length >= 12) score += 1;
    
    // Character variety
    if (/[a-z]/.test(password)) score += 1;
    else feedback.push('Lowercase letters');
    
    if (/[A-Z]/.test(password)) score += 1;
    else feedback.push('Uppercase letters');
    
    if (/[0-9]/.test(password)) score += 1;
    else feedback.push('Numbers');
    
    if (/[^A-Za-z0-9]/.test(password)) score += 1;
    else feedback.push('Special characters');
    
    // Common patterns
    if (!/(.)\1{2,}/.test(password)) score += 1;
    else feedback.push('Avoid repeated characters');
    
    return {
        score: Math.min(score, 5),
        feedback: feedback
    };
}

function updatePasswordStrength(strength, bar, text) {
    const percentage = (strength.score / 5) * 100;
    bar.style.width = percentage + '%';
    
    // Update color and text
    bar.classList.remove('bg-danger', 'bg-warning', 'bg-info', 'bg-success');
    
    if (strength.score <= 2) {
        bar.classList.add('bg-danger');
        text.textContent = 'Weak password';
        text.className = 'text-danger';
    } else if (strength.score === 3) {
        bar.classList.add('bg-warning');
        text.textContent = 'Fair password';
        text.className = 'text-warning';
    } else if (strength.score === 4) {
        bar.classList.add('bg-info');
        text.textContent = 'Good password';
        text.className = 'text-info';
    } else {
        bar.classList.add('bg-success');
        text.textContent = 'Strong password';
        text.className = 'text-success';
    }
}

// Form validation
function setupFormValidation() {
    const forms = document.querySelectorAll('.auth-form');
    
    forms.forEach(form => {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            
            if (validateForm(form)) {
                handleFormSubmission(form);
            }
        });
    });
}

function validateForm(form) {
    let isValid = true;
    const formData = new FormData(form);
    
    // Clear previous errors
    clearFormErrors(form);
    
    // Required field validation
    const requiredFields = form.querySelectorAll('[required]');
    requiredFields.forEach(field => {
        if (!field.value.trim()) {
            showFieldError(field, 'This field is required');
            isValid = false;
        }
    });
    
    // Email validation
    const emailFields = form.querySelectorAll('input[type="email"]');
    emailFields.forEach(field => {
        if (field.value && !isValidEmail(field.value)) {
            showFieldError(field, 'Please enter a valid email address');
            isValid = false;
        }
    });
    
    // Password confirmation
    const password = form.querySelector('#password');
    const confirmPassword = form.querySelector('#confirmPassword');
    if (password && confirmPassword && password.value !== confirmPassword.value) {
        showFieldError(confirmPassword, 'Passwords do not match');
        isValid = false;
    }
    
    // Terms validation
    const terms = form.querySelector('#terms');
    if (terms && !terms.checked) {
        showFieldError(terms, 'You must agree to the terms and conditions');
        isValid = false;
    }
    
    // DUNS number validation
    const dunsNumber = form.querySelector('#dunsNumber');
    if (dunsNumber && dunsNumber.value && !isValidDUNS(dunsNumber.value)) {
        showFieldError(dunsNumber, 'DUNS number must be 9 digits');
        isValid = false;
    }
    
    // CAGE code validation
    const cageCode = form.querySelector('#cageCode');
    if (cageCode && cageCode.value && !isValidCAGE(cageCode.value)) {
        showFieldError(cageCode, 'CAGE code must be 5 characters');
        isValid = false;
    }
    
    // UEI validation
    const uei = form.querySelector('#uei');
    if (uei && uei.value && !isValidUEI(uei.value)) {
        showFieldError(uei, 'UEI must be 12 characters');
        isValid = false;
    }
    
    // PSC code validation
    const primaryPsc = form.querySelector('#primaryPsc');
    if (primaryPsc && primaryPsc.value && !isValidPSC(primaryPsc.value)) {
        showFieldError(primaryPsc, 'PSC code must be 4 characters (e.g., R425)');
        isValid = false;
    }
    
    // Keywords validation
    const primaryKeywords = form.querySelector('#primaryKeywords');
    if (primaryKeywords && !primaryKeywords.value.trim()) {
        showFieldError(primaryKeywords, 'Primary keywords are required');
        isValid = false;
    }
    
    return isValid;
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function isValidDUNS(duns) {
    const dunsRegex = /^\d{9}$/;
    return dunsRegex.test(duns.replace(/\D/g, ''));
}

function isValidCAGE(cage) {
    const cageRegex = /^[A-Z0-9]{5}$/;
    return cageRegex.test(cage.toUpperCase());
}

function isValidUEI(uei) {
    const ueiRegex = /^[A-Z0-9]{12}$/;
    return ueiRegex.test(uei.toUpperCase());
}

function isValidPSC(psc) {
    const pscRegex = /^[A-Z]\d{3}$/;
    return pscRegex.test(psc.toUpperCase());
}

function showFieldError(field, message) {
    field.classList.add('is-invalid');
    
    let errorDiv = field.parentNode.querySelector('.invalid-feedback');
    if (!errorDiv) {
        errorDiv = document.createElement('div');
        errorDiv.className = 'invalid-feedback';
        field.parentNode.appendChild(errorDiv);
    }
    errorDiv.textContent = message;
}

function clearFormErrors(form) {
    const invalidFields = form.querySelectorAll('.is-invalid');
    invalidFields.forEach(field => {
        field.classList.remove('is-invalid');
    });
    
    const errorMessages = form.querySelectorAll('.invalid-feedback');
    errorMessages.forEach(error => {
        error.remove();
    });
}

// Form submissions
function setupFormSubmissions() {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const forgotPasswordLink = document.getElementById('forgotPasswordLink');
    
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }
    
    if (forgotPasswordLink) {
        forgotPasswordLink.addEventListener('click', handleForgotPassword);
    }
}

async function handleForgotPassword(e) {
    e.preventDefault();
    
    const email = prompt('Enter your email address to reset your password:');
    if (!email) return;
    
    if (!isValidEmail(email)) {
        showErrorMessage('Please enter a valid email address');
        return;
    }
    
    try {
        const result = await window.passwordReset.sendPasswordResetEmail(email);
        if (result.success) {
            showSuccessMessage('Password reset email sent! Please check your inbox.');
        } else {
            showErrorMessage(result.message);
        }
    } catch (error) {
        showErrorMessage('Failed to send password reset email. Please try again.');
    }
}

async function handleLogin(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const loginData = {
        email: formData.get('email'),
        password: formData.get('password'),
        rememberMe: formData.get('rememberMe') === 'on'
    };
    
    // Check if account is locked
    if (window.accountSecurity.isAccountLocked(loginData.email)) {
        showErrorMessage('Account is temporarily locked due to too many failed attempts. Please try again later.');
        return;
    }
    
    // Show loading state
    showLoadingState(e.target);
    
    try {
        // Call API to login user
        const response = await window.sstAPI.loginUser(loginData);
        
        hideLoadingState(e.target);
        
        if (response.success) {
            // Check if email is verified
            const userData = JSON.parse(localStorage.getItem('sst_user_data') || '{}');
            if (!userData.emailVerified) {
                showErrorMessage('Please verify your email before logging in. Check your inbox for a verification code.');
                return;
            }
            
            // Clear failed attempts on successful login
            window.accountSecurity.clearFailedAttempts(loginData.email);
            
            showSuccessMessage('Login successful! Redirecting...');
            
            // Redirect to dashboard
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1500);
        } else {
            // Record failed attempt
            window.accountSecurity.recordFailedAttempt(loginData.email);
            const remainingAttempts = window.accountSecurity.getRemainingAttempts(loginData.email);
            
            if (remainingAttempts > 0) {
                showErrorMessage(`${response.error || 'Login failed'}. ${remainingAttempts} attempts remaining.`);
            } else {
                showErrorMessage('Account locked due to too many failed attempts. Please try again later.');
            }
        }
        
    } catch (error) {
        hideLoadingState(e.target);
        window.accountSecurity.recordFailedAttempt(loginData.email);
        showErrorMessage(error.message || 'Login failed. Please try again.');
    }
}

async function handleRegister(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const registerData = {
        // Personal Information
        firstName: formData.get('firstName'),
        lastName: formData.get('lastName'),
        email: formData.get('email'),
        phone: formData.get('phone'),
        jobTitle: formData.get('jobTitle'),
        
        // Company Information
        companyName: formData.get('companyName'),
        dunsNumber: formData.get('dunsNumber'),
        cageCode: formData.get('cageCode'),
        uei: formData.get('uei'),
        companySize: formData.get('companySize'),
        businessType: formData.get('businessType'),
        address: formData.get('address'),
        
        // NAICS Codes
        primaryNaics: formData.get('primaryNaics'),
        secondaryNaics: formData.get('secondaryNaics'),
        
        // PSC Codes
        primaryPsc: formData.get('primaryPsc'),
        secondaryPsc: formData.get('secondaryPsc'),
        pscDescription: formData.get('pscDescription'),
        
        // Keywords & Capabilities
        primaryKeywords: formData.get('primaryKeywords'),
        secondaryKeywords: formData.get('secondaryKeywords'),
        capabilities: formData.get('capabilities'),
        certifications: formData.get('certifications'),
        
        // Security & Preferences
        password: formData.get('password'),
        emailNotifications: formData.get('emailNotifications') === 'on',
        newsletter: formData.get('newsletter') === 'on',
        terms: formData.get('terms') === 'on',
        dataProcessing: formData.get('dataProcessing') === 'on'
    };
    
    // Show loading state
    showLoadingState(e.target);
    
    try {
        // Call API to register user
        const response = await window.sstAPI.registerUser(registerData);
        
        hideLoadingState(e.target);
        
        if (response.success) {
            // Send verification email
            const emailResult = await window.emailVerification.sendVerificationEmail(registerData.email, window.emailVerification.generateVerificationCode());
            
            if (emailResult.success) {
                showSuccessMessage('Registration successful! Please check your email to verify your account.');
                
                // Redirect to email verification page
                setTimeout(() => {
                    window.location.href = `verify-email.html?email=${encodeURIComponent(registerData.email)}`;
                }, 2000);
            } else {
                showErrorMessage('Registration successful, but failed to send verification email. Please contact support.');
            }
        } else {
            showErrorMessage(response.error || 'Registration failed');
        }
        
    } catch (error) {
        hideLoadingState(e.target);
        showErrorMessage(error.message || 'Registration failed. Please try again.');
    }
}

function showLoadingState(form) {
    const submitButton = form.querySelector('button[type="submit"]');
    const originalText = submitButton.innerHTML;
    
    submitButton.disabled = true;
    submitButton.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Processing...';
    
    // Store original text for restoration
    submitButton.dataset.originalText = originalText;
}

function hideLoadingState(form) {
    const submitButton = form.querySelector('button[type="submit"]');
    
    submitButton.disabled = false;
    submitButton.innerHTML = submitButton.dataset.originalText || 'Submit';
}

function showSuccessMessage(message) {
    // Create success alert
    const alertDiv = document.createElement('div');
    alertDiv.className = 'alert alert-success alert-dismissible fade show';
    alertDiv.innerHTML = `
        <i class="fas fa-check-circle me-2"></i>${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    // Insert at top of form
    const form = document.querySelector('.auth-form');
    form.insertBefore(alertDiv, form.firstChild);
    
    // Auto-dismiss after 5 seconds
    setTimeout(() => {
        if (alertDiv.parentNode) {
            alertDiv.remove();
        }
    }, 5000);
}

function showErrorMessage(message) {
    // Create error alert
    const alertDiv = document.createElement('div');
    alertDiv.className = 'alert alert-danger alert-dismissible fade show';
    alertDiv.innerHTML = `
        <i class="fas fa-exclamation-triangle me-2"></i>${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    // Insert at top of form
    const form = document.querySelector('.auth-form');
    form.insertBefore(alertDiv, form.firstChild);
    
    // Auto-dismiss after 7 seconds
    setTimeout(() => {
        if (alertDiv.parentNode) {
            alertDiv.remove();
        }
    }, 7000);
}

// Input formatting
function setupInputFormatting() {
    // DUNS number formatting
    const dunsInput = document.getElementById('dunsNumber');
    if (dunsInput) {
        dunsInput.addEventListener('input', function() {
            this.value = this.value.replace(/\D/g, '').substring(0, 9);
        });
    }
    
    // CAGE code formatting
    const cageInput = document.getElementById('cageCode');
    if (cageInput) {
        cageInput.addEventListener('input', function() {
            this.value = this.value.toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 5);
        });
    }
    
    // UEI formatting
    const ueiInput = document.getElementById('uei');
    if (ueiInput) {
        ueiInput.addEventListener('input', function() {
            this.value = this.value.toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 12);
        });
    }
    
    // PSC code formatting
    const primaryPscInput = document.getElementById('primaryPsc');
    if (primaryPscInput) {
        primaryPscInput.addEventListener('input', function() {
            this.value = this.value.toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 4);
        });
    }
    
    const secondaryPscInput = document.getElementById('secondaryPsc');
    if (secondaryPscInput) {
        secondaryPscInput.addEventListener('input', function() {
            // Format multiple PSC codes separated by commas
            let value = this.value.toUpperCase();
            let codes = value.split(',').map(code => 
                code.trim().replace(/[^A-Z0-9]/g, '').substring(0, 4)
            ).filter(code => code.length > 0);
            this.value = codes.join(', ');
        });
    }
    
    // Phone number formatting
    const phoneInput = document.getElementById('phone');
    if (phoneInput) {
        phoneInput.addEventListener('input', function() {
            this.value = formatPhoneNumber(this.value);
        });
    }
}

function formatPhoneNumber(phone) {
    const cleaned = phone.replace(/\D/g, '');
    const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
    
    if (match) {
        return `(${match[1]}) ${match[2]}-${match[3]}`;
    }
    
    return phone;
}

// Security considerations for future implementation
function generateSecureToken() {
    // This would generate a secure token for authentication
    // Implementation would use crypto.getRandomValues() or similar
    return 'secure-token-placeholder';
}

function hashPassword(password) {
    // This would hash the password using a secure hashing algorithm
    // Implementation would use Web Crypto API or similar
    return 'hashed-password-placeholder';
}

function validateCSRFToken(token) {
    // This would validate CSRF tokens for security
    // Implementation would check against server-side token
    return true;
}

console.log('SST 2.0 Authentication system loaded! 🔐');
