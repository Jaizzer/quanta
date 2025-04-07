const { Router } = require("express");
const reportsRouter = Router();
const reportsControllers = require("../controllers/reportsControllers.js");

reportsRouter.get("/", reportsControllers.reportsGet);
module.exports = reportsRouter;
