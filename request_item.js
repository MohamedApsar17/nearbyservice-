// WebSocket connection to the server
const socket = new WebSocket('ws://localhost:3000');

// DOM elements
const requestForm = document.getElementById('request-form');
const itemNameInput = document.getElementById('item-name');
const itemLocationInput = document.getElementById('item-location');

// When the user submits the request form
requestForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const itemName = itemNameInput.value.trim();
    const itemLocation = itemLocationInput.value.trim();

    if (itemName && itemLocation) {
        // Send the request item event via WebSocket
        socket.send(JSON.stringify({
            type: 'requestItem',
            itemName,
            itemLocation
        }));

        // Reset the form
        itemNameInput.value = '';
        itemLocationInput.value = '';
    }
});

// Listen for notifications of new requests
socket.onmessage = (event) => {
    const data = JSON.parse(event.data);

    if (data.type === 'newItemRequest') {
        alert(`New item requested: ${data.itemName} at ${data.itemLocation}`);
    }
};

// WebSocket connection open event
socket.onopen = () => {
    console.log('Connected to WebSocket server');
};
