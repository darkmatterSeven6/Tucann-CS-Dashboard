import { auth, db } from './firebase-config.js';
import { 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword,
    signOut, 
    onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const loginScreen = document.getElementById('login-screen');
const registerScreen = document.getElementById('register-screen');
const dashboard = document.getElementById('main-dashboard');
const loginError = document.getElementById('login-error');
const registerError = document.getElementById('register-error');
const logoutBtn = document.getElementById('logout-btn');

const showRegister = document.getElementById('show-register');
const showLogin = document.getElementById('show-login');

export let currentUserRole = 'standard';

// Auth State Observer
onAuthStateChanged(auth, async (user) => {
    if (user) {
        await fetchUserRole(user.uid);
        showDashboard();
        applyRoleRestrictions();
    } else {
        showLogin();
    }
});

async function fetchUserRole(uid) {
    try {
        const userDoc = await getDoc(doc(db, "users", uid));
        if (userDoc.exists()) {
            currentUserRole = userDoc.data().role;
        } else {
            // First user becomes superuser (Owner)
            // Note: This is a simple logic for setup. In production, 
            // you'd set this manually in the console for the first user.
            currentUserRole = 'standard';
        }
    } catch (err) {
        console.error("Error fetching role:", err);
    }
}

function applyRoleRestrictions() {
    const restrictedItems = document.querySelectorAll('.role-restricted');
    const roles = {
        'standard': 0,
        'admin': 1,
        'superuser': 2
    };

    restrictedItems.forEach(item => {
        const requiredRole = item.getAttribute('data-role');
        if (roles[currentUserRole] < roles[requiredRole]) {
            item.classList.add('hidden');
        } else {
            item.classList.remove('hidden');
        }
    });
}

// Toggle Forms
showRegister.addEventListener('click', (e) => {
    e.preventDefault();
    loginScreen.classList.remove('active');
    registerScreen.classList.add('active');
});

showLogin.addEventListener('click', (e) => {
    e.preventDefault();
    registerScreen.classList.remove('active');
    loginScreen.classList.add('active');
});

// Registration Handler
registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const firstName = document.getElementById('register-firstname').value;
    const lastName = document.getElementById('register-lastname').value;
    const username = document.getElementById('register-username').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    
    if (registerError) registerError.textContent = '';
    
    try {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        
        // Check if this is the first user
        const statsRef = doc(db, "settings", "stats");
        const statsSnap = await getDoc(statsRef);
        
        let role = 'standard';
        
        if (!statsSnap.exists()) {
            role = 'superuser'; // First user is Owner
            await setDoc(statsRef, { firstUserCreated: true });
        }

        await setDoc(doc(db, "users", cred.user.uid), {
            firstName: firstName,
            lastName: lastName,
            username: username,
            email: email,
            role: role,
            createdAt: new Date().toISOString()
        });
        
    } catch (error) {
        if (registerError) registerError.textContent = error.message;
        console.error("Registration Error:", error);
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
    registerScreen.classList.remove('active');
    dashboard.classList.add('active');
}

function showLogin() {
    dashboard.classList.remove('active');
    registerScreen.classList.remove('active');
    loginScreen.classList.add('active');
}
