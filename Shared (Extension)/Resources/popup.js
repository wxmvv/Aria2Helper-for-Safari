// components

// Attempt to obtain the current device used to distinguish iOS macOS
function detectDevice() {
	const userAgent = navigator.userAgent;
	const isTouchDevice = "ontouchstart" in window || navigator.maxTouchPoints > 0;

	if (/iPad|iPhone|iPod/.test(userAgent) || (isTouchDevice && /Mobile/.test(userAgent))) {
		return "ios";
	} else if (/Macintosh/.test(userAgent) && !isTouchDevice) {
		return "macos";
	} else {
		return "未知设备";
	}
}

// guide arrow
const arrow = createIndicatorArrow({
	container: document.body,
	left: "20%",
	top: "76px",
});
function createIndicatorArrow(options = {}) {
	const container = options.container || document.body;
	let left = options.left || "50%"; // default center
	let top = options.top || "20px"; // defaut top
	let element = null;
	let isActive = false;

	function createElement() {
		element = document.createElement("div");
		element.style.cssText = `
            position: absolute;
            width: 12px;
            height: 20px;
            left: ${left};
            top: ${top};
            transform: translateX(-50%);
            z-index: 1000;
            animation: slide 1.5s infinite ease-in-out;
            /* 箭头样式 */
            background: linear-gradient(180deg,rgb(139, 56, 56) 0%, #ff3333 100%);
            clip-path: polygon(50% 0%, 0% 70%, 25% 70%, 25% 100%, 75% 100%, 75% 70%, 100% 70%);
            border-radius: 2px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        `;

		const styleSheet = document.createElement("style");
		styleSheet.textContent = `
            @keyframes slide {
                0% {
                    transform: translateX(-50%) translateY(0);
                }
                50% {
                    transform: translateX(-50%) translateY(-8px);
                }
                100% {
                    transform: translateX(-50%) translateY(0);
                }
            }
        `;
		document.head.appendChild(styleSheet);

		container.appendChild(element);
	}

	return {
		show: function () {
			if (!element) {
				createElement();
			}
			element.style.display = "block";
			isActive = true;
		},

		hide: function () {
			if (element) {
				element.style.display = "none";
			}
			isActive = false;
		},

		updatePosition: function (newLeft, newTop) {
			left = newLeft || left;
			top = newTop || top;
			if (element) {
				element.style.left = left;
				element.style.top = top;
			}
		},

		destroy: function () {
			if (element) {
				element.remove();
				element = null;
				isActive = false;
			}
		},

		isActive: function () {
			return isActive;
		},
	};
}

// notification
let notificationTimeout = null; // save notification timeout
let textareaTimeout = null;
function showNotification(message, duration = 3000, type = "custom", withTextarea = false, backgroundColor = "rgba(255, 255, 255, .3)", textareaOutlineColor = "rgba(255, 255, 255, 0.8)") {
	if (type === "custom") {
	}
	if (type === "success") (backgroundColor = "rgba(0, 255, 0, .3)"), (textareaOutlineColor = "rgba(0, 255, 0, 0.8)");
	if (type === "error") (backgroundColor = "rgba(255, 0, 0, .3)"), (textareaOutlineColor = "rgba(255, 0, 0, 0.8)");
	if (type === "warning") (backgroundColor = "rgba(255, 255, 0, .3)"), (textareaOutlineColor = "rgba(255, 255, 0, 0.8)");
	if (type === "info") (backgroundColor = "rgba(0, 0, 255, .3)"), (textareaOutlineColor = "rgba(0, 0, 255, 0.8)");

	const textarea = document.getElementById("addtask-textarea");
	const notification = document.getElementById("notification");
	notification.textContent = message;
	notification.style.backgroundColor = backgroundColor;
	notification.classList.add("show");

	if (withTextarea) {
		if (textarea) {
			textarea.style.outline = `3px solid ${backgroundColor}`;
			clearTimeout(textareaTimeout);
			textareaTimeout = setTimeout(() => (textarea.style.outline = "revert"), 3000);
		}
	}

	if (!duration || duration === 0) return; // if duration===0 then no auto hide
	else {
		if (notificationTimeout) clearTimeout(notificationTimeout); // clear previous timeout
		notificationTimeout = setTimeout(() => notification.classList.remove("show"), duration); // auto hide
	}
}

// noTask element
const noTaskEl = document.getElementById("noTask");
const noTaskTextEl = document.getElementById("noTaskText");
function showNoTaskElement(text = "no task here") {
	downloadListEl.style.display = "none";
	noTaskEl.style.display = "flex";
	noTaskTextEl.textContent = text;
}
function hideNoTaskElement() {
	noTaskEl.style.display = "none";
	downloadListEl.style.display = "flex";
}

// Connection Status
let selectDefaultProfileFlag = new Date();
let connectionStatus = false;

