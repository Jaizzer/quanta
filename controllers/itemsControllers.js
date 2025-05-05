const asyncHandler = require("express-async-handler");
const getTotalItemQuantity = require("./getTotalItemQuantity");
const getTotalValue = require("./getTotalValue");
const { body, validationResult } = require("express-validator");
const db = require("../models/queries");
let _ = require("lodash");

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
			notes: "",
			measurement: "unit",
			variants: [],
		},
	});
}

async function addItemPost(req, res, next) {
	// Create an item object out of the request body's content
	const item = {
		name: req.body.name,
		price: req.body.price === "" ? null : parseFloat(req.body.price),
		quantity:
			req.body.quantity === "" ? null : parseFloat(req.body.quantity),
		measurement: req.body.measurement,
		minLevel:
			req.body.minLevel === "" ? null : parseFloat(req.body.minLevel),
		notes: req.body.notes.trim(),
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
	const items = await db.getAllItems();
	res.render("items", {
		title: "Items",
		items: items,
		totalQuantity: getTotalItemQuantity(items),
		totalValue: getTotalValue(items),
		distinctItemQuantity: items.length,
	});
}

async function getItemById(req, res, next) {
	const itemId = Number(req.params.id);
	const item = await db.getItemById(itemId);
	res.render("item", {
		title: item.name,
		item: item,
	});
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
		price: req.body.price === "" ? null : parseFloat(req.body.price),
		quantity:
			req.body.quantity === "" ? null : parseFloat(req.body.quantity),
		measurement: req.body.measurement,
		minLevel:
			req.body.minLevel === "" ? null : parseFloat(req.body.minLevel),
		notify: req.body.notify ? true : false,
		notes: req.body.notes.trim(),
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
		return res.status(400).render("itemAdding", {
			title: "Add Item",
			tags: tags,
			item: updatedItem,
			...itemErrors,
		});
	}

	// Compute all the modifications
	const modifications = trackItemChanges(previousVersionItem, updatedItem);

	await db.editItem(updatedItem);
	res.status(200).redirect(`/items/${idOfItemToEdit}`);
}

async function editItemQuantityGet(req, res, next) {
	res.render("editItemQuantity", {
		title: "Edit Quantity",
	});
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

module.exports = {
	getItemById: asyncHandler(getItemById),
	getAllItems: asyncHandler(getAllItems),
	addItemGet: asyncHandler(addItemGet),
	lowStockGet: asyncHandler(lowStockGet),
	editItemGet: asyncHandler(editItemGet),
	editItemPost: [validateAddItemForm, asyncHandler(editItemPost)],
	editItemQuantityGet: asyncHandler(editItemQuantityGet),
	addItemPost: [validateAddItemForm, asyncHandler(addItemPost)],
};

function trackItemChanges(previousVersion, updatedVersion) {
	// Identify which item attributes to access
	const attributes = [
		"name",
		"price",
		"quantity",
		"measurement",
		"notes",
		"notify",
		"minLevel",
		"tags",
	];

	// Save the item's name before performing the edits
	const modifications = { itemNameBeforeEdit: previousVersion.name };

	// Loop through all item attributes
	attributes.forEach((attribute) => {
		if (attribute !== "tags") {
			modifications[attribute] = getAttributeModificationDescription(
				previousVersion[attribute],
				updatedVersion[attribute],
				attribute,
			);
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
				modifications[attribute] = {
					added:
						addedTags.length !== 0
							? `Added the tags ${joinWithAnd(addedTags.map((addedElement) => addedElement.name))}.`
							: null,
					removed:
						removedTags.length !== 0
							? `Removed the ${removedTags.length > 1 ? attribute : attribute.substring(0, attribute.length - 1)} ${joinWithAnd(removedTags.map((removedElement) => removedElement.name))}.`
							: null,
				};
			} else {
				modifications[attribute] = null;
			}
		}
	});

	return modifications;
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
		quantity:
			// Only convert the quantity input if it's not empty
			req.body[variantInputName][1] !== ""
				? Math.abs(parseFloat(req.body[variantInputName][1]))
				: null,
		price:
			// Only convert the price input if it's not empty
			req.body[variantInputName][2] !== ""
				? Math.abs(parseFloat(req.body[variantInputName][2]))
				: null,
		measurement: req.body.measurement,
		minLevel:
			req.body.minLevel === "" ? null : parseFloat(req.body.minLevel),
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

function getAttributeModificationDescription(
	previousValue,
	newValue,
	attribute,
	itemName,
) {
	// Don't create a modification description if there's no modification
	if (previousValue === newValue) {
		return null;
	}

	if (attribute === "notify" && previousValue !== newValue) {
		return `Turned notify ${previousValue ? "off" : "on"}`;
	} else if (previousValue && newValue) {
		return `Updated the${itemName ? ` ${itemName}'s` : ""} ${attribute} from ${previousValue} to ${newValue}.`;
	} else if (!previousValue && newValue) {
		return `Added a ${attribute === "minLevel" ? "minimum level" : attribute} of ${newValue}${itemName ? ` to ${itemName}` : ""}.`;
	} else if (previousValue && !newValue) {
		return `Removed the ${attribute}${itemName ? ` from ${itemName}` : ""}.`;
	}
}
