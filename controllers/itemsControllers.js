const asyncHandler = require("express-async-handler");
const getTotalItemQuantity = require("./getTotalItemQuantity");
const getTotalValue = require("./getTotalValue");
const { body, validationResult } = require("express-validator");
const db = require("../models/queries");
let _ = require("lodash");
let parseNumberInput = require("../utils/parseNumberInput.js");

// Get the tags from the database
let tags;
(async () => {
	tags = await db.getAllTags();
})();

async function addItemGet(req, res, next) {
	res.render("itemAdding", {
		title: "Add Item",
		tags: tags,
		itemNameError: null,
		itemPriceError: null,
		itemTagError: null,
		itemMinLevelError: null,
		itemQuantityError: null,
		item: {
			name: "Item",
			price: 0,
			quantity: 0,
			minLevel: 0,
			notify: false,
			tags: [],
			note: "",
			measurement: "unit",
			variants: [],
		},
	});
}

async function addItemPost(req, res, next) {
	// Create an item object out of the request body's content
	const item = {
		name: req.body.name,
		price: parseNumberInput(req.body.price).toFixed(2),
		quantity: parseNumberInput(req.body.quantity),
		measurement: req.body.measurement,
		minLevel: parseNumberInput(req.body.minLevel),
		note: req.body.note.trim(),
		notify: req.body.notify ? true : false,
		variants: req.body?.variantStatus ? getVariantsArray(req) : [],
		// Ensure tag is an array of id number
		tags: !req.body.tags
			? []
			: Array.isArray(req.body.tags)
				? req.body.tags.map((tagValue) => parseInt(tagValue))
				: [parseInt(req.body.tags)],
	};

	// Check for non-variant field errors
	const nonVariantFieldErrors = validationResult(req).array();
	const isThereErrorInNonVariantInputs = nonVariantFieldErrors.length > 0;

	if (isThereErrorInNonVariantInputs) {
		const itemErrors = isThereErrorInNonVariantInputs
			? getItemErrors(nonVariantFieldErrors)
			: null;
		return res.status(400).render("itemAdding", {
			title: "Add Item",
			tags: tags,
			item: item,
			...itemErrors,
		});
	}

	await db.insertItem(item);
	res.status(200).redirect("/items");
}

async function getAllItems(req, res, next) {
	const sortOption = req.query.sort;

	let result = [];
	if (sortOption) {
		result = await db.getAllItems(sortOption);
	} else {
		result = await db.getAllItems();
	}

	const { items, totalItemTypeQuantity, totalInventoryValue } = result;

	res.render("items", {
		title: "Items",
		items: items,
		totalItemTypeQuantity: totalItemTypeQuantity,
		totalInventoryValue: totalInventoryValue,
		sortOptions: [
			{ value: "", name: "Sort By", isSelected: !sortOption },
			{
				value: "name-ascending",
				name: "Name (Ascending)",
				isSelected: sortOption === "name-ascending",
			},
			{
				value: "name-descending",
				name: "Name (Descending)",
				isSelected: sortOption === "name-descending",
			},
			{
				value: "date-added-ascending",
				name: "Date Created (Oldest to Newest)",
				isSelected: sortOption === "date-added-ascending",
			},
			{
				value: "date-added-descending",
				name: "Date Created (Newest to Oldest)",
				isSelected: sortOption === "date-added-descending",
			},
			{
				value: "date-updated-ascending",
				name: "Date Updated (Oldest to Newest)",
				isSelected: sortOption === "date-updated-ascending",
			},
			{
				value: "date-updated-descending",
				name: "Date Updated (Newest to Oldest)",
				isSelected: sortOption === "date-updated-descending",
			},
		],
	});
}

async function getItemById(req, res, next) {
	const itemId = Number(req.params.id);
	const item = await db.getItemById(itemId);

	// Render the item page if the item exists
	if (item) {
		res.render("item", {
			title: item.name,
			item: item,
		});
	} else {
		// Render an error page if the item does not exist.
		res.render("error", {
			title: "Item Not Found",
			message: "The item does not exist.",
		});
	}
}

async function lowStockGet(req, res, next) {
	let lowStockItems = (await db.getLowStockItems()) || [];
	res.render("lowStock", {
		title: "Low Stock",
		items: lowStockItems,
	});
}

async function editItemGet(req, res, next) {
	const idOfItemToEdit = req.params.id;
	const item = await db.getItemById(idOfItemToEdit);

	// Add variant template
	if (item.variants.length === 0) {
		item.variants = [
			{
				id: 1,
				name: "Variant-1",
				price: 0,
				quantity: 0,
				error: null,
			},
		];
	}

	res.render("itemEdit", {
		title: "Item Edit",
		item: item,
		tags: tags,
		itemNameError: null,
		itemPriceError: null,
		itemTagError: null,
		itemMinLevelError: null,
		itemQuantityError: null,
	});
}

