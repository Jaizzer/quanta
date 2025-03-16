// Load environment variables
const dotenv = require("dotenv");
dotenv.config();

// Setup the server
const express = require("express");
const app = express();
const PORT = process.env.PORT || 5000;
app.listen(PORT, (error) => {
	if (error) {
		console.error(`Failed to start server: ${error}`);
	} else {
		console.log(`Server is listening on: http://localhost:${PORT}`);
	}
});

// Setup views
const path = require("node:path");
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Error handling for uncaught exceptions
process.on("uncaughtException", (error) => {
	console.error(`Uncaught exception: ${error}`);
	process.exit(1);
});
