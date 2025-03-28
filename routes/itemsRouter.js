const { Router } = require("express");
const itemsRouter = Router();
const itemsControllers = require("../controllers/itemsControllers.js");

itemsRouter.get("/", itemsControllers.getAllItems);
itemsRouter.get("/:id(\\d+)", itemsControllers.getItemById);

module.exports = itemsRouter;
