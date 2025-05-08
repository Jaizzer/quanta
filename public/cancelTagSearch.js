const searchBar = document.querySelector("#search");

if (searchBar.value.trim() !== "") {
	searchBar.parentElement.appendChild(createCancelTagSearchButton());
}

searchBar.addEventListener("input", (e) => {
	const cancelTagSearchButton = document.querySelector(
		".cancel-tag-search-button",
	);

	// Hide the cancel tag search button if there is no input
	if (e.target.value.trim() === "" && cancelTagSearchButton) {
		e.target.parentElement.removeChild(cancelTagSearchButton);
	} else if (e.target.value.trim() !== "" && !cancelTagSearchButton) {
		// REnder the cancel tag search button if there is an input
		e.target.parentElement.appendChild(createCancelTagSearchButton());
	}
});

function createCancelTagSearchButton() {
	const cancelTagSearchButton = document.createElement("button");
	cancelTagSearchButton.textContent = "x";
	cancelTagSearchButton.type = "button";
	cancelTagSearchButton.classList.add("cancel-tag-search-button");

	cancelTagSearchButton.addEventListener("click", () => {
		// Empty the search bar
		searchBar.value = "";

		// Go back to the main tags page if the search is canceled
		if (window.location.href.includes("keyword"))
			window.location = window.location.href.slice(
				0,
				window.location.href.indexOf("?keyword"),
			);
	});

	return cancelTagSearchButton;
}
