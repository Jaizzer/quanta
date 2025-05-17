const asyncHandler = require("express-async-handler");
const getTotalItemQuantity = require("./getTotalItemQuantity");
const getTotalValue = require("./getTotalValue");
const db = require("../models/queries");

async function inventorySummaryGet(req, res, next) {
	const result = await db.getAllItems("date-updated-descending");

	const items = result?.items || [];
	const totalItemTypeQuantity = result?.totalItemTypeQuantity;
	const totalInventoryValue = result?.totalInventoryValue;

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