function checkConnectionStatus() {
	browser.runtime.sendMessage({ api: "aria2_getVersion" }, (response) => {
		if (response === "error" || !response) {
			updatedConnectionStatus(false);
		} else {
			updatedConnectionStatus(true);
		}
	});
}

function updatedConnectionStatus(isConnect) {
	if (isConnect) {
		document.documentElement.style.setProperty("--connection-status-color", "var(--connect-color)");
		document.querySelector(".connect-indicator").style.animation = "breathe 2s infinite ease-in-out";
		document.querySelector(".connect-indicator").title = browser.i18n.getMessage("connect");
		connectionStatus = true;
		// console.log("%cconnected to server", "color: green", response);
	} else {
		document.documentElement.style.setProperty("--connection-status-color", "var(--disconnect-color)");
		document.querySelector(".connect-indicator").style.animation = "none";
		document.querySelector(".connect-indicator").title = browser.i18n.getMessage("disconnect");
		connectionStatus = false;
		// console.log("%cdisconnected to server", "color: red", "error");
	}
}

// Profile Left
function initProfile() {
	browser.runtime.sendMessage({ api: "get-local-storage" }, (result) => {
		console.log("[init profile] get-local-storage ", result);

		// check connection status
		let leftEl = document.querySelector(".navbar-left");

		// select btn
		if (result.error && result.code == 1) console.log("[init profile error] ", result.error);
		if (!result || !result.profiles || result.error) {
			if (document.getElementById("init-profile-btn")) return; // already init
			else {
				let initProfileBtn = document.createElement("button");
				initProfileBtn.className = "btn";
				initProfileBtn.id = "init-profile-btn";
				initProfileBtn.innerText = "Add Aria2 connection";
				initProfileBtn.addEventListener("click", () => browser.runtime.openOptionsPage());
				leftEl.innerHTML = "";
				leftEl.appendChild(initProfileBtn);
				// arrow
				arrow.show();
			}
		} else {
			// connect indicator
			let selectProfileEl;
			let connectIndicatorEl;
			let listenChangeBtnEl;
			connectIndicatorEl = document.createElement("div");
			connectIndicatorEl.className = "connect-indicator";
			selectProfileEl = document.createElement("div");
			selectProfileEl.className = "select-profile";
			listenChangeBtnEl = document.createElement("button");
			listenChangeBtnEl.className = "btn";

			// listen btn
			if (result.settings.listenDownloads) {
				listenChangeBtnEl.classList.add("listen-icon"), listenChangeBtnEl.classList.remove("notlisten-icon");
				listenChangeBtnEl.title = browser.i18n.getMessage("listen_activate");
			} else {
				listenChangeBtnEl.classList.add("notlisten-icon"), listenChangeBtnEl.classList.remove("listen-icon");
				listenChangeBtnEl.title = browser.i18n.getMessage("listen_deactivated");
			}
			listenChangeBtnEl.addEventListener("click", () => {
				browser.runtime.sendMessage({ api: "toggle-listen-status" }, (response) => {
					console.log("[change & set-listen-status]", response);
					if (response.result) {
						listenChangeBtnEl.classList.add("listen-icon"), listenChangeBtnEl.classList.remove("notlisten-icon");
						listenChangeBtnEl.title = browser.i18n.getMessage("listen_activate");
						showNotification(browser.i18n.getMessage("Start_listening_downloads"), 3000, "success", true);
					} else {
						listenChangeBtnEl.classList.add("notlisten-icon"), listenChangeBtnEl.classList.remove("listen-icon");
						listenChangeBtnEl.title = browser.i18n.getMessage("listen_deactivated");
						showNotification(browser.i18n.getMessage("Stop_listening_downloads"), 3000, "info", true);
					}
				});
			});

			// select btn
			let selectEl = document.createElement("select");
			selectEl.id = "select";
			for (let profileId of Object.keys(result.profiles)) {
				let profileName = result.profiles[profileId].alias;
				let optionEl = document.createElement("option");
				optionEl.value = profileId;
				optionEl.textContent = profileName;
				if (profileId === result.defaultProfileId) optionEl.selected = true;
				selectEl.appendChild(optionEl);
			}
			selectEl.addEventListener("change", () => {
				showNoTaskElement(browser.i18n.getMessage("connecting"));
				selectDefaultProfileFlag = new Date();
				console.log("change profile, block old fetchDownloadList before:", selectDefaultProfileFlag);
				browser.runtime.sendMessage({ api: "set-default-profile", profileId: selectEl.value }, (response) => {
					console.log("[change & set default profile] profile:", selectEl.value, response);
					fetchDownloadList();
				});
			});
			// Add a dropdown arrow to "select"
			let symbolEl = document.createElement("div");
			symbolEl.className = "arrowdown-icon";
			let rect = selectEl.getBoundingClientRect(); //get the position of the select element
			symbolEl.style.right = `${rect.right + 6}px`;

			selectProfileEl.appendChild(symbolEl);
			selectProfileEl.appendChild(selectEl);
			leftEl.innerHTML = "";
			leftEl.appendChild(selectProfileEl);
			leftEl.appendChild(connectIndicatorEl);
			leftEl.appendChild(listenChangeBtnEl);
		}
	});
}

