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

		// Update activity history
		await updateActivityHistory({
			itemID: itemID,
			categoryID: null,
			activityDescription: `Create item "${name}".`,
			activityTypeID: null,
			reason: null,
			propertyName: null,
			formerValueText: null,
			newValueText: null,
			formerValueNumber: null,
			newValueNumber: null,
		});

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
        CASE
            WHEN (SELECT COUNT(item_id) FROM item_categories WHERE item_id = $1) <> 0 
                THEN JSONB_AGG(JSONB_BUILD_OBJECT('id', category_id, 'name', category_name) ORDER BY category_id)
            ELSE NULL
        END AS categories        
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
            CASE
                WHEN (SELECT COUNT(parent_item_id) FROM variants WHERE parent_item_id = $1).COUNT <> 0
                    THEN JSONB_AGG(JSONB_BUILD_OBJECT('name', variants.name, 'price', variants.price, 'quantity', variants.quantity) ORDER BY variants.name)
                ELSE NULL
            END AS variants
            FROM items 
            LEFT JOIN item_categories 
            ON item_categories.item_id = items.id 
            LEFT JOIN categories 
            ON item_categories.category_id = categories.id 
            LEFT JOIN variants 
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
		const row = (await pool.query(query, [itemID])).rows[0];

		return {
			id: row.id,
			name: row.name,
			quantity: row.quantity,
			price: row.price,
			notify: row.notify,
			notes: row.notes,
			minLevel: row.min_level,
			variants: row.variants || [],
			categories: row.categories || [],
			measurement: row.measurement,
			totalValue: row.total_value || row.price * row.quantity,
			totalQuantity: row.total_quantity || row.quantity,
		};
	} catch (error) {
		console.error("Error retrieving the item. ", error);
	}
}

async function searchItem(keyword) {
	try {
		const query = `SELECT id, name, quantity, measurement FROM items WHERE LOWER(name) LIKE LOWER('%' || $1 || '%')`;
		const { rows } = await pool.query(query, [keyword]);
		return rows;
	} catch (error) {
		console.error("Error fetching item. ", error);
	}
}

async function getLowStockItems() {
	try {
		const query = `
        SELECT id, name, quantity, measurement, min_level FROM items WHERE quantity <= min_level;
        `;
		const { rows } = await pool.query(query);
		return rows;
	} catch (error) {
		console.error("Error fetching low-stock items. ", error);
	}
}

async function updateActivityHistory(activity) {
	const {
		itemID,
		categoryID,
		activityDescription,
		activityTypeID,
		reason,
		propertyName,
		formerValueText,
		newValueText,
		formerValueNumber,
		newValueNumber,
	} = activity;

	try {
		// Insert the activity values and obtain the result
		await pool.query(
			`
			INSERT INTO activity_history(
            item_id, 
            category_id, 
            activity_type_id, 
            activity_description,
            reason, 
            property_name, 
            former_value_text, 
            new_value_text, 
            former_value_number, 
            new_value_number) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            ;
            `,
			[
				itemID,
				categoryID,
				activityTypeID,
				activityDescription,
				reason,
				propertyName,
				formerValueText,
				newValueText,
				formerValueNumber,
				newValueNumber,
			],
		);
		console.log("Activity inserted successfully.");
	} catch (error) {
		console.error("Error inserting activity.", error);
	}
}

async function getAllActivities() {
	try {
		const query = `
        SELECT
        item_id,
        category_id,
        CASE
            WHEN categories.category IS NULL THEN items.name
            ELSE categories.category
        END AS entity_name,
        activity_done_at,
        activity_description AS description
        FROM activity_history
        LEFT JOIN items
        ON item_id = items.id
        LEFT JOIN categories
        ON category_id = categories.id
        ORDER BY activity_history.id DESC
        ;
        `;
		const { rows } = await pool.query(query);
		return rows;
	} catch (error) {
		console.error("Error fetching activities. ", error);
	}
}

