import { auth } from './firebase-config.js';
import { 
    signInWithEmailAndPassword, 
    signOut, 
    onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const loginForm = document.getElementById('login-form');
const loginScreen = document.getElementById('login-screen');
const dashboard = document.getElementById('dashboard');
const loginError = document.getElementById('login-error');
const logoutBtn = document.getElementById('logout-btn');

// Auth State Observer
onAuthStateChanged(auth, (user) => {
    if (user) {
        showDashboard();
    } else {
        showLogin();
    }
});

// Login Handler
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    loginError.textContent = '';
    
    try {
        await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
        loginError.textContent = "Invalid credentials. Please try again.";
        console.error("Login Error:", error);
    }
});

// Logout Handler
logoutBtn.addEventListener('click', () => {
    signOut(auth).catch(err => console.error("Logout Error:", err));
});

function showDashboard() {
    loginScreen.classList.remove('active');
    dashboard.classList.add('active');
}

function showLogin() {
    dashboard.classList.remove('active');
    loginScreen.classList.add('active');
}