// NavbarBtn Right
function initNavbarBtn() {
	let navbarRight = document.querySelector(".navbar-right");
	let settingsBtn = document.createElement("div");
	settingsBtn.className = "btn settings-icon";
	settingsBtn.id = "settings";
	settingsBtn.title = browser.i18n.getMessage("open_settings");
	let addtaskBtn = document.createElement("div");
	addtaskBtn.className = "btn addtask-icon";
	addtaskBtn.id = "addtask";
	addtaskBtn.title = browser.i18n.getMessage("add_task");
	navbarRight.appendChild(addtaskBtn);
	navbarRight.appendChild(settingsBtn);

	settingsBtn.addEventListener("click", () => browser.runtime.openOptionsPage());
	addtaskBtn.addEventListener("click", () => showAddTaskDialog());

	let clearBtn = document.createElement("div");
	clearBtn.className = "btn";
	clearBtn.id = "clear";
	clearBtn.textContent = browser.i18n.getMessage("clear");
	clearBtn.title = browser.i18n.getMessage("clear_download_list");
	clearBtn.style.display = "none";
	navbarRight.prepend(clearBtn);
	clearBtn.addEventListener("click", () => {
		browser.runtime.sendMessage({ api: "aria2_purgeDownloadResult" }, function (data) {
			console.log("[aria2_purgeDownloadResult] ", data);
		});
	});
}

// Add task dialogue
function createAddTaskDialog() {
	let dialogueEl = document.createElement("div");
	dialogueEl.className = "addtask-dialogue";
	dialogueEl.id = "addtask-dialogue";
	let title = document.createElement("div");
	title.className = "dialogue-title";
	title.textContent = "Add Download Task";
	title.style.display = "none";
	let content = document.createElement("div");
	content.className = "dialogue-content";
	let actions = document.createElement("div");
	actions.className = "dialogue-actions";
	let textareaInfo = document.createElement("div");
	textareaInfo.className = "textareaInfo";
	textareaInfo.textContent = "none";
	let textarea = document.createElement("textarea");
	textarea.className = "textarea";
	textarea.id = "addtask-textarea";
	textarea.placeholder = browser.i18n.getMessage("Enter_URL_or_magnet_link_here");
	textarea.addEventListener("input", () => {
		if (!textarea.value) return (textareaInfo.textContent = "input url or filepath");
		textareaInfo.textContent = parseUrlOrPathType(textarea.value.trim());
	});
	let confirmBtn = document.createElement("button");
	confirmBtn.className = "btn";
	confirmBtn.textContent = browser.i18n.getMessage("confirm");
	let cancelBtn = document.createElement("button");
	cancelBtn.className = "btn";
	cancelBtn.textContent = browser.i18n.getMessage("cancel");
	let selectFileBtn = document.createElement("label");
	selectFileBtn.setAttribute("for", "inputFile");
	selectFileBtn.className = "btn";
	selectFileBtn.textContent = browser.i18n.getMessage("select_torrent_file");
	let clearInputFileBtn = document.createElement("div");
	clearInputFileBtn.className = "clear-inputFile-Btn";
	clearInputFileBtn.style.display = "none";
	let inputFile = document.createElement("input");
	inputFile.id = "inputFile";
	inputFile.style.display = "none";
	inputFile.type = "file";
	inputFile.accept = ".torrent,.metalink,.meta4";

	const confirmBtnEvent = (e) => {
		e.stopPropagation();
		e.preventDefault();
		confirmBtn.disabled = true;
		// setTimeout(() => (confirmBtn.disabled = false), 1000);
		if (!connectionStatus) return showNotification(browser.i18n.getMessage("please_connect_first"), 3000, "error", true), (confirmBtn.disabled = false);
		// if torrent or metalink
		// BUG 目前aria2不支持http发送过大的torrent文件
		// TODO 尝试js解析torrent 然后分片发送
		// TODO 尝试用使用 fetchActivateFlag 先暂停fetch 在上传
		let curfiles = inputFile.files;
		if (curfiles.length === 1) {
			let file = curfiles[0];
			let fileApi;
			if (file.name.lastIndexOf(".torrent") !== -1) fileApi = "aria2_addTorrent";
			else if (file.name.lastIndexOf(".metalink") !== -1 || file.name.lastIndexOf(".meta4") !== -1) fileApi = "aria2_addMetalink";
			else return showNotification(browser.i18n.getMessage("invalid_file"), 3000, "error", true), (confirmBtn.disabled = false);

			return encodeFileToBase64(curfiles[0]).then((result) => {
				browser.runtime.sendMessage({ api: fileApi, file: result }, (result) => {
					console.log("[Add torrent] success result: ", result);
					if (result === "error" || !result) {
						showNotification(browser.i18n.getMessage("Task_added_failed"), 3000, "error", true);
					} else {
						showNotification(browser.i18n.getMessage("Task_added_successfully"), 3000, "success", true);
					}
					clearInputFile();
					hideAddTaskDialog();
					confirmBtn.disabled = false;
				});
			});
		}

		// if url
		if (!textarea.value || textarea.value.trim() === "") return showNotification(browser.i18n.getMessage("please_input_url_or_filepath"), 3000, "error", true), (confirmBtn.disabled = false);
		else {
			let url = textarea.value.trim();
			// let addTaskType = parseUrlOrPathType(url);
			browser.runtime.sendMessage({ api: "aria2_addUri", url: url }, (result) => {
				if (result.error) {
					console.log(`%cerror code: ${result.error.code} message: ${result.error.message}`, "color: red");
					return showNotification(result.error.message, 3000, "error", true), (confirmBtn.disabled = false);
				}
				showNotification(browser.i18n.getMessage("Task_added_successfully"), 3000, "success", true);
				hideAddTaskDialog();
				console.log("[Add url] success result: ", result);
				confirmBtn.disabled = false;
			});
		}
	};

	const clearInputFile = () => {
		textarea.value = "";
		inputFile.value = "";
		textarea.disabled = false;
		clearInputFileBtn.style.display = "none";
	};

	confirmBtn.addEventListener("click", (e) => confirmBtnEvent(e));
	confirmBtn.addEventListener("dblclick", (e) => confirmBtnEvent(e));
	cancelBtn.addEventListener("click", (e) => {
		clearInputFile();
		hideAddTaskDialog(e);
	});

	inputFile.addEventListener("change", () => {
		let curfiles = inputFile.files;
		console.log(curfiles);
		if (curfiles.length === 0) {
			textarea.disabled = false;
			textareaInfo.textContent = "none";
			clearInputFileBtn.style.display = "none";
			textarea.value = "";
		} else if (curfiles.length === 1) {
			let file = curfiles[0];
			textarea.disabled = true;
			textareaInfo.textContent = file.type;
			clearInputFileBtn.style.display = "flex";
			textarea.value = `[name] ${file.name}\n[size] ${bytesToSize(file.size)}\n[type] ${file.type}`;
		}
	});

	clearInputFileBtn.addEventListener("click", () => {
		clearInputFile();
	});

	content.appendChild(textareaInfo);
	content.appendChild(clearInputFileBtn);
	content.appendChild(textarea);
	actions.appendChild(confirmBtn);
	actions.appendChild(cancelBtn);
	actions.appendChild(selectFileBtn);
	dialogueEl.appendChild(title);
	dialogueEl.appendChild(content);
	dialogueEl.appendChild(actions);
	dialogueEl.appendChild(inputFile);
	return dialogueEl;
}

