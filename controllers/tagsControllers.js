const asyncHandler = require("express-async-handler");
const db = require("../models/queries");

async function getAllTags(req, res, next) {
	const keyword = req.query.keyword;
	let tags = [];

	if (keyword) {
		tags = await db.searchTag(keyword);
	} else {
		tags = await db.getAllTags(keyword);
	}

	res.render("tags", {
		title: "Tags",
		tags: tags,
		keyword: keyword,
	});
}

module.exports = {
	getAllTags: asyncHandler(getAllTags),
};
