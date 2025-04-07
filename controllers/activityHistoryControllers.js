const asyncHandler = require("express-async-handler");
const db = require("../models/queries.js");
const { intervalToDuration } = require("date-fns");

async function activityHistoryGet(req, res, next) {
	const activities = (await db.getAllActivities()).map((activity) => {
		// Transform the activity object with link property
		const {
			item_id,
			category_id,
			description,
			entity_name,
			activity_done_at,
		} = activity;
		return {
			description: description,
			entityName: entity_name,
			link: item_id ? `/items/${item_id}` : `/tags?${category_id}`,
			timePassed: getTimePassed(activity_done_at),
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

function getTimePassed(date) {
	const { years, months, days, hours, minutes, seconds } = intervalToDuration(
		{
			start: new Date(date),
			end: new Date(),
		},
	);

	if (years) {
		return `${years}yr`;
	} else if (months) {
		return `${months}mo`;
	} else if (days) {
		return `${days}d`;
	} else if (hours) {
		return `${hours}hr`;
	} else if (minutes) {
		return `${minutes}m`;
	} else {
		return `${seconds}s`;
	}

	return result;
}
