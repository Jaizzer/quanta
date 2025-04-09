const { Router } = require("express");
const tagsRouter = Router();
const tagsControllers = require("../controllers/tagsControllers.js");

tagsRouter.get("/", tagsControllers.getAllTags);
tagsRouter.post("/", tagsControllers.insertTag)
tagsRouter.get("/edit", tagsControllers.editTagsGet);
tagsRouter.post("/delete", tagsControllers.deleteTag)

module.exports = tagsRouter;
