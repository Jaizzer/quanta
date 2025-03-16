const { Router } = require("express");
const rootRouter = Router();
const rootControllers = require("../controllers/rootControllers");

rootRouter.get("/", rootControllers.rootGet);

module.exports = rootRouter;
