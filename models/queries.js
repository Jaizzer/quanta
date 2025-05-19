const pool = require("./pool");
const { intervalToDuration } = require("date-fns");

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
			note,
			tags,
			variants,
			parent,
		} = item;

		// Create the array of values to be used in inserting item in the database
		const itemValues = [
			name,
			price,
			quantity,
			measurement,
			minLevel,
			notify,
			note,
			parent?.id,
		];

		// Insert the item values and obtain the result
		const result = await pool.query(
			"INSERT INTO items(name, price, quantity, measurement, min_level, notify, note, parent_item_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *",
			itemValues,
		);

		// Get the newly inserted item's ID
		const itemID = result.rows[0].id;

		// Insert item into item_tags table with the item's id and tag id
		if (tags) {
			tags.forEach(async (tag) => {
				await pool.query(
					`INSERT INTO item_tags(item_id, tag_id) VALUES($1, $2)`,
					[itemID, tag],
				);
			});
		} else {
			// Default to 1 if no tags were submitted
			await pool.query(
				`INSERT INTO item_tags(item_id, tag_id) VALUES($1, $2)`,
				[itemID, 1],
			);
		}

		// Insert item variants
		if (variants) {
			variants.forEach((variant) => {
				insertItem({
					...variant,
					parent: {
						id: itemID,
						name: name,
					},
				});
			});
		}

		// Update activity history
		await updateActivityHistory({
			itemID: itemID,
			activityType: "Create",
			updateSummary: {
				name: name,
				groupName: parent?.name
					? `${parent?.name}'s variants`
					: "items",
				previousValue: 0,
				updatedValue: item.quantity,
			},
		});

		console.log("Item inserted successfully");
	} catch (error) {
		console.error("Error inserting the item. ", error);
	}
}

async function getAllItems(sortOption) {
	try {
		let orderByStatement;
		switch (sortOption) {
			case "name-ascending":
				orderByStatement = `ORDER BY column_for_name_sorting ASC`;
				break;
			case "name-descending":
				orderByStatement = "ORDER BY column_for_name_sorting DESC";
				break;
			case "date-added-ascending":
				orderByStatement = "ORDER BY id ASC";
				break;
			case "date-added-descending":
				orderByStatement = "ORDER BY id DESC";
				break;
			case "date-updated-ascending":
				orderByStatement = "ORDER BY date_updated ASC";
				break;
			case "date-updated-descending":
				orderByStatement = "ORDER BY date_updated DESC";
				break;
			default:
				orderByStatement = "";
				break;
		}

		// Only return the items which are not a parent item
		const { rows } = 
        await pool.query(`
            SELECT 
                SUM(total_item_value) as total_inventory_value,
                COUNT(*) AS total_item_type_quantity,
                JSONB_AGG(
                    JSONB_BUILD_OBJECT(
                        'id',
                        id,
                        'name',
                        name,
                        'quantity',
                        quantity,
                        'measurement',
                        measurement,
                        'parent_item_name',
                        parent_item_name,
                        'min_level',
                        min_level
                    )
                ) as items
            FROM (
                    SELECT 
                        items_x.id,
                        items_x.name,
                        items_x.quantity,
                        items_x.measurement,
                        items_x.min_level,
                        items_y.name as parent_item_name,
                        items_x.quantity * items_x.price AS total_item_value,
                        CASE
                            WHEN items_y.name IS NOT NULL THEN items_y.name
                            ELSE items_x.name
                        END as column_for_name_sorting,
                        MAX(activity_history.activity_done_at) AS date_updated
                    FROM items AS items_x
                        LEFT JOIN items AS items_y ON items_x.parent_item_id = items_y.id
                        LEFT JOIN activity_history ON activity_history.item_id = items_x.id
                    WHERE items_x.id NOT IN (
                            SELECT parent_item_id
                            FROM items
                            WHERE parent_item_id IS NOT NULL
                        )
                    GROUP BY
                        items_x.id,
                        items_x.name,
                        items_x.quantity,
                        items_x.measurement,
                        items_x.min_level,
                        items_y.name,
                        items_x.quantity * items_x.price
                    ${orderByStatement}
                ) as m;`);

		return {
			totalItemTypeQuantity: isNaN(
				parseFloat(rows[0].total_item_type_quantity),
			)
				? 0
				: parseFloat(rows[0].total_item_type_quantity),
			totalInventoryValue: isNaN(
				parseFloat(rows[0].total_inventory_value),
			)
				? 0
				: parseFloat(rows[0].total_inventory_value).toFixed(2),
			items: rows[0].items
				? rows[0].items.map((item) => ({
						id: item.id,
						name: item.name,
						quantity:
							item.quantity !== null
								? parseFloat(item.quantity)
								: null,
						measurement: item.measurement,
						parentItemName: item.parent_item_name,
						isLowStock: parseFloat(item.quantity) <= item.min_level,
					}))
				: [],
		};
	} catch (error) {
		console.error("Error getting the items. ", error);
	}
}