async function editItemPost(req, res, next) {
	const idOfItemToEdit = req.params.id;

	// Access the previous version of the item to edit
	const previousVersionItem = await db.getItemById(idOfItemToEdit);

	// Create an updated item object out of the request body's content
	const updatedItem = {
		id: idOfItemToEdit,
		name: req.body.name,
		price: parseNumberInput(req.body.price).toFixed(2),
		quantity: parseNumberInput(req.body.quantity),
		measurement: req.body.measurement,
		minLevel: parseNumberInput(req.body.minLevel),
		notify: req.body.notify ? true : false,
		note: req.body.note.trim(),
		variants: req.body?.variantStatus ? getVariantsArray(req) : null,
		// Ensure tag is an array of tag object containing tag ID and tag name
		tags: !req.body.tags
			? []
			: Array.isArray(req.body.tags)
				? getTagsWithName(
						req.body.tags.map((tagValue) => parseInt(tagValue)),
					)
				: getTagsWithName([parseInt(req.body.tags)]),
	};

	// Check for non-variant field errors
	const nonVariantFieldErrors = validationResult(req).array();
	const isThereErrorInNonVariantInputs = nonVariantFieldErrors.length > 0;

	if (isThereErrorInNonVariantInputs) {
		const itemErrors = isThereErrorInNonVariantInputs
			? getItemErrors(nonVariantFieldErrors)
			: null;
		return res.status(400).render("itemEdit", {
			title: "Add Item",
			tags: tags,
			item: updatedItem,
			...itemErrors,
		});
	}

	// Compute all the updateSummary
	const updateSummary = getItemUpdateSummary(
		previousVersionItem,
		updatedItem,
	);

	// Check if there are updates
	const isThereUpdates = Object.keys(updateSummary)
		.filter((attribute) => attribute !== "itemNameBeforeEdit")
		.map((attribute) => updateSummary[attribute])
		.reduce((acc, curr) => acc || curr !== null, false);

	// Edit the item if there are updates
	if (isThereUpdates) {
		await db.editItem(updatedItem, updateSummary);
	}

	res.status(200).redirect(`/items/${idOfItemToEdit}`);
}

async function editItemQuantityGet(req, res, next) {
	const idOfItemToEdit = req.params.id;
	const item = await db.getItemById(idOfItemToEdit);
	res.render("editItemQuantity", {
		title: "Edit Quantity",
		item: item,
		reasons: [
			"Consumed",
			"Damaged",
			"Inventory Count Adjustment",
			"Picked",
			"Restocked",
			"Returned",
			"Sold",
			"Stocktake",
			"Stolen",
		],
	});
}

async function editItemQuantityPost(req, res, next) {
	const idOfItemToEdit = req.params.id;
	const itemToEdit = await db.getItemById(idOfItemToEdit);
	const previousQuantity = itemToEdit.quantity;

	const newQuantity = parseNumberInput(req.body.newQuantity);
	const reason = req.body.reason;

	const updateSummary = {
		itemNameBeforeEdit: itemToEdit.name,
		quantity: {
			description: [
				`Updated the quantity from '${previousQuantity}' to '${newQuantity}'.`,
			],
			previousValue: previousQuantity,
			updatedValue: newQuantity,
		},
	};

	const isThereQuantityUpdate = newQuantity !== previousQuantity;

	// Edit the item only if there's an update
	if (isThereQuantityUpdate) {
		await db.updateItemQuantity(itemToEdit.id, reason, updateSummary);
	}

	res.status(200).redirect(`/items/${idOfItemToEdit}`);
}

async function addVariantGet(req, res, next) {
	// Check first if the parent item exists
	const parentID = req.params.id;
	const parentItem = await db.getItemById(parentID);

	if (parentItem) {
		res.render("itemVariantAdding", {
			title: "Add Variant",
			tags: tags,
			itemNameError: null,
			itemPriceError: null,
			itemTagError: null,
			itemMinLevelError: null,
			itemQuantityError: null,
			item: {
				parent: {
					id: parentID,
					name: parentItem.name,
				},
				name: "Variant",
				price: 0,
				quantity: 0,
				minLevel: 0,
				notify: false,
				tags: [],
				note: "",
				measurement: "unit",
				variants: [],
			},
		});
	} else {
		res.render("error", {
			title: "Add Variant",
			message: "Parent item does not exist.",
		});
	}
}

