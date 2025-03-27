const { Router } = require("express");
const inventorySummaryRouter = Router();
const inventorySummaryControllers = require("../controllers/inventorySummaryControllers");

inventorySummaryRouter.get("/", inventorySummaryControllers.rootGet);

module.exports = inventorySummaryRouter;