// encoded torrent to base64 string
let encodeFileToBase64 = (file) => {
	return new Promise((resolve, reject) => {
		const temporaryFileReader = new FileReader();
		temporaryFileReader.onerror = () => {
			temporaryFileReader.abort();
			reject(new Error(`Cannot parse '${file}'.`));
		};
		temporaryFileReader.onloadend = () => {
			if (temporaryFileReader.result) {
				const splitResult = temporaryFileReader.result.toString().split(/[:;,]/);
				if (splitResult.length >= 4) {
					resolve(splitResult[3]);
				} else {
					reject(new Error(`Cannot get base64 encoded string for '${file}'.`));
				}
			} else {
				reject(new Error(`Result is empty for '${file}'.`));
			}
		};
		temporaryFileReader.readAsDataURL(file);
	});
};

function showAddTaskDialog() {
	const dialogue = document.getElementById("dialogue");
	if (!document.getElementById("addtask-dialogue")) dialogue.appendChild(createAddTaskDialog());
	dialogue.classList.add("show");
	document.documentElement.style.setProperty("--dialogue-height", "var(--dialogue-show-height)");
	document.getElementById("addtask-textarea").focus();
}

function hideAddTaskDialog() {
	const dialogue = document.getElementById("dialogue");
	dialogue.classList.remove("show");
	document.documentElement.style.setProperty("--dialogue-height", "0px");
}

// createDownloadList
const downloadListEl = document.getElementById("downloadList");
const downloadItems = new Map();
const downloadItemsState = new Map();

function fetchDownloadList() {
	const funcDate = new Date();
	browser.runtime.sendMessage({ api: "get-download-list" }, (response) => {
		// console.log("[fetchDownloadList]", response, "[fetch time]", funcDate);
		console.log("[fetchDownloadList]", response);

		if (funcDate < selectDefaultProfileFlag) return;
		updateList(response);
	});
}

