const { Router } = require("express");
const transactionsRouter = Router();
const transactionsControllers = require("../controllers/transactionsControllers.js");

transactionsRouter.get("/", transactionsControllers.getAllTransactions);

module.exports = transactionsRouter;
