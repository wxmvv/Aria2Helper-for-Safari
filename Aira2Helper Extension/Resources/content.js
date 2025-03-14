let skipNextClick = false;

browser.storage.local.get(["settings"]).then((result) => {
	let settings = result.settings;
	if (settings && settings.listenDownloads) {
		console.log("[Aria2Helper] start to listen downloads");

		let listener = (event) => {
			if (skipNextClick) {
				skipNextClick = false;
				return;
			}
			let target = event.target;
			while (target && target.nodeName !== "A") target = target.parentElement;
			if (target && target.nodeName === "A") {
				if (isDownloadLink(target.href, settings.extensions)) {
					// block default
					event.preventDefault();
					const fileparts = getFileParts(target.href);

					// post to aria2 server
					browser.runtime.sendMessage({ api: "aria2_addUri", url: target.href, cookie: document.cookie, header: getRequestHeaders() }).then((response) => {
						if (response === "error") {
							// error
							console.log("[aria2Helper] error to connect aria2 server");
							// Set flag and trigger default behavior
							skipNextClick = true;
							target.click(); // click the link again
							if (settings.showNotification)
								browser.runtime.sendMessage({ api: "native-open-notification", title: "Error", subtitle: "", body: `Error to connect aria2 server. Download with Safari Native.` });
						} else {
							if (settings.showNotification)
								browser.runtime.sendMessage({ api: "native-open-notification", title: "Success", subtitle: "", body: `[Download started] ${fileparts.filename}` });
						}
					});
				}
			} else {
				// not download link
			}
		};
		document.addEventListener("click", listener);
	} else {
		// not listen downloads
	}
});

// validateDownloadLink
function isDownloadLink(url, extensions) {
	const downloadExtensions = [
		".exe",
		".zip",
		".rar",
		".tar",
		".gz",
		".7z",
		".dmg",
		".pkg",
		".apk",
		".iso",
		".img",
		".sig",
		".zst",
		".bz2",
		".xz",
		".pdf",
		".doc",
		".docx",
		".xls",
		".xlsx",
		".ppt",
		".pptx",
		".mp3",
		".mp4",
		".avi",
		".mkv",
		".jpg",
		".png",
		".gif",
		".torrent",
	];
	if (extensions) {
		return extensions.some((ext) => url.endsWith(ext));
	} else {
		return downloadExtensions.some((ext) => url.endsWith(ext));
	}
}

function getFileParts(filename) {
	if (typeof filename !== "string" || filename.trim() === "") {
		return {
			extension: "",
			nameWithoutExtension: "",
		};
	}

	filename = filename.trim();

	filename = decodeURIComponent(filename.substring(filename.lastIndexOf("/") + 1));
	const lastDotIndex = filename.lastIndexOf(".");
	if (
		lastDotIndex === -1 || // no dot
		lastDotIndex === 0 || // start with dot (.gitignore)
		lastDotIndex === filename.length - 1
	) {
		// end with dot (file.)
		return {
			extension: "",
			nameWithoutExtension: filename,
		};
	}
	const ext = filename.slice(lastDotIndex + 1);
	return {
		filename: filename,
		extension: ext ? `.${ext}` : "", // add dot if ext is not empty
		nameWithoutExtension: filename.slice(0, lastDotIndex),
	};
}

function getRequestHeaders() {
	const headers = {};

	headers["User-Agent"] = navigator.userAgent;
	headers["Accept-Language"] = navigator.language;

	return headers;
}
