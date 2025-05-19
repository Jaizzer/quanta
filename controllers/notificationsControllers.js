const asyncHandler = require("express-async-handler");
const db = require("../models/queries");

async function getNotifications(req, res, next) {
	let lowStockItems = (await db.getLowStockItems(true)) || [];
	const notifications = lowStockItems.map((lowStockItem) => ({
		itemID: lowStockItem.id,
		message: `'${lowStockItem.name}' ${
			Math.round(lowStockItem.quantity) ===
			Math.round(lowStockItem.minLevel)
				? `has reached the set minimum level of ${lowStockItem.minLevel} ${lowStockItem.minLevel <= 1 ? ` ${lowStockItem.measurement}` : ` ${lowStockItem.measurement}s`}.`
				: `has went below the set minimum level of ${lowStockItem.minLevel} ${lowStockItem.minLevel <= 1 ? ` ${lowStockItem.measurement}` : ` ${lowStockItem.measurement}s`} with a current level of ${lowStockItem.quantity} ${lowStockItem.quantity <= 1 ? ` ${lowStockItem.measurement}` : ` ${lowStockItem.measurement}s`}.`
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
