const asyncHandler = require("express-async-handler");

async function getItemById(req, res, next) {
	const itemId = Number(req.params.id);
	const items = [
		{
			id: 24,
			name: "Item 78",
			quantity: 5,
			minLevel: 1,
			tags: ["Tag 1", "Tag2"],
			updatedAt: "Mar 20",
			price: 25,
			totalValue: 50,
		},
	];

	const [item] = items.filter((item) => item.id === itemId);

	res.render("item", {
		title: item.name,
		item: item,
	});
}

module.exports = {
	getItemById: asyncHandler(getItemById),
};
