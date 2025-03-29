const pool = require("./pool");

async function insertItem(item) {
	try {
		// Destructure item
		const {
			name,
			price,
			quantity,
			measurement,
			minLevel,
			notificationStatus,
			notes,
			tags,
		} = item;

		// Create the array of values to be used in inserting item in the database
		const itemValues = [
			name,
			price,
			quantity,
			measurement,
			minLevel,
			notificationStatus,
			notes,
		];

		// Insert the item values and obtain the result
		const result = await pool.query(
			"INSERT INTO items(name, price, quantity, measurement, min_level, notify, notes) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *",
			itemValues,
		);

		// Get the newly inserted item's ID
		const itemID = result.rows[0].id;

		// Insert item into item_categories table with the item's id and tag id
		if (tags) {
			tags.forEach(async (tag) => {
				await pool.query(
					`INSERT INTO item_categories(item, category) VALUES($1, $2)`,
					[itemID, tag],
				);
			});
		} else {
			await pool.query(
				`INSERT INTO item_categories(item, category) VALUES($1, $2)`,
				[itemID, 1],
			);
		}
		console.error("Item inserted successfully");
	} catch (error) {
		console.error("Error inserting the item. ", error);
	}
}

module.exports = {
	insertItem,
};
