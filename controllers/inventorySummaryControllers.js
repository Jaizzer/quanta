const asyncHandler = require("express-async-handler");
const getTotalItemQuantity = require("./getTotalItemQuantity");
const getTotalValue = require("./getTotalValue");

async function inventorySummaryGet(req, res, next) {
	const items = [
		{
			id: 3,
			name: "Item 1",
			quantity: 2,
			price: 25,
		},
		{
			id: 4,
			name: "Item 2",
			quantity: 2,
			price: 45,
		},
	];
	const totalQuantity = getTotalItemQuantity(items);
	const totalValue = getTotalValue(items);

	res.render("inventorySummary", {
		title: "Home",
		totalQuantity: totalQuantity,
		totalValue: totalValue,
		items: items,
	});
}

module.exports = {
	inventorySummaryGet: asyncHandler(inventorySummaryGet),
};
