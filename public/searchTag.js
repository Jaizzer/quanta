const searchTagBtn = document.querySelector(".search-button");

searchTagBtn.addEventListener("click", (e) => {
	renderSearchBar(e);
});

// Click the search bar by default
const clickEvent = new Event("click");
searchTagBtn.dispatchEvent(clickEvent);

function renderSearchBar(e) {
	// Access the container
	const container = e.target.parentElement;

	// Hide the search tag button
	e.target.parentElement.removeChild(e.target);

	// Render a search bar
	const form = document.createElement("form");
	form.classList.add("search-bar");
	form.method = "GET";
	form.action = window.location.href;
	container.appendChild(form);

	const input = document.createElement("input");
	input.name = "keyword";
	input.placeholder = "Search";
	const searchIcon = document.createElement("label");
	searchIcon.textContent = "🔍";
	searchIcon.htmlFor = input;
	form.appendChild(searchIcon);
	form.appendChild(input);

	const closeBtn = document.createElement("button");
	closeBtn.type = "button";
	closeBtn.textContent = "x";
	closeBtn.classList.add("close-btn");
	closeBtn.addEventListener("click", () => {
		// Go back to the tag page if the tag is in item search mode through the 'keyword' query in the URL
		const isTagInItemSearchMode = window.location.href.includes("keyword");
		if (isTagInItemSearchMode) {
			document.querySelector("form")?.submit();
		}

		form.parentElement.removeChild(form);

		// Render the search tag button when the search bar is closed
		const newSearchTagBtn = searchTagBtn.cloneNode(true);
		newSearchTagBtn.addEventListener("click", (e) => {
			renderSearchBar(e);
		});
		container.appendChild(newSearchTagBtn);
	});
	form.appendChild(closeBtn);

    // Don't submit the form if the search query is empty
	form.addEventListener("submit", (e) => {
		if (input.value.trim() === "") {
			e.preventDefault();
		}
	});
}