function updateList(response) {
	// init error
	if (response.error && response.code === 1) return showNoTaskElement(browser.i18n.getMessage("please_connect_first")), updatedConnectionStatus(false);
	else arrow.hide();
	if (response === "error" || !response) return showNoTaskElement(browser.i18n.getMessage("unable_to_connect_to_server")), updatedConnectionStatus(false);
	else updatedConnectionStatus(true);

	// get list from response && concat two result
	let tellActiveList = response.result[0][0] || [];
	let tellWaitingList = response.result[1][0] || [];
	let tellStoppedList = response.result[2][0] || [];

	// console.log("[active]", response.result[0][0]);
	// console.log("[waiting]", response.result[1][0]);
	// console.log("[stopped]", response.result[2][0]);

	// show clear button
	if (tellStoppedList.length > 0) document.getElementById("clear").style.display = "block";
	else document.getElementById("clear").style.display = "none";

	let list = tellActiveList.concat(tellWaitingList, tellStoppedList);

	// console.log("[list]", list);

	if (list.length === 0) showNoTaskElement(browser.i18n.getMessage("no_task_here"));
	else hideNoTaskElement();
	// generate gid set
	const newGids = new Set(list.map((item) => item.gid));

	// remove old items
	for (const [gid, el] of downloadItems) {
		if (!newGids.has(gid)) {
			downloadListEl.removeChild(el);
			downloadItems.delete(gid);
		}
	}
	for (const [gid, status] of downloadItemsState) {
		if (!newGids.has(gid)) {
			downloadItemsState.delete(gid);
		}
	}

	// add or update items
	list.forEach((item) => {
		let itemEl = downloadItems.get(item.gid);
		if (!itemEl) {
			downloadItemsState.set(item.gid, item.status);
			itemEl = createDownloadItemElement(item); // create
			downloadListEl.appendChild(itemEl);
			downloadItems.set(item.gid, itemEl);
		} else {
			downloadItemsState.set(item.gid, item.status);
			updateDownloadItemElement(itemEl, item); // update
		}
	});
}

function createDownloadItemElement(item) {
	const div = document.createElement("div");
	div.className = `item gid${item.gid}`;

	updateDownloadItemElement(div, item); // initializing

	div.addEventListener("click", () => {
		if (document.querySelector(".item.active")) document.querySelector(".item.active").classList.remove("active");
		div.classList.add("active");
	});

	div.addEventListener("dblclick", (e) => {
		e.stopPropagation();
		e.preventDefault();
		browser.runtime.sendMessage({ api: "native-select-file", url: item.taskPath }).then((response) => {
			if (!response.result) {
				if (response.isLocal) {
					showNotification(browser.i18n.getMessage("file_not_found"), 3000, "error");
				} else if (!response.isLocal) {
					showNotification(browser.i18n.getMessage("unable_open_remote_file"), 3000, "error");
				} else {
					showNotification(browser.i18n.getMessage("file_not_found"), 3000, "error");
				}
			} else if (response.result === "ios") {
				showNotification(browser.i18n.getMessage("unable_open_ios_file"), 3000, "error");
			} else {
				// showNotification(response.result, 3000, "info");
			}
		});
	});

	return div;
}

