export async function getAllLocalStorges() {
	return await browser.storage.local.get(["settings", "profiles", "currentProfileId", "defaultProfile", "device"]);
}

export async function setLocalStorages(profiles, settings, currentProfileId, defaultProfileId) {
	await browser.storage.local.set({
		profiles,
		settings,
		currentProfileId,
		defaultProfileId,
	});
}

export async function setSettings() {
	browser.storage.local
		.set({
			settings: settings,
		})
		.then((res) => {
			console.log("saveSettings", res);
			console.log(settings);
		});
}
