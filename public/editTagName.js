const tagNames = document.querySelectorAll(".tag-name");
tagNames?.forEach((tagName) =>
	tagName?.addEventListener("click", () => {
		const backgroundOverlay = document.createElement("div");
		backgroundOverlay.classList.add("background-overlay");
		document.body.appendChild(backgroundOverlay);

		const form = document.createElement("form");
		form.method = "POST";
		form.action = `/tags/${tagName.dataset.id}`;
		backgroundOverlay.appendChild(form);

		const formTitle = document.createElement("h2");
		formTitle.textContent = "Edit Tag";
		form.appendChild(formTitle);

		const input = document.createElement("input");
		input.name = "tagName";
		input.value = tagName.textContent;
		input.placeholder = "Tag Name";
		input.addEventListener("input", () => {
			input.setCustomValidity("");
		});
		form.appendChild(input);

		const cancelButton = document.createElement("button");
		cancelButton.type = "button";
		cancelButton.textContent = "Cancel";
		cancelButton.addEventListener("click", () => {
			backgroundOverlay.parentElement.removeChild(backgroundOverlay);
		});
		form.appendChild(cancelButton);

		const saveButton = document.createElement("button");
		saveButton.type = "submit";
		saveButton.textContent = "Save";
		saveButton.addEventListener("click", () => {
			// Render error message if input is not alpha numeric or empty
			const tagName = input.value;
			const isTagNameAlpha = /^[a-zA-Z]*$/.test(tagName);
			const isTagNameEmpty = input.value.trim() === "";
			input.setCustomValidity(
				isTagNameEmpty
					? "Tag name must not be empty"
					: !isTagNameAlpha
						? "Tag name must be alpha numeric"
						: "",
			);
			input.reportValidity();
		});

		form.appendChild(saveButton);
	}),
);
