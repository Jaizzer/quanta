const asyncHandler = require("express-async-handler");

async function rootGet(req, res, next) {
	res.render("index", { title: "Home" });
}

module.exports = {
	rootGet: asyncHandler(rootGet),
};