async function getAllTags(sortOption) {
	try {
		let orderByStatement;
		switch (sortOption) {
			case "name-ascending":
				orderByStatement = "ORDER BY category ASC";
				break;
			case "name-descending":
				orderByStatement = "ORDER BY category DESC";
				break;
			case "date-added-ascending":
				orderByStatement = "ORDER BY id ASC";
				break;
			case "date-added-descending":
				orderByStatement = "ORDER BY id DESC";
				break;
			default:
				orderByStatement = "";
				break;
		}

		const query = `
            SELECT 
            id, 
            category AS name
            FROM categories
            ${orderByStatement}
            ;
        `;
        
		const { rows } = await pool.query(query);
		return rows;
	} catch (error) {
		console.error("Error fetching tags. ", error);
	}
}

async function searchTag(keyword) {
	try {
		const query = `
        SELECT 
        id, 
        category AS name
        FROM CATEGORIES 
        WHERE LOWER(category) LIKE LOWER('%' || $1 || '%')
        ;
        `;
		const { rows } = await pool.query(query, [keyword]);
		return rows;
	} catch (error) {
		console.error("Error fetching tag. ", error);
	}
}

async function deleteTag(id) {
	try {
		const query = `
            DELETE
            FROM categories
            WHERE id = $1
            ;
        `;
		await pool.query(query, [id]);
		console.log("Tag deleted successfully.");
	} catch (error) {
		console.error("Error deleting tag. ", error);
	}
}

async function updateTagName(id, newTagName) {
	try {
		const query = `
            UPDATE categories
            SET category = $2
            WHERE id = $1
            ;
        `;
		await pool.query(query, [id, newTagName]);
		console.log("Tag updated successfully.");
	} catch (error) {
		console.error("Error updating tag name. ", error);
	}
}

async function insertTag(tagName) {
	try {
		const query = `
            INSERT INTO CATEGORIES (category) 
            VALUES ($1)
            ;
        `;
		await pool.query(query, [tagName]);
		console.log(`Tag ${tagName} added successfully.`);
	} catch (error) {
		console.error("Error inserting tag. ", error);
	}
}

async function getTagByID(id) {
	try {
		const query = `
            SELECT 
                tag_name,
                sum(total_item_quantity) as total_item_quantity,
                sum(total_value) as total_value,
                COUNT(*) as total_distinct_item_quantity,
                JSONB_AGG(JSONB_BUILD_OBJECT('id', item_id, 'name', item_name, 'quantity', total_item_quantity, 'measurement', measurement) ORDER BY item_id) AS items
            FROM(
                    SELECT item_name,
                        item_id,
                        tag_name,
                        sum(total_value) as total_value,
                        sum(quantity) as total_item_quantity,
                        measurement
                    FROM (
                            SELECT items.name as item_name,
                                items.id as item_id,
                                categories.category as tag_name,
                                items.measurement AS measurement,
                                CASE
                                    WHEN(variants.id IS NOT NULL) THEN variants.price
                                    ELSE items.price
                                END AS price,
                                CASE
                                    WHEN(variants.id IS NOT NULL) THEN variants.quantity
                                    ELSE items.quantity
                                END AS quantity,
                                CASE
                                    WHEN(variants.id IS NOT NULL) THEN variants.price * variants.quantity
                                    ELSE items.price * items.quantity
                                END AS total_value
                            FROM items
                                INNER JOIN item_categories ON items.id = item_categories.item_id
                                INNER JOIN categories ON categories.id = item_categories.category_id
                                LEFT JOIN variants ON variants.parent_item_id = items.id
                            WHERE categories.id = $1
                        )
                    GROUP BY item_name,
                        item_id,
                        tag_name,
                        measurement
                )
            GROUP BY tag_name;
        `;
		const { rows } = await pool.query(query, [id]);
		return rows[0];
	} catch (error) {
		console.error("Error fetching tag. ", error);
	}
}

module.exports = {
	insertItem,
	getAllItems,
	getItemById,
	searchItem,
	getLowStockItems,
	getAllActivities,
	getAllTags,
	searchTag,
	deleteTag,
	insertTag,
	updateTagName,
	getTagByID,
};
