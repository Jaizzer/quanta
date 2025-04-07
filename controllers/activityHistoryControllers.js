const asyncHandler = require("express-async-handler");
const db = require("../models/queries.js");

async function activityHistoryGet(req, res, next) {
	const activities = (await db.getAllActivities()).map((activity) => {
		// Transform the activity object with link property
		const { item_id, category_id, description, entity_name } = activity;
		return {
			description: description,
			entityName: entity_name,
			link: item_id ? `/items/${item_id}` : `/tags?${category_id}`,
		};
	});
	res.render("activityHistory", {
		title: "Activity History",
		activities: activities,
	});
}

module.exports = {
	activityHistoryGet: asyncHandler(activityHistoryGet),
};
