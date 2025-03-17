const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Sample employee data
const employees = [
    {
        id: 1,
        name: "John Doe",
        experience: "5 Years",
        rating: "⭐⭐⭐⭐⭐ (5/5)",
        image: "image/help1.jpg"
    },
    {
        id: 2,
        name: "Jane Smith",
        experience: "3 Years",
        rating: "⭐⭐⭐⭐ (4/5)",
        image: "image/help2.jpg"
    },
    {
        id: 3,
        name: "Mike Johnson",
        experience: "8 Years",
        rating: "⭐⭐⭐⭐⭐ (5/5)",
        image: "image/help3.jpg"
    }
];

// Endpoint to get employee data
app.get('/api/employees', (req, res) => {
    res.json(employees);
});

// Endpoint to handle booking
app.post('/api/book', (req, res) => {
    const { employeeId, customerName, date } = req.body;
    // Here you would typically save the booking to a database
    console.log(`Booking received: Employee ID: ${employeeId}, Customer Name: ${customerName}, Date: ${date}`);
    res.status(201).json({ message: 'Booking successful!' });
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

const WebSocket = require('ws');
const wsss = new WebSocket.Server({ port: 3000 });

let useers = [];
let groups = ['General']; // Default group

wss.on('connection', (wss) => {
    let userName;
    let location;

    // Handle incoming messages from clients
    ws.on('message', (data) => {
        const parsedData = JSON.parse(data);

        if (parsedData.type === 'join') {
            userName = parsedData.username;
            location = parsedData.location;
            users.push({ ws, username: userName, location });
            broadcast({ type: 'updateUsers', users: users.map(user => user.username) });
        } else if (parsedData.type === 'message') {
            broadcast({
                type: 'message',
                message: parsedData.message,
                sender: userName,
                group: parsedData.group,
            });
        } else if (parsedData.type === 'createGroup') {
            groups.push(parsedData.groupName);
            broadcast({ type: 'updateGroups', groups });
        }
    });

    // Broadcast a message to all users
    function broadcast(message, exclude = null) {
        users.forEach(user => {
            if (user.wss !== exclude) {
                user.ws.send(JSON.stringify(message));
            }
        });
    }

    wss.on('close', () => {
        users = users.filter(user => user.ws !== ws);
        broadcast({ type: 'updateUsers', users: users.map(user => user.username) });
    });
});
const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 3000 });

let users = [];

wss.on('connection', (ws) => {
    let username;

    // Handle incoming messages
    ws.on('message', (data) => {
        const parsedData = JSON.parse(data);

        if (parsedData.type === 'requestItem') {
            // Broadcast the new item request to all users
            broadcast({
                type: 'newItemRequest',
                itemName: parsedData.itemName,
                itemLocation: parsedData.itemLocation
            });
        } else if (parsedData.type === 'join') {
            // Add user to the list
            username = parsedData.username;
            users.push({ ws, username });
        }
    });

    // Broadcast a message to all connected users
    function broadcast(message) {
        users.forEach(user => {
            user.ws.send(JSON.stringify(message));
        });
    }

    // Remove user when they disconnect
    ws.on('close', () => {
        users = users.filter(user => user.ws !== ws);
    });
});

console.log('WebSocket server running on ws://localhost:3000');
