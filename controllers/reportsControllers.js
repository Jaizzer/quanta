const asyncHandler = require("express-async-handler");

async function reportsGet(req, res, next) {
    res.render("reports", {
        title: "Reports",
    });
}

module.exports = {
    reportsGet: asyncHandler(reportsGet),
};
