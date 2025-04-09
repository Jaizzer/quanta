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

async function editTagsGet(req, res, next) {
	let tags = await db.getAllTags();
	res.render("editTags", {
		title: "Edit Tags",
		tags: tags,
	});
}

module.exports = {
	getAllTags: asyncHandler(getAllTags),
	editTagsGet: asyncHandler(editTagsGet),
};
