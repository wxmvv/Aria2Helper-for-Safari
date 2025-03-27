// MARK background server
// [Doc] https://aria2.document.top/zh/aria2c.html#aria2.addUri
browser.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
	let result = await browser.storage.local.get(["defaultProfileId", "currentProfileId", "profiles", "settings", "device", "themeColor"]);
	if (!result.defaultProfileId) return await sendResponse({ error: "no default profile", code: 1 });
	if (!result.currentProfileId) return await sendResponse({ error: "no currentProfileId profile", code: 2 });
	if (!result.profiles) return await sendResponse({ error: "no profiles", code: 3 });
	if (!result.device) getSysInfo();
	let Aria2Info = result.profiles[result.defaultProfileId]; // ["rpcHost", "rpcPort", "rpcSecret"]
	let isLocal = Aria2Info.rpcHost.toLocaleLowerCase() === "localhost" || Aria2Info.rpcHost.toLocaleLowerCase() === "127.0.0.1";

	// MARK browser API
	if (message.api === "get-local-storage") {
		await sendResponse(result);
	}
	// MARK Aria2 API
	// add uri/torrent/metalink
	if (message.api === "aria2_addUri" && message.url) {
		const options = {};
		if (message.dir) console.log("dir:", message.dir), (options.dir = message.dir);
		if (message.split) console.log("split:", message.split), (options.split = message.split);
		if (message.out) console.log("out:", message.out), (options.out = message.out);
		if (message.referrer) console.log("reference:", message.referrer);
		if (message.header) console.log("header:", message.header);
		if (message.cookie) console.log("cookie:", message.cookie), (options.header = [`Cookie:${message.cookie}`]); //Cookie

		const method = "aria2.addUri";
		const params = [`token:${Aria2Info.rpcSecret}`, [message.url], options];
		const res = await sendAria2Request(method, params);
		if (res === "error") await sendResponse("error"), console.log("failed to add download");
		else {
			const data = await res.json();
			updateBadge();
			await sendResponse(data);
		}
	}
	if (message.api === "aria2_addTorrent" && message.file) {
		const uris = []; // Web-seeding uri  https://aria2.github.io/manual/en/html/aria2c.html#aria2.addTorrent
		const options = {};
		if (message.dir) console.log("dir:", message.dir), (options.dir = message.dir);
		if (message.out) console.log("out:", message.out), (options.out = message.out);
		if (message.referrer) console.log("reference:", message.referrer);
		if (message.header) console.log("header:", message.header);
		if (message.cookie) console.log("cookie:", message.cookie), (options.header = [`Cookie:${message.cookie}`]); //Cookie

		const method = "aria2.addTorrent";
		const params = [`token:${Aria2Info.rpcSecret}`, message.file, uris, options];
		const res = await sendAria2Request(method, params);
		if (res === "error") await sendResponse("error"), console.log("failed to add download");
		else {
			let data = await res.json();
			updateBadge();
			await sendResponse(data);
		}
	}
	if (message.api === "aria2_addMetalink" && message.file) {
		const options = {};
		if (message.dir) console.log("dir:", message.dir), (options.dir = message.dir);
		if (message.out) console.log("out:", message.out), (options.out = message.out);
		if (message.referrer) console.log("reference:", message.referrer);
		if (message.header) console.log("header:", message.header);
		if (message.cookie) console.log("cookie:", message.cookie), (options.header = [`Cookie:${message.cookie}`]); //Cookie

		const method = "aria2.addMetalink";
		const params = [`token:${Aria2Info.rpcSecret}`, message.file, options];
		const res = await sendAria2Request(method, params);
		if (res === "error") await sendResponse("error"), console.log("failed to add download");
	}

	// remove
	if (message.api === "aria2_remove" && message.gid) {
		const res = await sendAria2Request("aria2.remove", [`token:${Aria2Info.rpcSecret}`, message.gid]);
		if (res === "error") {
			await sendResponse("error");
			console.log("failed to remove download");
		} else {
			let data = await res.json();
			await sendResponse(data);
		}
	}
	if (message.api === "aria2_forceRemove" && message.gid) {
		const res = await sendAria2Request("aria2.forceRemove", [`token:${Aria2Info.rpcSecret}`, message.gid]);
		if (res === "error") {
			await sendResponse("error");
			console.log("failed to forceRemove download");
		} else {
			let data = await res.json();
			await sendResponse(data);
		}
	}
	// pause
	if (message.api === "aria2_pause" && message.gid) {
		// pause download
		const res = await sendAria2Request("aria2.pause", [`token:${Aria2Info.rpcSecret}`, message.gid]);
		if (res === "error") {
			await sendResponse("error");
			console.log("failed to pause download");
		} else {
			let data = await res.json();
			await sendResponse(data);
		}
	}
	if (message.api === "aria2_pauseAll") {
		// pause all download
		const res = await sendAria2Request("aria2.pauseAll", [`token:${Aria2Info.rpcSecret}`]);
		if (res === "error") {
			await sendResponse("error");
			console.log("failed to pause all download");
		} else {
			let data = await res.json();
			await sendResponse(data);
		}
	}
	if (message.api === "aria2_forcePause" && message.gid) {
		// pause download
		const res = await sendAria2Request("aria2.forcePause", [`token:${Aria2Info.rpcSecret}`, message.gid]);
		if (res === "error") {
			await sendResponse("error");
			console.log("failed to pause download");
		} else {
			let data = await res.json();
			await sendResponse(data);
		}
	}
	if (message.api === "aria2_pauseAll") {
		// pause all download
		const res = await sendAria2Request("aria2.forcePauseAll", [`token:${Aria2Info.rpcSecret}`]);
		if (res === "error") {
			await sendResponse("error");
			console.log("failed to pause all download");
		} else {
			let data = await res.json();
			await sendResponse(data);
		}
	}
	// unpause
	if (message.api === "aria2_unpause" && message.gid) {
		// unpause download
		const res = await sendAria2Request("aria2.unpause", [`token:${Aria2Info.rpcSecret}`, message.gid]);
		if (res === "error") {
			await sendResponse("error");
			console.log("failed to unpause download");
		} else {
			let data = await res.json();
			await sendResponse(data);
		}
	}
	if (message.api === "aria2_unpauseAll") {
		// unpause all download
		const res = await sendAria2Request("aria2.unpauseAll", [`token:${Aria2Info.rpcSecret},header:${message.cookies ? message.cookies : ""}`]);
		if (res === "error") {
			await sendResponse("error");
			console.log("failed to unpause all download");
		} else {
			let data = await res.json();
			await sendResponse(data);
		}
	}
	// api
	if (message.api === "aria2_method" && message.method) {
		let params;
		let options;
		if (message.method) method = message.method;
		if (message.params && message.params[0]) {
			if (typeof message.params[0] === "string" && message.params[0].length >= 5 && message.params[0].startsWith("token")) params = message.params;
			else params = [`token:${Aria2Info.rpcSecret}`, ...message.params];
		}
		if (message.options) options = message.options;
		const res = await sendAria2Request(message.method, params, options);
		if (res === "error") {
			await sendResponse("error");
			console.log("failed to call aria2 method");
		} else {
			let data = await res.json();
			await sendResponse(data);
		}
	}
	// others
	if (message.api === "aria2_getVersion") {
		// 根据Aria2Info.rpcHost判断是否是本地请求
		const res = await sendAria2Request("aria2.getVersion", [`token:${Aria2Info.rpcSecret}`]);
		if (res === "error") {
			await sendResponse("error");
		} else {
			let data = await res.json();
			updateBadge();
			await sendResponse(data.result);
		}
	}
	// remove history
	if (message.api === "aria2_removeDownloadResult" && message.gid) {
		// remove download result
		const res = await sendAria2Request("aria2.removeDownloadResult", [`token:${Aria2Info.rpcSecret}`, message.gid], Aria2Info.rpcIshttps);
		if (res === "error") {
			await sendResponse("error");
			console.log("failed to remove download result");
		} else {
			let data = await res.json();
			await sendResponse(data);
		}
	}
	if (message.api === "aria2_purgeDownloadResult") {
		// purge download result
		const res = await sendAria2Request("aria2.purgeDownloadResult", [`token:${Aria2Info.rpcSecret}`], Aria2Info.rpcIshttps);
		if (res === "error") {
			await sendResponse("error");
			console.log("failed to purge download result");
		}
	}

	// MARK Helper API
	if (message.api === "set-default-profile" && message.profileId) {
		await browser.storage.local.set({ defaultProfileId: message.profileId });
		await sendResponse("success");
	}
	if (message.api === "toggle-listen-status") {
		let settings = result.settings;
		const initalListenDownloads = settings.listenDownloads;
		settings.listenDownloads = !initalListenDownloads;
		await browser.storage.local.set({ settings: settings });
		await sendResponse({ result: !initalListenDownloads, listenDownloads: !initalListenDownloads });
	}
	// get Aria2 download list
	if (message.api === "get-download-list") {
		const res = await sendAria2Request(
			"system.multicall",
			[
				[
					{ methodName: "aria2.tellActive", params: [`token:${Aria2Info.rpcSecret}`] },
					{ methodName: "aria2.tellWaiting", params: [`token:${Aria2Info.rpcSecret}`, 0, 1000] },
					{ methodName: "aria2.tellStopped", params: [`token:${Aria2Info.rpcSecret}`, 0, 1000] },
				],
			],
			Aria2Info.rpcIshttps
		);
		if (res === "error") {
			await sendResponse("error");
			console.log("failed to get download list");
			browser.action.setBadgeText({ text: "" }); // clear Badge
		} else {
			let data = await res.json();
			updateBadge();
			await sendResponse(data);
		}
	}
	// get stopped list
	if (message.api === "get-stopped-list") {
		const res = await sendAria2Request("aria2.tellStopped", [`token:${Aria2Info.rpcSecret}`, 0, 1000], Aria2Info.rpcIshttps);
		if (res === "error") {
			await sendResponse("error");
			console.log("failed to get stopped list");
		} else {
			let data = await res.json();
			await sendResponse(data);
		}
	}

	// MARK Native API
	// select file
	if (message.api === "native-select-file" && message.url) {
		try {
			const response = await new Promise((resolve, reject) => {
				browser.runtime.sendNativeMessage({ message: "select-file", url: message.url }, (response) => {
					if (browser.runtime.lastError) reject(browser.runtime.lastError);
					else resolve(response);
				});
			});
			console.log("Native message response:", response);
			sendResponse({ isLocal, ...response }); // 返回原生消息的响应
		} catch (error) {
			console.error("Native message error:", error);
			sendResponse({ isLocal, status: "error", message: error.message }); // 返回错误信息
		}
	}

	// show notification
	if (message.api === "native-open-notification") {
		let title = message.title ? message.title : "no title";
		let subtitle = message.subtitle ? message.subtitle : "";
		let body = message.body ? message.body : "no body";
		try {
			const responses = await new Promise((resolve, reject) => {
				browser.runtime.sendNativeMessage({ message: "open-notification", title: title, subtitle: subtitle, body: body }, function (response) {
					resolve(response);
				});
			});
			console.log("Native message response:", responses);
			sendResponse(responses);
		} catch (error) {
			console.error("Native message error:", error);
			sendResponse({ status: "error", message: error.message }); // 返回错误信息
		}
	}

	// MARK test
	if (message.api === "test") {
		sendResponse("test success");
	}
});

