// Inbox UI Logic
import { getFacebookMessages } from './facebook.js';

const threadList = document.getElementById('thread-list');
const chatMessages = document.getElementById('chat-messages');
const messageForm = document.getElementById('message-form');
const messageInput = document.getElementById('message-input');
const currentUserName = document.getElementById('current-user-name');

let activeThreadId = null;

const mockThreads = [
    { id: 't1', name: 'Alex Johnson', preview: 'Is it shipped yet?', time: '5m' },
    { id: 't2', name: 'Sarah Miller', preview: 'Thank you for the help!', time: '1h' },
    { id: 't3', name: 'John Doe', preview: 'How do I return this?', time: '2h' }
];

export function initInbox() {
    renderThreads(mockThreads);
    
    messageForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const text = messageInput.value.trim();
        if (text && activeThreadId) {
            sendMessage(text);
            messageInput.value = '';
        }
    });
}

function renderThreads(threads) {
    threadList.innerHTML = '';
    threads.forEach(thread => {
        const div = document.createElement('div');
        div.className = `thread-item ${activeThreadId === thread.id ? 'active' : ''}`;
        div.innerHTML = `
            <div class="thread-avatar">${thread.name.charAt(0)}</div>
            <div class="thread-info">
                <div class="thread-top">
                    <span class="thread-name">${thread.name}</span>
                    <span class="thread-time">${thread.time}</span>
                </div>
                <div class="thread-preview">${thread.preview}</div>
            </div>
        `;
        div.onclick = () => selectThread(thread);
        threadList.appendChild(div);
    });
}

async function selectThread(thread) {
    activeThreadId = thread.id;
    currentUserName.textContent = thread.name;
    renderThreads(mockThreads); // Update active state
    
    chatMessages.innerHTML = '<div class="loading">Loading messages...</div>';
    
    // Simulate API delay
    setTimeout(() => {
        const messages = [
            { id: 'm1', text: 'Hi, I have a question about my order.', type: 'received' },
            { id: 'm2', text: thread.preview, type: 'received' }
        ];
        renderMessages(messages);
    }, 500);
}

function renderMessages(messages) {
    chatMessages.innerHTML = '';
    messages.forEach(msg => {
        const div = document.createElement('div');
        div.className = `message ${msg.type}`;
        div.textContent = msg.text;
        chatMessages.appendChild(div);
    });
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function sendMessage(text) {
    const msg = { id: Date.now().toString(), text: text, type: 'sent' };
    const messages = Array.from(chatMessages.querySelectorAll('.message')).map(m => ({
        text: m.textContent,
        type: m.classList.contains('sent') ? 'sent' : 'received'
    }));
    messages.push(msg);
    renderMessages(messages);
    
    // In a real app, you would POST to Facebook API here
    console.log(`Sending to FB: ${text}`);
}
