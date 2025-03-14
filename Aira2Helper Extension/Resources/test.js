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

const extensionList = [
	[
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
		".apk",
		".bat",
		".com",
		".deb",
		".dll",
		".dmg",
		".exe",
		".ipa",
		".jar",
		".msi",
		".rpm",
		".sh",
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
		".bin",
		".db",
		".torrent",
	],
];

// 方法1.5：数组方式匹配
function isDownloadLink(url, extList) {
	if (extList) return extList.some((ext) => url.endsWith(ext));
	else return extensionList.some((ext) => url.endsWith(ext));
}

// 方法1：数组方式匹配
function matchExtensionList(url, extensions) {
	// 将所有扩展名拼接成一个长数组
	const allExtensions = Object.values(extensions)
		.flatMap((category) => category.extensions)
		.map((ext) => ext.toLowerCase());

	// 获取URL中的扩展名
	const urlLower = url.toLowerCase();
	const lastDotIndex = urlLower.lastIndexOf(".");
	if (lastDotIndex === -1) return null;

	const ext = urlLower.substring(lastDotIndex);

	// 检查是否匹配
	const matched = allExtensions.find((extension) => ext.startsWith(extension));
	if (!matched) return null;
	else return true;

	// 找到匹配的类别
	// for (const [category, data] of Object.entries(extensions)) {
	// 	if (data.extensions.includes(matched)) {
	// 		return {
	// 			category: category,
	// 			name: data.name,
	// 			extension: matched,
	// 		};
	// 	}
	// }
	// return null;
}
// 方法2：对象方式匹配  最快！
function matchExtensionObject(url, extensions) {
	const urlLower = url.toLowerCase();
	const lastDotIndex = urlLower.lastIndexOf(".");
	if (lastDotIndex === -1) return null;

	const ext = urlLower.substring(lastDotIndex);

	for (const [category, data] of Object.entries(extensions)) {
		const matched = data.extensions.find((extension) => ext.startsWith(extension.toLowerCase()));
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

// 方法3 ：对象方式匹配 endwith
function matchExtensionObjectEndsWith(url, extensions) {
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

function test() {
	const testUrl = "https://example.com/video/test.a";
	const iterations = 10000; // 测试次数

	// 测试方法1 拼接
	console.time("List Method");
	for (let i = 0; i < iterations; i++) {
		matchExtensionList(testUrl, extensions);
	}
	console.timeEnd("List Method");

	// 测试方法1.5 不拼接列表
	console.time("List 1.5 Method");
	for (let i = 0; i < iterations; i++) {
		isDownloadLink(testUrl, extensionList);
	}
	console.timeEnd("List 1.5 Method");

	// 测试方法2
	console.time("Object Method");
	for (let i = 0; i < iterations; i++) {
		matchExtensionObject(testUrl, extensions);
	}
	console.timeEnd("Object Method");

	// 测试方法3
	console.time("Object Endwith Method");
	for (let i = 0; i < iterations; i++) {
		matchExtensionObjectEndsWith(testUrl, extensions);
	}
	console.timeEnd("Object Endwith Method");

	// 验证结果

	console.log("List Method Result:", matchExtensionList(testUrl, extensions));
	console.log("List 1.5 Method Result:", isDownloadLink(testUrl, extensionList));
	console.log("Object Method Result:", matchExtensionObject(testUrl, extensions));
	console.log("Object Endwith Method Result:", matchExtensionObjectEndsWith(testUrl, extensions));
}

test();
