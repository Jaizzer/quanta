const { Router } = require("express");
const tagsRouter = Router();
const tagsControllers = require("../controllers/tagsControllers.js");

tagsRouter.get("/", tagsControllers.getAllTags);
tagsRouter.get("/edit", tagsControllers.editTagsGet);

module.exports = tagsRouter;
