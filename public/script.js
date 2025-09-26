const imageUpload = document.getElementById("image-upload");
const submitBtn = document.getElementById("submitBtn");
const hideInput = document.getElementById("hide");
const loaddingSpinner = document.getElementById("loading");
const result_length = document.getElementById("result_count");

const images_container = document.querySelector(".images_container");
const resultSummary = document.querySelector(".result_summary");
const imagePreviewContainer = document.querySelector(".image-preview-wrapper");
const downloadSvg = `<svg fill="#ffffff" viewBox="0 0 32 32" version="1.1" xmlns="http://www.w3.org/2000/svg" stroke="#ffffff"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <title>download-cloud</title> <path d="M0 16q0 2.912 1.824 5.088t4.576 2.752q0.032 0 0.032-0.032v-0.064t0.032-0.032q0.544-1.344 1.344-2.176t2.208-1.184v-2.336q0-2.496 1.728-4.256t4.256-1.76 4.256 1.76 1.76 4.256v2.336q1.376 0.384 2.176 1.216t1.344 2.144l0.096 0.288h0.384q2.464 0 4.224-1.76t1.76-4.224v-2.016q0-2.464-1.76-4.224t-4.224-1.76q-0.096 0-0.32 0.032 0.32-1.152 0.32-2.048 0-3.296-2.368-5.632t-5.632-2.368q-2.88 0-5.056 1.824t-2.784 4.544q-1.152-0.352-2.176-0.352-3.296 0-5.664 2.336t-2.336 5.664v1.984zM10.016 25.824q-0.096 0.928 0.576 1.6l4 4q0.576 0.576 1.408 0.576t1.408-0.576l4-4q0.672-0.672 0.608-1.6-0.064-0.32-0.16-0.576-0.224-0.576-0.736-0.896t-1.12-0.352h-1.984v-5.984q0-0.832-0.608-1.408t-1.408-0.608-1.408 0.608-0.576 1.408v5.984h-2.016q-0.608 0-1.12 0.352t-0.736 0.896q-0.096 0.288-0.128 0.576z"></path> </g></svg>`;
const SERVER_URL = "";
let showRectangles = true;
let results = [];
function drawImageCover(ctx, img, x, y, w, h) {
	const imgRatio = img.naturalWidth / img.naturalHeight;
	const boxRatio = w / h;

	let drawWidth, drawHeight, offsetX, offsetY;

	if (imgRatio > boxRatio) {
		// image is wider → fit height, crop sides
		drawHeight = h;
		drawWidth = h * imgRatio;
		offsetX = (w - drawWidth) / 2;
		offsetY = 0;
	} else {
		// image is taller → fit width, crop top/bottom
		drawWidth = w;
		drawHeight = w / imgRatio;
		offsetX = 0;
		offsetY = (h - drawHeight) / 2;
	}

	ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
}

function createResultCard(entry) {
	const imageUrl = `${SERVER_URL}/download/${entry.imageUrl}`;

	const rectangles = entry.rectangles;
	const colors = entry.colors;
	const containerDiv = document.createElement("div");
	const img = document.createElement("img");
	const rectanglesDiv = document.createElement("div");
	const downloadLinkElm = document.createElement("a");
	downloadLinkElm.innerHTML = downloadSvg;
	downloadLinkElm.href = imageUrl;
	downloadLinkElm.download = entry.imageUrl;
	downloadLinkElm.classList.add("image_download_link");
	containerDiv.appendChild(downloadLinkElm);
	containerDiv.classList.add("image_container");
	rectanglesDiv.classList.add("faces");
	img.crossOrigin = "anonymous";
	img.src = imageUrl;

	containerDiv.appendChild(img);
	containerDiv.appendChild(rectanglesDiv);
	images_container.appendChild(containerDiv);

	img.onload = () => {
		const canvas = document.createElement("canvas");
		const { width: w, height: h } = img.getBoundingClientRect();
		canvas.width = w;
		canvas.height = h;
		const ctx = canvas.getContext("2d");
		ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

		img.style.display = "none";
		containerDiv.insertBefore(canvas, rectanglesDiv);

		for (let idx = 0; idx < rectangles.length; idx++) {
			const rectImg = document.createElement("img");
			rectImg.classList.add("miniature");
			const color = colors[idx];

			let [top, right, bottom, left] = rectangles[idx];
			const x = left * w;
			const y = top * h;
			const width = (right - left) * w;
			const height = (bottom - top) * h;
			if (showRectangles) {
				ctx.strokeStyle = color;
				ctx.lineWidth = 2;
				ctx.strokeRect(x, y, width, height);
			}

			const MINI_IMG_W = 60;
			const MINI_IMG_H = 60;
			const faceCanvas = document.createElement("canvas");
			faceCanvas.width = MINI_IMG_W;
			faceCanvas.height = MINI_IMG_H;
			const faceCtx = faceCanvas.getContext("2d");
			faceCtx.drawImage(
				canvas,
				x,
				y,
				width,
				height, // source
				0,
				0,
				MINI_IMG_W,
				MINI_IMG_H // destination
			);
			rectImg.style.border = "2px solid " + color;
			rectImg.style.marginInline = "2px";
			rectImg.src = faceCanvas.toDataURL();
			rectanglesDiv.appendChild(rectImg);
		}
	};

	return containerDiv;
}

function setResultLength(num) {
	if (num > 0)
		resultSummary.innerHTML = `<h2>
					Found <span id="result_count">${num}</span> images that
					contains given faces together
				</h2>`;
	else resultSummary.innerHTML = "";
}
imageUpload.addEventListener("change", async (e) => {
	const files = e.target.files;
	if (!files?.length > 0) return;
	imagePreviewContainer.innerHTML = "";
	for (let file of files) {
		const imageUrl = URL.createObjectURL(file);
		const image = document.createElement("img");
		image.src = imageUrl;
		image.classList.add("image-preview");
		imagePreviewContainer.appendChild(image);
	}
	submitBtn.removeAttribute("disabled");
});

const populateCards = (results) => {
	for (let img_url in results) {
		if (results[img_url].length === 0) continue;

		createResultCard({
			imageUrl: img_url,
			confidences: results[img_url].map((e) => e[0]),
			rectangles: results[img_url].map((e) => e[1]),
			colors: results[img_url].map((e) => e[2]),
		});
	}
	const matchesCount = Object.keys(results).filter(
		(k) => results[k].length > 0
	).length;
	setResultLength(matchesCount);
};
async function findMatches(files) {
	const formData = new FormData();
	for (let i = 0; i < files.length; i++) {
		formData.append("files", files[i]);
	}
	const response = await fetch(`${SERVER_URL}/similar`, {
		method: "POST",
		body: formData,
	});
	if (!response.ok) {
		throw new Error("Request failed " + response.status);
	}

	return await response.json();
}
const setLoading = (bool) => {
	if (bool) loaddingSpinner.removeAttribute("hidden");
	else loaddingSpinner.setAttribute("hidden", true);
};
submitBtn.addEventListener("click", async () => {
	setLoading(true);
	try {
		images_container.innerHTML = "";
		const json = await findMatches(imageUpload.files);
		results = json.matches;
		if (Object.keys(results).length === 0) {
			alert(
				"No faces were recognized in the given images. Please try with different images."
			);
		}
		populateCards(results);
	} catch (error) {
		alert("error occured while trying to identify faces");
	} finally {
		setLoading(false);
	}
});

hideInput.addEventListener("change", (e) => {
	showRectangles = !e.target.checked;
	images_container.innerHTML = "";
	populateCards(results);
});
