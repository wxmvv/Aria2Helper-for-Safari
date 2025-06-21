export const initProfiles = {
	init: {
		alias: "New",
		rpcHost: "",
		rpcIshttps: false,
		rpcPort: "",
		rpcSecret: "",
		rpcParameters: "",
		isDefault: true,
		dir: "", 
		header:[],
	},
};

export const initSettings = {
	showBadge: false, // show badge
	showNotification: false, // show notifications
	listenDownloads: false, // listen downloads
	filterLists: {
		blacklist: {
			name: "Blacklist",
			extensions: [],
		},
		whitelist: {
			name: "Whitelist",
			extensions: [],
		},
	},
};

export const initCurrentProfileId = "init";
export const initDefaultProfileId = "init";
