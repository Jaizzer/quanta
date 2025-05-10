const asyncHandler = require("express-async-handler");
const db = require("../models/queries");

async function searchItem(req, res, next) {
	let items = [];
	const keyword = req.query.keyword?.trim();
	if (keyword) {
		items = await db.searchItem(keyword);
	}

	res.render("search", {
		title: "Search",
		items: items,
		keyword: keyword,
	});
}

module.exports = {
	searchItem: asyncHandler(searchItem),
};
