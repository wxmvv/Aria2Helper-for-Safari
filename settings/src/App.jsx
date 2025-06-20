import Aria2HelperTab from "./tabs/Aria2HelperSettings";

import bgimg from "./assets/Ghostty Config - Application.webp";
import aria2helperIcon from "./assets/tabIcon/o.png";
import aria2Icon from "./assets/tabIcon/Application Settings.webp";

import { ChevronBackward } from "./icon/chevron_backward";
import { ChevronForward } from "./icon/chevron_forward";
import { SidebarLeft } from "./icon/sidebar_left";

import { SidebarItem, SidebarProfile } from "./components/SidebarItem";
import { TrafficLight } from "./components/TrafficLight";
import { RPCTabView } from "./tabs/RPCTab";
import { AboutTab } from "./tabs/AboutTab";
import { OtherSettings } from "./tabs/OtherSettings";

import { t } from "./utils/i18n";

import { useState, useEffect } from "react";

function App({ helper }) {
	const [tab, setTab] = useState("Aria2Helper");
	const [RPCTab, setRPCTab] = useState(helper.getCurrentProfileId());
	const [RPCs, setRPCs] = useState(helper.getProfiles());
	const [showSidebar, setShowSidebar] = useState(true);

	const addRPC = () => {
		console.log("addRPC");
		helper.addNewProfile();
		setRPCs(helper.getProfiles());
		setRPCTab(helper.getCurrentProfileId());
	};
	const removeRPC = () => {
		console.log("removeRPC");
		helper.removeProfileById(RPCTab);
		setRPCs(helper.getProfiles());
		setRPCTab(helper.getCurrentProfileId());
	};
	const selectRPCTab = (rpcKey) => {
		setTab("RPC");
		helper.setCurrentProfileById(rpcKey);
		setRPCs(helper.getProfiles());
		setRPCTab(helper.getCurrentProfileId());
	};

	const onRPCUpdate = () => {
		setRPCs(helper.getProfiles());
		setRPCTab(helper.getCurrentProfileId());
	};

	const handleToggleClick = () => {
		if (!showSidebar) {
			document.documentElement.style.setProperty("--sidebar-width", "var(--sidebar-width-value)");
			document.documentElement.style.setProperty("--sidebar-opacity", "1");
			setShowSidebar(true);
		} else {
			document.documentElement.style.setProperty("--sidebar-width", "0px");
			document.documentElement.style.setProperty("--sidebar-opacity", "0");
			setShowSidebar(false);
		}
	};

	return (
		<div id="main" className="text flex flex-col justify-center items-center w-full min-h-lvh relative">
			<img src={bgimg} alt="" srcSet="" className="absolute top-0 left-0 w-full h-full object-cover -z-1 " />

			<div className="relative flex flex-row w-[100%] md:w-[90%] max-w-[715px] h-[700px] rounded-xl overflow-hidden border border-gray-300/50 shadow-md shadow-primary/30">
				<div id="nav" className="flex flex-row z-20 absolute top-0 left-0 w-full h-[var(--navbar-height)] bg-transparent ">
					<TrafficLight id="nav-traffic-light" className="transition-all opacity-[var(--sidebar-opacity)] absolute top-[20px] left-[20px]" />

					<div className="transition-all w-[var(--sidebar-width)] min-w-[60px] pr-2 h-full flex flex-row items-center justify-end ">
						<button id="nav-sidebar-toggle" onClick={handleToggleClick} className="z-30 w-[32px] h-[32px] p-[5px] active:bg-gray-500/20 rounded-lg">
							<SidebarLeft className=" w-[22px] h-[22px] fill-black dark:fill-white"></SidebarLeft>
						</button>
					</div>

					<div className="transition-all content-nav px-[20px] py-[16px] gap-[16px] h-full flex flex-row items-center">
						<div className="flex flex-row gap-[22px]">
							<ChevronBackward className="w-[15px] h-[15px]" color={"#999"}></ChevronBackward>
							<ChevronForward className="w-[15px] h-[15px]" color={"#999"}></ChevronForward>
						</div>
						<div id="nav-title" className="font-semibold text-xl">
							{tab && tab === "About" && t("extension_name")}
							{tab && tab === "Aria2Helper" && t("helper_settings")}
							{tab && tab === "Others" && t("other_settings")}
							{tab && tab === "RPC" && t("aria2_settings")}
						</div>
					</div>
				</div>

				<div id="sidebar" className="transition-all opacity-[var(--sidebar-opacity)] absolute left-0 top-0 h-full z-10 md:relative flex flex-col w-[var(--sidebar-width)] bg-base-100/[0.65] backdrop-blur-md">
					<div id="sidebar-header" className=" relative h-[var(--navbar-height)] min-h-[var(--navbar-height)] w-full ">
						{/* <TrafficLight className="absolute top-[20px] left-[20px]" />
						<button onClick={() => setShowSidebar(!showSidebar)} className="absolute top-[12px] right-[20px] w-[32px] h-[32px] p-[5px] active:bg-gray-500/20 rounded-lg">
							<SidebarLeft className=" w-[22px] h-[22px] fill-black dark:fill-white"></SidebarLeft>
						</button> */}
					</div>
					<div id="sidebar-content" className="mb-[var(--profile-gap-height)] flex flex-col py-[10px] px-[10px] gap-[2px] font-semibold">
						<SidebarProfile className="mb-[var(--profile-gap-height)]" iconSrc={aria2helperIcon} selected={tab === "About"} title={t("extension_name")} subTitle={"v1.3.5"} onClick={() => setTab("About")} />
						<SidebarItem iconSrc={aria2helperIcon} selected={tab === "Aria2Helper"} title={t("helper_settings")} onClick={() => setTab("Aria2Helper")} />
						<SidebarItem iconSrc={aria2Icon} selected={tab === "Others"} title={t("other_settings")} onClick={() => setTab("Others")} />
					</div>
					<div id="section-title" className="flex flex-row items-center px-[10px] pt-[10px] justify-between gap-[10px] text-l font-bold text-gray-600">
						<div className="">{t("aria2_settings")}</div>
						<div className="flex flex-row gap-[10px]">
							<button className="text-primary" onClick={addRPC}>
								+
							</button>
							<button disabled={!RPCTab || tab !== "RPC"} className={`${!RPCTab || tab !== "RPC" ? "" : "text-primary"}`} onClick={removeRPC}>
								-
							</button>
						</div>
					</div>
					<div id="sidebar-content" className="flex flex-col px-[10px] gap-[2px] font-semibold  overflow-scroll">
						{/* <div className="flex flex-col gap-[2px] h-[450px] pb-[10px]"> */}
						<div className="flex flex-col gap-[2px] pb-[10px]">
							{Object.keys(RPCs).map((rpcKey, index) => {
								return (
									<SidebarItem
										className={RPCs[rpcKey].isDefault ? "bg-primary/20" : ""}
										key={rpcKey}
										iconSrc={aria2helperIcon}
										selected={tab === "RPC" && RPCTab === rpcKey}
										title={RPCs[rpcKey].alias}
										onClick={() => selectRPCTab(rpcKey)}
									/>
								);
							})}
						</div>
					</div>
				</div>

				<div id="content" className=" shadow-gray-500/50 border-l border-gray-500/50 shadow relative flex flex-col flex-1 grow bg-base-100/[0.8] ">
					<div id="content-header" className="absolute left-0 top-0 h-[var(--navbar-height)] w-full px-20px bg-transparent backdrop-blur-md">
						{/* <div className="content-nav px-[20px] py-[16px] gap-[16px] w-full h-full flex flex-row items-center">
							<div className="flex flex-row gap-[22px]">
								<ChevronBackward className="w-[15px] h-[15px]" color={"#999"}></ChevronBackward>
								<ChevronForward className="w-[15px] h-[15px]" color={"#999"}></ChevronForward>
							</div>
							<div id="nav-title" className="font-semibold text-xl">
								{tab && tab === "About" && t("extension_name")}
								{tab && tab === "Aria2Helper" && t("helper_settings")}
								{tab && tab === "Others" && t("other_settings")}
								{tab && tab === "RPC" && t("aria2_settings")}
							</div>
						</div> */}
					</div>
					<div className="w-full h-full overflow-scroll p-[20px]">
						<div className="safe-area h-[var(--safe-area-top)] bg-transparent w-full"></div>
						{tab && tab === "About" && <AboutTab />}
						{tab && tab === "Aria2Helper" && <Aria2HelperTab helper={helper} />}
						{tab && tab === "Others" && "Others" && <OtherSettings helper={helper} />}
						{tab && tab === "RPC" && RPCTab && <RPCTabView onRPCUpdate={onRPCUpdate} helper={helper} />}
					</div>
				</div>
			</div>
		</div>
	);
}

export default App;
