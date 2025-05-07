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
	const row = await db.getTagByID(tagID);
	const tag = {
		name: row.tag_name,
		items: keyword
			? row.items?.filter((item) =>
					item.name.toUpperCase().includes(keyword?.toUpperCase()),
				)
			: row.items || [],
		totalItemQuantity: row.total_item_quantity,
		totalDistinctItemQuantity: row.total_distinct_item_quantity,
		totalValue: row.total_value,
	};

	res.render("tag", {
		title: tag.name,
		tag: tag,
		keyword: keyword,
	});
}

module.exports = {
	getAllTags: asyncHandler(getAllTags),
	editTagsGet: asyncHandler(editTagsGet),
	deleteTag: asyncHandler(deleteTag),
	insertTag: asyncHandler(insertTag),
	updateTagName: asyncHandler(updateTagName),
	getTagByID: asyncHandler(getTagByID),
};
