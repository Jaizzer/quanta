let isVariantCreationEnabled = true;

let variantAddingToggleBtn = document.querySelector(
	".variant-adding-toggle-btn",
);

let addVariantBtn = document.querySelector(".add-variant-btn");

addVariantBtn.addEventListener("click", () => {
	addVariant();
});

let deleteVariantBtns = Array.from(
	document.querySelectorAll(".delete-variant-btn"),
);

deleteVariantBtns.forEach((deleteVariantBtn) => {
	deleteVariantBtn.addEventListener("click", (e) => {
		e.target.parentElement.parentElement.removeChild(
			e.target.parentElement,
		);
	});
});

// Access the form
const form = document.querySelector("form");

// Clone of the current variant creation section
let currentVariantCreationSectionCopy;

variantAddingToggleBtn.addEventListener("click", () => {
	isVariantCreationEnabled = !isVariantCreationEnabled;
	variantAddingToggleBtn.textContent = isVariantCreationEnabled
		? "Disable Item Variant"
		: "Enable Item Variant";

	if (!isVariantCreationEnabled) {
		// Backup the variant creation section first before removal
		let currentVariantCreationSection = document.querySelector(
			".variant-creation-container",
		);
		currentVariantCreationSectionCopy =
			currentVariantCreationSection.cloneNode(true);

		// Remove the original variant creation Section
		form.removeChild(currentVariantCreationSection);
	} else {
		// Add functionality to the Delete Variant buttons inside the variant creation section's copy
		let deleteVariantBtns = Array.from(
			currentVariantCreationSectionCopy.querySelectorAll(
				".delete-variant-btn",
			),
		);

		deleteVariantBtns.forEach((deleteVariantBtn) => {
			deleteVariantBtn.addEventListener("click", (e) => {
				e.target.parentElement.parentElement.removeChild(
					e.target.parentElement,
				);
			});
		});

		// Restore the variant creation section from a created copy
		form.appendChild(currentVariantCreationSectionCopy);
	}
});

function addVariant() {
	// Extract the last variant field
	const lastVariantField = Array.from(
		document.querySelectorAll(".variant-field"),
	).slice(-1)[0];

	// Extract the input field name
	const inputFieldName = lastVariantField.querySelector("input").name;

	// Extract the ID from the input field name
	const id = parseInt(inputFieldName.slice(-1));

	// Create the id of the new variant field to be created
	const newVariantFieldId = `Variant-${id + 1}`;

	// Clone the last variant field that will serve as the new variant field
	const newVariantField = lastVariantField.cloneNode(true);

	// Access all the inputs inside the new variant field input
	const newVariantFieldInputs = Array.from(
		newVariantField.querySelectorAll("input"),
	);

	// Update the name of all the inputs to match the newly generated id
	newVariantFieldInputs.forEach((input) => (input.name = newVariantFieldId));

	// Put an initial value inside the variant name input
	newVariantFieldInputs[0].value = newVariantFieldId;

	// Remove any error messages copied from the last variant field
	let errorMessageCopiedFromLastVariantField =
		newVariantField.querySelector(".error-message");
	if (errorMessageCopiedFromLastVariantField) {
		newVariantField.removeChild(errorMessageCopiedFromLastVariantField);
	}

	// Add event listener to the new variant field's Delete button
	const newVariantFieldDeleteBtn = newVariantField.querySelector(
		".delete-variant-btn",
	);

	newVariantFieldDeleteBtn.addEventListener("click", (e) => {
		e.target.parentElement.parentElement.removeChild(
			e.target.parentElement,
		);
	});

	// Place the newly created variant field next to the last variant field
	let variantCreationSection = document.querySelector(
		".variant-creation-container",
	);
	variantCreationSection.insertBefore(
		newVariantField,
		variantCreationSection.querySelector(".add-variant-btn"),
	);
}
