const { Router } = require("express");
const tagsRouter = Router();
const tagsControllers = require("../controllers/tagsControllers.js");

tagsRouter.get("/", tagsControllers.getAllTags);
tagsRouter.post("/", tagsControllers.insertTag);
tagsRouter.get("/edit", tagsControllers.editTagsGet);
tagsRouter.post("/delete", tagsControllers.deleteTag);
tagsRouter.post("/:id", tagsControllers.updateTagName);
tagsRouter.get("/:id", tagsControllers.getTagByID);

module.exports = tagsRouter;
