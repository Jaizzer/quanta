const asyncHandler = require("express-async-handler");
const db = require("../models/queries");

async function rootGet(req, res, next) {
	const result = await db.getAllItems("date-updated-descending");

	const items = result?.items || [];
	const totalItemTypeQuantity = result?.totalItemTypeQuantity;
	const totalInventoryValue = result?.totalInventoryValue;

	const lowStockItems = await db.getLowStockItems();
	res.render("index", {
		title: "Home",
		recentlyUpdatedItems: items.slice(0, 10),
		lowStockItems: lowStockItems,
		summary: {
			totalItemTypeQuantity,
			totalInventoryValue,
		},
	});
}

module.exports = {
	rootGet: asyncHandler(rootGet),
};
