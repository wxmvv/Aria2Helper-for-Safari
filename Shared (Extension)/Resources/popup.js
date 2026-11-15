/**
 * Popup controller.
 *
 * Thin view layer: all storage, RPC and file policy lives in common/*.js.
 * Loaded as a classic deferred script so the shared globals exist first.
 */
(function () {
	"use strict";

	const A = window.Aria2Helper;
	if (!A) return;
	const { constants, util, files, filters, storage, messaging, i18n } = A;

	const downloadListEl = document.getElementById("downloadList");
	const noTaskEl = document.getElementById("noTask");
	const noTaskTextEl = document.getElementById("noTaskText");
	const noTaskActionsEl = document.getElementById("noTaskActions");
	const notificationEl = document.getElementById("notification");
	const engineBadgeEl = document.getElementById("engineBadge");
	const dialogueEl = document.getElementById("dialogue");

	const downloadItems = new Map();
	const downloadStatuses = new Map();
	const taskByElement = new WeakMap();

	let state = null;
	let settings = null;
	let connectionStatus = false;
	let engineInfo = null;
	let notificationTimer = null;
	let pollTimer = null;
	let polling = false;
	let dialogueOpen = false;
	let lastFailureAt = 0;

	// --- helpers -----------------------------------------------------------

	function tr(key, fallback) {
		return i18n.t(key, fallback);
	}

	function showNotification(message, type, duration) {
		const colors = {
			success: "rgba(0, 255, 0, .3)",
			error: "rgba(255, 0, 0, .35)",
			info: "rgba(0, 0, 255, .3)",
			warning: "rgba(255, 200, 0, .35)",
			custom: "rgba(255, 255, 255, .3)",
		};
		notificationEl.textContent = message;
		notificationEl.style.backgroundColor = colors[type] || colors.custom;
		notificationEl.classList.add("show");
		if (notificationTimer) clearTimeout(notificationTimer);
		const timeout = duration == null ? 3000 : duration;
		if (timeout > 0) {
			notificationTimer = setTimeout(() => notificationEl.classList.remove("show"), timeout);
		}
	}

	function setNoTask(text, actions) {
		downloadListEl.style.display = "none";
		noTaskEl.style.display = "flex";
		noTaskTextEl.textContent = text;
		noTaskActionsEl.innerHTML = "";
		for (const action of actions || []) {
			const button = document.createElement("button");
			button.className = `btn ${action.primary ? "btn-primary" : ""}`;
			button.textContent = action.label;
			button.addEventListener("click", action.onClick);
			noTaskActionsEl.appendChild(button);
		}
	}

	function hideNoTask() {
		noTaskEl.style.display = "none";
		downloadListEl.style.display = "flex";
	}

	function openSettings() {
		if (window.browser && window.browser.runtime) window.browser.runtime.openOptionsPage();
	}

	function setConnection(isConnected) {
		connectionStatus = isConnected;
		document.documentElement.style.setProperty("--connection-status-color", isConnected ? "var(--connect-color)" : "var(--disconnect-color)");
		const indicator = document.querySelector(".connect-indicator");
		if (indicator) {
			indicator.style.animation = isConnected ? "breathe 2s infinite ease-in-out" : "none";
			indicator.title = isConnected ? tr("connect", "Connected") : tr("disconnect", "Disconnected");
		}
		renderEngineBadge();
	}

	function renderEngineBadge() {
		if (!engineBadgeEl) return;
		if (connectionStatus && engineInfo) {
			const label = `${engineInfo.product} ${engineInfo.version}`.trim();
			engineBadgeEl.textContent = label;
			engineBadgeEl.title = `${label} · ${engineInfo.enabledFeatures.join(", ")}`;
			engineBadgeEl.hidden = false;
			engineBadgeEl.classList.toggle("is-next", Boolean(engineInfo.isAria2Next));
		} else if (connectionStatus) {
			engineBadgeEl.textContent = tr("engine_connected", "aria2");
			engineBadgeEl.title = "";
			engineBadgeEl.hidden = false;
		} else {
			engineBadgeEl.hidden = true;
		}
	}

	function applyAppearance() {
		const appearance = (settings && settings.appearance) || {};
		document.documentElement.classList.toggle("glass", appearance.liquidGlass === true);
		document.documentElement.classList.toggle("no-background", appearance.showBackground !== true);
	}

	// --- state -------------------------------------------------------------

	async function loadState() {
		state = await storage.loadState();
		settings = state.settings;
		applyAppearance();
	}

	if (window.browser && window.browser.storage && window.browser.storage.onChanged) {
		window.browser.storage.onChanged.addListener(() => {
			loadState().then(() => {
				initProfile();
				applyAppearance();
				if (dialogueOpen) refreshSkipHint();
			});
		});
	}

	// --- connection --------------------------------------------------------

	async function checkConnection() {
		const profile = storage.activeProfile(state || {});
		if (!storage.hasUsableProfile(profile)) {
			setConnection(false);
			return false;
		}
		const response = await messaging.send({ api: "engine.getVersion" }, { timeoutMs: 8000 });
		if (!response.ok) {
			setConnection(false);
			return false;
		}
		engineInfo = response.data;
		setConnection(true);
		return true;
	}

	// --- profile bar -------------------------------------------------------

	function initProfile() {
		const left = document.querySelector(".navbar-left");
		if (!left) return;
		left.innerHTML = "";
		const profile = storage.activeProfile(state || {});
		if (!storage.hasUsableProfile(profile)) {
			const button = document.createElement("button");
			button.className = "btn btn-setup";
			button.id = "init-profile-btn";
			button.textContent = tr("setup_aria2", "Set up aria2");
			button.addEventListener("click", openSettings);
			left.appendChild(button);
			return;
		}

		const selectWrap = document.createElement("div");
		selectWrap.className = "select-profile";
		const select = document.createElement("select");
		select.id = "select";
		for (const [profileId, item] of Object.entries(state.profiles)) {
			const option = document.createElement("option");
			option.value = profileId;
			option.textContent = item.alias;
			option.selected = profileId === state.defaultProfileId;
			select.appendChild(option);
		}
		select.addEventListener("change", async () => {
			setNoTask(tr("connecting", "Connecting…"));
			await messaging.send({ api: "profile.setDefault", profileId: select.value });
			await loadState();
			engineInfo = null;
			await checkConnection();
			fetchDownloadList();
		});
		const arrow = document.createElement("div");
		arrow.className = "arrowdown-icon";
		selectWrap.appendChild(select);
		selectWrap.appendChild(arrow);

		const indicator = document.createElement("div");
		indicator.className = "connect-indicator";
		indicator.title = tr("disconnect", "Disconnected");

		const listenButton = document.createElement("button");
		listenButton.className = "btn";
		renderListenButton(listenButton);
		listenButton.addEventListener("click", async () => {
			const response = await messaging.send({ api: "listen.toggle" });
			if (!response.ok) return;
			await loadState();
			renderListenButton(listenButton);
			setConnection(connectionStatus);
			showNotification(
				response.data.listenDownloads ? tr("Start_listening_downloads", "Listening for downloads") : tr("Stop_listening_downloads", "Stopped listening"),
				response.data.listenDownloads ? "success" : "info"
			);
		});

		left.appendChild(selectWrap);
		left.appendChild(indicator);
		left.appendChild(listenButton);
		setConnection(connectionStatus);
	}

	function renderListenButton(button) {
		const listening = Boolean(settings && settings.listenDownloads);
		button.classList.toggle("listen-icon", listening);
		button.classList.toggle("notlisten-icon", !listening);
		button.title = listening ? tr("listen_activate", "Listening") : tr("listen_deactivated", "Not listening");
		button.setAttribute("aria-label", button.title);
	}

	// --- navbar ------------------------------------------------------------

	function initNavbar() {
		const right = document.querySelector(".navbar-right");
		if (!right) return;
		right.innerHTML = "";

		const clearButton = document.createElement("div");
		clearButton.className = "btn";
		clearButton.id = "clear";
		clearButton.textContent = tr("clear", "Clear");
		clearButton.title = tr("clear_download_list", "Clear finished downloads");
		clearButton.style.display = "none";
		clearButton.addEventListener("click", async () => {
			await messaging.send({ api: "downloads.purgeResults" });
			fetchDownloadList();
		});

		const addButton = document.createElement("div");
		addButton.className = "btn addtask-icon";
		addButton.id = "addtask";
		addButton.title = tr("add_task", "Add task");
		addButton.setAttribute("role", "button");
		addButton.setAttribute("tabindex", "0");
		addButton.addEventListener("click", () => openAddTaskDialog());
		addButton.addEventListener("keydown", (event) => {
			if (event.key === "Enter" || event.key === " ") {
				event.preventDefault();
				openAddTaskDialog();
			}
		});

		const settingsButton = document.createElement("div");
		settingsButton.className = "btn settings-icon";
		settingsButton.id = "settings";
		settingsButton.title = tr("open_settings", "Open settings");
		settingsButton.addEventListener("click", openSettings);

		right.appendChild(clearButton);
		right.appendChild(addButton);
		right.appendChild(settingsButton);
	}

	// --- download list -----------------------------------------------------

	async function fetchDownloadList() {
		if (polling) return;
		polling = true;
		try {
			const response = await messaging.send({ api: "downloads.list" }, { timeoutMs: 12000 });
			if (!response.ok) {
				setConnection(false);
				lastFailureAt = Date.now();
				if (!downloadItems.size) {
					setNoTask(tr("unable_to_connect_to_server", "Unable to connect to aria2"), [
						{ label: tr("retry", "Retry"), onClick: () => fetchDownloadList(), primary: true },
						{ label: tr("setup_aria2", "Set up aria2"), onClick: openSettings },
					]);
				}
				return;
			}
			if (!connectionStatus) await checkConnection();
			lastFailureAt = 0;
			updateList(response.data);
		} finally {
			polling = false;
		}
	}

	function updateList(data) {
		const active = data.active || [];
		const waiting = data.waiting || [];
		const stopped = data.stopped || [];
		const items = active.concat(waiting, stopped);

		const clearButton = document.getElementById("clear");
		if (clearButton) clearButton.style.display = stopped.length > 0 ? "block" : "none";

		if (items.length === 0) {
			setNoTask(tr("no_task_here", "No tasks yet"));
			downloadItems.forEach((element) => element.remove());
			downloadItems.clear();
			downloadStatuses.clear();
			return;
		}
		hideNoTask();

		const liveGids = new Set(items.map((item) => item.gid));
		for (const [gid, element] of downloadItems) {
			if (!liveGids.has(gid)) {
				element.remove();
				downloadItems.delete(gid);
				downloadStatuses.delete(gid);
			}
		}

		items.forEach((item, index) => {
			let element = downloadItems.get(item.gid);
			if (!element) {
				element = createDownloadItemElement(item);
				downloadItems.set(item.gid, element);
				downloadListEl.appendChild(element);
			}
			downloadStatuses.set(item.gid, item.status);
			updateDownloadItemElement(element, item);
			element.style.order = String(index);
		});
	}

	function taskName(item) {
		const firstFile = (item.files && item.files[0]) || null;
		if (item.bittorrent && item.bittorrent.info && item.bittorrent.info.name) return item.bittorrent.info.name;
		if (item.ed2k && item.ed2k.name) return item.ed2k.name;
		if (item.media && item.media.filename) return item.media.filename;
		const fromFile = firstFile && firstFile.path ? files.basename(firstFile.path) : "";
		if (fromFile) return fromFile;
		const uri = firstFile && firstFile.uris && firstFile.uris[0] ? firstFile.uris[0].uri : "";
		if (uri) return files.basename(uri);
		if (item.dir) return files.basename(item.dir) || item.gid;
		return item.gid;
	}

	function taskPath(item) {
		const firstFile = (item.files && item.files[0]) || null;
		if (firstFile && firstFile.path) return firstFile.path;
		return item.dir || "";
	}

	function statusText(item) {
		const rawLabel = tr(item.status, item.status);
		const label = rawLabel ? rawLabel.charAt(0).toUpperCase() + rawLabel.slice(1) : rawLabel;
		const percent = util.formatPercent(util.progressPercent(item));
		const isMedia = Boolean(item.media) && util.toNumber(item.totalLength) === 0;
		if (isMedia && item.status === "active") {
			const downloaded = util.formatBytes(item.media.downloadedLength || item.completedLength);
			const live = String(item.media.live) === "true" ? " · LIVE" : "";
			return `${label} ${percent} ${downloaded}${live}`.trim();
		}
		const total = util.formatBytes(util.effectiveTotalLength(item));
		const completed = util.formatBytes(util.effectiveCompletedLength(item));
		if (item.status === "active") {
			const remaining = util.remainingSeconds(util.effectiveCompletedLength(item), util.effectiveTotalLength(item), item.downloadSpeed);
			const eta = remaining == null ? "" : ` · ${util.formatDuration(remaining)}`;
			const speed = util.formatSpeed(item.downloadSpeed);
			return `${label} ${percent} ${completed}/${total} ${speed}${eta}`.replace(/\s+/g, " ").trim();
		}
		if (item.status === "complete") return `${label} ${total}`;
		if (item.status === "error") return `${label}${item.errorMessage ? `: ${util.truncate(item.errorMessage, 60)}` : ""}`;
		if (item.status === "removed") return label;
		return `${label} ${percent} ${completed}/${total}`.trim();
	}

	function createDownloadItemElement(item) {
		const element = document.createElement("div");
		element.className = "item";
		element.dataset.gid = item.gid;
		taskByElement.set(element, item);

		const icon = document.createElement("div");
		icon.className = "item-icon";
		icon.addEventListener("click", (event) => {
			event.stopPropagation();
			togglePause(taskByElement.get(element), icon);
		});

		const info = document.createElement("div");
		info.className = "item-info";
		const name = document.createElement("div");
		name.className = "item-info-name";
		const nameBody = document.createElement("div");
		nameBody.className = "item-info-name-name";
		const nameExtension = document.createElement("div");
		nameExtension.className = "item-info-name-extension";
		name.appendChild(nameBody);
		name.appendChild(nameExtension);
		const progressBg = document.createElement("div");
		progressBg.className = "item-info-progress-bg";
		const progress = document.createElement("div");
		progress.className = "item-info-progress";
		progressBg.appendChild(progress);
		const status = document.createElement("div");
		status.className = "item-info-status";
		info.appendChild(name);
		info.appendChild(progressBg);
		info.appendChild(status);

		const actions = document.createElement("div");
		actions.className = "item-actions";
		const removeButton = document.createElement("button");
		removeButton.className = "btn-delete-icon";
		removeButton.title = tr("remove", "Remove");
		removeButton.addEventListener("click", (event) => {
			event.stopPropagation();
			handleRemove(taskByElement.get(element), removeButton);
		});
		const openButton = document.createElement("button");
		openButton.className = "btn-open-icon";
		openButton.title = tr("open_file", "Show in Finder");
		openButton.addEventListener("click", (event) => {
			event.stopPropagation();
			openTaskFile(taskByElement.get(element));
		});
		actions.appendChild(removeButton);
		actions.appendChild(openButton);

		element.appendChild(icon);
		element.appendChild(info);
		element.appendChild(actions);

		element.addEventListener("click", () => {
			const active = downloadListEl.querySelector(".item.active");
			if (active) active.classList.remove("active");
			element.classList.add("active");
		});
		element.addEventListener("dblclick", (event) => {
			event.preventDefault();
			openTaskFile(taskByElement.get(element));
		});
		return element;
	}

	async function togglePause(item, icon) {
		const status = downloadStatuses.get(item.gid);
		if (status !== "active" && status !== "waiting" && status !== "paused") {
			showNotification(tr("cannot_pause_task", "This task cannot be paused"), "warning");
			return;
		}
		const api = status === "paused" ? "downloads.unpause" : "downloads.pause";
		const response = await messaging.send({ api, gid: item.gid });
		if (!response.ok) {
			showNotification(response.error.message, "error");
			return;
		}
		icon.classList.toggle("pause-icon", status === "paused");
		icon.classList.toggle("play-icon", status !== "paused");
		fetchDownloadList();
	}

	async function handleRemove(item, button) {
		const status = downloadStatuses.get(item.gid);
		const finished = status === "complete" || status === "removed" || status === "error";
		if (finished) {
			const restartUri =
				!item.bittorrent && item.files && item.files[0] && item.files[0].uris && item.files[0].uris[0] ? item.files[0].uris[0].uri : "";
			const response = await messaging.send({ api: "downloads.removeResult", gid: item.gid });
			if (!response.ok) {
				showNotification(response.error.message, "error");
				return;
			}
			if (restartUri) {
				const added = await messaging.send({ api: "downloads.addUri", url: restartUri });
				if (!added.ok) showNotification(added.error.message, "error");
			}
			button.classList.remove("btn-restart-icon");
			button.classList.add("btn-delete-icon");
			button.title = tr("remove", "Remove");
		} else {
			const response = await messaging.send({ api: "downloads.remove", gid: item.gid });
			if (!response.ok) {
				showNotification(response.error.message, "error");
				return;
			}
		}
		fetchDownloadList();
	}

	async function openTaskFile(item) {
		const path = taskPath(item);
		if (!path) {
			showNotification(tr("file_not_found", "File not found"), "error");
			return;
		}
		const response = await messaging.send({ api: "native.selectFile", url: path }, { timeoutMs: 8000 });
		if (!response.ok) {
			showNotification(response.error.message, "error");
			return;
		}
		const result = response.data || {};
		if (result.result === "ios") {
			showNotification(tr("unable_open_ios_file", "Opening files is not available on iOS"), "error");
			return;
		}
		if (!result.isLocal) {
			showNotification(tr("unable_open_remote_file", "This file is on a remote aria2 host"), "error");
			return;
		}
		if (!result.result) showNotification(tr("file_not_found", "File not found"), "error");
	}

	function updateDownloadItemElement(element, item) {
		// Keep existing DOM nodes, but let all actions read the latest polled task.
		taskByElement.set(element, item);
		const icon = element.children[0];
		const info = element.children[1];
		const actions = element.children[2];
		const nameBody = info.children[0].children[0];
		const nameExtension = info.children[0].children[1];
		const progressBg = info.children[1];
		const progress = progressBg.children[0];
		const status = info.children[2];
		const removeButton = actions.children[0];

		const parts = files.getFileParts(taskName(item));
		nameBody.textContent = parts.nameWithoutExtension || taskName(item);
		nameExtension.textContent = parts.extension || "";
		element.title = taskName(item) || item.gid;

		const percent = util.progressPercent(item);
		const percentText = util.formatPercent(percent);
		progress.style.width = percentText || "0%";
		progress.classList.toggle("infinity", item.status === "active" && percent == null);
		progressBg.classList.toggle("hide", item.status === "error" || item.status === "removed");
		status.textContent = statusText(item);

		if (item.status === "paused") {
			icon.classList.remove("pause-icon");
			icon.classList.add("play-icon");
			icon.title = tr("unpause", "Resume");
		} else if (item.status === "active" || item.status === "waiting") {
			icon.classList.remove("play-icon");
			icon.classList.add("pause-icon");
			icon.title = tr("pause", "Pause");
		} else {
			icon.classList.remove("play-icon", "pause-icon");
			icon.title = "";
		}

		const finished = item.status === "complete" || item.status === "removed" || item.status === "error";
		const uri = item.files && item.files[0] && item.files[0].uris && item.files[0].uris[0] ? item.files[0].uris[0].uri : "";
		const restartable = finished && !item.bittorrent && Boolean(uri);
		removeButton.classList.toggle("btn-restart-icon", Boolean(restartable));
		removeButton.classList.toggle("btn-delete-icon", !restartable);
		removeButton.title = restartable ? tr("restart", "Restart") : tr("remove", "Remove");
	}

	// --- add task dialogue ------------------------------------------------

	const dialogState = {
		files: [],
		busy: false,
	};

	function openAddTaskDialog() {
		if (!dialogueEl.querySelector(".addtask-dialogue")) {
			dialogueEl.appendChild(createAddTaskDialog());
		}
		dialogueOpen = true;
		dialogueEl.classList.add("show");
		const textarea = document.getElementById("addtask-textarea");
		if (textarea) textarea.focus();
		syncDialogueHeight();
	}

	function closeAddTaskDialog() {
		dialogueOpen = false;
		dialogueEl.classList.remove("show");
		dialogState.files = [];
		syncDialogueHeight();
	}

	function syncDialogueHeight() {
		const dialog = dialogueEl.querySelector(".addtask-dialogue");
		const height = dialogueOpen && dialog ? `${dialog.offsetHeight}px` : "0px";
		document.documentElement.style.setProperty("--dialogue-height", height);
	}

	function fileKind(name) {
		const lower = String(name || "").toLowerCase();
		if (lower.endsWith(".torrent")) return "torrent";
		if (lower.endsWith(".metalink") || lower.endsWith(".meta4")) return "metalink";
		return "";
	}

	function readFileAsBase64(file) {
		return new Promise((resolve, reject) => {
			const reader = new FileReader();
			reader.onerror = () => reject(new Error(`Cannot read ${file.name}`));
			reader.onload = () => {
				const result = String(reader.result || "");
				const comma = result.indexOf(",");
				if (comma < 0) {
					reject(new Error(`Cannot read ${file.name}`));
					return;
				}
				resolve(result.slice(comma + 1));
			};
			reader.readAsDataURL(file);
		});
	}

	function createAddTaskDialog() {
		const dialog = document.createElement("div");
		dialog.className = "addtask-dialogue";
		dialog.id = "addtask-dialogue";

		const content = document.createElement("div");
		content.className = "dialogue-content";

		const info = document.createElement("div");
		info.className = "textareaInfo";
		info.textContent = tr("enter_links_hint", "Paste links, one per line");

		const textarea = document.createElement("textarea");
		textarea.className = "textarea";
		textarea.id = "addtask-textarea";
		textarea.rows = 2;
		textarea.placeholder = tr("Enter_URL_or_magnet_link_here", "Paste URLs or magnet links, one per line");
		textarea.addEventListener("input", () => {
			const count = files.parseUriList(textarea.value).length;
			info.textContent = count ? `${count} ${tr("links_detected", "links")}` : tr("enter_links_hint", "Paste links, one per line");
			syncDialogueHeight();
		});

		const dropZone = document.createElement("label");
		dropZone.className = "drop-zone";
		dropZone.htmlFor = "inputFile";
		const dropText = document.createElement("span");
		dropText.textContent = tr("choose_torrent_files", "Choose .torrent / .metalink files");
		const dropHint = document.createElement("span");
		dropHint.className = "drop-hint";
		dropHint.textContent = tr("drop_files_here", "or drop them here");
		dropZone.appendChild(dropText);
		dropZone.appendChild(dropHint);

		const fileInput = document.createElement("input");
		fileInput.id = "inputFile";
		fileInput.type = "file";
		fileInput.multiple = true;
		fileInput.accept = ".torrent,.metalink,.meta4";
		fileInput.style.display = "none";

		const fileList = document.createElement("div");
		fileList.className = "file-list";
		fileList.id = "addtask-file-list";

		const skipHint = document.createElement("div");
		skipHint.className = "skip-hint";
		skipHint.id = "addtask-skip-hint";

		const actions = document.createElement("div");
		actions.className = "dialogue-actions";
		const confirm = document.createElement("button");
		confirm.className = "btn btn-primary";
		confirm.textContent = tr("confirm", "Add");
		const cancel = document.createElement("button");
		cancel.className = "btn";
		cancel.textContent = tr("cancel", "Cancel");
		actions.appendChild(confirm);
		actions.appendChild(cancel);

		content.appendChild(info);
		content.appendChild(textarea);
		content.appendChild(dropZone);
		content.appendChild(fileInput);
		content.appendChild(fileList);
		content.appendChild(skipHint);
		dialog.appendChild(content);
		dialog.appendChild(actions);

		cancel.addEventListener("click", () => {
			textarea.value = "";
			fileInput.value = "";
			dialogState.files = [];
			renderFileList(fileList);
			closeAddTaskDialog();
		});

		fileInput.addEventListener("change", () => {
			handleSelectedFiles(Array.from(fileInput.files || []), fileList);
			fileInput.value = "";
		});

		dropZone.addEventListener("dragover", (event) => {
			event.preventDefault();
			dropZone.classList.add("dragging");
		});
		dropZone.addEventListener("dragleave", () => dropZone.classList.remove("dragging"));
		dropZone.addEventListener("drop", (event) => {
			event.preventDefault();
			dropZone.classList.remove("dragging");
			handleSelectedFiles(Array.from(event.dataTransfer.files || []), fileList);
		});

		confirm.addEventListener("click", () => submitTasks(textarea, fileList, confirm));

		refreshSkipHint();
		return dialog;
	}

	function refreshSkipHint() {
		const hint = document.getElementById("addtask-skip-hint");
		if (!hint) return;
		const skip = (settings && settings.skipExtensions) || [];
		hint.textContent = skip.length ? `${tr("skip_list_applied", "Skipped file types")}: ${skip.join(", ")}` : "";
		hint.hidden = skip.length === 0;
	}

	async function handleSelectedFiles(selected, fileList) {
		if (dialogState.busy) return;
		const errors = [];
		for (const file of selected) {
			const kind = fileKind(file.name);
			if (!kind) {
				errors.push(`${file.name}: ${tr("invalid_file", "Unsupported file type")}`);
				continue;
			}
			try {
				const base64 = await readFileAsBase64(file);
				const entry = { name: file.name, size: file.size, kind, base64, inspection: null, selected: null };
				if (kind === "torrent") {
					const response = await messaging.send({ api: "torrent.inspect", file: base64 }, { timeoutMs: 15000 });
					if (response.ok) {
						entry.inspection = response.data;
						const skipExtensions =
							settings && settings.skipFilesInTorrent !== false ? settings.skipExtensions || [] : [];
						const selection = filters.selectTorrentFiles(entry.inspection.files, skipExtensions);
						entry.selected = new Set(selection.selected);
					} else {
						entry.error = response.error.message;
					}
				}
				dialogState.files.push(entry);
			} catch (error) {
				errors.push(`${file.name}: ${error.message}`);
			}
		}
		if (errors.length) showNotification(errors.join(" · "), "error", 5000);
		renderFileList(fileList);
		syncDialogueHeight();
	}

	function renderFileList(fileList) {
		fileList.innerHTML = "";
		if (!dialogState.files.length) {
			fileList.hidden = true;
			return;
		}
		fileList.hidden = false;
		for (const entry of dialogState.files) {
			const card = document.createElement("div");
			card.className = "file-card";
			const head = document.createElement("div");
			head.className = "file-card-head";
			const name = document.createElement("span");
			name.className = "file-card-name";
			name.textContent = entry.name;
			const size = document.createElement("span");
			size.className = "file-card-size";
			size.textContent = util.formatBytes(entry.size);
			const remove = document.createElement("button");
			remove.className = "btn file-card-remove";
			remove.textContent = "✕";
			remove.title = tr("remove", "Remove");
			remove.addEventListener("click", () => {
				dialogState.files = dialogState.files.filter((item) => item !== entry);
				renderFileList(fileList);
				syncDialogueHeight();
			});
			head.appendChild(name);
			head.appendChild(size);
			head.appendChild(remove);
			card.appendChild(head);

			if (entry.error) {
				const error = document.createElement("div");
				error.className = "file-card-error";
				error.textContent = entry.error;
				card.appendChild(error);
			}

			if (entry.inspection) {
				const summary = document.createElement("div");
				summary.className = "file-card-summary";
				const total = entry.inspection.files.length;
				const selectedCount = entry.selected ? entry.selected.size : total;
				summary.textContent = `${selectedCount}/${total} ${tr("files_selected", "files selected")} · ${util.formatBytes(entry.inspection.totalLength)}`;
				const toggleAll = document.createElement("button");
				toggleAll.className = "btn file-card-toggle";
				const allSelected = selectedCount === total;
				toggleAll.textContent = allSelected ? tr("select_none", "Select none") : tr("select_all", "Select all");
				toggleAll.addEventListener("click", () => {
					entry.selected = allSelected ? new Set() : new Set(entry.inspection.files.map((file) => file.index));
					renderFileList(fileList);
				});
				summary.appendChild(toggleAll);
				card.appendChild(summary);

				const list = document.createElement("div");
				list.className = "torrent-files";
				const skipExtensions = (settings && settings.skipExtensions) || [];
				const reviewFiles = !settings || settings.confirmTorrentSelection !== false;
				for (const file of reviewFiles ? entry.inspection.files : []) {
					const row = document.createElement("label");
					row.className = "torrent-file";
					const checkbox = document.createElement("input");
					checkbox.type = "checkbox";
					checkbox.checked = entry.selected ? entry.selected.has(file.index) : true;
					checkbox.addEventListener("change", () => {
						if (!entry.selected) entry.selected = new Set();
						if (checkbox.checked) entry.selected.add(file.index);
						else entry.selected.delete(file.index);
						const totalSelected = entry.selected.size;
						summary.firstChild.nodeValue = `${totalSelected}/${total} ${tr("files_selected", "files selected")} · ${util.formatBytes(entry.inspection.totalLength)}`;
					});
					const path = document.createElement("span");
					path.className = "torrent-file-path";
					path.textContent = file.path;
					path.title = file.path;
					const fileSize = document.createElement("span");
					fileSize.className = "torrent-file-size";
					fileSize.textContent = util.formatBytes(file.length);
					const skipped = files.matchesExtensionList(file.path, skipExtensions);
					if (skipped) row.classList.add("skipped");
					row.appendChild(checkbox);
					row.appendChild(path);
					row.appendChild(fileSize);
					list.appendChild(row);
				}
				card.appendChild(list);
			}
			fileList.appendChild(card);
		}
		refreshSkipHint();
	}

	async function submitTasks(textarea, fileList, confirm) {
		if (dialogState.busy) return;
		const uris = files.parseUriList(textarea.value);
		const entries = dialogState.files.slice();
		if (!uris.length && !entries.length) {
			showNotification(tr("please_input_url_or_filepath", "Add a link or choose a file"), "error");
			return;
		}
		dialogState.busy = true;
		confirm.disabled = true;
		try {
			const items = [];
			const skippedFiles = [];
			for (const entry of entries) {
				if (entry.kind === "torrent") {
					if (!entry.selected || entry.selected.size === 0) {
						skippedFiles.push(entry.name);
						continue;
					}
					const spec = filters.compactIndexList(Array.from(entry.selected));
					const all = entry.inspection ? entry.inspection.files.length : 0;
					const needSelection = all > 0 && entry.selected.size < all;
					items.push({
						kind: "torrent",
						name: entry.name,
						file: entry.base64,
						extra: needSelection ? { selectFile: spec } : {},
					});
				} else {
					items.push({ kind: "metalink", name: entry.name, file: entry.base64, extra: {} });
				}
			}
			for (const uri of uris) items.push({ kind: "uri", url: uri, extra: {} });

			if (!items.length) {
				showNotification(tr("no_files_selected", "No files selected"), "warning");
				return;
			}

			const response = await messaging.send({ api: "downloads.addBatch", items }, { timeoutMs: 120000 });
			if (!response.ok) {
				showNotification(response.error.message, "error", 5000);
				return;
			}
			const { added, failed, skipped } = response.data;
			const parts = [];
			if (added.length) parts.push(`${added.length} ${tr("added", "added")}`);
			if (failed.length) parts.push(`${failed.length} ${tr("failed", "failed")}`);
			if (skipped.length || skippedFiles.length) parts.push(`${skipped.length + skippedFiles.length} ${tr("skipped", "skipped")}`);
			showNotification(parts.join(" · ") || tr("Task_added_successfully", "Task added"), failed.length ? "warning" : "success", 4000);
			if (failed.length) {
				// Keep only what still needs a retry, otherwise pressing Add again
				// would queue the already-added downloads a second time.
				const addedNames = new Set(added.map((item) => item.name));
				dialogState.files = dialogState.files.filter((entry) => !addedNames.has(entry.name));
				textarea.value = uris.filter((uri) => !addedNames.has(uri)).join("\n");
				renderFileList(fileList);
				for (const failure of failed) {
					const row = document.createElement("div");
					row.className = "file-card-error";
					row.textContent = `${failure.name}: ${failure.error}`;
					fileList.appendChild(row);
				}
				if (added.length) showNotification(`${added.length} ${tr("added", "added")}`, "info", 3000);
				return;
			}
			textarea.value = "";
			dialogState.files = [];
			renderFileList(fileList);
			closeAddTaskDialog();
			fetchDownloadList();
		} finally {
			dialogState.busy = false;
			confirm.disabled = false;
			syncDialogueHeight();
		}
	}

	// --- device style -----------------------------------------------------

	function detectDevice() {
		const userAgent = navigator.userAgent;
		const touch = "ontouchstart" in window || navigator.maxTouchPoints > 0;
		if (/iPad|iPhone|iPod/.test(userAgent) || (touch && /Mobile/.test(userAgent))) return "ios";
		if (/Macintosh/.test(userAgent) && !touch) return "macos";
		return "unknown";
	}

	function initStyle() {
		if (detectDevice() === "ios") {
			document.documentElement.style.setProperty("--downloadList-width", "100%");
			document.documentElement.style.setProperty("--downloadList-max-height", "auto");
			document.body.classList.add("ios");
		}
	}

	// --- boot --------------------------------------------------------------

	async function boot() {
		initStyle();
		document.getElementById("appTitle").textContent = tr("extension_name", constants.APP_NAME);
		await loadState();
		initNavbar();
		initProfile();
		setNoTask(tr("initializing", "Initializing…"));
		const connected = await checkConnection();
		if (connected) await fetchDownloadList();
		else {
			setNoTask(tr("please_connect_first", "Connect aria2 to get started"), [
				{ label: tr("setup_aria2", "Set up aria2"), onClick: openSettings, primary: true },
				{ label: tr("retry", "Retry"), onClick: () => checkConnection().then((ok) => ok && fetchDownloadList()) },
			]);
		}
		pollTimer = setInterval(() => {
			if (document.visibilityState !== "visible") return;
			// After a failure, back off instead of hammering an offline engine every 1.5 s.
			if (!connectionStatus && Date.now() - lastFailureAt < 5000) return;
			fetchDownloadList();
		}, 1500);
		document.addEventListener("visibilitychange", () => {
			if (document.visibilityState === "visible") fetchDownloadList();
		});
		// Deep link used by the UI harness and by future "add from page" actions.
		if (location.hash === "#add") openAddTaskDialog();
		window.addEventListener("beforeunload", () => {
			if (pollTimer) clearInterval(pollTimer);
			if (notificationTimer) clearTimeout(notificationTimer);
		});
	}

	if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
	else boot();
})();
