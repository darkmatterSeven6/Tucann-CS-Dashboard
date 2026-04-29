// Facebook Graph API Integration
import { db } from './firebase-config.js';
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
                const userAccessToken = response.authResponse.accessToken;
                
                // 1. Get list of pages the user manages
                FB.api('/me/accounts', (pagesResponse) => {
                    if (pagesResponse && !pagesResponse.error) {
                        // For simplicity, we take the first page. 
                        // In a real app, you'd show a picker.
                        const page = pagesResponse.data[0];
                        if (page) {
                            savePageToken(page.id, page.access_token, page.name);
                            resolve(page);
                        } else {
                            reject('No pages found');
                        }
                    }
                });
            } else {
                reject('User cancelled login or did not fully authorize.');
            }
        }, {scope: 'pages_messaging,pages_show_list,pages_manage_metadata'});
    });
}

async function savePageToken(pageId, token, name) {
    try {
        await setDoc(doc(db, "settings", "facebook"), {
            pageId: pageId,
            accessToken: token,
            pageName: name,
            updatedAt: new Date().toISOString()
        });
        console.log("Facebook Page linked successfully!");
    } catch (error) {
        console.error("Error saving token:", error);
    }
}

export async function getFacebookMessages(threadId) {
    // This would typically use the stored Page Access Token
    // For the UI demo, we'll return mock data if not connected
    const settings = await getDoc(doc(db, "settings", "facebook"));
    if (!settings.exists()) {
        return getMockMessages();
    }
    
    const token = settings.data().accessToken;
    // Real API call:
    // return fetch(`https://graph.facebook.com/v18.0/${threadId}/messages?access_token=${token}`)
    //     .then(res => res.json());
}

function getMockMessages() {
    return [
        { id: '1', text: 'Hi, I have a question about my order.', from: 'customer', time: '10:30 AM' },
        { id: '2', text: 'Hello! I would be happy to help. What is your order number?', from: 'rep', time: '10:32 AM' },
        { id: '3', text: 'It is #4521. Is it shipped yet?', from: 'customer', time: '10:35 AM' }
    ];
}
