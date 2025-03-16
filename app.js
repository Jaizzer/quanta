const express = require("express");
const dotenv = require("dotenv");

// Load environment variables
dotenv.config();

// Setup the server
const app = express();
const PORT = process.env.PORT || 5000;
app.listen(PORT, (error) => {
	if (error) {
		console.error(`Failed to start server: ${error}`);
	} else {
		console.log(`Server is listening on: http://localhost:${PORT}`);
	}
});

// Error handling for uncaught exceptions
process.on("uncaughtException", (error) => {
	console.error(`Uncaught exception: ${error}`);
	process.exit(1);
});
