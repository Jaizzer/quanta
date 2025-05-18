const priceInput = document.querySelector("#price");
const quantityInput = document.querySelector("#quantity");
const totalValue = document.querySelector(".value");

let currentQuantity =
	quantityInput.value.trim() !== "" ? parseFloat(quantityInput.value) : 0;

let currentPrice =
	priceInput.value.trim() !== "" ? parseFloat(priceInput.value) : 0;

totalValue.textContent = `$${(currentPrice * currentPrice).toFixed(2)}`;

priceInput.addEventListener("input", (e) => {
	currentPrice =
		e.target.value.trim() !== "" ? parseFloat(e.target.value) : 0;
	totalValue.textContent = `$${(currentPrice * currentQuantity).toFixed(2)}`;
});

quantityInput.addEventListener("input", (e) => {
	currentQuantity =
		e.target.value.trim() !== "" ? parseFloat(e.target.value) : 0;
	totalValue.textContent = `$${(currentPrice * currentQuantity).toFixed(2)}`;
});
