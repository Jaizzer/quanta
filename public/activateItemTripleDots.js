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

		document.body.prepend(
			createUtilityBox(itemID, itemName, parentItemName),
		);
	});
});

function createUtilityBox(itemID, itemName, parentItemName) {
	const utilityBoxBackgroundOverlay = document.createElement("div");
	utilityBoxBackgroundOverlay.classList.add("background-overlay");

	const utilityBoxContainer = document.createElement("form");
	utilityBoxContainer.action = "/items/delete-item-dashboard";
	utilityBoxContainer.method = "POST";
	utilityBoxContainer.classList.add("utility-box-container");
	utilityBoxBackgroundOverlay.appendChild(utilityBoxContainer);

	const itemIDInput = document.createElement("input");
	itemIDInput.value = itemID;
	itemIDInput.readOnly = true;
	itemIDInput.hidden = true;
	itemIDInput.name = "itemID";
	utilityBoxContainer.appendChild(itemIDInput);

	const closeButton = document.createElement("button");
	closeButton.classList.add("utility-box-close-button");
	closeButton.type = "button";
	closeButton.textContent = "x";
	closeButton.addEventListener("click", () => {
		utilityBoxBackgroundOverlay.parentElement.removeChild(
			utilityBoxBackgroundOverlay,
		);
	});
	utilityBoxContainer.appendChild(closeButton);

	const itemCard = document.createElement("div");
	itemCard.classList.add("item");
	utilityBoxContainer.appendChild(itemCard);

	const itemImageContainer = document.createElement("div");
	itemImageContainer.classList.add("item-image-container");
	itemCard.appendChild(itemImageContainer);

	const itemTextContent = document.createElement("div");
	itemTextContent.classList.add("item-text-content");
	itemCard.appendChild(itemTextContent);

	const itemNameContainer = document.createElement("div");
	itemNameContainer.classList.add("item-name");
	itemNameContainer.textContent = parentItemName || itemName;
	itemTextContent.appendChild(itemNameContainer);

	// Add the variant name if the item is a variant
	if (parentItemName) {
		const variantName = document.createElement("div");
		variantName.classList.add("variant-name");
		variantName.textContent = itemName;
		itemTextContent.appendChild(variantName);
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
					link.href = `/items/edit-quantity/${itemID}`;
					break;
				case "edit-item":
					link.href = `/items/edit/${itemID}`;
					break;
				case "view-item-activity-history":
					link.href = `/activity-history/${itemID}`;
					break;
				case "view-item-transactions":
					link.href = `/transactions/item/${itemID}`;
					break;
				case "view-item-details":
					link.href = `/items/${itemID}`;
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
					iconContainer.innerHTML = `
                            <svg width="25" height="24" viewBox="0 0 25 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M21.7539 6.39001H14.4839C14.0739 6.39001 13.7339 6.05001 13.7339 5.64001C13.7339 5.23001 14.0739 4.89001 14.4839 4.89001H21.7539C22.1639 4.89001 22.5039 5.23001 22.5039 5.64001C22.5039 6.05001 22.1639 6.39001 21.7539 6.39001Z" fill="#171717"/>
                            <path d="M9.634 6.39001H2.354C1.944 6.39001 1.604 6.05001 1.604 5.64001C1.604 5.23001 1.944 4.89001 2.354 4.89001H9.624C10.034 4.89001 10.374 5.23001 10.374 5.64001C10.374 6.05001 10.044 6.39001 9.634 6.39001Z" fill="#171717"/>
                            <path d="M21.7539 16.08H14.4839C14.0739 16.08 13.7339 15.74 13.7339 15.33C13.7339 14.92 14.0739 14.58 14.4839 14.58H21.7539C22.1639 14.58 22.5039 14.92 22.5039 15.33C22.5039 15.74 22.1639 16.08 21.7539 16.08Z" fill="#171717"/>
                            <path d="M21.7539 22.14H14.4839C14.0739 22.14 13.7339 21.8 13.7339 21.39C13.7339 20.98 14.0739 20.64 14.4839 20.64H21.7539C22.1639 20.64 22.5039 20.98 22.5039 21.39C22.5039 21.8 22.1639 22.14 21.7539 22.14Z" fill="#171717"/>
                            <path d="M18.144 10.02C17.734 10.02 17.394 9.68 17.394 9.27V2C17.394 1.59 17.734 1.25 18.144 1.25C18.554 1.25 18.894 1.59 18.894 2V9.27C18.894 9.69 18.564 10.02 18.144 10.02Z" fill="#171717"/>
                            <path d="M2.35395 22.75C2.16395 22.75 1.97395 22.68 1.82395 22.53C1.53395 22.24 1.53395 21.76 1.82395 21.47L9.09395 14.2C9.38395 13.91 9.86395 13.91 10.1539 14.2C10.4439 14.49 10.4439 14.97 10.1539 15.26L2.88395 22.53C2.74395 22.68 2.55395 22.75 2.35395 22.75Z" fill="#171717"/>
                            <path d="M9.63396 22.75C9.44395 22.75 9.25396 22.68 9.10396 22.53L1.83396 15.26C1.54396 14.97 1.54396 14.49 1.83396 14.2C2.12396 13.91 2.60396 13.91 2.89395 14.2L10.164 21.47C10.454 21.76 10.454 22.24 10.164 22.53C10.014 22.68 9.82395 22.75 9.63396 22.75Z" fill="#171717"/>
                            </svg>`;
					break;
				case "edit-item":
					buttonText.textContent = `Edit`;
					iconContainer.innerHTML = `
                        <svg width="25" height="24" viewBox="0 0 25 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M6.03999 19.5201C5.42999 19.5201 4.85999 19.31 4.44999 18.92C3.92999 18.43 3.67999 17.69 3.76999 16.89L4.13999 13.65C4.20999 13.04 4.57999 12.23 5.00999 11.79L13.22 3.10005C15.27 0.930049 17.41 0.870049 19.58 2.92005C21.75 4.97005 21.81 7.11005 19.76 9.28005L11.55 17.97C11.13 18.42 10.35 18.84 9.73999 18.9401L6.51999 19.49C6.34999 19.5 6.19999 19.5201 6.03999 19.5201ZM16.43 2.91005C15.66 2.91005 14.99 3.39005 14.31 4.11005L6.09999 12.8101C5.89999 13.0201 5.66999 13.5201 5.62999 13.8101L5.25999 17.05C5.21999 17.38 5.29999 17.65 5.47999 17.82C5.65999 17.99 5.92999 18.05 6.25999 18L9.47999 17.4501C9.76999 17.4001 10.25 17.14 10.45 16.93L18.66 8.24005C19.9 6.92005 20.35 5.70005 18.54 4.00005C17.74 3.23005 17.05 2.91005 16.43 2.91005Z" fill="#171717"/>
                        <path d="M17.8399 10.95C17.8199 10.95 17.7899 10.95 17.7699 10.95C14.6499 10.64 12.1399 8.26997 11.6599 5.16997C11.5999 4.75997 11.8799 4.37997 12.2899 4.30997C12.6999 4.24997 13.0799 4.52997 13.1499 4.93997C13.5299 7.35997 15.4899 9.21997 17.9299 9.45997C18.3399 9.49997 18.6399 9.86997 18.5999 10.28C18.5499 10.66 18.2199 10.95 17.8399 10.95Z" fill="#171717"/>
                        </svg>
                        `;
					break;
				case "view-item-activity-history":
					buttonText.textContent = `History`;
					iconContainer.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M12 22.75C6.07 22.75 1.25 17.93 1.25 12C1.25 6.07 6.07 1.25 12 1.25C17.93 1.25 22.75 6.07 22.75 12C22.75 17.93 17.93 22.75 12 22.75ZM12 2.75C6.9 2.75 2.75 6.9 2.75 12C2.75 17.1 6.9 21.25 12 21.25C17.1 21.25 21.25 17.1 21.25 12C21.25 6.9 17.1 2.75 12 2.75Z" fill="#171717" />
                                    <path d="M15.7101 15.93C15.5801 15.93 15.4501 15.9 15.3301 15.82L12.2301 13.97C11.4601 13.51 10.8901 12.5 10.8901 11.61V7.51001C10.8901 7.10001 11.2301 6.76001 11.6401 6.76001C12.0501 6.76001 12.3901 7.10001 12.3901 7.51001V11.61C12.3901 11.97 12.6901 12.5 13.0001 12.68L16.1001 14.53C16.4601 14.74 16.5701 15.2 16.3601 15.56C16.2101 15.8 15.9601 15.93 15.7101 15.93Z" fill="#171717" />
                                    </svg>`;
					break;
				case "view-item-transactions":
					buttonText.textContent = `Transactions`;
					iconContainer.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M20.4201 12.22C20.0101 12.22 19.6701 11.88 19.6701 11.47V8.15002C19.6701 6.91002 18.6601 5.90002 17.4201 5.90002H3.58008C3.17008 5.90002 2.83008 5.56002 2.83008 5.15002C2.83008 4.74002 3.17008 4.40002 3.58008 4.40002H17.4201C19.4901 4.40002 21.1701 6.08002 21.1701 8.15002V11.47C21.1701 11.89 20.8301 12.22 20.4201 12.22Z" fill="#171717" />
                                    <path d="M6.74008 9.06998C6.55008 9.06998 6.36008 8.99995 6.21008 8.84995L3.05008 5.68997C2.91008 5.54997 2.83008 5.35994 2.83008 5.15994C2.83008 4.95994 2.91008 4.76998 3.05008 4.62998L6.21008 1.46994C6.50008 1.17994 6.98008 1.17994 7.27008 1.46994C7.56008 1.75994 7.56008 2.24 7.27008 2.53L4.64011 5.15994L7.27008 7.78995C7.56008 8.07995 7.56008 8.55995 7.27008 8.84995C7.12008 8.98995 6.93008 9.06998 6.74008 9.06998Z" fill="#171717" />
                                    <path d="M20.4201 19.59H6.58008C4.51008 19.59 2.83008 17.91 2.83008 15.84V12.52C2.83008 12.11 3.17008 11.77 3.58008 11.77C3.99008 11.77 4.33008 12.11 4.33008 12.52V15.84C4.33008 17.08 5.34008 18.09 6.58008 18.09H20.4201C20.8301 18.09 21.1701 18.43 21.1701 18.84C21.1701 19.25 20.8301 19.59 20.4201 19.59Z" fill="#171717" />
                                    <path d="M17.2602 22.75C17.0702 22.75 16.8802 22.68 16.7302 22.53C16.4402 22.24 16.4402 21.7599 16.7302 21.4699L19.3602 18.84L16.7302 16.21C16.4402 15.92 16.4402 15.44 16.7302 15.15C17.0202 14.86 17.5002 14.86 17.7902 15.15L20.9502 18.31C21.0902 18.45 21.1702 18.64 21.1702 18.84C21.1702 19.04 21.0902 19.23 20.9502 19.37L17.7902 22.53C17.6502 22.68 17.4602 22.75 17.2602 22.75Z" fill="#171717" />
                                    </svg>`;
					break;
				case "view-item-details":
					buttonText.textContent = `Details`;
					iconContainer.innerHTML = `
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 22C17.5 22 22 17.5 22 12C22 6.5 17.5 2 12 2C6.5 2 2 6.5 2 12C2 17.5 6.5 22 12 22Z" stroke="#171717" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                        <path d="M12 8V13" stroke="#171717" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                        <path d="M11.9946 16H12.0036" stroke="#171717" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
`;
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
				utilityBoxBackgroundOverlay.hidden = true;

				// Display warning message
				const deleteWarningBackgroundOverlay =
					document.createElement("div");
				deleteWarningBackgroundOverlay.classList.add(
					"background-overlay",
				);
				document.body.prepend(deleteWarningBackgroundOverlay);

				const warningMessageContainer = document.createElement("div");
				warningMessageContainer.classList.add(
					"warning-message-container",
				);
				deleteWarningBackgroundOverlay.appendChild(
					warningMessageContainer,
				);

				const warningMessage = document.createElement("div");
				warningMessage.textContent = `Are you sure you want to delete item '${itemName}'?`;
				warningMessage.classList.add("warning-message");
				warningMessageContainer.appendChild(warningMessage);

				const cancelButton = document.createElement("button");
				cancelButton.textContent = "Cancel";
				cancelButton.classList.add("cancel-button");
				cancelButton.addEventListener("click", () => {
					deleteWarningBackgroundOverlay.parentElement.removeChild(
						deleteWarningBackgroundOverlay,
					);

					// Show the utility box
					utilityBoxBackgroundOverlay.hidden = false;
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
			iconContainer.innerHTML = `
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M21 5.97998C17.67 5.64998 14.32 5.47998 10.98 5.47998C9 5.47998 7.02 5.57998 5.04 5.77998L3 5.97998"  stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M8.5 4.97L8.72 3.66C8.88 2.71 9 2 10.69 2H13.31C15 2 15.13 2.75 15.28 3.67L15.5 4.97" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M18.8499 9.13989L18.1999 19.2099C18.0899 20.7799 17.9999 21.9999 15.2099 21.9999H8.7899C5.9999 21.9999 5.9099 20.7799 5.7999 19.2099L5.1499 9.13989" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M10.3301 16.5H13.6601"  stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M9.5 12.5H14.5"  stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
`;
			deleteButton.appendChild(iconContainer);

			const buttonText = document.createElement("div");
			buttonText.classList.add("utility-button-text");
			buttonText.textContent = "Delete";
			deleteButton.appendChild(buttonText);

			utilityBoxContainer.appendChild(deleteButton);
		}
	});

	return utilityBoxBackgroundOverlay;
}
