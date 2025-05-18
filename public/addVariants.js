// Variable to store the body element of the item creation page
let itemCreationBody;

// Variable to store the body element of the variant creation page
let variantCreationBody;

// Access the variants data that is returned from the backend if they exist
const variantInputsDataString = document.querySelector(".variant-inputs-data")
	?.dataset?.variantInputsData;
const variantInputsData = variantInputsDataString
	? JSON.parse(variantInputsDataString)
	: null;
// Delete the element containing the data since the data is already retrieved
document
	.querySelector(".variant-inputs-data")
	?.parentElement?.removeChild(
		document.querySelector(".variant-inputs-data"),
	);

const isVariantsEnabled = false;
const itemNameInput = document.querySelector("#item-name");
document.querySelector("form")?.appendChild(createItemHasVariantsCheckbox());

// Append the variant inputs inside the item creation form
const itemCreationForm = document.querySelector("form");
variantInputsData.forEach((variantInputData, index) => {
	itemCreationForm?.appendChild(
		createVariantInputSection(
			`Variant ${index + 1}`,
			variantInputData.name,
			variantInputData.price,
			variantInputData.quantity,
			true,
		),
	);
});

function createItemHasVariantsCheckbox() {
	// Create the main container
	const container = document.createElement("div");
	container.classList.add("variant-checkbox-container");

	// Create the checkbox
	const checkBox = document.createElement("input");
	checkBox.type = "checkbox";
	checkBox.id = "enable-variants-checkbox";
	checkBox.name = "variantStatus";

	// Create the checkbox label
	const checkBoxLabel = document.createElement("label");
	checkBoxLabel.textContent = "This item has variants";
	checkBoxLabel.htmlFor = checkBox.id;
	checkBox.checked = variantInputsData?.length !== 0 || false;
	container.appendChild(checkBoxLabel);
	checkBoxLabel.appendChild(checkBox);

	// Render the add variant button section if the checkbox is already checked
	if (checkBox.checked) {
		checkBox.parentElement.appendChild(createAddVariantButtonSection());
	}

	checkBox.addEventListener("change", (e) => {
		// Check if the add variant button section already exists in the DOM
		const isThereAlreadyAddVariantButtonSection = document.querySelector(
			".add-variant-button-container",
		);

		// Remove the add variant button section
		if (isThereAlreadyAddVariantButtonSection) {
			e.target.parentElement.parentElement.removeChild(
				isThereAlreadyAddVariantButtonSection,
			);
		} else {
			e.target.parentElement.parentElement.appendChild(
				createAddVariantButtonSection(),
			);
		}

		// Remove the existing variants container section
		const variantsContainer = document.querySelector(".variants-container");
		if (variantsContainer) {
			e.target.parentElement.parentElement.removeChild(variantsContainer);
		}
	});

	return container;
}

function createAddVariantButtonSection() {
	// Create the main container
	const addVariantContainer = document.createElement("div");
	addVariantContainer.classList.add("add-variant-button-container");

	// Create the add variant button
	const addVariantButton = document.createElement("button");
	addVariantButton.type = "button";
	addVariantButton.textContent = "+Add";
	addVariantButton.addEventListener("click", () => {
		// Save the previous body before going to the variant creation container
		itemCreationBody = document.body;

		// Create initial variant creation body if variantCreationBody does not yet exist
		if (!variantCreationBody) {
			// Clear the body element
			document.body.parentElement.replaceChild(
				document.createElement("body"),
				document.body,
			);

            // Create additional container for the entire variant adding page content
			const variantAddingContainer = document.createElement("div");
			variantAddingContainer.classList.add("variant-adding");
			document.body.appendChild(variantAddingContainer);

			variantAddingContainer.appendChild(
				createVariantAddingHeadingSection(),
			);
			variantAddingContainer.appendChild(
				createVariantCreationContainer(variantInputsData),
			);
		} else {
			// Just load the previously save variantCreationBody if it exists
			document.body.parentElement.replaceChild(
				variantCreationBody,
				itemCreationBody,
			);
		}
	});
	addVariantContainer.appendChild(addVariantButton);

	// Create variant list if there are existing variants
	if (variantCreationBody) {
		const variantInputSections = Array.from(
			variantCreationBody.querySelectorAll(".variant-input-section"),
		);

		const variantNames = variantInputSections.map(
			(variantInputSection) =>
				variantInputSection.querySelector(".variant-name-input").value,
		);
		addVariantContainer.appendChild(createVariantList(variantNames));
	} else if (variantInputsData) {
		// Create variant list from the variant inputs data returned by the backend
		const variantNames = variantInputsData.map(
			(variantInputData) => variantInputData.name,
		);
		addVariantContainer.appendChild(createVariantList(variantNames));
	}

	return addVariantContainer;
}

