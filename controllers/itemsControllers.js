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
	});
}

async function addItemPost(req, res, next) {
	const errors = validationResult(req).array();
	const isThereAnyError = errors.length !== 0;
	if (isThereAnyError) {
		return res.status(400).render("itemAdding", {
			title: "Add Item",
			tags: tags,
			itemNameError:
				isThereAnyError &&
				errors.filter((error) => error.path === "itemName").length === 1
					? errors.filter((error) => error.path === "itemName")[0].msg
					: null,
			itemPriceError:
				isThereAnyError &&
				errors.filter((error) => error.path === "price").length === 1
					? errors.filter((error) => error.path === "price")[0].msg
					: null,
			itemTagError:
				errors.filter((error) => error.path === "tag").length === 1
					? errors.filter((error) => error.path === "tag")[0].msg
					: null,
			itemMinLevelError:
				errors.filter((error) => error.path === "minLevel").length === 1
					? errors.filter((error) => error.path === "minLevel")[0].msg
					: null,
			itemQuantityError:
				errors.filter((error) => error.path === "quantity").length === 1
					? errors.filter((error) => error.path === "quantity")[0].msg
					: null,
		});
	}

	const item = {
		name: req.body.itemName,
		price: req.body.price === "" ? null : parseFloat(req.body.price),
		quantity:
			req.body.quantity === "" ? null : parseFloat(req.body.quantity),
		measurement: req.body.measurement,
		minLevel:
			req.body.minLevel === "" ? null : parseFloat(req.body.minLevel),
		notes: req.body.notes,
		notificationStatus: req.body.notificationStatus ? true : false,
		// Ensure tag is an array of id number
		tags: !req.body.tags
			? null
			: Array.isArray(req.body.tags)
				? req.body.tags.map((tagValue) => parseInt(tagValue))
				: [parseInt(req.body.tags)],
	};
	await db.insertItem(item);
	res.status(200).redirect("/items");
}

async function getAllItems(req, res, next) {
	const items = [
		{
			id: 24,
			name: "Item 78",
			quantity: 5,
			minLevel: 1,
			tags: ["Tag 1", "Tag2"],
			updatedAt: "Mar 20",
			price: 25,
			totalValue: 50,
		},

		{
			id: 25,
			name: "Item 99",
			quantity: 5,
			minLevel: 1,
			tags: ["Tag 1", "Tag3"],
			updatedAt: "Mar 20",
			price: 25,
			totalValue: 50,
		},
	];

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
	const items = [
		{
			id: 24,
			name: "Item 78",
			quantity: 5,
			minLevel: 1,
			tags: ["Tag 1", "Tag2"],
			updatedAt: "Mar 20",
			price: 25,
			totalValue: 50,
		},
	];

	const [item] = items.filter((item) => item.id === itemId);

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