function updateDownloadItemElement(el, i) {
	// info format

	i.leftTime = calculateRemainingTime(i.completedLength, i.totalLength, i.downloadSpeed); // number
	if (i.totalLength === 0) i.progress = 0; // 解决 totalLength === 0 时 progress 为 Infinity 的问题
	else {
		i.progress = Math.floor((i.completedLength / i.totalLength) * 10000) / 100 || 0;
		i.progresspercent = i.progress + "%";
		if (!i.progresspercent) {
			console.log("progresspercent is null", i);
			i.progress = 0;
			i.progresspercent = "0%";
		} else if (i.progress === Infinity) {
			i.progresspercent = "infinity%";
		}
	}

	i.totalLength = bytesToSize(i.totalLength); // string
	i.completedLength = bytesToSize(i.completedLength); // string
	i.downloadSpeed = bytesToSize(i.downloadSpeed, 2) + "/s"; // string
	i.uploadSpeed = bytesToSize(i.uploadSpeed, 2) + "/s"; // string

	if (i.bittorrent && i.bittorrent.info && i.bittorrent.info.name) {
		i.taskPath = i.files[0].path || "";
		i.taskUri = "";
		i.taskName = i.bittorrent.info.name;
		i.fileparts = { extension: "", nameWithoutExtension: i.taskName };
	} else {
		if (!i.files[0].path || i.files[0].path === "") i.taskPath = i.dir || "";
		else i.taskPath = i.files[0].path;
		if (i.files[0].uris && i.files[0].uris.length > 0) i.taskUri = i.files[0].uris[0].uri;
		else i.taskUri = "";
		if (i.taskUri === "" || !i.taskUri) i.taskName = i.taskPath.substring(i.taskPath.lastIndexOf("/") + 1);
		else if (i.dir === i.taskPath) i.taskName = i.taskUri;
		else i.taskName = i.taskPath.substring(i.taskPath.lastIndexOf("/") + 1) || i.taskUri;
		i.fileparts = getPartsFromFilename(i.taskName);
	}

	let statusStr;
	// All status  ${i.status} ${i.progress}% left:${i.leftTime} ${i.completedLength}/${i.totalLength} ${i.status === "active" ? i.downloadSpeed : ""}
	if (i.status === "active") statusStr = `${browser.i18n.getMessage(i.status)} ${i.progresspercent} ${i.completedLength}/${i.totalLength} ${i.downloadSpeed}`;
	else if (i.status === "waiting") statusStr = `${browser.i18n.getMessage(i.status)} ${i.progresspercent} ${i.completedLength}/${i.totalLength}`;
	else if (i.status === "paused") statusStr = `${browser.i18n.getMessage(i.status)} ${i.progresspercent} ${i.completedLength}/${i.totalLength}`;
	else if (i.status === "error") statusStr = `${browser.i18n.getMessage(i.status)}`; // download error
	else if (i.status === "complete") statusStr = `${browser.i18n.getMessage(i.status)} ${i.totalLength}`; // download complete
	else if (i.status === "removed") statusStr = `${browser.i18n.getMessage(i.status)}`;
	else statusStr = `${i.status} ${i.progresspercent} ${i.completedLength}/${i.totalLength}`;

	// DOM
	let iconEl;
	let infoEl;
	let gidEl;
	let nameEl;
	let nameNameEl;
	let nameExtensionEl;
	let progressBgEl;
	let progressEl;
	let statusEl;
	let actionsEl;
	let deleteBtn;
	let openBtn;

	const childCount = el.children.length; // 获取子元素数量

	if (childCount === 0) {
		// create
		iconEl = document.createElement("div");
		iconEl.classList.add("item-icon");
		infoEl = document.createElement("div");
		infoEl.classList.add("item-info");
		gidEl = document.createElement("div");
		gidEl.classList.add("item-info-gid");
		gidEl.style.display = "none";
		nameEl = document.createElement("div");
		nameEl.classList.add("item-info-name");
		nameNameEl = document.createElement("div");
		nameNameEl.classList.add("item-info-name-name");
		nameExtensionEl = document.createElement("div");
		nameExtensionEl.classList.add("item-info-name-extension");
		progressBgEl = document.createElement("div");
		progressBgEl.classList.add("item-info-progress-bg");
		progressEl = document.createElement("div");
		progressEl.classList.add("item-info-progress");
		statusEl = document.createElement("div");
		statusEl.classList.add("item-info-status");
		actionsEl = document.createElement("div");
		actionsEl.className = "item-actions";
		deleteBtn = document.createElement("button");
		deleteBtn.className = "btn-delete-icon";
		openBtn = document.createElement("button");
		openBtn.className = "btn-open-icon";
		openBtn.title = browser.i18n.getMessage("open_file");
		infoEl.appendChild(gidEl);
		infoEl.appendChild(nameEl);
		nameEl.appendChild(nameNameEl);
		nameEl.appendChild(nameExtensionEl);
		infoEl.appendChild(progressBgEl);
		progressBgEl.appendChild(progressEl);
		infoEl.appendChild(statusEl);
		actionsEl.appendChild(deleteBtn);
		actionsEl.appendChild(openBtn);
		el.appendChild(iconEl);
		el.appendChild(infoEl);
		el.appendChild(actionsEl);

		iconEl.addEventListener("click", (e) => {
			e.stopPropagation();
			e.preventDefault();
			let status = downloadItemsState.get(i.gid);
			if (status === "active" || status === "waiting") {
				browser.runtime.sendMessage({ api: "aria2_forcePause", gid: i.gid }).then((response) => {
					if (response.error) {
						console.log(`%cerror code: ${response.error.code} message: ${response.error.message}`, "color: red");
						return showNotification(response.error.message, 3000, "error");
					} else {
						console.log("[sendMessage] aria2_forcePause [gid]", i.gid, "[res]", response);
						iconEl.classList.remove("pause-icon");
						iconEl.classList.add("play-icon");
						iconEl.title = browser.i18n.getMessage("unpause");
					}
					fetchDownloadList();
				});
			} else if (status === "paused") {
				browser.runtime.sendMessage({ api: "aria2_unpause", gid: i.gid }).then((response) => {
					if (response.error) {
						console.log(`%cerror code: ${response.error.code} message: ${response.error.message}`, "color: red");
						return showNotification(response.error.message, 3000, "error");
					} else {
						console.log("[sendMessage] aria2_unpause [gid]", i.gid, "[res]", response);
						iconEl.classList.remove("play-icon");
						iconEl.classList.add("pause-icon");
						iconEl.title = browser.i18n.getMessage("pause");
					}
					fetchDownloadList();
				});
			} else {
				console.log("[pause task] gid:", i.gid, " This task cannot be paused"); // showNotification("This task cannot be paused", 3000, "error");
			}
		});

		// click actions-delete :remove or restart download task
		deleteBtn.addEventListener("click", (e) => {
			e.stopPropagation();
			e.preventDefault();
			let status = downloadItemsState.get(i.gid);
			if ((status === "removed" || status === "complete" || status === "error") && !i.bittorrent) {
				browser.runtime.sendMessage({ api: "aria2_removeDownloadResult", gid: i.gid }).then((response) => {
					// torrent magnet unable restart
					browser.runtime.sendMessage({ api: "aria2_addUri", url: i.files[0].uris[0].uri }).then((response) => {
						console.log("[delete task] gid:", i.gid, "[Received response] ", response);
						deleteBtn.classList.remove("btn-restart-icon");
						deleteBtn.classList.add("btn-delete-icon");
						deleteBtn.title = browser.i18n.getMessage("remove");
						fetchDownloadList();
					});
					console.log("[delete task] gid:", i.gid, "[Received response] ", response);
				});
			} else if ((status === "removed" || status === "complete" || status === "error") && i.bittorrent) {
				browser.runtime.sendMessage({ api: "aria2_removeDownloadResult", gid: i.gid }).then((response) => {
					console.log("[delete task history] gid:", i.gid, "[Received response] ", response);
					fetchDownloadList();
				});
			} else {
				browser.runtime.sendMessage({ api: "aria2_forceRemove", gid: i.gid }).then((response) => {
					console.log("[delete task] gid:", i.gid, "[Received response] ", response);
					deleteBtn.classList.remove("btn-delete-icon");
					deleteBtn.classList.add("btn-restart-icon");
					deleteBtn.title = browser.i18n.getMessage("restart");
					fetchDownloadList();
				});
			}
		});

		openBtn.addEventListener("click", (e) => {
			e.stopPropagation();
			e.preventDefault();
			browser.runtime.sendMessage({ api: "native-select-file", url: i.taskPath }).then((response) => {
				if (!response.result) {
					if (response.isLocal) {
						showNotification(browser.i18n.getMessage("file_not_found"), 3000, "error");
					} else if (!response.isLocal) {
						showNotification(browser.i18n.getMessage("unable_open_remote_file"), 3000, "error");
					} else {
						showNotification(browser.i18n.getMessage("file_not_found"), 3000, "error");
					}
				} else if (response.result === "ios") {
					showNotification(browser.i18n.getMessage("unable_open_ios_file"), 3000, "error");
				} else {
					// showNotification(response.result, 3000, "info");
				}
			});
		});
	} else if (childCount === 3) {
		iconEl = el.children[0];
		infoEl = el.children[1];
		actionsEl = el.children[2];
		deleteBtn = actionsEl.children[0];
		openBtn = actionsEl.children[1];
		gidEl = infoEl.children[0];
		nameEl = infoEl.children[1];
		nameNameEl = nameEl.children[0];
		nameExtensionEl = nameEl.children[1];
		progressBgEl = infoEl.children[2];
		progressEl = progressBgEl.children[0];
		statusEl = infoEl.children[3];
	} else {
		console.log(`%cdownload list create error`, "color: red");
	}
	gidEl.textContent = `gid:${i.gid}`;
	nameNameEl.textContent = i.fileparts.nameWithoutExtension;
	nameExtensionEl.textContent = i.fileparts.extension;
	if (i.status === "error" || i.status === "removed") progressBgEl.classList.add("hide");
	else progressBgEl.classList.remove("hide");
	if (i.status === "active" && i.progress === Infinity) progressEl.classList.add("infinity");
	else progressEl.classList.remove("infinity");
	progressEl.style.width = i.progresspercent;
	statusEl.textContent = statusStr;
	if (i.status === "paused") {
		iconEl.classList.remove("pause-icon");
		iconEl.classList.add("play-icon");
		iconEl.title = browser.i18n.getMessage("unpause");
	} else if (i.status === "waiting" || i.status === "active") {
		iconEl.classList.remove("play-icon");
		iconEl.classList.add("pause-icon");
		iconEl.title = browser.i18n.getMessage("pause");
	} else {
		iconEl.classList.remove("play-icon", "pause-icon");
		iconEl.title = "";
	}

	if ((i.status === "complete" || i.status === "removed" || i.status === "error") && !i.bittorrent) {
		deleteBtn.classList.remove("btn-delete-icon");
		deleteBtn.classList.add("btn-restart-icon");
		deleteBtn.title = browser.i18n.getMessage("restart");
	} else {
		deleteBtn.classList.remove("btn-restart-icon");
		deleteBtn.classList.add("btn-delete-icon");
		deleteBtn.title = browser.i18n.getMessage("remove");
	}
}

