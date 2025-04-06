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

	const addCategoryOption = document.createElement("button");
	addCategoryOption.classList.add("add-option");
	addCategoryOption.textContent = "Add Category";
	addCategoryOption.addEventListener("click", () => {
		window.location.href = "/categories/add-category";
	});
	addOptionContainer.appendChild(addCategoryOption);

	document.body.appendChild(addOptionContainerBackground);
});
