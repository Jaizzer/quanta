const sortForm = document.querySelector(".sort-form");
const sortOptionSelector = sortForm.querySelector("select");
sortOptionSelector?.addEventListener("change", () => {
	sortForm.submit();
});
