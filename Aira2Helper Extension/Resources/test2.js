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
		extensions: [".bin", ".db", ".torrent"],
	},
};

const filterLists = {
	blacklist: {
		name: "Blacklist",
		extensions: [".exe", ".bat", ".dll", ".com"],
	},
	whitelist: {
		name: "Whitelist",
		extensions: [".mp4", ".pdf", ".jpg", ".png"],
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

// 综合匹配方法：优先白名单 -> 黑名单 -> 默认扩展名
function matchExtensionWithFilters(url, extensions, filterLists) {
	// whitelist
	const whitelistResult = matchWhitelist(url, filterLists.whitelist);
	if (whitelistResult) return whitelistResult;
	// blacklist
	if (matchBlacklist(url, filterLists.blacklist)) return null;
	// default extensions
	return matchDefaultExtensions(url, extensions);
}

console.log(matchExtensionWithFilters("example.mp4", extensions, filterLists));
