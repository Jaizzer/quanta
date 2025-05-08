const asyncHandler = require("express-async-handler");
const db = require("../models/queries");

async function getNotifications(req, res, next) {
	let lowStockItems = (await db.getLowStockItems(true)) || [];
	const notifications = lowStockItems.map((lowStockItem) => ({
		itemID: lowStockItem.id,
		message: `${lowStockItem.name} ${
			Math.round(lowStockItem.quantity) ===
			Math.round(lowStockItem.min_level)
				? `has reached the set minimum level ${lowStockItem.min_level} ${lowStockItem.measurement}.`
				: `has went below the set minimum level ${lowStockItem.min_level} ${lowStockItem.measurement} with a current level ${lowStockItem.quantity} ${lowStockItem.measurement}.`
		}`,
	}));

	res.render("notifications", {
		title: "Notifications",
		notifications: notifications,
	});
}

module.exports = {
	getNotifications: asyncHandler(getNotifications),
};
