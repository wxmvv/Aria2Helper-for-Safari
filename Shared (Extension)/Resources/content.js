//
const extensions = {
	video: {
		name: "Videos",
		extensions: [
			".3g2",
			".3gp",
			".3gp2",
			".3gpp",
			".asf",
			".asx",
			".avi",
			".dat",
			".divx",
			".flv",
			".m1v",
			".m2ts",
			".m2v",
			".m4v",
			".mkv",
			".mov",
			".mp4",
			".mpe",
			".mpeg",
			".mpg",
			".mts",
			".ogv",
			".qt",
			".ram",
			".rm",
			".rmvb",
			".ts",
			".vob",
			".wmv",
		],
	},
	audio: {
		name: "Audios",
		extensions: [
			".aac",
			".ac3",
			".adts",
			".amr",
			".ape",
			".eac3",
			".flac",
			".m1a",
			".m2a",
			".m4a",
			".mid",
			".mka",
			".mp2",
			".mp3",
			".mpa",
			".mpc",
			".ogg",
			".ra",
			".tak",
			".vqf",
			".wm",
			".wav",
			".wma",
			".wv",
		],
	},
	picture: {
		name: "Pictures",
		extensions: [
			".abr",
			".bmp",
			".emf",
			".gif",
			".j2c",
			".j2k",
			".jfif",
			".jif",
			".jp2",
			".jpc",
			".jpe",
			".jpeg",
			".jpf",
			".jpg",
			".jpk",
			".jpx",
			".pcx",
			".pct",
			".pic",
			".pict",
			".png",
			".pns",
			".psd",
			".psdx",
			".raw",
			".svg",
			".svgz",
			".tga",
			".tif",
			".tiff",
			".wbm",
			".wbmp",
			".webp",
			".wmf",
			".xif",
		],
	},
	document: {
		name: "Documents",
		extensions: [
			".csv",
			".doc",
			".docm",
			".docx",
			".dot",
			".dotm",
			".dotx",
			".key",
			".mpp",
			".numbers",
			".odp",
			".ods",
			".odt",
			".pages",
			".pdf",
			".pot",
			".potm",
			".potx",
			".pps",
			".ppsm",
			".ppsx",
			".ppt",
			".pptm",
			".pptx",
			".rtf",
			".txt",
			".vsd",
			".vsdx",
			".wk1",
			".wk2",
			".wk3",
			".wk4",
			".wks",
			".wpd",
			".wps",
			".xla",
			".xlam",
			".xll",
			".xlm",
			".xls",
			".xlsb",
			".xlsm",
			".xlsx",
			".xlt",
			".xltx",
			".xlw",
			".xps",
		],
	},
	application: {
		name: "Applications",
		extensions: [".apk", ".bat", ".com", ".deb", ".dll", ".dmg", ".exe", ".ipa", ".jar", ".msi", ".rpm", ".sh"],
	},
	archive: {
		name: "Archives",
		extensions: [
			".001",
			".7z",
			".ace",
			".arj",
			".bz2",
			".cab",
			".cbr",
			".cbz",
			".gz",
			".img",
			".iso",
			".lzh",
			".qcow2",
			".r",
			".rar",
			".sef",
			".tar",
			".taz",
			".tbz",
			".tbz2",
			".uue",
			".vdi",
			".vhd",
			".vmdk",
			".wim",
			".xar",
			".xz",
			".z",
			".zip",
		],
	},
	others: {
		name: "Others",
		extensions: [".bin", ".db", ".torrent", ".sig", ".eaglepack"],
	},
};

let filterLists = {
	blacklist: {
		name: "Blacklist",
		extensions: [],
	},
	whitelist: {
		name: "Whitelist",
		extensions: [],
	},
};

