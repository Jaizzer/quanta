function getTotalItemQuantity(items) {
	const initialValue = 0;
	return items
		.map((item) => item.quantity)
		.reduce(
			(accumulator, currentValue) => accumulator + currentValue,
			initialValue,
		);
}

module.exports = getTotalItemQuantity;
