// MARK

let listener;
let skipNextClick = false; // 新增标志位，用于跳过下一次点击处理

browser.storage.local.get(["settings"]).then((result) => {
	let settings = result.settings;
	if (settings && settings.listenDownloads) {
		console.log("[Aria2HelpFer] start to listen downloads");
		// listener = document.addEventListener("click", function (event) {
		listener = (event) => {
			// 如果标志位为 true，则跳过处理，让浏览器执行默认行为
			if (skipNextClick) {
				console.log("[Aria2HelpFer] skipping this click due to Aria2 failure");
				skipNextClick = false; // 重置标志位
				return;
			}
			let target = event.target;
			while (target && target.nodeName !== "A") target = target.parentElement;
			if (target && target.nodeName === "A") {
				// console.log("[Aria2HelpFer] is link", target, target.href, settings.extensions, isDownloadLink(target.href, settings.extensions));
				if (isDownloadLink(target.href, settings.extensions)) {
					// MARK block default
					event.preventDefault();
					const fileparts = getFileParts(target.href);

					// MARK post to aria2 server
					browser.runtime.sendMessage({ api: "aria2_addUri", url: target.href, cookie: document.cookie, header: getRequestHeaders() }).then((response) => {
						if (response === "error") {
							// MARK error
							console.log("[aria2HelpFer] error to connect aria2 server");
							// 设置标志位并触发默认行为
							skipNextClick = true;
							target.click(); // 直接调用原始元素的 click 方法
							if (settings.showNotification)
								browser.runtime.sendMessage({ api: "native-open-notification", title: "Error", subtitle: "", body: `Error to connect aria2 server. Download with Safari Native.` });
						} else {
							if (settings.showNotification)
								browser.runtime.sendMessage({ api: "native-open-notification", title: "Success", subtitle: "", body: `[Download started] ${fileparts.filename}` });
						}
					});
				}
			} else {
				console.log("[Aria2HelpFer] not download link");
			}
		};
		document.addEventListener("click", listener);
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