// init style
let testDevice = detectDevice();
function initStyle() {
	if (testDevice === "ios") {
		document.documentElement.style.setProperty("--downloadList-width", "100%");
		document.documentElement.style.setProperty("--downloadList-max-height", "auto");
		document.body.classList.add("ios");
	}
}

let fetchActivateFlag = true;
// MARK popup main
document.addEventListener("DOMContentLoaded", function () {
	// initializing
	initStyle();
	document.getElementById("appTitle").innerHTML = browser.i18n.getMessage("extension_name") || "Aria2Helper";
	showNoTaskElement(browser.i18n.getMessage("initializing"));
	initProfile();
	initNavbarBtn();
	checkConnectionStatus();
	fetchDownloadList();

	// refresh every 1.5 seconds
	const refreshInterval = setInterval(() => {
		if (!fetchActivateFlag) return;
		fetchDownloadList();
	}, 1000);

	// clear interval on page close
	window.addEventListener("beforeunload", () => {
		clearInterval(refreshInterval);
	});
});

// utils

function getPartsFromFilename(filename) {
	if (typeof filename !== "string" || filename.trim() === "") {
		return {
			extension: "",
			nameWithoutExtension: "",
		};
	}

	filename = filename.trim();
	const lastDotIndex = filename.lastIndexOf(".");
	if (
		lastDotIndex === -1 || // no dot
		lastDotIndex === 0 || // start with dot (example : .gitignore)
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
		extension: ext ? `.${ext}` : "", // add dot if ext is not empty
		nameWithoutExtension: filename.slice(0, lastDotIndex),
	};
}

