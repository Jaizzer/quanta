const addButton = document.querySelector(".add-item-button");

// Render the item/tag adder component when add button is clicked
addButton.addEventListener("click", () => {
	const addOptionContainerBackground = document.createElement("div");
	addOptionContainerBackground.classList.add(
		"add-option-container-background",
	);

	const addOptionContainer = document.createElement("div");
	addOptionContainer.classList.add("add-option-container");
	addOptionContainerBackground.appendChild(addOptionContainer);

	const closeButton = document.createElement("button");
	closeButton.textContent = "x";
	closeButton.classList.add("close-add-option-container-button");
	closeButton.addEventListener("click", (e) => {
		document.body.removeChild(e.target.parentElement.parentElement);
	});
	addOptionContainer.appendChild(closeButton);

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
