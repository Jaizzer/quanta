const asyncHandler = require("express-async-handler");

async function menuGet(req, res, next) {
	res.render("menu", {
		title: "Menu",
	});
}

module.exports = {
	menuGet: asyncHandler(menuGet),
};
