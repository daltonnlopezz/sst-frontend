// SST 2.0 Email Verification System

class EmailVerification {
    constructor() {
        this.verificationCodes = new Map(); // In production, use Redis or database
        this.codeExpiry = 15 * 60 * 1000; // 15 minutes
    }

    // Generate verification code
    generateVerificationCode() {
        return Math.floor(100000 + Math.random() * 900000).toString();
    }

    // Send verification email (simulated)
    async sendVerificationEmail(email, code) {
        // In production, integrate with email service like SendGrid, AWS SES, etc.
        console.log(`📧 Verification email sent to ${email}`);
        console.log(`🔑 Verification code: ${code}`);
        
        // For demo purposes, we'll show the code in the UI
        this.showVerificationCode(code);
        
        // Store code with expiry
        this.verificationCodes.set(email, {
            code: code,
            expires: Date.now() + this.codeExpiry,
            attempts: 0
        });
        
        return { success: true, message: 'Verification email sent' };
    }

    // Show verification code in UI (for demo)
    showVerificationCode(code) {
        const notification = document.createElement('div');
        notification.className = 'alert alert-info alert-dismissible fade show position-fixed';
        notification.style.cssText = `
            top: 20px;
            right: 20px;
            z-index: 9999;
            max-width: 400px;
        `;
        notification.innerHTML = `
            <strong>📧 Demo Mode:</strong> Verification code sent!<br>
            <strong>Code:</strong> <code>${code}</code><br>
            <small>In production, this would be sent via email.</small>
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        document.body.appendChild(notification);
        
        // Auto-dismiss after 30 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 30000);
    }

    // Verify email code
    verifyCode(email, code) {
        const stored = this.verificationCodes.get(email);
        
        if (!stored) {
            return { success: false, message: 'No verification code found for this email' };
        }
        
        if (Date.now() > stored.expires) {
            this.verificationCodes.delete(email);
            return { success: false, message: 'Verification code has expired' };
        }
        
        if (stored.attempts >= 3) {
            this.verificationCodes.delete(email);
            return { success: false, message: 'Too many failed attempts. Please request a new code.' };
        }
        
        if (stored.code === code) {
            this.verificationCodes.delete(email);
            return { success: true, message: 'Email verified successfully' };
        } else {
            stored.attempts++;
            return { success: false, message: 'Invalid verification code' };
        }
    }

    // Resend verification code
    async resendVerificationCode(email) {
        const code = this.generateVerificationCode();
        return await this.sendVerificationEmail(email, code);
    }
}

// Password Reset System
class PasswordReset {
    constructor() {
        this.resetTokens = new Map(); // In production, use Redis or database
        this.tokenExpiry = 60 * 60 * 1000; // 1 hour
    }

    // Generate reset token
    generateResetToken() {
        return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    }

    // Send password reset email
    async sendPasswordResetEmail(email) {
        const token = this.generateResetToken();
        
        // Store token with expiry
        this.resetTokens.set(token, {
            email: email,
            expires: Date.now() + this.tokenExpiry,
            used: false
        });
        
        // In production, send actual email with reset link
        console.log(`📧 Password reset email sent to ${email}`);
        console.log(`🔑 Reset token: ${token}`);
        
        // For demo, show the reset link
        this.showResetLink(token);
        
        return { success: true, message: 'Password reset email sent' };
    }

    // Show reset link (for demo)
    showResetLink(token) {
        const notification = document.createElement('div');
        notification.className = 'alert alert-warning alert-dismissible fade show position-fixed';
        notification.style.cssText = `
            top: 20px;
            right: 20px;
            z-index: 9999;
            max-width: 500px;
        `;
        notification.innerHTML = `
            <strong>🔐 Demo Mode:</strong> Password reset link generated!<br>
            <strong>Reset Link:</strong> <a href="reset-password.html?token=${token}" target="_blank">Reset Password</a><br>
            <small>In production, this would be sent via email.</small>
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        document.body.appendChild(notification);
        
        // Auto-dismiss after 30 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 30000);
    }

    // Verify reset token
    verifyResetToken(token) {
        const stored = this.resetTokens.get(token);
        
        if (!stored) {
            return { success: false, message: 'Invalid reset token' };
        }
        
        if (Date.now() > stored.expires) {
            this.resetTokens.delete(token);
            return { success: false, message: 'Reset token has expired' };
        }
        
        if (stored.used) {
            return { success: false, message: 'Reset token has already been used' };
        }
        
        return { success: true, email: stored.email };
    }

    // Reset password
    resetPassword(token, newPassword) {
        const stored = this.resetTokens.get(token);
        
        if (!stored || Date.now() > stored.expires || stored.used) {
            return { success: false, message: 'Invalid or expired reset token' };
        }
        
        // Mark token as used
        stored.used = true;
        
        // In production, update password in database
        console.log(`Password reset for ${stored.email}`);
        
        return { success: true, message: 'Password reset successfully' };
    }
}

// Account Security System
class AccountSecurity {
    constructor() {
        this.failedAttempts = new Map(); // Track failed login attempts
        this.maxAttempts = 5;
        this.lockoutDuration = 15 * 60 * 1000; // 15 minutes
    }

    // Track failed login attempt
    recordFailedAttempt(email) {
        const attempts = this.failedAttempts.get(email) || { count: 0, lastAttempt: 0 };
        attempts.count++;
        attempts.lastAttempt = Date.now();
        this.failedAttempts.set(email, attempts);
    }

    // Check if account is locked
    isAccountLocked(email) {
        const attempts = this.failedAttempts.get(email);
        
        if (!attempts) {
            return false;
        }
        
        // Reset attempts if lockout period has passed
        if (Date.now() - attempts.lastAttempt > this.lockoutDuration) {
            this.failedAttempts.delete(email);
            return false;
        }
        
        return attempts.count >= this.maxAttempts;
    }

    // Clear failed attempts (on successful login)
    clearFailedAttempts(email) {
        this.failedAttempts.delete(email);
    }

    // Get remaining attempts
    getRemainingAttempts(email) {
        const attempts = this.failedAttempts.get(email);
        if (!attempts) {
            return this.maxAttempts;
        }
        return Math.max(0, this.maxAttempts - attempts.count);
    }
}

// Create global instances
window.emailVerification = new EmailVerification();
window.passwordReset = new PasswordReset();
window.accountSecurity = new AccountSecurity();

console.log('SST 2.0 Security Systems loaded! 🔐');
