import { initInbox } from './inbox.js';
import { initFacebookSDK, linkFacebookPage } from './facebook.js';

document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

async function initApp() {
    // Tab Switching
    const navItems = document.querySelectorAll('.nav-item[data-tab]');
    const tabContents = document.querySelectorAll('.tab-content');

    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
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
