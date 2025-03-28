const asyncHandler = require("express-async-handler");
const getTotalItemQuantity = require("./getTotalItemQuantity");
const getTotalValue = require("./getTotalValue");

async function addItemGet(req, res, next) {
	res.render("itemAdding", {
		title: "Add Item",
		tags: ["Tag 1", "Tag 2", "Tag 3"],
	});
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

module.exports = {
	getItemById: asyncHandler(getItemById),
	getAllItems: asyncHandler(getAllItems),
	addItemGet: asyncHandler(addItemGet),
};