async function addVariantPost(req, res, next) {
	// Get the parent item
	const parentID = req.params.id;
	const parentItem = await db.getItemById(parentID);

	// Create an item object out of the request body's content
	const item = {
		parent: {
			id: parentItem.id,
			name: parentItem.name,
		},
		name: req.body.name,
		price: parseNumberInput(req.body.price).toFixed(2),
		quantity: parseNumberInput(req.body.quantity),
		measurement: req.body.measurement,
		minLevel: parseNumberInput(req.body.minLevel),
		note: req.body.note.trim(),
		notify: req.body.notify ? true : false,
		variants: req.body?.variantStatus ? getVariantsArray(req) : [],
		// Ensure tag is an array of id number
		tags: !req.body.tags
			? []
			: Array.isArray(req.body.tags)
				? req.body.tags.map((tagValue) => parseInt(tagValue))
				: [parseInt(req.body.tags)],
	};

	// Check for non-variant field errors
	const nonVariantFieldErrors = validationResult(req).array();
	const isThereErrorInNonVariantInputs = nonVariantFieldErrors.length > 0;

	if (isThereErrorInNonVariantInputs) {
		const itemErrors = isThereErrorInNonVariantInputs
			? getItemErrors(nonVariantFieldErrors)
			: null;
		return res.status(400).render("itemVariantAdding", {
			title: "Add Variant",
			tags: tags,
			item: item,
			...itemErrors,
		});
	}
	await db.insertItem(item);
	res.status(200).redirect(`/items/${parentItem.id}`);
}

const validateAddItemForm = [
	body("name")
		.trim()
		.isLength({ min: 1 })
		.withMessage("Item name must not be empty."),

	body("quantity")
		.optional({ values: "falsy" })
		.isFloat({ min: 0 })
		.withMessage("Item quantity must be at least 0"),

	body("minLevel")
		.optional({ values: "falsy" })
		.isFloat({ min: 0 })
		.withMessage("Item minimum level must be at least 0"),

	body("price")
		.optional({ values: "falsy" })
		.isFloat({ min: 0 })
		.withMessage("Item price must be at least 0"),

	body("tags").custom((value, { req }) => {
		if (value) {
			// Get all available tag id
			const availableTagIDs = tags.map((tag) => tag.id);

			// Ensure submitted tag IDs are stored in array.
			const submittedTagIDs = Array.isArray(value)
				? value.map((tagID) => parseInt(tagID))
				: [parseInt(value)];

			// Check if the submitted tag IDs are found in the available tag IDs
			const isEveryTagInDatabase = submittedTagIDs.every((tagID) => {
				return availableTagIDs.includes(tagID);
			});

			if (!isEveryTagInDatabase) {
				throw new Error("Tag/s must not have non-existent values.");
			}
		}

		return "Something just to prevent express-validator throwing error if nothing is returned :)";
	}),
];

async function editItemsGet(req, res, next) {
	const items = await db.getAllItems();
	res.render("editItems", {
		title: "Edit Items",
		items: items,
	});
}

async function deleteItem(req, res, next) {
	const { itemID } = req.body;
	const item = await db.getItemById(itemID);
	await db.deleteItem(item);

	// Check if the delete request came from an item page
	const isDeleteRequestFromItemPage = req.originalUrl === "/items/delete";

	if (isDeleteRequestFromItemPage) {
		// Redirect back to items if the delete request came from the item page
		res.status(200).redirect("/items");
	} else {
		// Redirect back to the edit-items page if the delete request came from the edit-items page
		res.status(200).redirect("/items/edit-items");
	}
}

module.exports = {
	getItemById: asyncHandler(getItemById),
	getAllItems: asyncHandler(getAllItems),
	addItemGet: asyncHandler(addItemGet),
	lowStockGet: asyncHandler(lowStockGet),
	editItemGet: asyncHandler(editItemGet),
	editItemPost: [validateAddItemForm, asyncHandler(editItemPost)],
	editItemQuantityGet: asyncHandler(editItemQuantityGet),
	editItemQuantityPost: asyncHandler(editItemQuantityPost),
	addItemPost: [validateAddItemForm, asyncHandler(addItemPost)],
	addVariantGet: asyncHandler(addVariantGet),
	addVariantPost: [validateAddItemForm, asyncHandler(addVariantPost)],
	editItemsGet: asyncHandler(editItemsGet),
	deleteItem: asyncHandler(deleteItem),
};

