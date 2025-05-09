function parseNumberInput(n) {
	const isValueValidNumber = !Number.isNaN(parseFloat(n));
	if (isValueValidNumber) {
		return Number.parseFloat(n);
	}
	return 0;
}

module.exports = parseNumberInput;
