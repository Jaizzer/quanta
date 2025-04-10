const addBtn = document.querySelector(".add-item-btn");

// Render the item/category adder component when add button is clicked
addBtn.addEventListener("click", () => {
	const addOptionContainerBackground = document.createElement("div");
	addOptionContainerBackground.classList.add(
		"add-option-container-background",
	);

	const addOptionContainer = document.createElement("div");
	addOptionContainer.classList.add("add-option-container");
	addOptionContainerBackground.appendChild(addOptionContainer);

	const closeBtn = document.createElement("button");
	closeBtn.textContent = "x";
	closeBtn.classList.add("close-add-option-container-btn");
	closeBtn.addEventListener("click", (e) => {
		document.body.removeChild(e.target.parentElement.parentElement);
	});
	addOptionContainer.appendChild(closeBtn);

	const addItemOption = document.createElement("button");
	addItemOption.classList.add("add-option");
	addItemOption.textContent = "Add Item";
	addItemOption.addEventListener("click", () => {
		window.location.href = "/items/add-item";
	});
	addOptionContainer.appendChild(addItemOption);

	const addTagOption = document.createElement("button");
	addTagOption.classList.add("add-option");
	addTagOption.textContent = "Add Tag";
	addTagOption.addEventListener("click", () => {
		window.location.href = "/tags";
	});
	addOptionContainer.appendChild(addTagOption);

	document.body.appendChild(addOptionContainerBackground);
});