function matchBlacklist(url, blacklist) {
	const urlLower = url.toLowerCase();
	const lastDotIndex = urlLower.lastIndexOf(".");
	if (lastDotIndex === -1) return false;

	const ext = urlLower.substring(lastDotIndex);
	return blacklist.extensions.some((extension) => ext.endsWith(extension.toLowerCase()));
}
function matchWhitelist(url, whitelist) {
	const urlLower = url.toLowerCase();
	const lastDotIndex = urlLower.lastIndexOf(".");
	if (lastDotIndex === -1) return null;

	const ext = urlLower.substring(lastDotIndex);
	const matched = whitelist.extensions.find((extension) => ext.endsWith(extension.toLowerCase()));

	if (matched) {
		return {
			category: "whitelist",
			name: whitelist.name,
			extension: matched,
		};
	}
	return null;
}
function matchDefaultExtensions(url, extensions) {
	const urlLower = url.toLowerCase();
	const lastDotIndex = urlLower.lastIndexOf(".");
	if (lastDotIndex === -1) return null;

	const ext = urlLower.substring(lastDotIndex);

	for (const [category, data] of Object.entries(extensions)) {
		const matched = data.extensions.find((extension) => ext.endsWith(extension.toLowerCase()));
		if (matched) {
			return {
				category: category,
				name: data.name,
				extension: matched,
			};
		}
	}
	return null;
}

// Preferred White List -> Black List -> Default Extension
function matchExtensionWithFilters(url, extensions, filterLists) {
	// whitelist
	const whitelistResult = matchWhitelist(url, filterLists.whitelist);
	if (whitelistResult) return whitelistResult;
	// blacklist
	if (matchBlacklist(url, filterLists.blacklist)) return null;
	// default extensions
	return matchDefaultExtensions(url, extensions);
}

// simulate link behavior
function simulateLinkBehavior(element) {
	try {
		const href = element.getAttribute("href");
		if (!href) return console.log("[Aria2Helper] No href attribute found on the link element");

		const targetAttr = element.getAttribute("target");
		const hasDownload = element.hasAttribute("download");

		const tempLink = element.cloneNode(true);
		tempLink.href = href;

		if (hasDownload) {
			tempLink.download = element.getAttribute("download") || "";
			tempLink.style.display = "none";
			document.body.appendChild(tempLink);
			tempLink.click();
			document.body.removeChild(tempLink);
		} else {
			switch (targetAttr) {
				case "_blank":
					window.open(href, "_blank");
					break;
				case "_top":
					window.top.location.href = href;
					break;
				case "_parent":
					window.parent.location.href = href;
					break;
				default:
					window.location.href = href;
					break;
			}
		}
	} catch (error) {
		console.error("[Aria2Helper] Error simulating link behavior:", error);
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

// main
browser.storage.local.get(["settings"]).then((result) => {
	let settings = result.settings;
	if (settings && settings.listenDownloads) {
		console.log("[Aria2Helper] start to listen downloads");

		let listener = (event) => {
			// command control option shift pressed when click -> ignore
			if (event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return;

			let target = event.target;

			while (target && target.nodeName !== "A") {
				if (target.nodeName === "BUTTON" && target.parentElement && target.parentElement.nodeName === "A") return; // for button inside a tag, ignore,it will download twice
				target = target.parentElement;
			}
			if (target && target.nodeName === "A") {
				if (!target.hasAttribute("href")) return;
				if (target.href.includes("archive/refs/heads") && target.href.includes("github.com")) return; // ignore github archive links
				if (!target.getAttribute("href").includes(".")) return;

				event.preventDefault(); // block default behavior

				const url = new URL(target.href);
				const testUrl = url.origin + url.pathname;

				if (matchExtensionWithFilters(testUrl, extensions, filterLists)) {
					const fileparts = getFileParts(testUrl);
					// post to aria2 server
					browser.runtime.sendMessage({ api: "aria2_addUri", url: target.href, cookie: document.cookie, header: getRequestHeaders() }).then((response) => {
						if (response === "error") {
							console.log("[aria2Helper] error to connect aria2 server, download with safari native");
							simulateLinkBehavior(target);
							if (settings.showNotification)
								browser.runtime.sendMessage({ api: "native-open-notification", title: "Error", subtitle: "", body: `Error to connect aria2 server. Download with Safari Native.` });
						} else {
							if (settings.showNotification)
								browser.runtime.sendMessage({ api: "native-open-notification", title: "Success", subtitle: "", body: `[Download started] ${fileparts.filename}` });
						}
					});
				} else {
					simulateLinkBehavior(target);
				}
			}
		};

		document.addEventListener("click", listener);

		window.addEventListener("unload", () => {
			document.removeEventListener("click", listener);
		});
	}
});
