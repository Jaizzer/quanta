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

async function deleteTag(req, res, next) {
	const { tagID } = req.body;
	await db.deleteTag(tagID);
	res.status(200).redirect("/tags/edit");
}

async function insertTag(req, res, next) {
	const { tagName } = req.body;
	await db.insertTag(tagName);
	res.status(200).redirect("/tags");
}

module.exports = {
	getAllTags: asyncHandler(getAllTags),
	editTagsGet: asyncHandler(editTagsGet),
	deleteTag: asyncHandler(deleteTag),
	insertTag: asyncHandler(insertTag),
};
