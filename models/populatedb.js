const { Client } = require("pg");
require("dotenv").config("../.env");

const SQL1 = `
CREATE TABLE IF NOT EXISTS product_types (
    id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    type TEXT NOT NULL
);

INSERT INTO product_types (type)
VALUES
    ('Stocked Product'),
    ('Serialized Product'),
    ('Non-Stocked Product'),
    ('Service');

CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    category TEXT NOT NULL
);

INSERT INTO categories (category)
VALUES
    ('Uncategorized');

CREATE TABLE IF NOT EXISTS items (
    id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    name TEXT NOT NULL,
    type INTEGER,
    sku TEXT,
    barcode TEXT,
    price DECIMAL(10, 2),
    cost DECIMAL(10, 2),
    length REAL,
    width REAL,
    height REAL,
    weight REAL,
    brand TEXT,
    color TEXT,
    material TEXT,
    country_of_origin TEXT,
    return_date DATE,
    image_link TEXT,
    description TEXT,
    FOREIGN KEY (type) REFERENCES product_types(id)
);

CREATE TABLE IF NOT EXISTS item_categories (
    item INTEGER,
    category INTEGER,
    PRIMARY KEY (item, category),
    FOREIGN KEY (item) REFERENCES items(id),
    FOREIGN KEY (category) REFERENCES categories(id)
);
`;

const SQL2 = `
CREATE TABLE IF NOT EXISTS activity_type (
    id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    name TEXT
);

INSERT INTO activity_type (name)
VALUES
    ('Create'),  
    ('Update'),
    ('Delete');

CREATE TABLE IF NOT EXISTS activity_history (
    id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    item_id INTEGER,
    product_type_id INTEGER,
    activity_type_id INTEGER,
    reason TEXT,
    property_name TEXT,
    former_value_text TEXT,
    new_value_text TEXT,
    former_value_number DECIMAL(10, 2),
    new_value_number DECIMAL(10, 2),
    activity_done_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (item_id) REFERENCES items(id),
    FOREIGN KEY (product_type_id) REFERENCES product_types(id),
    FOREIGN KEY (activity_type_id) REFERENCES activity_type(id)
);
`;

const SQL3 = `
ALTER TABLE items
ADD COLUMN quantity INTEGER DEFAULT 0;
`;

async function main() {
	let client;
	try {
		const connectionString =
			process.argv[2] === "PRODUCTION"
				? process.env.PRODUCTION_DB_URL
				: process.env.LOCAL_DB_URL;

		if (!connectionString) {
			throw new Error(
				"Database URL not defined in environment variables.",
			);
		}

		client = new Client({
			connectionString: connectionString,
			ssl:
				process.argv[2] === "PRODUCTION"
					? {
							rejectUnauthorized: false,
						}
					: false,
		});

		await client.connect();
		await client.query(SQL3);
		console.log(`Database setup complete.`);
	} catch (error) {
		console.error(`Error during database setup: ${error}`);
	} finally {
		if (client) {
			try {
				await client.end();
				console.log(`Database connection closed successfully.`);
			} catch (endError) {
				console.error(`Error closing database connection: ${endError}`);
			}
		}
	}
}
main();
