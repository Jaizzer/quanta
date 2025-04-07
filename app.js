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
		const baseUrl =
			process.argv[2] === "PRODUCTION"
				? process.env.PRODUCTION_URL
				: `http://localhost:${PORT}`;
		console.log(`Server is listening on: ${baseUrl}`);
	}
});

// Encode data into key-value pairs
app.use(express.urlencoded({ extended: true }));

// Serve public files
const path = require("node:path");
app.use(express.static(path.join(__dirname, "public")));

// Setup views
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Root router
const rootRouter = require("./routes/rootRouter");
app.use("/", rootRouter);

// Items router
const itemsRouter = require("./routes/itemsRouter.js");
app.use("/items", itemsRouter);

// Inventory Summary router
const inventorySummaryRouter = require("./routes/inventorySummaryRouter.js");
app.use("/inventory-summary", inventorySummaryRouter);

// Search router
const searchRouter = require("./routes/searchRouter.js");
app.use("/search", searchRouter);

// Transactions router
const transactionsRouter = require("./routes/transactionsRouter.js");
app.use("/transactions", transactionsRouter);

// Notifications router
const notificationsRouter = require("./routes/notificationsRouter.js");
app.use("/notifications", notificationsRouter);

// Menu router
const menuRouter = require("./routes/menuRouter.js");
app.use("/menu", menuRouter);

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