// MARK getColor
function getSysInfo() {
	browser.runtime.sendNativeMessage({ message: "get-color" }, (response) => {
		console.log("get-color: ", response);
		let r = response.result.r;
		let g = response.result.g;
		let b = response.result.b;
		let a = response.result.a;
		let resdevice = response.result.device;
		if (r + g + b === 0 || r + g + b === 765) return;
		let color = `rgba(${r - 10}, ${g + 30}, ${b + 9}, ${0.8})`;
		console.log("color", color);
		browser.storage.local.set({ themeColor: color, device: resdevice });
	});
}

getSysInfo();

// MARK contextMenus
// Add
browser.contextMenus.removeAll(() => {
	/*
     1. link
     2. selection
     3. image
     4. video
     5. audio
     doc: https://developer.chrome.google.cn/docs/extensions/reference/api/contextMenus?hl=zh-cn
     TODO argetUrlPatterns
     */

	// browser.contextMenus.create({
	//     id: "Aria2HelperWebDownloadLink",
	//     title: browser.i18n.getMessage("Download_with_Aria2"),
	//     contexts: ["link", "selection", "image", "video", "audio"],
	//     targetUrlPatterns: ["*://*/*"],
	// });

	browser.contextMenus.create({
		id: "Aria2HelperWebDownloadLink",
		title: browser.i18n.getMessage("Download_link_with_Aria2"),
		contexts: ["link"],
		targetUrlPatterns: ["*://*/*"],
	});

	browser.contextMenus.create({
		id: "Aria2HelperWebDownloadSelection",
		title: browser.i18n.getMessage("Download_selection_with_Aria2"),
		contexts: ["selection"],
	});

	browser.contextMenus.create({
		id: "Aria2HelperWebDownloadImage",
		title: browser.i18n.getMessage("Download_image_with_Aria2"),
		contexts: ["image"],
	});

	browser.contextMenus.create({
		id: "Aria2HelperWebDownloadVideo",
		title: browser.i18n.getMessage("Download_video_with_Aria2"),
		contexts: ["video"],
	});

	browser.contextMenus.create({
		id: "Aria2HelperWebDownloadAudio",
		title: browser.i18n.getMessage("Download_audio_with_Aria2"),
		contexts: ["audio"],
	});
});
// Listen
browser.contextMenus.onClicked.addListener(async (info, tab) => {
	let result = await browser.storage.local.get(["defaultProfileId", "currentProfileId", "profiles", "settings"]);
	let Aria2Info = result.profiles[result.defaultProfileId];
	let showNotification = result.settings.showNotification;
	// test
	if (info.menuItemId === "test") {
	}

	// get DownloadUrl
	if (
		info.menuItemId === "Aria2HelperWebDownloadLink" ||
		info.menuItemId === "Aria2HelperWebDownloadSelection" ||
		info.menuItemId === "Aria2HelperWebDownloadImage" ||
		info.menuItemId === "Aria2HelperWebDownloadVideo" ||
		info.menuItemId === "Aria2HelperWebDownloadAudio"
	) {
		let downloadUrl = "";
		if (info.menuItemId === "Aria2HelperWebDownloadLink") {
			downloadUrl = info.linkUrl;
		} else if (info.menuItemId === "Aria2HelperWebDownloadSelection") {
			downloadUrl = info.selectionText;
		} else if (info.menuItemId === "Aria2HelperWebDownloadImage") {
			downloadUrl = info.srcUrl;
		} else if (info.menuItemId === "Aria2HelperWebDownloadVideo") {
			downloadUrl = info.srcUrl;
		} else if (info.menuItemId === "Aria2HelperWebDownloadAudio") {
			downloadUrl = info.srcUrl;
		}

		let fileparts = getFileParts(downloadUrl);
		// request
		const res = await sendAria2Request("aria2.addUri", [`token:${Aria2Info.rpcSecret}`, [downloadUrl]]);
		// "application.id"  is not necessary in Safari
		if (res.ok) {
			console.log("AddUri Success", res);
			updateBadge();
			if (showNotification)
				browser.runtime.sendNativeMessage({ message: "open-notification", title: `Success`, subtitle: "", body: `[Download started] ${fileparts.filename}` }, function (response) {
					console.log("Received response: ", response);
				});
		} else {
			console.log("AddUri Error", res);
			updateBadge();
			if (res === "error") {
				if (showNotification)
					browser.runtime.sendNativeMessage({ message: "open-notification", title: `Error`, subtitle: "", body: "Error to connect aria2 server." }, function (response) {
						console.log("Received response: ", response);
					});
			} else {
				if (showNotification)
					browser.runtime.sendNativeMessage({ message: "open-notification", title: `Error`, subtitle: "", body: `${res.statusText}` }, function (response) {
						console.log("Received response: ", response);
					});
			}
		}
	}
});

