const tripleDotButtons = Array.from(
	document.querySelectorAll(".item-triple-dot-button"),
);

tripleDotButtons?.forEach((tripleDotButton) => {
	tripleDotButton.addEventListener("click", () => {
		// Close an existing utility-box
		const utilityBox = document.querySelector(".utility-box-container");
		if (utilityBox) {
			utilityBox.parentElement.removeChild(utilityBox);
		}

		// Close an existing delete warning message
		const deleteWarningMessage = document.querySelector(
			".background-overlay",
		);
		if (deleteWarningMessage) {
			deleteWarningMessage.parentElement.removeChild(
				deleteWarningMessage,
			);
		}

		// Pop up a utility box
		const itemID = tripleDotButton.dataset.id;
		const parentItemName = tripleDotButton.dataset.parent;
		const itemName = tripleDotButton.dataset.name;

		document.body.appendChild(
			createUtilityBox(itemID, itemName, parentItemName),
		);
	});
});

function createUtilityBox(itemID, itemName, parentItemName) {
	const utilityBoxContainer = document.createElement("form");
	utilityBoxContainer.action = "/items/delete-item-dashboard";
	utilityBoxContainer.method = "POST";
	utilityBoxContainer.classList.add("utility-box-container");

	const itemIDInput = document.createElement("input");
	itemIDInput.value = itemID;
	itemIDInput.readOnly = true;
	itemIDInput.hidden = true;
	itemIDInput.name = "itemID";
	utilityBoxContainer.appendChild(itemIDInput);

	const closeButton = document.createElement("button");
	closeButton.classList.add("utility-box-close-button");
	closeButton.textContent = "x";
	closeButton.addEventListener("click", () => {
		utilityBoxContainer.parentElement.removeChild(utilityBoxContainer);
	});
	utilityBoxContainer.appendChild(closeButton);

	const itemCard = document.createElement("div");
	itemCard.classList.add("item");
	utilityBoxContainer.appendChild(itemCard);

	const itemImageContainer = document.createElement("div");
	itemImageContainer.classList.add("item-image-container");
	itemCard.appendChild(itemImageContainer);

	const itemNameContainer = document.createElement("div");
	itemNameContainer.classList.add("item-name");
	itemNameContainer.textContent = parentItemName || itemName;
	itemCard.appendChild(itemNameContainer);

	// Add the variant name if the item is a variant
	if (parentItemName) {
		const variantName = document.querySelector("div");
		variantName.classList.add("variant-name");
		variantName.textContent = itemName;
		itemCard.appendChild(variantName);
	}

	const actions = [
		"update-item-quantity",
		"edit-item",
		"view-item-activity-history",
		"view-item-transactions",
		"view-item-details",
		"delete-item",
	];

	actions.forEach((action) => {
		if (action !== "delete-item") {
			const link = document.createElement("a");
			switch (action) {
				case "update-item-quantity":
					link.href = `items/edit-quantity/${itemID}`;
					break;
				case "edit-item":
					link.href = `items/edit/${itemID}`;
					break;
				case "view-item-activity-history":
					link.href = `activity-history/${itemID}`;
					break;
				case "view-item-transactions":
					link.href = `transactions/item/${itemID}`;
					break;
				case "view-item-details":
					link.href = `items/${itemID}`;
					break;
				default:
					break;
			}

			const buttonContent = document.createElement("div");
			buttonContent.classList.add("utility-button-content");

			const iconContainer = document.createElement("div");
			iconContainer.classList.add("utility-button-icon-container");
			buttonContent.appendChild(iconContainer);

			const buttonText = document.createElement("div");
			buttonText.classList.add("utility-button-text");
			switch (action) {
				case "update-item-quantity":
					buttonText.textContent = `Update Quantity`;
					break;
				case "edit-item":
					buttonText.textContent = `Edit`;
					break;
				case "view-item-activity-history":
					buttonText.textContent = `History`;
					break;
				case "view-item-transactions":
					buttonText.textContent = `Transactions`;
					break;
				case "view-item-details":
					buttonText.textContent = `Details`;
					break;
				default:
					break;
			}
			buttonContent.appendChild(buttonText);
			link.appendChild(buttonContent);
			utilityBoxContainer.appendChild(link);
		} else {
			const deleteButton = document.createElement("button");
			deleteButton.classList.add("delete-item-button");
			deleteButton.type = "button";
			deleteButton.addEventListener("click", () => {
				// Hide the utility box
				utilityBoxContainer.parentElement.removeChild(
					utilityBoxContainer,
				);

				// Display warning message
				const backgroundOverlay = document.createElement("div");
				backgroundOverlay.classList.add("background-overlay");
				document.body.appendChild(backgroundOverlay);

				const warningMessageContainer = document.createElement("div");
				warningMessageContainer.classList.add(
					"warning-message-container",
				);
				backgroundOverlay.appendChild(warningMessageContainer);

				const warningMessage = document.createElement("div");
				warningMessage.textContent = `Are you sure you want to delete item '${itemName}'?`;
				warningMessage.classList.add("warning-message");
				warningMessageContainer.appendChild(warningMessage);

				const cancelButton = document.createElement("button");
				cancelButton.textContent = "Cancel";
				cancelButton.classList.add("cancel-button");
				cancelButton.addEventListener("click", () => {
					backgroundOverlay.parentElement.removeChild(
						backgroundOverlay,
					);

					// Show the utility box
					document.body.appendChild(
						utilityBoxContainer,
					);
				});
				warningMessageContainer.appendChild(cancelButton);

				const saveButton = document.createElement("button");
				saveButton.textContent = "Yes";
				saveButton.classList.add("save-button");
				saveButton.addEventListener("click", () => {
					utilityBoxContainer.submit();
				});
				warningMessageContainer.appendChild(saveButton);
			});

			const iconContainer = document.createElement("div");
			iconContainer.classList.add("utility-button-icon-container");
			deleteButton.appendChild(iconContainer);

			const buttonText = document.createElement("div");
			buttonText.classList.add("utility-button-text");
			buttonText.textContent = "Delete";
			deleteButton.appendChild(buttonText);

			utilityBoxContainer.appendChild(deleteButton);
		}
	});

	return utilityBoxContainer;
}
