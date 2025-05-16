const forms = document.querySelectorAll("form");
forms?.forEach((form) => {
	// Access the delete button
	const deleteItemButton = form.querySelector(".delete-item-button");

	// Get the item name
	const itemName =
		form.querySelector(".item-name")?.textContent ||
		document.querySelector(".variant-name")?.textContent ||
		document.querySelector("h2")?.textContent;

	// Render warning message before deleting the item
	deleteItemButton.addEventListener("click", () => {
		// Remove the current popup if there are any
		const currentPopUp = document.querySelector(".background-overlay");
		if (currentPopUp) {
			currentPopUp.parentElement.removeChild(currentPopUp);
		}

		const backgroundOverlay = document.createElement("div");
		backgroundOverlay.classList.add("background-overlay");
		document.body.prepend(backgroundOverlay);

		const warningMessageContainer = document.createElement("div");
		warningMessageContainer.classList.add("warning-message-container");
		backgroundOverlay.appendChild(warningMessageContainer);

		const warningMessage = document.createElement("div");
		warningMessage.textContent = `Are you sure you want to delete item '${itemName}'?`;
		warningMessage.classList.add("warning-message");
		warningMessageContainer.appendChild(warningMessage);

		const cancelButton = document.createElement("button");
		cancelButton.textContent = "Cancel";
		cancelButton.classList.add("cancel-button");
		cancelButton.addEventListener("click", () => {
			backgroundOverlay.parentElement.removeChild(backgroundOverlay);
		});
		warningMessageContainer.appendChild(cancelButton);

		const saveButton = document.createElement("button");
		saveButton.textContent = "Yes";
		saveButton.classList.add("save-button");
		saveButton.addEventListener("click", () => {
			form.submit();
		});
		warningMessageContainer.appendChild(saveButton);
	});
});
