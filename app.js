// Connect to WebSocket server
const socket = new WebSocket('ws://localhost:3000');

// DOM Elements
const chatWindow = document.getElementById('chat-window');
const messageInput = document.getElementById('message-input');
const sendBtn = document.getElementById('send-btn');
const userList = document.getElementById('user-list');
const suggestions = document.getElementById('suggestions');
const typingIndicator = document.getElementById('typing-indicator');
const chatHeader = document.getElementById('chat-header');
const userNameDisplay = document.getElementById('user-name');

// User Info
let username = prompt("Enter your name:");
let currentChat = 'regional'; // Default chat is regional
while (!username) {
    username = prompt("Name is required to join the chat!");
}
socket.onopen = () => {
    socket.send(JSON.stringify({ type: 'join', username }));
    userNameDisplay.textContent = `Logged in as: ${username}`;
};

// Append messages to chat
function appendMessage(message, sender = 'Stranger', isOwn = false) {
    const msgDiv = document.createElement('div');
    msgDiv.className = `p-2 rounded my-1 ${isOwn ? 'bg-blue-200 text-right' : 'bg-gray-200'}`;
    msgDiv.innerHTML = `<strong>${sender}:</strong> ${message} <span class="text-xs text-gray-500">${new Date().toLocaleTimeString()}</span>`;
    chatWindow.appendChild(msgDiv);
    chatWindow.scrollTop = chatWindow.scrollHeight;
}

// Update user list
function updateUserList(users) {
    userList.innerHTML = '';
    users.forEach(user => {
        const userDiv = document.createElement('li');
        userDiv.className = 'p-2 bg-blue-700 rounded hover:bg-blue-800 cursor-pointer';
        userDiv.textContent = user;
        userDiv.addEventListener('click', () => initiatePrivateChat(user));
        userList.appendChild(userDiv);
    });
}

// Add suggested users
function addSuggestions() {
    const suggestedUsers = ['Alice', 'Bob', 'Charlie', 'Dave', 'Eve'];
    suggestions.innerHTML = '';
    suggestedUsers.forEach(user => {
        const userDiv = document.createElement('li');
        userDiv.className = 'p-2 bg-blue-500 rounded hover:bg-blue-600 cursor-pointer';
        userDiv.textContent = user;
        userDiv.addEventListener('click', () => initiatePrivateChat(user));
        suggestions.appendChild(userDiv);
    });
}

// Initiate private chat
function initiatePrivateChat(user) {
    currentChat = user;
    chatHeader.textContent = `Chat with ${user}`;
    chatWindow.innerHTML = ''; // Clear the chat window for private chat
}

// Send message
sendBtn.addEventListener('click', () => {
    const message = messageInput.value.trim();
    if (message) {
        socket.send(JSON.stringify({ type: 'message', message, chat: currentChat }));
        appendMessage(message, 'You', true);
        messageInput.value = '';
    }
});

// Typing indicator
messageInput.addEventListener('input', () => {
    socket.send(JSON.stringify({ type: 'typing', chat: currentChat }));
});

// Receive messages
socket.onmessage = (event) => {
    const data = JSON.parse(event.data);

    if (data.type === 'message' && data.chat === currentChat) {
        appendMessage(data.message, data.sender);
    } else if (data.type === 'updateUsers') {
        updateUserList(data.users);
    } else if (data.type === 'typing' && data.chat === currentChat) {
        typingIndicator.classList.remove('hidden');
        setTimeout(() => typingIndicator.classList.add('hidden'), 1000);
    }
};

// Add initial suggestions
addSuggestions();
