import { initInbox } from './inbox.js';
import { initFacebookSDK, linkFacebookPage } from './facebook.js';
const db = window.db;
import { collection, query, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

async function initApp() {
    // View Switching
    const navItems = document.querySelectorAll('.sidebar-nav li[data-view]');
    const views = document.querySelectorAll('.view');

    navItems.forEach(item => {
        item.addEventListener('click', async (e) => {
            e.preventDefault();
            const targetView = item.getAttribute('data-view');

            // Update Nav
            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');

            // Update Views
            views.forEach(view => {
                view.classList.remove('active');
                if (view.id === `${targetView}-view`) {
                    view.classList.add('active');
                }
            });

            // Special Logic
            if (targetView === 'admin') {
                loadTeamMembers();
            }
        });
    });

    // Admin Console Modal Logic
    const createUserModal = document.getElementById('create-user-modal');
    const openModalBtn = document.getElementById('open-create-user-modal');
    const closeModalBtn = document.querySelector('.close-modal');
    const createUserForm = document.getElementById('create-user-form');

    if (openModalBtn) {
        openModalBtn.addEventListener('click', () => createUserModal.classList.add('active'));
    }

    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', () => createUserModal.classList.remove('active'));
    }

    window.onclick = (event) => {
        if (event.target == createUserModal) createUserModal.classList.remove('active');
    };

    if (createUserForm) {
        createUserForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const submitBtn = createUserForm.querySelector('button[type="submit"]');
            submitBtn.disabled = true;
            submitBtn.textContent = 'Creating...';

            const firstName = document.getElementById('new-user-firstname').value;
            const lastName = document.getElementById('new-user-lastname').value;
            const username = document.getElementById('new-user-username').value;
            const email = document.getElementById('new-user-email').value;
            const password = document.getElementById('new-user-password').value;
            const role = document.getElementById('new-user-role').value;

            try {
                // To create a user without logging out the admin, we use a temporary secondary app instance
                // This is a common pattern for client-side admin tools
                const tempApp = window.firebase.initializeApp(window.firebaseConfig, "tempApp");
                const tempAuth = window.firebase.getAuth(tempApp);
                const { createUserWithEmailAndPassword } = await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js");
                const { doc, setDoc } = await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js");

                const cred = await createUserWithEmailAndPassword(tempAuth, email, password);
                
                await setDoc(doc(db, "users", cred.user.uid), {
                    firstName,
                    lastName,
                    username,
                    email,
                    role,
                    createdAt: new Date().toISOString(),
                    status: 'offline',
                    lastActive: 'Never'
                });

                // Clean up temp app
                await tempAuth.signOut();
                await window.firebase.deleteApp(tempApp);

                alert("Agent account created successfully!");
                createUserModal.classList.remove('active');
                createUserForm.reset();
                loadTeamMembers();
            } catch (err) {
                alert("Error creating agent: " + err.message);
                console.error(err);
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Create Agent Account';
            }
        });
    }

    // Initialize Inbox
    initInbox();

    // Initialize FB SDK
    try {
        await initFacebookSDK();
        console.log("Facebook SDK Ready");
    } catch (err) {
        console.warn("Facebook SDK failed to load (Check App ID and domain)");
    }

    // Check existing FB connection
    try {
        const { doc, getDoc } = await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js");
        const settings = await getDoc(doc(db, "settings", "facebook"));
        const status = document.getElementById('fb-status');
        const fbConnectBtn = document.getElementById('fb-connect-btn');
        
        if (settings.exists()) {
            const data = settings.data();
            if (status) status.innerHTML = `<span class="dot green"></span> Connected to <strong>${data.pageName}</strong>`;
            if (fbConnectBtn) fbConnectBtn.textContent = 'Change Connection';
        }
    } catch (err) {
        console.error("Error checking FB status:", err);
    }

    // Settings logic
    const fbConnectBtn = document.getElementById('fb-connect-btn');
    if (fbConnectBtn) {
        fbConnectBtn.addEventListener('click', async () => {
            try {
                const page = await linkFacebookPage();
                const status = document.getElementById('fb-status');
                if (status) status.innerHTML = `<span class="dot green"></span> Connected to <strong>${page.name}</strong>`;
                fbConnectBtn.textContent = 'Change Connection';
                alert("Facebook Page linked successfully!");
            } catch (err) {
                alert("Failed to connect to Facebook: " + err);
            }
        });
    }
}

async function loadTeamMembers() {
    const teamTableBody = document.getElementById('team-table-body');
    const totalCount = document.getElementById('total-agents-count');
    const onlineCount = document.getElementById('online-agents-count');

    if (!teamTableBody) return;
    
    teamTableBody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 2rem;">Loading team...</td></tr>';
    
    try {
        const q = query(collection(db, "users"));
        const querySnapshot = await getDocs(q);
        teamTableBody.innerHTML = '';
        
        let online = 0;
        totalCount.textContent = querySnapshot.size;

        querySnapshot.forEach((doc) => {
            const user = doc.data();
            const row = document.createElement('tr');
            
            if (user.status === 'online') online++;
            
            row.innerHTML = `
                <td>
                    <div style="font-weight: 600;">${user.firstName} ${user.lastName}</div>
                    <div style="font-size: 0.8rem; color: var(--text-secondary);">@${user.username}</div>
                </td>
                <td>${user.email}</td>
                <td><span class="role-badge badge-${user.role}">${user.role}</span></td>
                <td>
                    <span class="status-indicator">
                        <span class="dot ${user.status === 'online' ? 'green' : 'red'}"></span>
                        ${user.status || 'offline'}
                    </span>
                </td>
                <td style="font-size: 0.85rem; color: var(--text-secondary);">${user.lastActive || 'N/A'}</td>
                <td>
                    <div style="display: flex; gap: 8px;">
                        <button class="btn-reset-pw" data-email="${user.email}" title="Reset Password" style="background: none; border: none; color: var(--accent-color); cursor: pointer;">
                            <i class="fas fa-key"></i>
                        </button>
                        <button class="btn-edit-user" data-uid="${doc.id}" title="Edit User" style="background: none; border: none; color: var(--text-secondary); cursor: pointer;">
                            <i class="fas fa-edit"></i>
                        </button>
                    </div>
                </td>
            `;
            teamTableBody.appendChild(row);
        });

        onlineCount.textContent = online;

        // Reset Password Event Listeners
        document.querySelectorAll('.btn-reset-pw').forEach(btn => {
            btn.addEventListener('click', async () => {
                const email = btn.getAttribute('data-email');
                if (confirm(`Send a password reset email to ${email}?`)) {
                    try {
                        const { getAuth, sendPasswordResetEmail } = await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js");
                        const auth = getAuth();
                        await sendPasswordResetEmail(auth, email);
                        alert("Reset email sent!");
                    } catch (err) {
                        alert("Error: " + err.message);
                    }
                }
            });
        });

    } catch (err) {
        console.error("Error loading team:", err);
        teamTableBody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: var(--error-color);">Error loading team members.</td></tr>';
    }
}
