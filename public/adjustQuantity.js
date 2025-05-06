const addButton = document.querySelector(".add-button");
const subtractButton = document.querySelector(".subtract-button");
const currentAdjustmentValue = document.querySelector(
	".current-adjustment-value",
);
const newQuantityInput = document.querySelector("#new-quantity-input");

const originalQuantity =
	newQuantityInput.value.trim() === ""
		? 0
		: parseFloat(newQuantityInput.value);

addButton.addEventListener("click", () => {
	const currentQuantityToAdd =
		currentAdjustmentValue.value.trim() === ""
			? 0
			: parseFloat(currentAdjustmentValue.value);

	currentAdjustmentValue.value = currentQuantityToAdd + 1;

	newQuantityInput.value = originalQuantity + currentQuantityToAdd + 1;

	validateInputs();
});

subtractButton.addEventListener("click", () => {
	const currentQuantityToAdd =
		currentAdjustmentValue.value.trim() === ""
			? 0
			: parseFloat(currentAdjustmentValue.value);
	currentAdjustmentValue.value = currentQuantityToAdd - 1;
	newQuantityInput.value = originalQuantity + currentQuantityToAdd - 1;

	validateInputs();
});

// Prevent invalid values when entering an input
currentAdjustmentValue.addEventListener("keypress", (e) => {
	if (e?.key === "e" || e?.key === "+") {
		e.preventDefault();
	}

	if (e.target.value.length === 0 && e?.key === "-") {
		e.target.value = "";
	}

	if (e.target.value.length > 0 && e?.key === "-") {
		e.preventDefault();
	}
});

currentAdjustmentValue.addEventListener("input", (e) => {
	const quantityToAdd =
		e.target.value.trim() === "" ? 0 : parseFloat(e.target.value);
	newQuantityInput.value = originalQuantity + quantityToAdd;

	validateInputs();
});

newQuantityInput.addEventListener("input", (e) => {
	const newQuantityValue =
		e.target.value.trim() === "" ? 0 : parseFloat(e.target.value);
	currentAdjustmentValue.value = newQuantityValue - originalQuantity;

	validateInputs();
});

// Prevent invalid values when pasting
currentAdjustmentValue.addEventListener("paste", (e) => {
	const reg = "^[-]?[0-9]*\\.?[0-9]*$";
	const current = e.target.value;
	if (!current) {
		e.target.value = "";
	}
	if (
		!(current + e.clipboardData.getData("Text")).match(reg) &&
		e.clipboardData.getData("Text").match(reg)
	) {
		e.target.value = "";
	}
	if (!e.clipboardData.getData("Text").match(reg)) {
		e.preventDefault();
	}
});

// Prevent invalid values when entering an input
newQuantityInput.addEventListener("keypress", (e) => {
	if (e?.key === "e" || e?.key === "+") {
		e.preventDefault();
	}

	if (e.target.value.length === 0 && e?.key === "-") {
		e.target.value = "";
	}

	if (e.target.value.length > 0 && e?.key === "-") {
		e.preventDefault();
	}
});

// Prevent invalid values when pasting
newQuantityInput.addEventListener("paste", (e) => {
	const reg = "^[-]?[0-9]*\\.?[0-9]*$";
	const current = e.target.value;
	if (!current) {
		e.target.value = "";
	}
	if (
		!(current + e.clipboardData.getData("Text")).match(reg) &&
		e.clipboardData.getData("Text").match(reg)
	) {
		e.target.value = "";
	}
	if (!e.clipboardData.getData("Text").match(reg)) {
		e.preventDefault();
	}
});

function insertAnErrorNextToAnElement(element, message) {
	const errorMessage = document.createElement("div");
	errorMessage.classList.add("error-message");
	errorMessage.textContent = message;

	const nextElement = element.nextElementSibling;

	// Just append the error message if there is no next element
	if (!nextElement) {
		element.parentElement.appendChild(errorMessage);
	} else if (nextElement.className === "error-message") {
		// Just replace the text content if there is already an error message next to the element
		nextElement.textContent = message;
	} else {
		element.parentElement.insertBefore(
			errorMessage,
			element.nextElementSibling,
		);
	}
}

function validateInputs() {
	if (newQuantityInput.value < 0) {
		insertAnErrorNextToAnElement(
			newQuantityInput,
			"Quantity can't be lower than 0.",
		);

		// Disable the update button
		const updateButton = document.querySelector(".update-button");
		updateButton.disabled = true;
	} else {
		// Clear error message
		const errorMessage = document.querySelector(".error-message");
		if (errorMessage) {
			errorMessage.parentElement.removeChild(errorMessage);
		}

		// Enable the update button
		const updateButton = document.querySelector(".update-button");
		updateButton.disabled = false;
	}
}
