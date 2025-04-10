const forms = document.querySelectorAll("form");
forms?.forEach((form) => {
	// Access the delete button
	const deleteTagBtn = form.querySelector(".delete-tag-btn");

	// Get the tag name
	const tagName = form.querySelector(".tag-name")?.textContent;

	// Render warning message before deleting the tag
	deleteTagBtn.addEventListener("click", () => {
		const backgroundOverlay = document.createElement("div");
		backgroundOverlay.classList.add("background-overlay");
		document.body.appendChild(backgroundOverlay);

		const warningMessageContainer = document.createElement("div");
		warningMessageContainer.classList.add("warning-message-container");
		backgroundOverlay.appendChild(warningMessageContainer);

		const warningMessage = document.createElement("div");
		warningMessage.textContent = `Are you sure you want to delete tag '${tagName}'?`;
		warningMessage.classList.add("warning-message");
		warningMessageContainer.appendChild(warningMessage);

		const cancelBtn = document.createElement("button");
		cancelBtn.textContent = "Cancel";
		cancelBtn.classList.add("cancel-btn");
		cancelBtn.addEventListener("click", () => {
			backgroundOverlay.parentElement.removeChild(backgroundOverlay);
		});
		warningMessageContainer.appendChild(cancelBtn);

		const saveBtn = document.createElement("button");
		saveBtn.textContent = "Yes";
		saveBtn.classList.add("save-btn");
		saveBtn.addEventListener("click", () => {
			form.submit();
		});
		warningMessageContainer.appendChild(saveBtn);
	});
});
