const asyncHandler = require("express-async-handler");

async function getAllTransactions(req, res, next) {
	const transactions = [
		{
			id: 24,
			itemId: 2,
			itemName: "Item 78",
			type: "Update",
			reason: "Restocked",
			quantityChange: "+5",
			date: "Mar 20",
		},
		{
			id: 24,
			itemId: 2,
			itemName: "Item 45",
			type: "Update",
			reason: "Damaged",
			quantityChange: "-7",
			date: "Mar 20",
		},
	];

	res.render("transactions", {
		title: "Transactions",
		transactions: transactions,
	});
}

async function getTransactionById(req, res, next) {
	const transactionId = Number(req.params.id);
	const transactions = [
		{
			id: 24,
			itemId: 2,
			itemName: "Item 78",
			type: "Update",
			reason: "Restocked",
			quantityChange: "+5",
			date: "Mar 20",
		},
	];

	const [transaction] = transactions.filter(
		(transaction) => transaction.id === transactionId,
	);

	res.render("transaction", {
		title: "Transactions",
		transaction: transaction,
	});
}

module.exports = {
	getAllTransactions: asyncHandler(getAllTransactions),
	getTransactionById: asyncHandler(getTransactionById),
};
