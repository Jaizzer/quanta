const asyncHandler = require("express-async-handler");
const db = require("../models/queries.js");

async function activityHistoryGet(req, res, next) {
	const activities = await db.getAllActivities();
	res.render("activityHistory", {
		title: "Activity History",
		activities: activities,
	});
}

async function getItemActivityHistory(req, res, next) {
	const itemID = req.params.id;
	const item = await db.getItemById(itemID);
	const activities = await db.getActivityByItemID(itemID);

	if (item) {
		res.render("activityHistory", {
			title: `${item.name} History`,
			activities: activities,
            itemName: item.name
		});
	} else {
		res.render("error", {
			title: "Activity History Not Found",
			message: "Item does not exist.",
		});
	}
}

module.exports = {
	activityHistoryGet: asyncHandler(activityHistoryGet),
	getItemActivityHistory: asyncHandler(getItemActivityHistory),
};