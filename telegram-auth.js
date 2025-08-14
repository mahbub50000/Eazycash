// Telegram Web App SDK Integration for Automatic Authentication
class TelegramAuth {
    constructor() {
        this.user = null;
        this.token = null;
        this.isAuthenticated = false;
        this.init();
    }

    init() {
        // Check if running in Telegram Web App
        if (window.Telegram && window.Telegram.WebApp) {
            this.telegram = window.Telegram.WebApp;
            this.telegram.ready();
            this.authenticate();
        } else {
            console.warn('Not running in Telegram Web App');
            // Fallback for testing
            this.handleTestEnvironment();
        }
    }

    async authenticate() {
        try {
            const user = this.telegram.initDataUnsafe?.user;
            
            if (user) {
                // Send user data to backend for verification
                const response = await this.sendUserDataToBackend(user);
                
                if (response.success) {
                    this.user = response.user;
                    this.token = response.token;
                    this.isAuthenticated = true;
                    
                    // Store token in localStorage
                    localStorage.setItem('telegram_token', this.token);
                    
                    // Update UI with user profile
                    this.updateUserProfile();
                    
                    // Emit authentication event
                    window.dispatchEvent(new CustomEvent('telegram-authenticated', {
                        detail: { user: this.user, token: this.token }
                    }));
                }
            }
        } catch (error) {
            console.error('Authentication failed:', error);
            this.handleAuthError();
        }
    }

    async sendUserDataToBackend(userData) {
        const response = await fetch('/api/auth/telegram', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                id: userData.id,
                first_name: userData.first_name,
                last_name: userData.last_name,
                username: userData.username,
                photo_url: userData.photo_url,
                auth_date: this.telegram.initDataUnsafe.auth_date,
                hash: this.telegram.initDataUnsafe.hash
            })
        });
        
        return response.json();
    }

    updateUserProfile() {
        if (!this.user) return;

        // Update profile photo
        const profileImg = document.getElementById('user-avatar');
        if (profileImg && this.user.photo_url) {
            profileImg.src = this.user.photo_url;
            profileImg.style.display = 'block';
        }

        // Update username
        const usernameEl = document.getElementById('username');
        if (usernameEl) {
            usernameEl.textContent = this.user.username || this.user.first_name;
        }

        // Update user info display
        const userInfoEl = document.getElementById('user-info');
        if (userInfoEl) {
            userInfoEl.innerHTML = `
                <div class="user-profile">
                    <img src="${this.user.photo_url || '/default-avatar.png'}" alt="Profile" class="avatar">
                    <div class="user-details">
                        <h3>${this.user.first_name} ${this.user.last_name || ''}</h3>
                        <p>@${this.user.username || 'user'}</p>
                    </div>
                </div>
            `;
        }

        // Hide login elements
        const loginElements = document.querySelectorAll('.login-section, .auth-buttons');
        loginElements.forEach(el => el.style.display = 'none');
    }

    handleTestEnvironment() {
        // For testing outside Telegram
        const testUser = {
            id: 123456789,
            first_name: 'Test',
            last_name: 'User',
            username: 'testuser',
            photo_url: 'https://via.placeholder.com/100'
        };
        
        this.user = testUser;
        this.token = 'test-token';
        this.isAuthenticated = true;
        
        setTimeout(() => this.updateUserProfile(), 100);
    }

    handleAuthError() {
        // Show fallback UI or retry button
        console.error('Failed to authenticate with Telegram');
    }

    logout() {
        localStorage.removeItem('telegram_token');
        this.user = null;
        this.token = null;
        this.isAuthenticated = false;
        
        // Show login elements
        const loginElements = document.querySelectorAll('.login-section, .auth-buttons');
        loginElements.forEach(el => el.style.display = 'block');
        
        // Hide user profile
        const userInfoEl = document.getElementById('user-info');
        if (userInfoEl) userInfoEl.innerHTML = '';
    }

    getAuthHeaders() {
        return {
            'Authorization': `Bearer ${this.token || localStorage.getItem('telegram_token')}`
        };
    }
}

// Initialize Telegram authentication on page load
document.addEventListener('DOMContentLoaded', () => {
    window.telegramAuth = new TelegramAuth();
});

// Listen for authentication events
window.addEventListener('telegram-authenticated', (event) => {
    console.log('User authenticated:', event.detail.user);
});
