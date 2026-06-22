const express = require('express');
const path = require('path');
const app = express();
const PORT = 3000;

// Middleware to parse incoming form data and json payloads
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Serve all static frontend files from current directory
app.use(express.static(path.join(__dirname)));

// Handle the contact form submission endpoint anonymously
app.post('/api/transmit', (req, res) => {

	const { name, email, message } = req.body
	
	// Prints straight to your secure debian server console
	console.log(`\n[ALERT] Incoming transmission intercepted!`);
	console.log(`From: ${name} (${email})`);
	console.log(`Message: ${message}\n`);

	// Send an anonymous, secure response back to browser
	res.status(200).json({status: 'success', message: 'Transmission encrypted and routed safely.'});
});

// Start the server engine
app.listen(PORT, () => {
	console.log(`[SYSTEM] Hacker's Hangout backend online and listening on port ${PORT}`);
});