// MARK Badge
function updateBadge() {
	browser.storage.local.get(["defaultProfileId", "currentProfileId", "profiles", "settings"]).then((result) => {
		if (result.error) return browser.action.setBadgeText({ text: "" });
		if (!result.defaultProfileId) return browser.action.setBadgeText({ text: "" });
		if (!result.currentProfileId) return browser.action.setBadgeText({ text: "" });
		if (!result.profiles) return browser.action.setBadgeText({ text: "" });
		let Aria2Info = result.profiles[result.defaultProfileId];
		let showBadge = result.settings.showBadge || false;
		if (showBadge) {
			sendAria2Request("aria2.tellActive", [`token:${Aria2Info.rpcSecret}`], Aria2Info.rpcIshttps).then((res) => {
				res.json().then((json) => {
					if (res === "error") {
						browser.action.setBadgeText({ text: "" }); // clear Badge
					} else {
						console.log("badgeCount", json);
						if (json.result.length > 0) {
							browser.action.setBadgeText({ text: json.result.length.toString() });
						} else {
							browser.action.setBadgeText({ text: "" });
						}
						browser.action.setBadgeBackgroundColor({ color: "#62bb44" }); // not work in safari
						browser.action.setBadgeTextColor({ color: "#FFFFFF" }); // not work in safari
					}
				});
			});
		} else {
			browser.action.setBadgeText({ text: "" });
		}
	});
}
updateBadge();

