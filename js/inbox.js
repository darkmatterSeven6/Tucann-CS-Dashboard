// Inbox UI Logic
import { getFacebookConversations, getFacebookMessages, sendFacebookMessage } from './facebook.js';

const threadList = document.getElementById('thread-list');
const chatMessages = document.getElementById('chat-messages');
const messageForm = document.getElementById('message-form');
const messageInput = document.getElementById('message-input');
const currentUserName = document.getElementById('current-user-name');
const refreshBtn = document.getElementById('refresh-convos');

let activeThreadId = null;
let allThreads = [];

export function initInbox() {
    loadConversations();
    
    if (refreshBtn) {
        refreshBtn.addEventListener('click', loadConversations);
    }

    if (messageForm) {
        messageForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const text = messageInput.value.trim();
            if (text && activeThreadId) {
                try {
                    await sendFacebookMessage(activeThreadId, text);
                    const sentMsg = { id: Date.now(), message: text, from: { id: 'me' } };
                    messageInput.value = '';
                    appendMessage(sentMsg);
                } catch (err) {
                    alert("Failed to send message: " + err.message);
                }
            }
        });
    }
}

async function loadConversations() {
    if (threadList) threadList.innerHTML = '<div class="loading-shimmer"></div>';
    
    try {
        allThreads = await getFacebookConversations();
        if (allThreads.length === 0) {
            threadList.innerHTML = '<div style="padding: 2rem; text-align: center; color: var(--text-secondary);">No conversations found. Connect a Page in Settings.</div>';
        } else {
            renderThreads(allThreads);
        }
    } catch (err) {
        console.error("Load Conversations Error:", err);
        threadList.innerHTML = '<div style="padding: 2rem; text-align: center; color: var(--error-color);">Error loading conversations.</div>';
    }
}

function renderThreads(threads) {
    threadList.innerHTML = '';
    threads.forEach(thread => {
        const participant = thread.participants?.data[0] || { name: 'Unknown' };
        const lastMsg = thread.messages?.data[0]?.message || 'No messages';
        const time = new Date(thread.updated_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        const div = document.createElement('div');
        div.className = `thread-item ${activeThreadId === thread.id ? 'active' : ''}`;
        div.innerHTML = `
            <div class="thread-avatar">${participant.name.charAt(0)}</div>
            <div class="thread-info">
                <div class="thread-top">
                    <span class="thread-name">${participant.name}</span>
                    <span class="thread-time">${time}</span>
                </div>
                <div class="thread-preview">${lastMsg}</div>
            </div>
        `;
        div.onclick = () => selectThread(thread);
        threadList.appendChild(div);
    });
}

async function selectThread(thread) {
    activeThreadId = thread.id;
    const participant = thread.participants?.data[0] || { name: 'Unknown' };
    currentUserName.textContent = participant.name;
    renderThreads(allThreads); // Update active state
    
    chatMessages.innerHTML = '<div class="loading-shimmer"></div>';
    
    try {
        const messages = await getFacebookMessages(thread.id);
        renderMessages(messages);
    } catch (err) {
        chatMessages.innerHTML = '<div class="error">Error loading messages.</div>';
    }
}

function renderMessages(messages) {
    chatMessages.innerHTML = '';
    messages.forEach(msg => {
        appendMessage(msg);
    });
}

function appendMessage(msg) {
    const isFromMe = msg.from?.id === 'me' || (activeThreadId && msg.from?.id !== activeThreadId); 
    const div = document.createElement('div');
    div.className = `message ${isFromMe ? 'sent' : 'received'}`;
    div.textContent = msg.message;
    chatMessages.appendChild(div);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}
