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
			notification: false,
			tags: [],
			notes: "",
			measurement: "unit",
			variants: [
				{
					id: 1,
					name: "Variant-1",
					price: 0,
					quantity: 0,
					error: null,
				},
			],
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
		notes: req.body.notes,
		notification: req.body.notify ? true : false,
		variants: getVariantsArray(req),
		// Ensure tag is an array of id number
		tags: !req.body.tags
			? []
			: Array.isArray(req.body.tags)
				? req.body.tags.map((tagValue) => parseInt(tagValue))
				: [parseInt(req.body.tags)],
	};

	// Check for non-variant and variant field errors
	const isThereErrorInVariantInputs = checkVariantErrors(item.variants);
	const nonVariantFieldErrors = validationResult(req).array();
	const isThereErrorInNonVariantInputs = nonVariantFieldErrors.length > 0;
	const isThereAnyError =
		isThereErrorInNonVariantInputs || isThereErrorInVariantInputs;

	if (isThereAnyError) {
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
		notes: req.body.notes,
		variants: getVariantsArray(req),
		// Ensure tag is an array of tag object containing tag ID and tag name
		tags: !req.body.tags
			? []
			: Array.isArray(req.body.tags)
				? getTagsWithName(
						req.body.tags.map((tagValue) => parseInt(tagValue)),
					)
				: [parseInt(req.body.tags)],
	};

	// Check for non-variant and variant field errors
	const isThereErrorInVariantInputs = checkVariantErrors(
		updatedItem.variants,
	);
	const nonVariantFieldErrors = validationResult(req).array();
	const isThereErrorInNonVariantInputs = nonVariantFieldErrors.length > 0;
	const isThereAnyError =
		isThereErrorInNonVariantInputs || isThereErrorInVariantInputs;

	if (isThereAnyError) {
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
	const modifications = getItemModification(previousVersionItem, updatedItem);

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
		.withMessage("Item name must be atleast 1 character"),

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

function getItemModification(previousVersion, updatedVersion) {
	// Identify which item attributes to access
	const attributes = [
		"name",
		"price",
		"quantity",
		"measurement",
		"notes",
		"notify",
		"minLevel",
		"variants",
		"tags",
	];

	// Save the item's name before performing the edits
	const modifications = { itemNameBeforeEdit: previousVersion.name };

	// Loop through all item attributes
	attributes.forEach((attribute) => {
		if (attribute !== "variants" && attribute !== "tags") {
			modifications[attribute] = getAttributeModificationDescription(
				previousVersion[attribute],
				updatedVersion[attribute],
				attribute,
			);
		} else {
			// Get the added tags or variants
			const addedElements = _.differenceBy(
				updatedVersion[attribute],
				previousVersion[attribute],
				"id",
			);

			// Get the removed tags or variants
			const removedElements = _.differenceBy(
				previousVersion[attribute],
				updatedVersion[attribute],
				"id",
			);

			// Get the modified variants
			const modifiedElements = [];
			if (attribute === "variants") {
				// Get the retained variants
				const retainedVariantIDs = _.intersectionBy(
					previousVersion[attribute],
					updatedVersion[attribute],
					"id",
				).map((retainedVariant) => retainedVariant.id);

				// Check if the retained variants were modified
				retainedVariantIDs?.forEach((retainedVariantID) => {
					// Get the previous variant version
					const previousVariantVersion = previousVersion[
						attribute
					].filter((variant) => variant.id === retainedVariantID)[0];

					// Get the updated variant version
					const updatedVariantVersion = updatedVersion[
						attribute
					].filter((variant) => variant.id === retainedVariantID)[0];

					// Create the array of variant modification description
					const variantModificationDescriptions = [
						"name",
						"price",
						"quantity",
					]
						.map((attribute) => {
							return getAttributeModificationDescription(
								previousVariantVersion[attribute],
								updatedVariantVersion[attribute],
								attribute,
								`variant ${previousVariantVersion.name}`,
							);
						})
						.filter((element) => element);

					// Only add the variant modification object if at least one property was modified
					const isThereModification =
						variantModificationDescriptions.length !== 0;
					if (isThereModification) {
						modifiedElements.push({
							variantNameBeforeEdit: previousVariantVersion.name,
							variantModifications:
								variantModificationDescriptions,
						});
					}
				});
			}

			// Only assign an object to the variants or tags property if there are either added, removed or modified elements
			if (
				addedElements.length !== 0 ||
				removedElements.length !== 0 ||
				modifiedElements.length !== 0
			) {
				modifications[attribute] = {
					added:
						addedElements.length !== 0
							? attribute === "variants"
								? addedElements.map(
										(addedElement) =>
											`Added the variant ${addedElement.name}${attribute === "variants" ? ` with price ${addedElement.price} and quantity ${addedElement.quantity}.` : "."}`,
									)
								: `Added the tags ${joinWithAnd(addedElements.map((addedElement) => addedElement.name))}.`
							: null,
					removed:
						removedElements.length !== 0
							? `Removed the ${removedElements.length > 1 ? attribute : attribute.substring(0, attribute.length - 1)} ${joinWithAnd(removedElements.map((removedElement) => removedElement.name))}.`
							: null,
					// Only include 'modified' property for 'variants' attribute
					...(attribute === "variants" && {
						modified: modifiedElements,
					}),
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
		id: parseInt(variantInputName.split("-")[1]),
		name: req.body[variantInputName][0],
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
		error: null,
	}));

	variants.forEach((currentVariant) => {
		// Check for duplicates
		let isCurrentVariantNameNotUnique =
			variants.filter((variant) => variant.name === currentVariant.name)
				.length > 1;

		if (isCurrentVariantNameNotUnique) {
			currentVariant.error = "Variant name must be unique";
		}

		// Check for empty variant names
		let isCurrentVariantEmpty = currentVariant.name.trim().length === 0;

		if (isCurrentVariantEmpty) {
			currentVariant.error = "Variant name must not be empty";
		}
	});

	return variants;
}

function checkVariantErrors(variants) {
	if (variants) {
		return variants.reduce((acc, curr) => !!acc || !!curr.error, false);
	}
	return false;
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
		return `Turned notification ${previousValue ? "off" : "on"}`;
	} else if (previousValue && newValue) {
		return `Updated the${itemName ? ` ${itemName}'s` : ""} ${attribute} from ${previousValue} to ${newValue}.`;
	} else if (!previousValue && newValue) {
		return `Added a ${attribute === 'minLevel' ? 'minimum level' : attribute} of ${newValue}${itemName ? ` to ${itemName}` : ""}.`;
	} else if (previousValue && !newValue) {
		return `Removed the ${attribute}${itemName ? ` from ${itemName}` : ""}.`;
	}
}
