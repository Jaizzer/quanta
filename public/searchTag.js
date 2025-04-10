const searchTagBtn = document.querySelector(".search-button");

searchTagBtn.addEventListener("click", (e) => {
	renderSearchBar(e);
});

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
    input.name = 'keyword'
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
		form.parentElement.removeChild(form);

		// Render the search tag button when the search bar is closed
		const newSearchTagBtn = searchTagBtn.cloneNode(true);
		newSearchTagBtn.addEventListener("click", (e) => {
			renderSearchBar(e);
		});
		container.appendChild(newSearchTagBtn);
	});
	form.appendChild(closeBtn);
}
