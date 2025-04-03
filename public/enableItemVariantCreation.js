let isVariantCreationEnabled = false;

let variantAddingToggleBtn = document.querySelector(
	".variant-adding-toggle-btn",
);

variantAddingToggleBtn.addEventListener("click", () => {
	isVariantCreationEnabled = !isVariantCreationEnabled;
	variantAddingToggleBtn.textContent = isVariantCreationEnabled
		? "Disable Item Variant"
		: "Enable Item Variant";
});
