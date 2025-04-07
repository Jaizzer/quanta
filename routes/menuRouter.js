const { Router } = require("express");
const menuRouter = Router();
const menuControllers = require("../controllers/menuControllers.js");

menuRouter.get("/", menuControllers.menuGet);
module.exports = menuRouter;
