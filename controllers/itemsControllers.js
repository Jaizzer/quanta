const asyncHandler = require("express-async-handler");
const getTotalItemQuantity = require("./getTotalItemQuantity");
const getTotalValue = require("./getTotalValue");
const { body, validationResult } = require("express-validator");
const db = require("../models/queries");

const tags = [
	{ id: 1, name: "Tag 1" },
	{ id: 2, name: "Tag 2" },
	{ id: 3, name: "Tag 3" },
];

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
					id: "Variant-1",
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
		name: req.body.itemName,
		price: req.body.price === "" ? null : parseFloat(req.body.price),
		quantity:
			req.body.quantity === "" ? null : parseFloat(req.body.quantity),
		measurement: req.body.measurement,
		minLevel:
			req.body.minLevel === "" ? null : parseFloat(req.body.minLevel),
		notes: req.body.notes,
		notification: req.body.notificationStatus ? true : false,
		// Ensure tag is an array of id number
		tags: !req.body.tags
			? []
			: Array.isArray(req.body.tags)
				? req.body.tags.map((tagValue) => parseInt(tagValue))
				: [parseInt(req.body.tags)],
	};

	// Access all the variant property names
	const variantInputNames = Object.keys(req.body).filter((key) =>
		key.includes("Variant"),
	);

	// Extract all variants from the request body
	let variants = variantInputNames.map((variantInputName) => ({
		id: variantInputName,
		name: req.body[variantInputName][0],
		quantity: Math.abs(parseFloat(req.body[variantInputName][1])),
		price: Math.abs(parseFloat(req.body[variantInputName][2])),
		error: null,
	}));

	// Check each variant input for errors
	let isThereErrorInVariantInputs = false;
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

		// Update whether there is an error with the variant inputs
		isThereErrorInVariantInputs =
			isCurrentVariantNameNotUnique || isCurrentVariantEmpty;
	});

	// Insert the variants inside the item object
	item.variants = variants;

	// Check for non-variant and variant field errors
	const nonVariantFieldErrors = validationResult(req).array();
	const isThereErrorInNonVariantInputs = nonVariantFieldErrors.length > 0;
	const isThereAnyError =
		isThereErrorInNonVariantInputs || isThereErrorInVariantInputs;

	if (isThereAnyError) {
		return res.status(400).render("itemAdding", {
			title: "Add Item",
			tags: tags,
			itemNameError:
				isThereErrorInNonVariantInputs &&
				nonVariantFieldErrors.filter(
					(error) => error.path === "itemName",
				).length === 1
					? nonVariantFieldErrors.filter(
							(error) => error.path === "itemName",
						)[0].msg
					: null,
			itemPriceError:
				isThereErrorInNonVariantInputs &&
				nonVariantFieldErrors.filter((error) => error.path === "price")
					.length === 1
					? nonVariantFieldErrors.filter(
							(error) => error.path === "price",
						)[0].msg
					: null,
			itemTagError:
				isThereErrorInNonVariantInputs &&
				nonVariantFieldErrors.filter((error) => error.path === "tag")
					.length === 1
					? nonVariantFieldErrors.filter(
							(error) => error.path === "tag",
						)[0].msg
					: null,
			itemMinLevelError:
				isThereErrorInNonVariantInputs &&
				nonVariantFieldErrors.filter(
					(error) => error.path === "minLevel",
				).length === 1
					? nonVariantFieldErrors.filter(
							(error) => error.path === "minLevel",
						)[0].msg
					: null,
			itemQuantityError:
				isThereErrorInNonVariantInputs &&
				nonVariantFieldErrors.filter(
					(error) => error.path === "quantity",
				).length === 1
					? nonVariantFieldErrors.filter(
							(error) => error.path === "quantity",
						)[0].msg
					: null,
			item: item,
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
	item.updatedAt = "April 6, 2025";
	res.render("item", {
		title: item.name,
		item: item,
	});
}

const validateAddItemForm = [
	body("itemName")
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
	addItemPost: [validateAddItemForm, asyncHandler(addItemPost)],
};
