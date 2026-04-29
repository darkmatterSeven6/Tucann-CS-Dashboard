import { initInbox } from './inbox.js';
import { initFacebookSDK, linkFacebookPage } from './facebook.js';
const db = window.db;
import { collection, query, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

async function initApp() {
    // Tab Switching
    const navItems = document.querySelectorAll('.nav-item[data-tab]');
    const tabContents = document.querySelectorAll('.tab-content');

    navItems.forEach(item => {
        item.addEventListener('click', async (e) => {
            e.preventDefault();
            const targetTab = item.getAttribute('data-tab');

            // Update Nav
            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');

            // Update Tabs
            tabContents.forEach(content => {
                content.classList.remove('active');
                if (content.id === `${targetTab}-tab`) {
                    content.classList.add('active');
                }
            });

            // Special Tab Logic
            if (targetTab === 'team') {
                loadTeamMembers();
            }
        });
    });

    // Initialize Inbox
    initInbox();

    // Initialize FB SDK
    try {
        await initFacebookSDK();
        console.log("Facebook SDK Ready");
    } catch (err) {
        console.warn("Facebook SDK failed to load (Check App ID and domain)");
    }

    // Settings logic
    const fbConnectBtn = document.getElementById('fb-connect-btn');
    if (fbConnectBtn) {
        fbConnectBtn.addEventListener('click', async () => {
            try {
                const page = await linkFacebookPage();
                const status = document.getElementById('fb-status');
                status.innerHTML = `<span class="dot green"></span> Connected to <strong>${page.name}</strong>`;
                fbConnectBtn.textContent = 'Change Connection';
            } catch (err) {
                alert("Failed to connect to Facebook: " + err);
            }
        });
    }
}

async function loadTeamMembers() {
    const teamList = document.getElementById('team-list');
    teamList.innerHTML = '<tr><td colspan="4">Loading team...</td></tr>';
    
    try {
        const q = query(collection(db, "users"));
        const querySnapshot = await getDocs(q);
        teamList.innerHTML = '';
        
        querySnapshot.forEach((doc) => {
            const user = doc.data();
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${user.name}</td>
                <td>${user.email}</td>
                <td><span class="role-badge badge-${user.role}">${user.role}</span></td>
                <td>
                    <button class="icon-btn" title="Edit Role"><i class="fas fa-edit"></i></button>
                    <button class="icon-btn" title="Remove"><i class="fas fa-trash"></i></button>
                </td>
            `;
            teamList.appendChild(row);
        });
    } catch (err) {
        console.error("Error loading team:", err);
        teamList.innerHTML = '<tr><td colspan="4">Error loading team members.</td></tr>';
    }
}