// MARK Aria2 request
async function sendAria2Request(method, params, isHttps) {
	let settings = await browser.storage.local.get(["defaultProfileId", "currentProfileId", "profiles", "settings"]);
	let Aria2Info = settings.profiles[settings.defaultProfileId];
	if (!isHttps) isHttps = Aria2Info.rpcIshttps;
	if (!isHttps) isHttps = false;
	const id = Math.floor(Math.random() * 9000) + 1000; // random int id
	const rpcUrl = `${isHttps ? "https" : "http"}://${Aria2Info.rpcHost}:${Aria2Info.rpcPort}/jsonrpc`;
	const rpcBody = { id: id, jsonrpc: "2.0", method: method, params: params };
	console.log("%c[req] ", "color:blue", method, params);
	try {
		const response = await fetch(rpcUrl, {
			method: "POST",
			headers: { Accept: "application/json", "Content-Type": "application/json" },
			body: JSON.stringify(rpcBody),
		});
		console.log("%c[res] success", "color:green", response);
		return response;
	} catch (error) {
		console.log("%c[res] Failed!!! It's all on fire!", "color:red", error);
		return "error";
	}
}

async function websocketSendAria2Request(method, params, isHttps) {
	let settings = await browser.storage.local.get(["defaultProfileId", "currentProfileId", "profiles", "settings"]);
	let Aria2Info = settings.profiles[settings.defaultProfileId];
	if (!isHttps) isHttps = Aria2Info.rpcIshttps;
	if (!isHttps) isHttps = false;
}

// MARK Util
function validateBase64(str) {
	// check if str is a string and not empty
	if (typeof str !== "string" || str.trim() === "") return false;

	// Base64 reg
	const base64Regex = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/;

	return base64Regex.test(str);
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