function createVariantCreationContainer(variantInputsData) {
	const container = document.createElement("div");
	container.classList.add("variant-creation-container");
	const addVariantButton = document.createElement("button");
	addVariantButton.textContent = "+Add Variant";
	addVariantButton.type = "button";
	addVariantButton.classList.add("add-variant-button");
	addVariantButton.addEventListener("click", () => {
		let variantCount =
			Array.from(document.querySelectorAll(".variant-input-section"))
				.length || 0;

		// Create variant input section element
		const variantInputSection = createVariantInputSection(
			`Variant ${variantCount + 1}`,
		);

		// Append the variant input section element in the DOM
		container.appendChild(variantInputSection);

		// Enable the save button since there is already at least 1 variant
		const saveButton = document.querySelector(".save-button");
		saveButton.disabled = false;
	});
	container.appendChild(addVariantButton);

	// Creation input elements if there is a provided variant Inputs Data
	if (variantInputsData) {
		variantInputsData.forEach((variantInputData, index) => {
			container.appendChild(
				createVariantInputSection(
					`Variant ${index + 1}`,
					variantInputData.name,
					variantInputData.price,
					variantInputData.quantity,
				),
			);
		});
	}

	return container;
}

function createVariantInputSection(
	label,
	name = "",
	price = "",
	quantity = "",
	hidden = false,
) {
	const mainContainer = document.createElement("div");
	mainContainer.classList.add("variant-input-section");
	mainContainer.hidden = hidden;

	const variantInputSectionLabel = document.createElement("h2");
	variantInputSectionLabel.classList.add("variant-input-section-label");
	variantInputSectionLabel.textContent = label;
	mainContainer.appendChild(variantInputSectionLabel);

	const deleteVariantInputSectionButton = document.createElement("button");
	deleteVariantInputSectionButton.textContent = "🗑️";
	deleteVariantInputSectionButton.type = "button";
	deleteVariantInputSectionButton.classList.add(
		"delete-variant-input-section-button",
	);
	deleteVariantInputSectionButton.addEventListener("click", () => {
		// Remove the variant input section from the DOM
		mainContainer.parentElement.removeChild(mainContainer);

		// Update the variant labels
		updateVariantInputSectionLabels();

		// Disable the save button if there is no variant left
		const isThereAnyVariantLeft =
			Array.from(document.querySelectorAll(".variant-input-section"))
				.length !== 0;

		if (!isThereAnyVariantLeft) {
			const saveButton = document.querySelector(".save-button");
			saveButton.disabled = true;
		}
	});
	mainContainer.appendChild(deleteVariantInputSectionButton);

	const variantNameInput = document.createElement("input");
	variantNameInput.name = label;
	variantNameInput.value = name;
	variantNameInput.classList.add("variant-name-input");
	variantNameInput.placeholder = "Name";
	variantNameInput.addEventListener("focus", () => {
		removeAnErrorNextToAnElement(variantNameInput);
	});
	variantNameInput.addEventListener("focusout", () => {
		triggerErrors();
	});

	mainContainer.appendChild(variantNameInput);

	const variantPriceInput = document.createElement("input");
	variantPriceInput.name = label;
	variantPriceInput.value = price;
	variantPriceInput.placeholder = "Price";
	variantPriceInput.min = 0;
	variantPriceInput.type = "number";
	variantPriceInput.classList.add("variant-price-input");
	variantPriceInput.addEventListener("input", (e) => {
		if (!e.target.validity.valid) {
			// Clear input if the value is invalid
			e.target.value = "";
		}
	});
	mainContainer.appendChild(variantPriceInput);

	const variantQuantityInput = document.createElement("input");
	variantQuantityInput.name = label;
	variantQuantityInput.value = quantity;
	variantQuantityInput.placeholder = "Quantity";
	variantQuantityInput.min = 0;
	variantQuantityInput.type = "number";
	variantQuantityInput.classList.add("variant-price-input");

	variantQuantityInput.addEventListener("input", (e) => {
		if (!e.target.validity.valid) {
			// Clear input if the value is invalid
			e.target.value = "";
		}
	});
	mainContainer.appendChild(variantQuantityInput);

	return mainContainer;
}

