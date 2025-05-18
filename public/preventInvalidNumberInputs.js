const quantity = document.querySelector("#quantity");
quantity.addEventListener("input", (e) => {
	if (e.target.value.length > 9) {
		e.target.value = e.target.value.substring(0, 9);
	}
});
quantity.addEventListener("keypress", (e) => {
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

const minLevel = document.querySelector("#min-level");
minLevel.addEventListener("input", (e) => {
	if (e.target.value.length > 9) {
		e.target.value = e.target.value.substring(0, 9);
	}
});
minLevel.addEventListener("keypress", (e) => {
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

const price = document.querySelector("#price");
price.addEventListener("input", (e) => {
	if (e.target.value.length > 12) {
		e.target.value = e.target.value.substring(0, 12);
	}
});
price.addEventListener("keypress", (e) => {
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
