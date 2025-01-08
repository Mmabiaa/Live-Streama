// streama-backend/server.js
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const { users } = require('./database');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    }
}); 

const otps = {}; // Store OTPs temporarily
const meetings = []; // Store meetings temporarily

// Middleware
app.use(cors());
app.use(bodyParser.json()); // For parsing application/json

// Configure nodemailer
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'isbbydior@gmail.com',
        pass: 'your-app-password' // Use your app password
    }
});

// User Registration
app.post('/register', async (req, res) => {
    const { email, password } = req.body;
    const existingUser = users.find(user => user.email === email);

    if (existingUser) {
        return res.status(400).send('User already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    users.push({ email, password: hashedPassword });

    // Generate OTP
    const otp = crypto.randomInt(100000, 999999).toString();
    otps[email] = otp;

    // Send OTP via email
    const mailOptions = {
        from: 'isbbydior@gmail.com',
        to: email,
        subject: 'Your OTP Code',
        text: `Your OTP code is ${otp}`
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            return res.status(500).send('Error sending OTP');
        }
        res.status(201).send('User registered. OTP sent to email.');
    });
});

// Verify OTP
app.post('/verify-otp', (req, res) => {
    const { email, otp } = req.body;
    if (otps[email] && otps[email] === otp) {
        delete otps[email]; // Remove OTP after verification
        res.status(200).send('OTP verified successfully');
    } else {
        res.status(400).send('Invalid OTP');
    }
});

// User Login
app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    const user = users.find(user => user.email === email);

    if (!user) {
        return res.status(401).send('Invalid credentials');
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (isValid) {
        res.status(200).send('Login successful');
    } else {
        res.status(401).send('Invalid credentials');
    }
});

// Create Meeting
app.post('/create-meeting', (req, res) => {
    const { meetingDetails, password } = req.body;
    const meetingId = crypto.randomBytes(3).toString('hex'); // Generate a random meeting ID
    meetings.push({ meetingId, meetingDetails, password });
    res.status(200).send({ message: 'Meeting created successfully', meetingId });
});

// Get Meeting Details
app.get('/meetings', (req, res) => {
    res.status(200).send(meetings);
});

// Contact Us
app.post('/contact', (req, res) => {
    const { name, email, message } = req.body;

    // Send contact message to the company's email
    const mailOptions = {
        from: email,
        to: 'isbbydior@gmail.com',
        subject: `Contact Message from ${name}`,
        text: message
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            return res.status(500).send('Error sending message');
        }
        res.status(200).send('Message sent successfully');
    });
});

// Socket.io setup for real-time communication
io.on('connection', (socket) => {
    console.log('New client connected');
    
    socket.on('disconnect', () => {
        console.log('Client disconnected');
    });

    socket.on('join-meeting', (meetingId) => {
        socket.join(meetingId);
        console.log(`User joined meeting: ${meetingId}`);
    });

    socket.on('leave-meeting', (meetingId) => {
        socket.leave(meetingId);
        console.log(`User left meeting: ${meetingId}`);
    });
});

// Start the server
server.listen(4000, () => {
    console.log('Server is running on port 4000');
});
