const { Router } = require("express");
const itemsRouter = Router();
const itemsControllers = require("../controllers/itemsControllers.js");

itemsRouter.get("/", itemsControllers.getAllItems);
itemsRouter.get("/add-item", itemsControllers.addItemGet);
itemsRouter.post("/add-item", itemsControllers.addItemPost);
itemsRouter.get("/low-stock", itemsControllers.lowStockGet);
itemsRouter.get("/edit/:id", itemsControllers.editItemGet);
itemsRouter.post("/edit/:id", itemsControllers.editItemPost);
itemsRouter.get("/:id", itemsControllers.getItemById);

module.exports = itemsRouter;
