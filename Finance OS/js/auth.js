// Simulated Authentication for Firebase
// Since we don't have real API keys provided by user yet, we mock the Firebase Auth logic
// When real keys are added to index.html, this will work seamlessly.

class AuthManager {
    constructor() {
        this.user = null;
        this.init();
    }

    init() {
        // Mock checking localStorage for a session to skip login
        const savedUser = localStorage.getItem('finance_user');
        if(savedUser) {
            this.user = JSON.parse(savedUser);
            this.showApp();
        }

        // Setup Event Listeners
        const btnGoogle = document.getElementById('btn-google-login');
        const loginForm = document.getElementById('login-form');
        const btnLogout = document.getElementById('btn-logout');
        const btnLogoutMobile = document.getElementById('mobile-logout-btn');

        if(btnGoogle) {
            btnGoogle.addEventListener('click', () => this.mockGoogleLogin());
        }

        if(loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const email = document.getElementById('auth-email').value;
                this.mockEmailLogin(email);
            });
        }

        if(btnLogout) {
            btnLogout.addEventListener('click', () => this.logout());
        }
        
        if(btnLogoutMobile) {
            btnLogoutMobile.addEventListener('click', () => {
                if(confirm('Are you sure you want to log out?')) {
                    this.logout();
                }
            });
        }
    }

    mockGoogleLogin() {
        // Simulate network delay
        setTimeout(() => {
            this.user = { name: 'Google User', email: 'user@gmail.com' };
            localStorage.setItem('finance_user', JSON.stringify(this.user));
            this.showApp();
        }, 800);
    }

    mockEmailLogin(email) {
        // Extract name from email
        const name = email.split('@')[0];
        setTimeout(() => {
            this.user = { name: name, email: email };
            localStorage.setItem('finance_user', JSON.stringify(this.user));
            this.showApp();
        }, 500);
    }

    showApp() {
        document.getElementById('auth-view').classList.add('hidden');
        document.getElementById('main-app').classList.remove('hidden');
        document.getElementById('display-name').innerText = this.user.name;
        
        // Initialize app if not already done, otherwise just refresh data
        if(!window.app) {
            if(window.initApp) window.initApp();
        } else {
            window.app.loadData().then(() => window.app.renderDashboard());
        }
    }

    logout() {
        localStorage.removeItem('finance_user');
        this.user = null;
        document.getElementById('main-app').classList.add('hidden');
        document.getElementById('auth-view').classList.remove('hidden');
    }
}

// Init auth manager
document.addEventListener('DOMContentLoaded', () => {
    window.auth = new AuthManager();
});
