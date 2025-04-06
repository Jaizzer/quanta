const { Router } = require("express");
const searchRouter = Router();
const searchControllers = require("../controllers/searchControllers.js");

searchRouter.get("/", searchControllers.searchItem);

module.exports = searchRouter;
