const asyncHandler = require("express-async-handler");

async function rootGet(req, res, next) {
	const totalQuantity = 25;
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
