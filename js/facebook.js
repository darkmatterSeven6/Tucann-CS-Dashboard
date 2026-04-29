// Facebook Graph API Integration
const db = window.db;
import { doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const FB_SDK_URL = 'https://connect.facebook.net/en_US/sdk.js';

export async function initFacebookSDK() {
    return new Promise((resolve) => {
        window.fbAsyncInit = function() {
            FB.init({
                appId      : 'YOUR_FB_APP_ID', // Replace with your FB App ID
                cookie     : true,
                xfbml      : true,
                version    : 'v18.0'
            });
            resolve();
        };

        (function(d, s, id) {
            var js, fjs = d.getElementsByTagName(s)[0];
            if (d.getElementById(id)) return;
            js = d.createElement(s); js.id = id;
            js.src = FB_SDK_URL;
            fjs.parentNode.insertBefore(js, fjs);
        }(document, 'script', 'facebook-jssdk'));
    });
}

// Function to link a Facebook Page (Admin only)
export async function linkFacebookPage() {
    return new Promise((resolve, reject) => {
        FB.login((response) => {
            if (response.authResponse) {
                FB.api('/me/accounts', (pagesResponse) => {
                    if (pagesResponse && !pagesResponse.error) {
                        const page = pagesResponse.data[0];
                        if (page) {
                            savePageToken(page.id, page.access_token, page.name);
                            resolve(page);
                        } else {
                            reject('No pages found. Make sure you are a Page Admin.');
                        }
                    } else {
                        reject(pagesResponse.error.message);
                    }
                });
            } else {
                reject('User cancelled login or did not fully authorize.');
            }
        }, {scope: 'pages_messaging,pages_show_list,pages_manage_metadata,public_profile,email'});
    });
}

export async function getFacebookConversations() {
    const settings = await getDoc(doc(db, "settings", "facebook"));
    if (!settings.exists()) return [];
    
    const { pageId, accessToken } = settings.data();
    
    return new Promise((resolve) => {
        FB.api(`/${pageId}/conversations`, { access_token: accessToken, fields: 'id,participants,updated_time,unread_count,messages.limit(1){message,from,created_time}' }, (response) => {
            if (response && !response.error) {
                resolve(response.data);
            } else {
                console.error("FB Conversations Error:", response.error);
                resolve([]);
            }
        });
    });
}

export async function getFacebookMessages(conversationId) {
    const settings = await getDoc(doc(db, "settings", "facebook"));
    if (!settings.exists()) return [];
    
    const { accessToken } = settings.data();
    
    return new Promise((resolve) => {
        FB.api(`/${conversationId}/messages`, { access_token: accessToken, fields: 'id,message,from,created_time' }, (response) => {
            if (response && !response.error) {
                // The API returns messages in reverse order (newest first for some endpoints)
                // We'll normalize it for the UI
                resolve(response.data.reverse());
            } else {
                console.error("FB Messages Error:", response.error);
                resolve([]);
            }
        });
    });
}

export async function sendFacebookMessage(conversationId, text) {
    const settings = await getDoc(doc(db, "settings", "facebook"));
    if (!settings.exists()) return;
    
    const { accessToken } = settings.data();
    
    return new Promise((resolve, reject) => {
        FB.api(`/${conversationId}/messages`, 'POST', {
            access_token: accessToken,
            message: text
        }, (response) => {
            if (response && !response.error) {
                resolve(response);
            } else {
                console.error("FB Send Error:", response.error);
                reject(response.error);
            }
        });
    });
}
