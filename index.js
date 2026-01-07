class AuthManager {
    constructor() {
        this.CLIENT_ID = '1009720948792-aad0bk7j1059vekntm79katmed40ihii.apps.googleusercontent.com';
        this.init();
    }

    init() {
        window.onload = () => {
            this.bindEvents();
            this.initializeGoogle();
        };
    }

    bindEvents() {
        document.getElementById('dashboardBtn').onclick = () => this.navigateToDashboard();
        document.getElementById('signOutBtn').onclick = () => this.handleSignOut();
        document.getElementById('languageSelect').onchange = (e) => this.updateLanguage(e.target.value);
    }

    initializeGoogle() {
        if (typeof google === 'undefined') {
            setTimeout(() => this.initializeGoogle(), 500);
            return;
        }

        google.accounts.id.initialize({
            client_id: this.CLIENT_ID,
            callback: (res) => this.handleCredentialResponse(res),
            auto_select: false
        });

        this.renderButton();
        this.checkExistingSession();
    }

    renderButton() {
        const btnContainer = document.getElementById('googleSignInBtn');
        if (btnContainer) {
            google.accounts.id.renderButton(btnContainer, {
                theme: 'filled_blue',
                size: 'large',
                width: btnContainer.offsetWidth,
                shape: 'pill'
            });
        }
    }

    handleCredentialResponse(response) {
        const payload = this.decodeJwt(response.credential);
        const userData = {
            name: payload.name,
            email: payload.email,
            picture: payload.picture,
            locale: payload.locale || 'en'
        };

        localStorage.setItem('userData', JSON.stringify(userData));
        this.updateUI(userData);
        this.notify('Successfully signed in!', 'success');
    }

    checkExistingSession() {
        const savedUser = localStorage.getItem('userData');
        if (savedUser) {
            this.updateUI(JSON.parse(savedUser));
        }
    }

    updateUI(user) {
        document.getElementById('loggedOutView').classList.add('hidden');
        document.getElementById('loggedInView').classList.remove('hidden');

        document.getElementById('userName').textContent = user.name;
        document.getElementById('userEmail').textContent = user.email;
        document.getElementById('userPicture').src = user.picture;
    }

    handleSignOut() {
        localStorage.removeItem('userData');
        google.accounts.id.disableAutoSelect();
        location.reload();
    }

    navigateToDashboard() {
        window.location.href = 'dashboard.html';
    }

    decodeJwt(token) {
        try {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            return JSON.parse(decodeURIComponent(atob(base64).split('').map(c => 
                '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')));
        } catch (e) {
            console.error("JWT Decode Failed", e);
            return {};
        }
    }

    notify(msg, type) {
        const container = document.getElementById('notification-container');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = msg;
        container.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    }

    updateLanguage(lang) {
        const user = JSON.parse(localStorage.getItem('userData') || '{}');
        user.locale = lang;
        localStorage.setItem('userData', JSON.stringify(user));
    }
}

new AuthManager();

// Function to handle Signing Out
function signOut() {
    localStorage.removeItem('userData');
    
    if (window.google && google.accounts.id) {
        google.accounts.id.disableAutoSelect();
    }

    document.getElementById('loggedInView').classList.add('hidden');
    document.getElementById('loggedOutView').classList.remove('hidden');

    if (window.location.pathname.includes('dashboard.html')) {
        window.location.href = 'index.html';
    }
}

document.getElementById('signOutBtn').addEventListener('click', signOut);