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

async function getItemSpecificTransactions(req, res, next) {
	const itemID = req.params.id;
	const item = await db.getItemById(itemID);
	const transactions = await db.getItemSpecificTransactions(itemID);

	if (item) {
		res.render("itemTransactions", {
			title: "Transactions",
			transactions: transactions,
			item: item,
		});
	} else {
		// Render an error page if the item does not exist.
		res.render("error", {
			title: "Item Not Found",
			message: "The item does not exist.",
		});
	}
}

module.exports = {
	getAllTransactions: asyncHandler(getAllTransactions),
	getTransactionById: asyncHandler(getTransactionById),
	getItemSpecificTransactions: asyncHandler(getItemSpecificTransactions),
};
