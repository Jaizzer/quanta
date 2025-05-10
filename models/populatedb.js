const { Client } = require("pg");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.resolve(__dirname, "../.env") });

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

CREATE TABLE IF NOT EXISTS tags (
    id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    tag TEXT NOT NULL
);

INSERT INTO tags (tag)
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
    FOREIGN KEY (type) REFERENCES product_types(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS item_tags (
    item INTEGER,
    tag INTEGER,
    PRIMARY KEY (item, tag),
    FOREIGN KEY (item) REFERENCES items(id) ON DELETE CASCADE,
    FOREIGN KEY (tag) REFERENCES tags(id) ON DELETE CASCADE
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
    FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE,
    FOREIGN KEY (product_type_id) REFERENCES product_types(id) ON DELETE CASCADE,
    FOREIGN KEY (activity_type_id) REFERENCES activity_type(id) ON DELETE CASCADE
);
`;

const SQL3 = `
ALTER TABLE items
ADD COLUMN quantity INTEGER DEFAULT 0;
`;

const SQL4 = `
ALTER TABLE items
ADD COLUMN notify BOOLEAN DEFAULT false;
`;

const SQL5 = `
CREATE TABLE IF NOT EXISTS attributes (
    id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    item_id INTEGER,
    name TEXT,
    FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS options (
    id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    attribute_id INTEGER,
    item_id INTEGER,
    name TEXT,
    price DECIMAL(10, 2),
    quantity DECIMAL(10, 2),
    FOREIGN KEY (attribute_id) REFERENCES attributes(id) ON DELETE CASCADE,
    FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE
);
`;

const SQL6 = `
ALTER TABLE items
ADD COLUMN are_attributes_enabled BOOLEAN DEFAULT FALSE;
`;

const SQL7 = `
ALTER TABLE items ALTER COLUMN type SET DEFAULT 1;
`;

const SQL8 = `
ALTER TABLE items
ADD COLUMN measurement TEXT DEFAULT 'unit';
`;

const SQL9 = `
ALTER TABLE items
ADD COLUMN min_level DECIMAL(10, 2)`;

const SQL10 = `
ALTER TABLE items
ADD COLUMN notes TEXT`;

const SQL11 = `
INSERT INTO tags (tag)
VALUES
    ('Tag 1'),  
    ('Tag 2'),
    ('Tag 4'),
    ('Tag 3');`;

const SQL12 = `
CREATE TABLE IF NOT EXISTS variants (
    id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    parent_item_id INTEGER,
    price DECIMAL(10, 2) DEFAULT 0,
    quantity DECIMAL(10, 2) DEFAULT 0,
    FOREIGN KEY (parent_item_id) REFERENCES items(id) ON DELETE CASCADE
);
`;

const SQL13 = `
ALTER TABLE variants
ADD COLUMN name TEXT NOT NULL;
`;

const SQL14 = `
DROP TABLE item_tags;
CREATE TABLE IF NOT EXISTS item_tags (
    id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    item_id INTEGER,
    tag_id INTEGER,
    FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);
`;

const SQL15 = `
ALTER TABLE items
ALTER COLUMN min_level
SET DEFAULT 0;

ALTER TABLE items
ALTER COLUMN price
SET DEFAULT 0;
`;

const SQL16 = `
ALTER TABLE activity_history
DROP COLUMN product_type_id;
`;

const SQL17 = `
ALTER TABLE activity_history
ADD COLUMN tag_id INTEGER REFERENCES tags(id);
`;

const SQL18 = `
ALTER TABLE activity_history
ADD COLUMN activity_description TEXT;
`;

const SQL19 = `
ALTER TABLE activity_history
DROP COLUMN activity_type_id, DROP property_name, DROP former_value_text, DROP new_value_text, DROP former_value_number, DROP new_value_number;
`;

const SQL20 = `
ALTER TABLE activity_history
ADD COLUMN activity_type TEXT;
`;

const SQL21 = `
DROP TABLE activity_type;
`;

const SQL22 = `
ALTER TABLE activity_history
ADD COLUMN previous_quantity DECIMAL(10, 2), ADD COLUMN updated_quantity DECIMAL(10, 2);
`;

const SQL23 = `
ALTER TABLE items
ADD COLUMN parent_item_id INTEGER;

ALTER TABLE items
ADD FOREIGN KEY (parent_item_id) REFERENCES items(id) ON DELETE CASCADE;
`;

const SQL24 = `
ALTER TABLE activity_history
ADD COLUMN previous_name_before_edit TEXT;
`;

const SQL25 = `
ALTER TABLE activity_history
RENAME COLUMN previous_name_before_edit to name_before_update;
`;

const SQL26 = `
ALTER TABLE items
RENAME COLUMN notes to note;
`;
const SQL27 = `
ALTER TABLE activity_history
DROP COLUMN item_id;

ALTER TABLE activity_history
ADD COLUMN item_id INTEGER;
`;

const SQL28 = `
ALTER TABLE items
DROP COLUMN sku;

ALTER TABLE items
DROP COLUMN barcode;

ALTER TABLE items
DROP COLUMN cost;

ALTER TABLE items
DROP COLUMN length;

ALTER TABLE items
DROP COLUMN width;

ALTER TABLE items
DROP COLUMN height;

ALTER TABLE items
DROP COLUMN brand;

ALTER TABLE items
DROP COLUMN color;

ALTER TABLE items
DROP COLUMN material;

ALTER TABLE items
DROP COLUMN country_of_origin;

ALTER TABLE items
DROP COLUMN return_date;

ALTER TABLE items
DROP COLUMN image_link;

ALTER TABLE items
DROP COLUMN description;

ALTER TABLE items
DROP COLUMN are_attributes_enabled;
`;

const SQL29 = `
ALTER TABLE activity_history
RENAME COLUMN category_id to tag_id;

ALTER TABLE categories
RENAME COLUMN category to tag;

ALTER TABLE categories
RENAME TO tags;


ALTER TABLE item_categories
RENAME COLUMN category_id to tag_id;

ALTER TABLE item_categories
RENAME TO item_tags;
`;


const SQL30 = `
ALTER TABLE activity_history
DROP COLUMN tag_id;

ALTER TABLE activity_history
ADD COLUMN tag_id INTEGER;
`;

const SQL31 = `
ALTER TABLE items
ALTER COLUMN quantity TYPE DECIMAL(10, 2);
`

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
		await client.query(SQL31);
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
