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
			notify,
			notes,
			tags,
			variants,
			parentItemID,
		} = item;

		// Create the array of values to be used in inserting item in the database
		const itemValues = [
			name,
			price,
			quantity,
			measurement,
			minLevel,
			notify,
			notes,
			parentItemID,
		];

		// Insert the item values and obtain the result
		const result = await pool.query(
			"INSERT INTO items(name, price, quantity, measurement, min_level, notify, notes, parent_item_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *",
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
				`INSERT INTO item_categories(item_id, category_id) VALUES($1, $2)`,
				[itemID, 1],
			);
		}

		// Insert item variants
		if (variants) {
			variants.forEach((variant) => {
				insertItem({ ...variant, parentItemID: itemID });
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
		// Only return the items which are not a parent item
		const { rows } = await pool.query(`
            SELECT 
            items_x.id, 
            items_x.name, 
            items_x.quantity, 
            items_x.measurement,
            items_y.name as parent_item_name
            FROM items AS items_x
            LEFT JOIN items AS items_y
            ON items_x.parent_item_id = items_y.id
            WHERE items_x.id 
            NOT IN (
                SELECT 
                parent_item_id 
                FROM items 
                WHERE parent_item_id IS NOT NULL
            )
            ;`);

		return rows.map((row) => ({
			id: row.id,
			name: row.name,
			quantity: row.quantity,
			measurement: row.measurement,
			parentItemName: row.parent_item_name,
		}));
	} catch (error) {
		console.error("Error getting the items. ", error);
	}
}

async function getItemById(itemID) {
	try {
		const query = `
            SELECT items_x.*,
                CASE
                    WHEN (
                        SELECT COUNT(parent_item_id)
                        FROM items
                        WHERE parent_item_id = $1
                    ) <> 0 THEN JSONB_AGG(
                        JSONB_BUILD_OBJECT(
                            'id',
                            variants.id,
                            'name',
                            variants.name,
                            'price',
                            variants.price,
                            'quantity',
                            variants.quantity
                        )
                        ORDER BY variants.id
                    )
                    ELSE NULL
                END AS variants
            FROM (
                    SELECT items_x.id,
                        items_x.name,
                        items_x.quantity,
                        items_x.measurement,
                        items_x.notify,
                        items_x.price,
                        items_x.min_level,
                        items_x.notes,
                        (
                            SELECT activity_done_at
                            FROM activity_history
                            WHERE item_id = $1
                            ORDER BY activity_done_at
                            LIMIT 1
                        ) as updated_at,
                        CASE
                            WHEN (
                                SELECT COUNT(parent_item_id)
                                FROM items
                                WHERE id = $1
                            ) <> 0 THEN JSONB_BUILD_OBJECT('id', items_y.id, 'name', items_y.name)
                            ELSE NULL
                        END AS parent,
                        CASE
                            WHEN (
                                SELECT COUNT(item_id)
                                FROM item_categories
                                WHERE item_id = $1
                            ) <> 0 THEN JSONB_AGG(
                                JSONB_BUILD_OBJECT('id', categories.id, 'name', categories.category)
                                ORDER BY categories.id
                            )
                            ELSE NULL
                        END AS categories
                    FROM items AS items_x
                        LEFT JOIN items AS items_y ON items_x.parent_item_id = items_y.id
                        LEFT JOIN item_categories ON item_categories.item_id = items_x.id
                        LEFT JOIN categories ON item_categories.category_id = categories.id
                    WHERE items_x.id = $1
                    GROUP BY items_x.id,
                        items_x.name,
                        items_x.quantity,
                        items_x.measurement,
                        items_x.notify,
                        items_x.price,
                        items_x.min_level,
                        items_x.notes,
                        parent,
                        updated_at
                ) AS items_x
                LEFT JOIN items as variants ON items_x.id = variants.parent_item_id
            GROUP BY items_x.id,
                items_x.name,
                items_x.quantity,
                items_x.measurement,
                items_x.notify,
                items_x.price,
                items_x.min_level,
                items_x.notes,
                items_x.updated_at,
                items_x.parent,
                items_x.categories;
        `;
		const row = (await pool.query(query, [itemID])).rows[0];

		return {
			id: row.id,
			updatedAt: `${new Date(row.updated_at).toLocaleTimeString([], { year: "numeric", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}`,
			name: row.name,
			quantity: row.quantity ? parseFloat(row.quantity) : null,
			price: row.price ? parseFloat(row.price) : null,
			notify: row.notify,
			notes: row.notes,
			minLevel: row.min_level ? parseFloat(row.min_level) : null,
			variants:
				row.variants?.map((variant) => ({
					...variant,
					price: variant.price ? parseFloat(variant.price) : null,
					quantity: variant.quantity
						? parseFloat(variant.quantity)
						: null,
				})) || [],
			tags: row.categories || [],
			measurement: row.measurement,
			minimumPrice: row.variants
				? Math.min(
						...row.variants.map((variant) =>
							variant.price ? parseFloat(variant.price) : null,
						),
					)
				: null,
			parent: row.parent,
			maximumPrice: row.variants
				? Math.max(
						...row.variants.map((variant) =>
							variant.price ? parseFloat(variant.price) : null,
						),
					)
				: null,
			totalQuantity: row.variants
				? row.variants.reduce((acc, curr) => acc + curr.quantity, 0)
				: row.quantity,
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
                CASE 
                    WHEN (SELECT COUNT(category_id) FROM item_categories WHERE category_id = $1) <> 0 
                        THEN COUNT(*) 
                    ELSE 0
                END as total_distinct_item_quantity,
                CASE 
                    WHEN (SELECT COUNT(category_id) FROM item_categories WHERE category_id = $1) <> 0 
                        THEN JSONB_AGG(JSONB_BUILD_OBJECT('id', item_id, 'name', item_name, 'quantity', total_item_quantity, 'measurement', measurement) ORDER BY item_id)
                    ELSE NULL
                END AS items
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
                                    WHEN (items.price IS NOT NULL) THEN items.price
                                    ELSE 0
                                END AS price,
                                CASE
                                    WHEN(variants.id IS NOT NULL) THEN variants.quantity
                                    WHEN(items.quantity IS NOT NULL) then items.quantity
                                    ELSE 0
                                END AS quantity,
                                CASE
                                    WHEN(variants.id IS NOT NULL) THEN variants.price * variants.quantity
                                    WHEN (items.price IS NOT NULL AND items.quantity IS NOT NULL) THEN items.price * items.quantity
                                    ELSE 0
                                END AS total_value
                            FROM categories
                                LEFT JOIN item_categories ON categories.id = item_categories.category_id
                                LEFT JOIN items ON items.id = item_categories.item_id
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

async function editItem(updatedItem, updateSummary) {
	try {
		// Destructure item
		const {
			name,
			price,
			quantity,
			measurement,
			minLevel,
			notify,
			notes,
			tags,
			variants,
			id,
		} = updatedItem;

		// Create the array of values to be used in inserting item in the database
		const itemValues = [
			name,
			price,
			quantity,
			measurement,
			minLevel,
			notify,
			notes,
			id,
		];

		// Insert the item values and obtain the result
		await pool.query(
			`
            UPDATE items 
            SET 
            name = $1, 
            price = $2, 
            quantity = $3, 
            measurement = $4, 
            min_level = $5, 
            notify = $6, 
            notes = $7
            WHERE id = $8;
            `,
			itemValues,
		);

		// Update item tags
		if (tags) {
			await pool.query("DELETE FROM item_categories WHERE item_id = $1", [
				id,
			]);
			tags.forEach(async (tag) => {
				await pool.query(
					`INSERT INTO item_categories(item_id, category_id) VALUES($1, $2)`,
					[id, tag.id],
				);
			});
		}

		// Update item variants
		if (variants) {
			await pool.query("DELETE FROM variants WHERE parent_item_id = $1", [
				id,
			]);
			variants.forEach((variant) => {
				insertItemVariant(
					id,
					variant.name,
					variant.price,
					variant.quantity,
				);
			});
		}

		// Update activity history
		await updateActivityHistory({
			itemID: id,
			categoryID: null,
			activityDescription: `Edit item "${name}".`,
			activityTypeID: null,
			reason: null,
			propertyName: null,
			formerValueText: null,
			newValueText: null,
			formerValueNumber: null,
			newValueNumber: null,
		});
	} catch (error) {
		console.error("Error editing item. ", Error);
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
	editItem,
};
