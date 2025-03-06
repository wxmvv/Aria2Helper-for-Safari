// MARK
browser.storage.local.get(["settings"]).then((result) => {
	const settings = result.settings;

	if (settings && settings.listenDownloads) {
		console.log("[Aria2HelpFer] start to listen downloads");
		document.addEventListener("click", function (event) {
			let target = event.target;
			// console.log("[Aria2HelpFer] click:", target);
			// check if link
			while (target && target.nodeName !== "A") {
				// console.log("[Aria2HelpFer] not link, go up");
				target = target.parentElement;
			}

			if (target && target.nodeName === "A") {
				// console.log("[Aria2HelpFer] is link");
				const url = target.href;
				// check if download link
				if (isDownloadLink(url, settings.extensions)) {
					// console.log("[Aria2HelpFer] block default");
					const fileparts = getFileParts(target.href);
					// console.log("[Aria2HelpFer] sendAria2Request", { api: "aria2_addUri", url: url, cookie: document.cookie, header: getRequestHeaders() });
					browser.runtime.sendMessage({ api: "aria2_addUri", url: url, cookie: document.cookie, header: getRequestHeaders() }).then((response) => {
						console.log("Received response: ", response);
						if (response === "error") {
							console.log("[aria2HelpFer] error to connect aria2 server");
							if (settings.showNotification)
								browser.runtime.sendMessage({ api: "native-open-notification", title: "Error", subtitle: "", body: `Error to connect aria2 server. Download with Safari Native.` });
						} else {
							event.preventDefault();
							if (settings.showNotification)
								browser.runtime.sendMessage({ api: "native-open-notification", title: "Success", subtitle: "", body: `[Download started] ${fileparts.filename}` });
						}
					});
				}
			} else {
				console.log("[Aria2HelpFer] not download link");
			}
		});
	} else {
		console.log("[Aria2HelpFer] not listen downloads");
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

// get headers
function getRequestHeaders() {
	const headers = {};

	headers["User-Agent"] = navigator.userAgent;
	headers["Accept-Language"] = navigator.language;

	return headers;
}