const bytesToSize = (bytes, precision = 1) => {
	if (!bytes) return "0 KB";
	const b = parseInt(bytes, 10);
	const sizes = ["B", "KB", "MB", "GB", "TB"];
	if (b === 0) return "0 KB";
	if (b === Infinity) return "Infinity";
	const i = parseInt(Math.floor(Math.log(b) / Math.log(1024)), 10);
	if (i === 0) {
		return `${b} ${sizes[i]}`;
	}
	return `${(b / 1024 ** i).toFixed(precision)} ${sizes[i]}`;
};

function calculateRemainingTime(completedLength, totalLength, downloadSpeed) {
	if (!totalLength || !downloadSpeed) return "N/A";
	if (downloadSpeed == 0) return "N/A";
	if (totalLength == 0) return "N/A";
	console.log("test", downloadSpeed, totalLength, downloadSpeed);
	const size = totalLength - completedLength;
	const speed = downloadSpeed;
	// int
	let sizeInt = parseInt(size / speed);
	return secondsToTime(sizeInt);
}

function secondsToTime(seconds) {
	const d = Math.floor(seconds / (3600 * 24));
	const h = Math.floor((seconds % (3600 * 24)) / 3600);
	const m = Math.floor((seconds % 3600) / 60);
	const s = Math.floor(seconds % 60);
	if (d > 0) {
		// return `${d}d ${h}h ${m}m ${s}s`;
		return `${d}d ${h}h`;
	} else if (h > 0) {
		// return `${h}h ${m}m ${s}s`;
		return `${h}h ${m}m`;
	} else if (m > 0) {
		return `${m}m ${s}s`;
	} else {
		return `${s}s`;
	}
}

function parseUrlOrPathType(value) {
	const patterns = [
		{
			type: "url",
			regex: /^(?:(?:(?:http?|https?|ftp):)?\/\/)(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z0-9\u00a1-\uffff][a-z0-9\u00a1-\uffff_-]{0,62})?[a-z0-9\u00a1-\uffff]\.)+(?:[a-z\u00a1-\uffff]{2,}\.?))(?::\d{2,5})?(?:[/?#]\S*)?$/i,
		},
		{
			type: "magnet_link",
			regex: /^magnet:\?xt=urn:[a-z0-9]+:[a-z0-9]{32,40}(&[a-zA-Z0-9]+=[^&]*)*$/i,
		},
		{
			type: "torrent",
			regex: /\S+\.torrent$/i,
		},
		{
			type: "metalink_url",
			regex: /^metalink:\?[^?]+$/i,
		},
		{
			type: "metalink_file",
			regex: /^(?:\S+\.(metalink|meta4))$/i,
		},
		{
			type: "file_path",
			regex: /^file:\/\/\/(?:[a-zA-Z]:\/|\/)?(?:[^<>:"/\\|?*\x00-\x1F]+\/)*[^<>:"/\\|?*\x00-\x1F]*$/i,
		},
		{
			type: "windows_path",
			regex: /^(?:[a-zA-Z]:\\|\\\\)(?:[^<>:"/\\|?*\x00-\x1F]+\\)*[^<>:"/\\|?*\x00-\x1F]*$/i,
		},
		{
			type: "path",
			regex: /^\/(?:[^/]+\/)*[^/]*$/,
		},
	];

	const match = patterns.find((pattern) => pattern.regex.test(value));

	return match ? match.type : "unknown";
}
