let isVariantCreationEnabled = true;

let variantAddingToggleBtn = document.querySelector(
	".variant-adding-toggle-btn",
);

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
		// Restore the variant creation section from a created copy
		form.appendChild(currentVariantCreationSectionCopy);
	}
});