function getItemUpdateSummary(previousVersion, updatedVersion) {
	// Identify which item attributes to access
	const attributes = [
		"name",
		"price",
		"quantity",
		"measurement",
		"note",
		"notify",
		"minLevel",
		"tags",
	];

	// Save the item's name before performing the edits
	const updateSummary = { itemNameBeforeEdit: previousVersion.name };

	// Loop through all item attributes
	attributes.forEach((attribute) => {
		if (attribute !== "tags") {
			const isThereAnyChanges =
				previousVersion[attribute] !== updatedVersion[attribute];
			if (isThereAnyChanges) {
				updateSummary[attribute] = {
					previousValue: previousVersion[attribute],
					updatedValue: updatedVersion[attribute],
					description: [
						getAttributeUpdateDescription(
							previousVersion[attribute],
							updatedVersion[attribute],
							attribute,
						),
					],
				};
			} else {
				updateSummary[attribute] = null;
			}
		} else {
			// Get the added tags
			const addedTags = _.differenceBy(
				updatedVersion[attribute],
				previousVersion[attribute],
				"id",
			);

			// Get the removed tags
			const removedTags = _.differenceBy(
				previousVersion[attribute],
				updatedVersion[attribute],
				"id",
			);

			// Only assign value to the 'tags' property if there are either added or removed tags
			if (addedTags.length !== 0 || removedTags.length !== 0) {
				updateSummary[attribute] = {
					previousValue: previousVersion[attribute],
					updatedValue: updatedVersion[attribute],
					description: [
						addedTags.length !== 0
							? `Added the tags ${joinWithAnd(addedTags.map((addedElement) => addedElement.name))}.`
							: null,

						removedTags.length !== 0
							? `Removed the ${removedTags.length > 1 ? attribute : attribute.substring(0, attribute.length - 1)} ${joinWithAnd(removedTags.map((removedElement) => removedElement.name))}.`
							: null,
					].filter((description) => description !== null),
				};
			} else {
				updateSummary[attribute] = null;
			}
		}
	});

	return updateSummary;
}

function joinWithAnd(array) {
	return array.reduce(
		(a, b, i, arr) => a + (i < arr.length - 1 ? ", " : " and ") + b,
	);
}

function getTagsWithName(tagIDs) {
	let tagsToReturn = [];
	tagIDs?.forEach((tagID) => {
		tags.forEach((tag) => {
			if (tag.id === tagID) {
				tagsToReturn.push({
					id: tag.id,
					name: tag.name,
				});
			}
		});
	});
	return tagsToReturn;
}

function getVariantsArray(req) {
	// Access all the variant property names
	const variantInputNames = Object.keys(req.body).filter((key) =>
		key.includes("Variant"),
	);

	// Extract all variants from the request body
	let variants = variantInputNames.map((variantInputName) => ({
		name: req.body[variantInputName][0]?.trim(),
		quantity: parseNumberInput(req.body[variantInputName][1]),
		price: parseNumberInput(req.body[variantInputName][2]),
		measurement: req.body.measurement,
		minLevel: parseNumberInput(req.body.minLevel),
		notify: req.body.notify ? true : false,
		// Ensure tag is an array of id number
		tags: !req.body.tags
			? []
			: Array.isArray(req.body.tags)
				? req.body.tags.map((tagValue) => parseInt(tagValue))
				: [parseInt(req.body.tags)],
	}));
	return variants;
}

function getItemErrors(nonVariantFieldErrors) {
	let itemErrors = {};
	const itemAttributes = ["name", "price", "tag", "minLevel", "quantity"];

	itemAttributes.forEach((itemAttribute) => {
		itemErrors[
			`item${itemAttribute.charAt(0).toUpperCase() + itemAttribute.slice(1)}Error`
		] =
			nonVariantFieldErrors.filter(
				(error) => error.path === itemAttribute,
			).length === 1
				? nonVariantFieldErrors.filter(
						(error) => error.path === itemAttribute,
					)[0].msg
				: null;
	});

	return itemErrors;
}

function getAttributeUpdateDescription(
	previousValue,
	newValue,
	attribute,
	itemName,
) {
	// Don't create a update description if there's no update
	if (previousValue === newValue) {
		return null;
	}

	if (attribute === "notify" && previousValue !== newValue) {
		return `Turned notification ${previousValue ? "off" : "on"}`;
	} else if (previousValue && newValue) {
		return `Updated the${itemName ? ` ${itemName}'s` : ""} ${attribute} from ${previousValue} to ${newValue}.`;
	} else if (!previousValue && newValue) {
		return `Added a ${attribute === "minLevel" ? "minimum level" : attribute} with the value of ${newValue}${itemName ? ` to ${itemName}` : ""}.`;
	} else if (previousValue && !newValue) {
		return `Removed the ${attribute}${itemName ? ` from ${itemName}` : ""}.`;
	}
}
