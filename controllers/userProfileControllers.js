const asyncHandler = require("express-async-handler");

async function userProfileGet(req, res, next) {
	res.render("userProfile", {
		title: "Profile",
		name: "Jaizzer",
		email: "placeholderemail@email.com",
		phoneNumber: "88888888",
		googleAccount: "placeholdergoogleaccount@gmail.com",
		appleID: "placeholder@privaterelay.appleid.com",
	});
}

module.exports = {
	userProfileGet: asyncHandler(userProfileGet),
};
