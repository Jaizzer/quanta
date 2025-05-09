const asyncHandler = require("express-async-handler");
const db = require("../models/queries.js");

async function activityHistoryGet(req, res, next) {
	const activities = await db.getAllActivities();
	res.render("activityHistory", {
		title: "Activity History",
		activities: activities,
	});
}

module.exports = {
	activityHistoryGet: asyncHandler(activityHistoryGet),
};