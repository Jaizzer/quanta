const asyncHandler = require("express-async-handler");

async function activityHistoryGet(req, res, next) {
	const activities = [
		{
			entityName: "Item 1",
			description: "Jaizzer created item Item 1 in Items",
			timePassed: "15m",
			link: "/items/96",
		},

		{
			entityName: "Tag 1",
			description: "Jaizzer created item Tag 1 ",
			timePassed: "15m",
			link: "/tags/96",
		},
	];
	res.render("activityHistory", {
		title: "Activity History",
		activities: activities,
	});
}

module.exports = {
	activityHistoryGet: asyncHandler(activityHistoryGet),
};
