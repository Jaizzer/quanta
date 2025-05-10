const asyncHandler = require("express-async-handler");
const getTotalItemQuantity = require("./getTotalItemQuantity");
const getTotalValue = require("./getTotalValue");
const db = require("../models/queries");

async function inventorySummaryGet(req, res, next) {
	const { items, totalItemTypeQuantity, totalInventoryValue } =
		await db.getAllItems("date-updated-descending");

	res.render("inventorySummary", {
		title: "Inventory Summary",
		items,
		summary: {
			totalItemTypeQuantity,
			totalInventoryValue,
		},
	});
}

module.exports = {
	inventorySummaryGet: asyncHandler(inventorySummaryGet),
};
