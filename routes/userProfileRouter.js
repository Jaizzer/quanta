const { Router } = require("express");
const userProfileRouter = Router();
const userProfileControllers = require("../controllers/userProfileControllers.js");

userProfileRouter.get("/", userProfileControllers.userProfileGet);

module.exports = userProfileRouter;
