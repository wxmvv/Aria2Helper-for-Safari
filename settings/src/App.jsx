import Aria2HelperTab from "./tabs/Aria2HelperSettings";

import bgimg from "./assets/Ghostty Config - Application.webp";
import aria2helperIcon from "./assets/tabIcon/o.png";
import aria2Icon from "./assets/tabIcon/Application Settings.webp";

import { ChevronBackward } from "./icon/chevron_backward";
import { ChevronForward } from "./icon/chevron_forward";
import { SidebarItem, SidebarProfile } from "./components/SidebarItem";
import { TrafficLight } from "./components/TrafficLight";
import { RPCTabView } from "./tabs/RPCTab";
import { AboutTab } from "./tabs/AboutTab";
import { OtherSettings } from "./tabs/OtherSettings";

import { useState, useEffect } from "react";

function App({ helper }) {
	const [tab, setTab] = useState("Aria2Helper");
	const [RPCTab, setRPCTab] = useState(helper.getCurrentProfileId());
	const [RPCs, setRPCs] = useState(helper.getProfiles());

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

	return (
		<div id="main" className="text flex flex-row justify-center items-center w-full min-h-lvh relative">
			<div className="flex flex-row w-[90%] max-w-[715px] h-[700px] rounded-xl  overflow-hidden border border-gray-300/50 shadow-md shadow-primary/30">
				<img src={bgimg} alt="" srcSet="" className="absolute top-0 left-0 w-full h-full object-cover -z-1 " />
				<div id="sidebar" className="flex flex-col w-[var(--sidebar-width)] bg-base-100/[0.65] backdrop-blur-md">
					<div id="sidebar-header" className="relative h-[var(--navbar-height)] w-full">
						<TrafficLight className="absolute top-[20px] left-[20px]" />
					</div>
					<div id="sidebar-content" className="flex flex-col py-[10px] px-[10px] gap-[2px] font-semibold">
						<SidebarProfile iconSrc={aria2helperIcon} selected={tab === "About"} title={"Aria2Helper"} subTitle={"v1.3.1"} onClick={() => setTab("About")} />
						<div id="profile-gap" className="w-full h-[var(--profile-gap-height)] bg-transparent"></div>
						<SidebarItem iconSrc={aria2helperIcon} selected={tab === "Aria2Helper"} title={"Aria2Helper"} onClick={() => setTab("Aria2Helper")} />
						<SidebarItem iconSrc={aria2Icon} selected={tab === "Others"} title={"Others"} onClick={() => setTab("Others")} />
					</div>
					<div id="profile-gap" className="w-full h-[var(--profile-gap-height)] bg-transparent"></div>
					<div id="section-title" className="flex flex-row items-center px-[10px] pt-[10px] justify-between gap-[10px] text-l font-bold text-gray-600">
						<div className="">Aria2 RPC</div>
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
						<div className="flex flex-col gap-[2px] h-[450px] pb-[10px]">
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
						<div className="content-nav px-[20px] py-[16px] gap-[16px] w-full h-full flex flex-row items-center">
							<div className="flex flex-row gap-[22px]">
								<ChevronBackward className="w-[15px] h-[15px]" color={"#999"}></ChevronBackward>
								<ChevronForward className="w-[15px] h-[15px]" color={"#999"}></ChevronForward>
							</div>
							<div id="nav-title" className="font-semibold text-xl">
								{tab && tab === "About" && "About"}
								{tab && tab === "Aria2Helper" && "Aria2Helper Settings"}
								{tab && tab === "Others" && "Others"}
								{tab && tab === "RPC" && "RPC Settings"}
							</div>
						</div>
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
