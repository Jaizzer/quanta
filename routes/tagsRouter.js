const { Router } = require("express");
const tagsRouter = Router();
const tagsControllers = require("../controllers/tagsControllers.js");

tagsRouter.get("/", tagsControllers.getAllTags);

module.exports = tagsRouter;