function createVariantAddingHeadingSection() {
	const headingSection = document.createElement("div");
	headingSection.classList.add("heading-section");

	const arrowButton = document.createElement("button");
	arrowButton.type = "button";
	arrowButton.textContent = "←";
	arrowButton.classList.add("back-button");
	arrowButton.addEventListener("click", () => {
		document.body.parentElement.replaceChild(
			itemCreationBody,
			document.body,
		);
	});
	headingSection.appendChild(arrowButton);

	const headingText = document.createElement("h1");
	headingText.textContent = "Variants and Options";
	headingSection.appendChild(headingText);

	const saveButton = document.createElement("button");
	saveButton.type = "submit";
	saveButton.textContent = "Save";
	saveButton.disabled =
		variantCreationBody?.querySelectorAll(".variant-input-section") ||
		false;
	saveButton.classList.add("save-button");

	saveButton.addEventListener("click", () => {
		triggerErrors();

		// Check if there are existing errors
		const isThereExistingVariantInputErrors =
			document.querySelector(".error-message");

		// Go back to the item creation form
		if (!isThereExistingVariantInputErrors) {
			// Save the variant creation body
			variantCreationBody = document.body;

			// Clear the variant list if it exists inside the item creation form
			removeVariantList(itemCreationBody);

			// Remove the hidden variant input section inside the item creation form
			removeVariantInputSections(itemCreationBody);

			// Restore the previous page
			document.body.parentElement.replaceChild(
				itemCreationBody,
				variantCreationBody,
			);

			// Append the variant creation form inputs inside the item creation form
			const itemCreationForm = document.querySelector("form");
			const variantInputSections = Array.from(
				variantCreationBody.querySelectorAll(".variant-input-section"),
			);

			variantInputSections.forEach((variantInputSection) => {
				const variantInputSectionCopy =
					variantInputSection.cloneNode(true);
				variantInputSectionCopy.hidden = true;
				itemCreationForm.appendChild(variantInputSectionCopy);
			});

			// Get all the variant names
			const variantNames = variantInputSections.map(
				(variantInputSection) =>
					variantInputSection.querySelector(".variant-name-input")
						.value,
			);

			// Append the variant list to the variant checkbox container
			const variantCheckboxContainer = document.querySelector(
				".variant-checkbox-container",
			);
			variantCheckboxContainer.appendChild(
				createVariantList(variantNames),
			);
		}
	});
	headingSection.appendChild(saveButton);

	return headingSection;
}

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

function updateVariantInputSectionLabels() {
	const variantInputSectionLabels = Array.from(
		document.querySelectorAll(".variant-input-section-label"),
	);

	const variantInputSectionLabelsCount =
		variantInputSectionLabels?.length || 0;

	if (variantInputSectionLabelsCount > 0) {
		variantInputSectionLabels.forEach((variantInputSectionLabel, index) => {
			variantInputSectionLabel.textContent = `Variant ${index + 1}`;
		});
	}
}

function triggerErrors() {
	const variantNameInputs = Array.from(
		document.querySelectorAll(".variant-name-input"),
	);

	// Remove extra white spaces
	variantNameInputs.forEach((variantNameInput) => {
		variantNameInput.value = variantNameInput.value.trim();
	});

	variantNameInputs.forEach((currentVariantInput) => {
		// Display error message for empty variant names
		if (currentVariantInput.value === "") {
			insertAnErrorNextToAnElement(
				currentVariantInput,
				"Variant name must not be empty.",
			);
		} else {
			// Display error message for duplicated variant names
			variantNameInputs.forEach((variantInput) => {
				if (
					currentVariantInput !== variantInput &&
					currentVariantInput.value === variantInput.value
				) {
					insertAnErrorNextToAnElement(
						currentVariantInput,
						`Variant name '${currentVariantInput.value}' already exists.`,
					);
				}
			});
		}
	});
}

function removeAnErrorNextToAnElement(element) {
	const nextElement = element.nextElementSibling;
	if (nextElement.className === "error-message") {
		element.parentElement.removeChild(nextElement);
	}
}

function createVariantList(variantNames) {
	const container = document.createElement("div");
	container.classList.add("variants-container");

	variantNames.forEach((variantName) => {
		const variant = document.createElement("div");
		variant.classList.add("variant-name");
		variant.textContent = variantName;
		container.appendChild(variant);
	});

	return container;
}

function removeVariantList(element) {
	const variantList = element.querySelector(".variants-container");
	variantList?.parentElement.removeChild(variantList);
}

function removeVariantInputSections(element) {
	const variantInputSections = Array.from(
		element.querySelectorAll(".variant-input-section"),
	);

	variantInputSections.forEach((variantInputSection) => {
		variantInputSection.parentElement.removeChild(variantInputSection);
	});
}
