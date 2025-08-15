// Telegram WebApp Authentication for EazyCash Mini App
// Enhanced with demo mode support and improved authentication flow

class TelegramAuth {
    constructor() {
        this.user = null;
        this.isDemoMode = false;
        this.init();
    }

    init() {
        // Check for demo mode first
        this.checkDemoMode();
        
        // Wait for Telegram WebApp to be ready
        if (window.Telegram && window.Telegram.WebApp) {
            this.webApp = window.Telegram.WebApp;
            this.webApp.ready();
            this.authenticateUser();
        } else {
            console.log('Telegram WebApp not available - checking for demo mode');
            this.handleNonTelegramEnvironment();
        }
    }

    checkDemoMode() {
        const demoMode = localStorage.getItem('demo_mode');
        const demoUser = localStorage.getItem('telegram_user');
        
        if (demoMode === 'true' && demoUser) {
            this.isDemoMode = true;
            this.user = JSON.parse(demoUser);
            console.log('✅ Demo mode active:', this.user);
            this.updateUserProfile();
            return true;
        }
        return false;
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
                this.handleNonTelegramEnvironment();
            }
        } catch (error) {
            console.error('❌ Telegram authentication error:', error);
            this.handleNonTelegramEnvironment();
        }
    }

    async sendUserToBackend() {
        try {
            const endpoint = this.isDemoMode ? '/api/demo-auth' : '/api/telegram-auth';
            const payload = this.isDemoMode 
                ? { user: this.user }
                : { 
                    user: this.user,
                    initData: this.webApp?.initData // For verification
                };

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload)
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

        const isDemo = this.isDemoMode;
        const userType = isDemo ? 'Demo User' : 'Telegram User';
        
        // Create user profile HTML
        const profileHTML = `
            <div class="user-profile ${isDemo ? 'demo-user' : ''}">
                <div class="user-avatar">
                    ${this.user.photo_url 
                        ? `<img src="${this.user.photo_url}" alt="${this.user.first_name}" onerror="this.src='https://via.placeholder.com/100'">`
                        : `<div class="avatar-placeholder">${this.user.first_name?.charAt(0) || 'U'}</div>`
                    }
                    ${isDemo ? '<div class="demo-badge">DEMO</div>' : ''}
                </div>
                <div class="user-details">
                    <h3>${this.user.first_name} ${this.user.last_name}</h3>
                    <p>@${this.user.username || 'user' + this.user.id}</p>
                    <small>${userType}</small>
                    ${isDemo ? '<button onclick="logoutDemo()" class="logout-btn">Logout</button>' : ''}
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
                    position: relative;
                }
                
                .user-profile.demo-user {
                    background: linear-gradient(135deg, #ff6b6b, #ffa500);
                }
                
                .demo-badge {
                    position: absolute;
                    top: -5px;
                    right: -5px;
                    background: #ff4757;
                    color: white;
                    padding: 2px 8px;
                    border-radius: 10px;
                    font-size: 0.7rem;
                    font-weight: bold;
                }
                
                .user-avatar {
                    position: relative;
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
                
                .logout-btn {
                    background: rgba(255,255,255,0.2);
                    border: 1px solid rgba(255,255,255,0.3);
                    color: white;
                    padding: 5px 10px;
                    border-radius: 5px;
                    cursor: pointer;
                    font-size: 0.8rem;
                    margin-top: 5px;
                }
                
                .logout-btn:hover {
                    background: rgba(255,255,255,0.3);
                }
            </style>
        `;
        
        userInfo.innerHTML = profileHTML;
    }

    handleNonTelegramEnvironment() {
        // Check if we have a demo user
        if (this.checkDemoMode()) {
            return;
        }
        
        // Show demo login option
        this.showDemoLogin();
    }

    showDemoLogin() {
        const userInfo = document.getElementById('user-info');
        if (userInfo) {
            userInfo.innerHTML = `
                <div class="user-profile">
                    <div class="user-avatar">
                        <div class="avatar-placeholder">?</div>
                    </div>
                    <div class="user-details">
                        <h3>Guest User</h3>
                        <p>Choose login method</p>
                        <button onclick="window.location.href='demo-login.html'" class="demo-btn">
                            <i class="fas fa-user-circle"></i> Demo Login
                        </button>
                        <button onclick="window.location.href='index.html'" class="telegram-btn">
                            <i class="fab fa-telegram-plane"></i> Telegram Login
                        </button>
                    </div>
                </div>
                <style>
                    .demo-btn, .telegram-btn {
                        background: rgba(255,255,255,0.2);
                        border: 1px solid rgba(255,255,255,0.3);
                        color: white;
                        padding: 8px 15px;
                        border-radius: 5px;
                        cursor: pointer;
                        font-size: 0.8rem;
                        margin: 2px;
                        transition: all 0.3s ease;
                    }
                    
                    .demo-btn:hover, .telegram-btn:hover {
                        background: rgba(255,255,255,0.3);
                    }
                </style>
            `;
        }
    }

    getUser() {
        return this.user;
    }

    isAuthenticated() {
        return this.user !== null;
    }

    isDemo() {
        return this.isDemoMode;
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

// Global function to check if demo mode
window.isDemoMode = () => {
    return window.telegramAuth?.isDemo() || false;
};

// Global function to logout from demo mode
window.logoutDemo = () => {
    localStorage.removeItem('telegram_user');
    localStorage.removeItem('demo_mode');
    window.location.href = 'demo-login.html';
};
