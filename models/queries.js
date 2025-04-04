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
			variants,
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
			// Default to 1 if no tags were submitted
			await pool.query(
				`INSERT INTO item_categories(item, category) VALUES($1, $2)`,
				[itemID, 1],
			);
		}

		// Insert item variants
		if (variants) {
			variants.forEach((variant) => {
				insertItemVariant(
					itemID,
					variant.name,
					variant.price,
					variant.quantity,
				);
			});
		}
		console.log("Item inserted successfully");
	} catch (error) {
		console.error("Error inserting the item. ", error);
	}
}

async function insertItemVariant(
	variantParentID,
	variantName,
	variantPrice,
	variantQuantity,
) {
	try {
		await pool.query(
			`INSERT INTO variants(parent_item_id, name, price, quantity) VALUES($1, $2, $3, $4)`,
			[variantParentID, variantName, variantPrice, variantQuantity],
		);
		console.log("Variant inserted successfully.");
	} catch (error) {
		console.error("Error inserting the variant. ", error);
	}
}

module.exports = {
	insertItem,
};
