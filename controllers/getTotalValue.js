function getTotalValue(items) {
	const initialValue = 0;
	return items
		.map((item) => item.price * item.quantity)
		.reduce(
			(accumulator, currentValue) => accumulator + currentValue,
			initialValue,
		);
}

module.exports = getTotalValue;
