const addImageForm = document.getElementById("add-image-form");
const resetButton = document.querySelector("button[type=reset]");
const loaddingSpinner = document.getElementById("loading");
const searchParams = window.location.search;
const password = searchParams.split("=")[1];
addImageForm.addEventListener("change", (e) => {
	const imageViewer = addImageForm.querySelector(".file-viewer");
	const fileInput = addImageForm.querySelector("input[type=file]");
	const file = fileInput.files[0];
	const url = URL.createObjectURL(file);
	imageViewer.setAttribute("src", url);
});
const setLoading = (bool) => {
	if (bool) loaddingSpinner.removeAttribute("hidden");
	else loaddingSpinner.setAttribute("hidden", true);
};
async function uploadFile(file) {
	const body = new FormData();
	body.append("file", file);
	const res = await fetch("/embed", {
		method: "POST",
		body,
	});

	if (!res.ok) {
		alert("error wile uploading file");
	} else {
		const json = await res.json();
		if (json.faces_detected === 0) {
			alert("the image have no faces");
		} else {
			alert(
				`detected ${json.faces_detected} face${
					json.faces_detected > 1 ? "s" : ""
				}`
			);
		}
	}
}
addImageForm.addEventListener("submit", async (e) => {
	e.preventDefault();
	const imageViewer = addImageForm.querySelector(".file-viewer");
	const fileInput = addImageForm.querySelector("input[type=file]");
	const file = fileInput.files[0];
	try {
		setLoading(true);
		await uploadFile(file);
	} catch (error) {
	} finally {
		setLoading(false);
	}
	imageViewer.setAttribute("src", "/avatar.png");
	window.location.reload();
});

resetButton.addEventListener("click", (e) => {
	const imageViewer = addImageForm.querySelector(".file-viewer");
	imageViewer.setAttribute("src", "/avatar.png");
});
