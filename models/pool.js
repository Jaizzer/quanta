const { Pool } = require("pg");
require("dotenv").config();

let pool;
try {
	const connectionString =
		process.argv[2] === "PRODUCTION"
			? process.env.PRODUCTION_DB_URL
			: process.env.LOCAL_DB_URL;

	if (!connectionString) {
		throw new Error(
			"Database connection string not found in environment variables.",
		);
	}

	pool = new Pool({
		connectionString: connectionString,
		ssl:
			process.argv[2] === "PRODUCTION"
				? {
						rejectUnauthorized: false,
					}
				: false,
	});

	console.log("Database pool created successfully.");
} catch (error) {
	console.error(`Error creating database pool: ${error}`);
	process.exit(1);
}

module.exports = pool;
