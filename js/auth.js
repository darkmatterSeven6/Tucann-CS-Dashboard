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
const dashboard = document.getElementById('dashboard');
const loginError = document.getElementById('login-error');
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
    loginForm.style.display = 'none';
    registerForm.style.display = 'block';
});

showLogin.addEventListener('click', (e) => {
    e.preventDefault();
    registerForm.style.display = 'none';
    loginForm.style.display = 'block';
});

// Registration Handler
registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('reg-name').value;
    const email = document.getElementById('reg-email').value;
    const password = document.getElementById('reg-password').value;
    
    loginError.textContent = '';
    
    try {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        
        // Check if this is the first user
        const usersSnap = await getDoc(doc(db, "settings", "stats"));
        let role = 'standard';
        
        if (!usersSnap.exists()) {
            role = 'superuser'; // First user is Owner
            await setDoc(doc(db, "settings", "stats"), { firstUserCreated: true });
        }

        await setDoc(doc(db, "users", cred.user.uid), {
            name: name,
            email: email,
            role: role,
            createdAt: new Date().toISOString()
        });
        
    } catch (error) {
        loginError.textContent = error.message;
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
    dashboard.classList.add('active');
}

function showLogin() {
    dashboard.classList.remove('active');
    loginScreen.classList.add('active');
    loginForm.style.display = 'block';
    registerForm.style.display = 'none';
}
