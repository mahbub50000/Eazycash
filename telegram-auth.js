// Telegram WebApp Authentication for EazyCash Mini App
// This script automatically authenticates users via Telegram WebApp

class TelegramAuth {
    constructor() {
        this.user = null;
        this.init();
    }

    init() {
        // Wait for Telegram WebApp to be ready
        if (window.Telegram && window.Telegram.WebApp) {
            this.webApp = window.Telegram.WebApp;
            this.webApp.ready();
            this.authenticateUser();
        } else {
            console.error('Telegram WebApp not available');
            this.showFallback();
        }
    }

    authenticateUser() {
        try {
            // Get user data from Telegram WebApp
            const userData = this.webApp.initDataUnsafe?.user;
            
            if (userData) {
                this.user = {
                    id: userData.id,
                    first_name: userData.first_name || '',
                    last_name: userData.last_name || '',
                    username: userData.username || '',
                    photo_url: userData.photo_url || '',
                    language_code: userData.language_code || 'en'
                };
                
                // Send user data to backend
                this.sendUserToBackend();
                
                // Update UI with user info
                this.updateUserProfile();
                
                // Store user in localStorage for persistence
                localStorage.setItem('telegram_user', JSON.stringify(this.user));
                
                console.log('✅ Telegram user authenticated:', this.user);
            } else {
                console.error('❌ No user data from Telegram');
                this.showFallback();
            }
        } catch (error) {
            console.error('❌ Telegram authentication error:', error);
            this.showFallback();
        }
    }

    async sendUserToBackend() {
        try {
            const response = await fetch('/api/telegram-auth', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    user: this.user,
                    initData: this.webApp.initData // For verification
                })
            });

            const result = await response.json();
            if (result.success) {
                console.log('✅ User saved to backend');
            }
        } catch (error) {
            console.error('❌ Failed to save user to backend:', error);
        }
    }

    updateUserProfile() {
        const userInfo = document.getElementById('user-info');
        if (!userInfo || !this.user) return;

        // Create user profile HTML
        const profileHTML = `
            <div class="user-profile">
                <div class="user-avatar">
                    ${this.user.photo_url 
                        ? `<img src="${this.user.photo_url}" alt="${this.user.first_name}" onerror="this.src='https://via.placeholder.com/100'">`
                        : `<div class="avatar-placeholder">${this.user.first_name?.charAt(0) || 'U'}</div>`
                    }
                </div>
                <div class="user-details">
                    <h3>${this.user.first_name} ${this.user.last_name}</h3>
                    <p>@${this.user.username || 'user' + this.user.id}</p>
                    <small>Telegram User</small>
                </div>
            </div>
            <style>
                .user-profile {
                    display: flex;
                    align-items: center;
                    gap: 15px;
                    padding: 20px;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    border-radius: 15px;
                    color: white;
                    margin: 20px 0;
                }
                .user-avatar img, .avatar-placeholder {
                    width: 60px;
                    height: 60px;
                    border-radius: 50%;
                    object-fit: cover;
                    background: rgba(255,255,255,0.2);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 24px;
                    font-weight: bold;
                }
                .user-details h3 {
                    margin: 0;
                    font-size: 1.2rem;
                }
                .user-details p {
                    margin: 5px 0;
                    opacity: 0.9;
                }
                .user-details small {
                    opacity: 0.7;
                }
            </style>
        `;
        
        userInfo.innerHTML = profileHTML;
    }

    showFallback() {
        // Fallback for non-Telegram environments
        const userInfo = document.getElementById('user-info');
        if (userInfo) {
            userInfo.innerHTML = `
                <div class="user-profile">
                    <div class="user-avatar">
                        <div class="avatar-placeholder">?</div>
                    </div>
                    <div class="user-details">
                        <h3>Guest User</h3>
                        <p>Login via Telegram</p>
                    </div>
                </div>
            `;
        }
    }

    getUser() {
        return this.user;
    }

    isAuthenticated() {
        return this.user !== null;
    }
}

// Initialize Telegram authentication when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.telegramAuth = new TelegramAuth();
});

// Global function to get user data
window.getTelegramUser = () => {
    return window.telegramAuth?.getUser() || JSON.parse(localStorage.getItem('telegram_user') || 'null');
};
