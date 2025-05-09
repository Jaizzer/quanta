const asyncHandler = require("express-async-handler");
const db = require("../models/queries");

async function getAllTags(req, res, next) {
	const keyword = req.query.keyword;
	const sortOption = req.query.sort;
	let tags = [];

	if (keyword) {
		tags = await db.searchTag(keyword, sortOption);
	} else {
		tags = await db.getAllTags(sortOption);
	}

	res.render("tags", {
		title: "Tags",
		tags: tags,
		keyword: keyword,
		sortOptions: [
			{ value: "", name: "Sort By", isSelected: !sortOption },
			{
				value: "name-ascending",
				name: "Name (Ascending)",
				isSelected: sortOption === "name-ascending",
			},
			{
				value: "name-descending",
				name: "Name (Descending)",
				isSelected: sortOption === "name-descending",
			},
			{
				value: "date-added-ascending",
				name: "Date Created (Oldest to Newest)",
				isSelected: sortOption === "date-added-ascending",
			},
			{
				value: "date-added-descending",
				name: "Date Created (Newest to Oldest)",
				isSelected: sortOption === "date-added-descending",
			},
		],
	});
}

async function editTagsGet(req, res, next) {
	let keyword = req?.query?.keyword ? req.query.keyword : "";
	const sortOption = req.query.sort;

	let tags = [];
	if (keyword) {
		tags = await db.searchTag(keyword, sortOption);
	} else {
		tags = await db.getAllTags(sortOption);
	}

	res.render("editTags", {
		title: "Edit Tags",
		tags: tags,
		keyword: keyword,
		sortOptions: [
			{ value: "", name: "Sort By", isSelected: !sortOption },
			{
				value: "name-ascending",
				name: "Name (Ascending)",
				isSelected: sortOption === "name-ascending",
			},
			{
				value: "name-descending",
				name: "Name (Descending)",
				isSelected: sortOption === "name-descending",
			},
			{
				value: "date-added-ascending",
				name: "Date Created (Oldest to Newest)",
				isSelected: sortOption === "date-added-ascending",
			},
			{
				value: "date-added-descending",
				name: "Date Created (Newest to Oldest)",
				isSelected: sortOption === "date-added-descending",
			},
		],
	});
}

async function deleteTag(req, res, next) {
	const { tagID } = req.body;
	const tag = await db.getTagByID(tagID);
	await db.deleteTag(tag);
	res.status(200).redirect("/tags/edit");
}

async function insertTag(req, res, next) {
	const { tagName } = req.body;
	await db.insertTag(tagName);

	// Preserve the previously selected sort option if there is one
	const { sort } = req.query;
	res.status(200).redirect(`/tags${sort ? `?sort=${sort}` : ""}`);
}

async function updateTagName(req, res, next) {
	const tagID = req.params.id;
	const newTagName = req.body.tagName;
	await db.updateTagName(tagID, newTagName);
	res.status(200).redirect("/tags");
}

async function getTagByID(req, res, next) {
	const tagID = req.params.id;
	const keyword = req.query.keyword;
	const tag = await db.getTagByID(tagID);

	// Filter the items if there is search keyword
	if (keyword) {
		tag.items = tag.items?.filter((item) =>
			item.name.toUpperCase().includes(keyword?.toUpperCase()),
		);
	}

    // Render the tag page if it exists
	if (tag) {
		res.render("tag", {
			title: tag.name,
			tag: tag,
			keyword: keyword,
		});
	} else {
        // Render the error page if the tag does not exists
		res.render("error", {
			title: "Tag Not found",
			message: "Tag does not exist.",
		});
	}
}

module.exports = {
	getAllTags: asyncHandler(getAllTags),
	editTagsGet: asyncHandler(editTagsGet),
	deleteTag: asyncHandler(deleteTag),
	insertTag: asyncHandler(insertTag),
	updateTagName: asyncHandler(updateTagName),
	getTagByID: asyncHandler(getTagByID),
};
