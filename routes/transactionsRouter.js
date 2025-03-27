const { Router } = require("express");
const transactionsRouter = Router();
const transactionsControllers = require("../controllers/transactionsControllers.js");

transactionsRouter.get("/", transactionsControllers.getAllTransactions);
transactionsRouter.get("/:id(\\d+)", transactionsControllers.getTransactionById)

module.exports = transactionsRouter;
