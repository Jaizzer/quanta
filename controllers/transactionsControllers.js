const asyncHandler = require("express-async-handler");

async function rootGet(req, res, next) {
	const transactions = [
		{
			id: 24,
			itemId: 2,
			itemName: "Item 78",
			type: "Update",
			reason: "Restocked",
			quantityChange: "+5",
			date: "Mar 20",
		},
		{
			id: 24,
			itemId: 2,
			itemName: "Item 45",
			type: "Update",
			reason: "Damaged",
			quantityChange: "-7",
			date: "Mar 20",
		},
	];

	res.render("transactions", {
		title: "Transactions",
		transactions: transactions,
	});
}

module.exports = {
	rootGet: asyncHandler(rootGet),
};
