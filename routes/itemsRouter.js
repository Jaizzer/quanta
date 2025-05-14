const { Router } = require("express");
const itemsRouter = Router();
const itemsControllers = require("../controllers/itemsControllers.js");

itemsRouter.get("/", itemsControllers.getAllItems);
itemsRouter.get("/add-item", itemsControllers.addItemGet);
itemsRouter.post("/add-item", itemsControllers.addItemPost);
itemsRouter.get("/low-stock", itemsControllers.lowStockGet);
itemsRouter.get('/edit-quantity/:id', itemsControllers.editItemQuantityGet);
itemsRouter.post('/edit-quantity/:id', itemsControllers.editItemQuantityPost);
itemsRouter.get("/edit/:id", itemsControllers.editItemGet);
itemsRouter.get("/add-variant/:id", itemsControllers.addVariantGet);
itemsRouter.post("/add-variant/:id", itemsControllers.addVariantPost);
itemsRouter.get("/edit-items", itemsControllers.editItemsGet)
itemsRouter.post("/edit/:id", itemsControllers.editItemPost);
itemsRouter.post("/delete-item-dashboard", itemsControllers.deleteItem)
itemsRouter.post("/edit-items-delete", itemsControllers.deleteItem)
itemsRouter.post("/delete", itemsControllers.deleteItem)
itemsRouter.get("/:id", itemsControllers.getItemById);

module.exports = itemsRouter;
