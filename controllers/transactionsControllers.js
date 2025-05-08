const asyncHandler = require("express-async-handler");

const db = require("../models/queries");

async function getAllTransactions(req, res, next) {
	const transactions = await db.getAllTransactions();
	res.render("transactions", {
		title: "Transactions",
		transactions: transactions,
	});
}

async function getTransactionById(req, res, next) {
	const transactionId = Number(req.params.id);
	const transaction = await db.getTransactionByID(transactionId);
	res.render("transaction", {
		title: "Transactions",
		transaction: transaction,
	});
}

module.exports = {
	getAllTransactions: asyncHandler(getAllTransactions),
	getTransactionById: asyncHandler(getTransactionById),
};
