import { getAllLocalStorges, setLocalStorages, setSettings } from "./utils/api";
class Helper {
	constructor() {
		this.App = "Aria2Helpers";
		this.Version = "v1.3.5";
		this.settings = null;
		this.profiles = null;
		this.currentProfileId = null;
		this.defaultProfile = null;
		this.device = null;
		this.init();
	}

	async init() {
		const res = await getAllLocalStorges();
		console.log(res);
	}
}