async function deleteItem(item) {
	try {
		const { id, name, parent, quantity } = item;
		const query = `
            DELETE
            FROM items
            WHERE id = $1
            ;
        `;
		await pool.query(query, [id]);

		// Update activity history
		await updateActivityHistory({
			itemID: id,
			activityType: "Delete",
			updateSummary: {
				name: name,
				groupName: parent?.name
					? `${parent?.name}'s variants`
					: "items",
				previousValue: quantity,
				updatedValue: 0,
			},
		});
		console.log("Item deleted successfully.");
	} catch (error) {
		console.error("Error deleting tag. ", error);
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
                            variants.quantity,
                            'measurement',
                            variants.measurement
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
                        items_x.note,
                        (
                            SELECT activity_done_at
                            FROM activity_history
                            WHERE item_id = $1
                            ORDER BY activity_done_at DESC
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
                                FROM item_tags
                                WHERE item_id = $1
                            ) <> 0 THEN JSONB_AGG(
                                JSONB_BUILD_OBJECT('id', tags.id, 'name', tags.tag)
                                ORDER BY tags.id
                            )
                            ELSE NULL
                        END AS tags
                    FROM items AS items_x
                        LEFT JOIN items AS items_y ON items_x.parent_item_id = items_y.id
                        LEFT JOIN item_tags ON item_tags.item_id = items_x.id
                        LEFT JOIN tags ON item_tags.tag_id = tags.id
                    WHERE items_x.id = $1
                    GROUP BY items_x.id,
                        items_x.name,
                        items_x.quantity,
                        items_x.measurement,
                        items_x.notify,
                        items_x.price,
                        items_x.min_level,
                        items_x.note,
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
                items_x.note,
                items_x.updated_at,
                items_x.parent,
                items_x.tags;
        `;
		const row = (await pool.query(query, [itemID])).rows[0];

		return {
			id: row.id,
			updatedAt: `${new Date(row.updated_at).toLocaleTimeString([], { year: "numeric", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}`,
			name: row.name,
			quantity: row.quantity !== null ? parseFloat(row.quantity) : null,
			price: row.price !== null ? parseFloat(row.price).toFixed(2) : null,
			totalValue:
				row.price * row.quantity !== null || NaN
					? parseFloat(row.price * row.quantity).toFixed(2)
					: null,
			notify: row.notify,
			note: row.note,
			minLevel: row.min_level !== null ? parseFloat(row.min_level) : null,
			variants:
				row.variants?.map((variant) => ({
					...variant,
					price:
						variant.price !== null
							? parseFloat(variant.price)
							: null,
					quantity:
						variant.quantity !== null
							? parseFloat(variant.quantity)
							: null,
				})) || [],
			tags: row.tags || [],
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
		const query = `
            SELECT DISTINCT *
            FROM (
                    SELECT items.id,
                        items.name,
                        items.quantity,
                        items.measurement
                    FROM items
                        LEFT JOIN item_tags ON item_tags.item_id = items.id
                        LEFT JOIN tags ON item_tags.tag_id = tags.id
                    WHERE (
                            LOWER(items.name) LIKE LOWER('%' || $1 || '%')
                            OR LOWER(tags.tag) LIKE LOWER('%' || $1 || '%')
                        )
                        AND items.id NOT IN (
                            SELECT parent_item_id
                            FROM items
                            WHERE parent_item_id IS NOT NULL
                        )
                ) AS items
            ORDER BY items.id;
        `;
		const { rows } = await pool.query(query, [keyword]);
		return rows;
	} catch (error) {
		console.error("Error fetching item. ", error);
	}
}

async function getLowStockItems(isNotificationEnabledOnly) {
	try {
		let query;
		if (isNotificationEnabledOnly) {
			query = `
                SELECT 
                    y.id,
                    y.name,
                    y.quantity,
                    y.measurement,
                    y.min_level,
                    y.notify,
                    x.name AS parent_item_name
                FROM items AS y
                LEFT JOIN items AS x
                ON y.parent_item_id = x.id
                WHERE y.quantity <= y.min_level
                    AND y.id NOT IN (
                        SELECT parent_item_id
                        FROM items
                        WHERE parent_item_id IS NOT NULL
                    )
                    AND y.notify = TRUE;
            `;
		} else {
			query = `
                SELECT 
                    y.id,
                    y.name,
                    y.quantity,
                    y.measurement,
                    y.min_level,
                    y.notify,
                    x.name AS parent_item_name
                FROM items AS y
                LEFT JOIN items AS x
                ON y.parent_item_id = x.id
                WHERE y.quantity <= y.min_level
                    AND y.id NOT IN (
                        SELECT parent_item_id
                        FROM items
                        WHERE parent_item_id IS NOT NULL
                    );
            `;
		}
		const { rows } = await pool.query(query);
		return rows.map((row) => ({
			id: row.id,
			name: row.name,
			quantity: row.quantity !== null ? parseFloat(row.quantity) : null,
			measurement: row.measurement,
			minLevel: row.min_level !== null ? parseFloat(row.min_level) : null,
			notify: row.notify,
			parentItemName: row.parent_item_name,
		}));
	} catch (error) {
		console.error("Error fetching low-stock items. ", error);
	}
}

async function updateActivityHistory(activity) {
	try {
		const { itemID, tagID, activityType, reason, updateSummary } = activity;

		if (activityType === "Create") {
			const activityDescription = `Added '${updateSummary.name}' to ${updateSummary.groupName}.`;
			await pool.query(
				`
                    INSERT INTO activity_history(
                        item_id, 
                        tag_id, 
                        activity_type, 
                        activity_description,
                        name_before_update,
                        previous_quantity,
                        updated_quantity
                    ) 
                    VALUES ($1, $2, $3, $4, $5, $6, $7)
                    ;
                    `,
				[
					itemID,
					tagID,
					activityType,
					activityDescription,
					updateSummary.name,
					updateSummary.previousValue,
					updateSummary.updatedValue,
				],
			);
		} else if (activityType === "Delete") {
			const activityDescription = `Removed '${updateSummary.name}' from ${updateSummary.groupName}.`;

			await pool.query(
				`
                    INSERT INTO activity_history (
                        item_id, 
                        tag_id, 
                        activity_type, 
                        activity_description,
                        name_before_update,
                        previous_quantity,
                        updated_quantity
                    ) 
                    VALUES ($1, $2, $3, $4, $5, $6, $7)
                    ;
                    `,
				[
					itemID,
					tagID,
					activityType,
					activityDescription,
					updateSummary.name,
					updateSummary.previousValue,
					updateSummary.updatedValue,
				],
			);
		} else if (activityType === "Update" && itemID) {
			// Create description for item updates

			// Get all attributes
			const attributes = Object.keys(updateSummary).filter(
				(attribute) => attribute !== "itemNameBeforeEdit",
			);

			// Update the database
			attributes.forEach(async (attribute) => {
				// Check if the current attribute has updates
				const isThereAnUpdateForThisAttribute =
					updateSummary[attribute] !== null;

				// Save the update in the activity history if the attribute was updated
				if (isThereAnUpdateForThisAttribute) {
					// Save the quantity differently than other attributes comprising of: activity description, previous quantity and updated quantity
					if (attribute === "quantity") {
						await pool.query(
							`
                            INSERT INTO activity_history (
                                item_id, 
                                activity_type, 
                                activity_description,
                                reason, 
                                previous_quantity,
                                updated_quantity,
                                name_before_update
                            ) 
                            VALUES ($1, $2, $3, $4, $5, $6, $7)
                            ;
                    `,
							[
								itemID,
								activityType,
								updateSummary[attribute].description[0],
								reason === "None" ? null : reason,
								updateSummary[attribute].previousValue,
								updateSummary[attribute].updatedValue,
								updateSummary["itemNameBeforeEdit"],
							],
						);
					} else {
						// Save the other non-quantity attributes
						updateSummary[attribute].description.forEach(
							async (description) => {
								await pool.query(
									`
                                INSERT INTO activity_history (
                                    item_id, 
                                    activity_type, 
                                    activity_description,
                                    name_before_update
                                ) 
                                VALUES ($1, $2, $3, $4)
                                ;
                        `,
									[
										itemID,
										activityType,
										description,
										updateSummary["itemNameBeforeEdit"],
									],
								);
							},
						);
					}
				}
			});
		} else if (activityType === "Update" && tagID) {
			// Create description for tag updates

			const activityDescription = `Renamed the tag '${updateSummary.previousName}' to '${updateSummary.newName}'`;
			await pool.query(
				`
                    INSERT INTO activity_history (
                    item_id, 
                    tag_id, 
                    activity_type, 
                    activity_description,
                    name_before_update
                    ) 
                    VALUES ($1, $2, $3, $4, $5)
                    ;
                    `,
				[
					itemID,
					tagID,
					activityType,
					activityDescription,
					updateSummary.previousName,
				],
			);
		}
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
        tag_id,
        activity_history.name_before_update AS entity_name,
        activity_done_at,
        activity_description AS description
        FROM activity_history
        LEFT JOIN items
        ON item_id = items.id
        LEFT JOIN tags
        ON tag_id = tags.id
        ORDER BY activity_history.id DESC
        ;
        `;
		const { rows } = await pool.query(query);

		return rows.map((row) => ({
			description: row.description,
			entityName: row.entity_name,
			link:
				row.item_id !== null
					? `/items/${row.item_id}`
					: `/tags/${row.tag_id}`,
			timePassed: getTimePassed(row.activity_done_at),
		}));
	} catch (error) {
		console.error("Error fetching activities. ", error);
	}
}

function getTimePassed(date) {
	const { years, months, days, hours, minutes, seconds } = intervalToDuration(
		{
			start: new Date(date),
			end: new Date(),
		},
	);

	if (years) {
		return `${years}${years > 1 ? "yrs" : "yr"}`;
	} else if (months) {
		return `${months}${months > 1 ? "mos" : "mo"}`;
	} else if (days) {
		return `${days}d`;
	} else if (hours) {
		return `${hours}${hours > 1 ? "hrs" : "hr"}`;
	} else if (minutes) {
		return `${minutes}m`;
	} else {
		return `${seconds}s`;
	}
}

async function getActivityByItemID(id) {
	try {
		const query = `
        SELECT
        item_id,
        tag_id,
        activity_history.name_before_update AS entity_name,
        activity_done_at,
        activity_description AS description
        FROM activity_history
        LEFT JOIN items
        ON item_id = items.id
        LEFT JOIN tags
        ON tag_id = tags.id
        WHERE item_id = $1
        ORDER BY activity_history.id DESC
        ;
        `;
		const { rows } = await pool.query(query, [id]);

		return rows.map((row) => ({
			description: row.description,
			entityName: row.entity_name,
			link:
				row.item_id !== null
					? `/items/${row.item_id}`
					: `/tags/${row.tag_id}`,
			timePassed: getTimePassed(row.activity_done_at),
		}));
	} catch (error) {
		console.error("Error fetching activity history. ", error);
	}
}

async function getAllTags(sortOption) {
	try {
		let orderByStatement;
		switch (sortOption) {
			case "name-ascending":
				orderByStatement = "ORDER BY tag ASC";
				break;
			case "name-descending":
				orderByStatement = "ORDER BY tag DESC";
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
            tag AS name
            FROM tags
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
        tag AS name
        FROM tags 
        WHERE LOWER(tag) LIKE LOWER('%' || $1 || '%')
        ;
        `;
		const { rows } = await pool.query(query, [keyword]);
		return rows;
	} catch (error) {
		console.error("Error fetching tag. ", error);
	}
}

async function deleteTag(tag) {
	try {
		const query = `
            DELETE
            FROM tags
            WHERE id = $1
            ;
        `;
		await pool.query(query, [tag.id]);

		// Update activity history
		await updateActivityHistory({
			tagID: tag.id,
			activityType: "Delete",
			updateSummary: {
				name: tag.name,
				groupName: "tags",
			},
		});
		console.log("Tag deleted successfully.");
	} catch (error) {
		console.error("Error deleting tag. ", error);
	}
}

async function updateTagName(id, newTagName) {
	try {
		const currentTagName = (await getTagByID(id))?.tag_name;
		const query = `
            UPDATE tags
            SET tag = $2
            WHERE id = $1
            ;
        `;

		await pool.query(query, [id, newTagName]);

		// Update activity history
		await updateActivityHistory({
			tagID: id,
			activityType: "Update",
			updateSummary: {
				previousName: currentTagName,
				newName: newTagName,
			},
		});
		console.log("Tag updated successfully.");
	} catch (error) {
		console.error("Error updating tag name. ", error);
	}
}

async function insertTag(tagName) {
	try {
		const query = `
            INSERT INTO tags (tag) 
            VALUES ($1)
            RETURNING *
            ;
        `;
		const result = await pool.query(query, [tagName]);

		// Get the newly inserted tag's ID
		const tagID = result.rows[0].id;

		// Update activity history
		await updateActivityHistory({
			tagID: tagID,
			activityType: "Create",
			updateSummary: {
				name: tagName,
				groupName: "tags",
			},
		});
		console.log(`Tag ${tagName} added successfully.`);
	} catch (error) {
		console.error("Error inserting tag. ", error);
	}
}

async function getTagByID(id) {
	try {
		const query = `
            SELECT
                tag_id,
                tag_name,
                CASE
                    WHEN (
                        SELECT COUNT(*)
                        FROM item_tags
                        WHERE tag_id = $1
                            AND item_tags.item_id NOT IN (
                                SELECT parent_item_id
                                FROM items
                                WHERE parent_item_id IS NOT NULL
                            )
                    ) <> 0 THEN SUM(quantity)
                    ELSE 0
                END AS total_item_quantity,
                CASE
                    WHEN (
                        SELECT COUNT(*)
                        FROM item_tags
                        WHERE tag_id = $1
                            AND item_tags.item_id NOT IN (
                                SELECT parent_item_id
                                FROM items
                                WHERE parent_item_id IS NOT NULL
                            )
                    ) <> 0 THEN SUM(total_value)
                    ELSE 0
                END AS total_value,
                CASE
                    WHEN (
                        SELECT COUNT(*)
                        FROM item_tags
                        WHERE tag_id = $1
                            AND item_tags.item_id NOT IN (
                                SELECT parent_item_id
                                FROM items
                                WHERE parent_item_id IS NOT NULL
                            )
                    ) <> 0 THEN COUNT(*)
                    ELSE 0
                END AS total_distinct_item_quantity,
                CASE
                    WHEN (
                        SELECT COUNT(*)
                        FROM item_tags
                        WHERE tag_id = $1
                            AND item_tags.item_id NOT IN (
                                SELECT parent_item_id
                                FROM items
                                WHERE parent_item_id IS NOT NULL
                            )
                    ) <> 0 THEN JSONB_AGG(
                        JSONB_BUILD_OBJECT(
                            'id',
                            item_id,
                            'name',
                            name,
                            'price',
                            price,
                            'quantity',
                            quantity,
                            'measurement',
                            measurement
                        )
                    )
                    ELSE NULL
                END AS items
            FROM (
                    SELECT y.name,
                        y.item_id,
                        y.quantity,
                        y.price,
                        y.measurement,
                        y.price * y.quantity as total_value,
                        tags.id as tag_id,
                        tags.tag as tag_name
                    FROM tags
                        LEFT JOIN (
                            SELECT *
                            FROM item_tags
                                INNER JOIN (
                                    SELECT *
                                    FROM items
                                    WHERE id NOT IN (
                                            SELECT parent_item_id
                                            FROM items
                                            WHERE parent_item_id IS NOT NULL
                                        )
                                ) as items ON item_tags.item_id = items.id
                        ) as y ON y.tag_id = tags.id
                    WHERE tags.id = $1
                )
            GROUP BY 
                tag_id,
                tag_name;
        `;
		const { rows } = await pool.query(query, [id]);
		return {
			id: rows[0].tag_id,
			name: rows[0].tag_name,
			items: rows[0].items || [],
			totalItemQuantity: isNaN(parseFloat(rows[0].total_item_quantity))
				? 0
				: parseFloat(rows[0].total_item_quantity),
			totalDistinctItemQuantity: isNaN(
				parseFloat(rows[0].total_distinct_item_quantity),
			)
				? 0
				: parseFloat(rows[0].total_distinct_item_quantity),
			totalValue: isNaN(parseFloat(rows[0].total_value))
				? 0
				: parseFloat(rows[0].total_value).toFixed(2),
		};
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
			note,
			tags,
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
			note,
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
            note = $7
            WHERE id = $8;
            `,
			itemValues,
		);

		// Update item tags
		if (tags) {
			await pool.query("DELETE FROM item_tags WHERE item_id = $1", [id]);
			tags.forEach(async (tag) => {
				await pool.query(
					`INSERT INTO item_tags(item_id, tag_id) VALUES($1, $2)`,
					[id, tag.id],
				);
			});
		}

		// Update activity history
		await updateActivityHistory({
			itemID: id,
			activityType: "Update",
			updateSummary: updateSummary,
		});
	} catch (error) {
		console.error("Error editing item. ", error);
	}
}

async function updateItemQuantity(itemID, reason, updateSummary) {
	try {
		// Update the item quantity
		await pool.query(
			`
            UPDATE items 
            SET 
            quantity = $1
            WHERE id = $2;
            `,
			[updateSummary.quantity.updatedValue, itemID],
		);

		// Update activity history
		await updateActivityHistory({
			itemID,
			reason,
			updateSummary,
			activityType: "Update",
		});
	} catch (error) {
		console.error("Error updating the item quantity. ", error);
	}
}

async function getAllTransactions() {
	try {
		// Update the item quantity
		const { rows } = await pool.query(
			`
                SELECT 
                    id AS transaction_id,
                    item_id,
                    reason,
                    activity_type,
                    name_before_update AS item_name_before_update,
                    previous_quantity,
                    updated_quantity,
                    CASE
                        WHEN previous_quantity IS NULL THEN updated_quantity
                        WHEN updated_quantity IS NULL then previous_quantity
                        ELSE updated_quantity - previous_quantity
                    END AS quantity_change,
                    activity_done_at as date_updated
                FROM activity_history
                WHERE NOT (
                        previous_quantity IS NULL
                        AND updated_quantity IS NULL
                    ) AND NOT (previous_quantity = updated_quantity)
                ORDER BY date_updated DESC;
            `,
		);

		return rows.map((row) => ({
			transactionID: row.transaction_id,
			itemID: row.item_id,
			itemName: row.item_name_before_update,
			reason: row.reason,
			type: row.activity_type,
			quantityChange:
				parseFloat(row.quantity_change) > 0
					? `+${parseFloat(row.quantity_change)}`
					: parseFloat(row.quantity_change),
			dateUpdated: `${new Date(row.date_updated).toLocaleDateString([], { year: "numeric", month: "short", day: "numeric" })}`,
		}));
	} catch (error) {
		console.error("Error retrieving the transactions. ", error);
	}
}

async function getItemSpecificTransactions(itemID) {
	try {
		const { rows } = await pool.query(
			`
                SELECT 
                    id AS transaction_id,
                    item_id,
                    reason,
                    activity_type,
                    name_before_update AS item_name_before_update,
                    previous_quantity,
                    updated_quantity,
                    CASE
                        WHEN previous_quantity IS NULL THEN updated_quantity
                        WHEN updated_quantity IS NULL then previous_quantity
                        ELSE updated_quantity - previous_quantity
                    END AS quantity_change,
                    activity_done_at as date_updated
                FROM activity_history
                WHERE NOT (
                        previous_quantity IS NULL
                        AND updated_quantity IS NULL
                    ) AND NOT (previous_quantity = updated_quantity)
                    AND item_id = $1
                ORDER BY date_updated DESC;
            `,
			[itemID],
		);

		return rows.map((row) => ({
			transactionID: row.transaction_id,
			itemID: row.item_id,
			itemName: row.item_name_before_update,
			type: row.activity_type,
			reason: row.reason,
			quantityChange:
				parseFloat(row.quantity_change) > 0
					? `+${parseFloat(row.quantity_change)}`
					: parseFloat(row.quantity_change),
			dateUpdated: `${new Date(row.date_updated).toLocaleDateString([], { year: "numeric", month: "short", day: "numeric" })}`,
		}));
	} catch (error) {
		console.error("Error retrieving the transactions. ", error);
	}
}

async function getTransactionByID(id) {
	try {
		// Update the item quantity
		const { rows } = await pool.query(
			`
               SELECT 
                    id AS transaction_id,
                    item_id,
                    reason,
                    activity_type,
                    name_before_update AS item_name_before_update,
                    previous_quantity,
                    updated_quantity,
                    CASE
                        WHEN previous_quantity IS NULL THEN updated_quantity
                        WHEN updated_quantity IS NULL then previous_quantity
                        ELSE updated_quantity - previous_quantity
                    END AS quantity_change,
                    activity_done_at as date_updated
                FROM activity_history
                WHERE id = $1
                    AND NOT (
                        previous_quantity IS NULL
                        AND updated_quantity IS NULL
                    ) AND NOT (previous_quantity = updated_quantity)
            `,
			[id],
		);

		return {
			transactionID: rows[0].transaction_id,
			itemID: rows[0].item_id,
			itemName: rows[0].item_name_before_update,
			reason: rows[0].reason,
			type: rows[0].activity_type,
			quantityChange:
				parseFloat(rows[0].quantity_change) > 0
					? `+${parseFloat(rows[0].quantity_change)}`
					: parseFloat(rows[0].quantity_change),
			dateUpdated: `${new Date(rows[0].date_updated).toLocaleTimeString([], { year: "numeric", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}`,
		};
	} catch (error) {
		console.error("Error retrieving the transactions. ", error);
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
	updateItemQuantity,
	deleteItem,
	getAllTransactions,
	getTransactionByID,
	getActivityByItemID,
	getItemSpecificTransactions,
};
