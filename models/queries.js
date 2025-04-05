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
					`INSERT INTO item_categories(item_id, category_id) VALUES($1, $2)`,
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

async function getAllItems() {
	try {
		const { rows } = await pool.query(
			`SELECT id, name, quantity, measurement FROM items;`,
		);
		return rows;
	} catch (error) {
		console.error("Error getting the items. ", error);
	}
}

async function getItemById(itemID) {
	try {
		const query = `
        SELECT 
        id, 
        name,
        notify,
        measurement,
        price,
        quantity,
        notes, 
        min_level,
        variants,
        total_value,
        total_quantity,
        JSONB_AGG(JSONB_BUILD_OBJECT('name', category_name, 'id', category_id) ORDER BY category_id) as categories
        FROM (
            SELECT 
            items.id, 
            items.name,
            items.notify,
            items.measurement,
            items.price,
            items.quantity,
            items.notes, 
            items.min_level,
            categories.id as category_id,
            categories.category as category_name,
            SUM(variants.price * variants.quantity) as total_value,
            SUM(variants.quantity) as total_quantity,
            JSONB_AGG(JSONB_BUILD_OBJECT('name', variants.name, 'price', variants.price, 'quantity', variants.quantity) ORDER BY variants.name) AS variants
            FROM items 
            INNER JOIN item_categories 
            ON item_categories.item_id = items.id 
            INNER JOIN categories 
            ON item_categories.category_id = categories.id 
            INNER JOIN variants 
            ON variants.parent_item_id = items.id
            WHERE items.id = $1
            GROUP BY 
            items.id, 
            items.name,
            items.notify,
            items.measurement,
            items.price,
            items.quantity,
            items.notes,
            items.min_level,
            categories.category,
            categories.id
        )
        GROUP BY 
        id, 
        name,
        notify,
        measurement,
        price,
        quantity,
        notes, 
        min_level,
        variants,
        total_value,
        total_quantity
        ;
        `;
		const { rows } = await pool.query(query, [itemID]);
		return rows[0];
	} catch (error) {
		console.error("Error retrieving the item. ", error);
	}
}

module.exports = {
	insertItem,
	getAllItems,
	getItemById,
};
