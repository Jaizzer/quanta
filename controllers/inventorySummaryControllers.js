const asyncHandler = require("express-async-handler");
const getTotalItemQuantity = require("./getTotalItemQuantity");

async function rootGet(req, res, next) {
	const totalValue = 45.21;
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

	res.render("inventorySummary", {
		title: "Home",
		totalQuantity: totalQuantity,
		totalValue: totalValue,
		items: items,
	});
}

module.exports = {
	rootGet: asyncHandler(rootGet),
};
