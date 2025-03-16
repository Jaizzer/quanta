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

// Serve public files
const path = require("node:path");
app.use(express.static(path.join(__dirname, "public")));

// Setup views
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Main error-handling middleware
app.use((err, req, res, next) => {
	console.error(err.stack);
	const statusCode = err.statusCode || err.status || 500;
	const message = err.message || "Internal server error";
	res.status(statusCode).json({ error: { message } });
});

// Error handling for uncaught exceptions
process.on("uncaughtException", (error) => {
	console.error(`Uncaught exception: ${error}`);
	process.exit(1);
});
