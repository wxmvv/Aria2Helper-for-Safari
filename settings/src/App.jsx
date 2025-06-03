// import "./App.css";

import Aria2Tab from "./tabs/Aria2Settings";
import Aria2HelperTab from "./tabs/Aria2HelperSettings";

import bgimg from "./assets/Ghostty Config - Application.webp";
import aria2helperIcon from "./assets/tabIcon/o.png";
import aria2Icon from "./assets/tabIcon/Application Settings.webp";

import { ChevronBackward } from "./icon/chevron_backward";
import { ChevronForward } from "./icon/chevron_forward";
import { SidebarItem, SidebarProfile } from "./components/SidebarItem";
import { TrafficLight } from "./components/TrafficLight";

import { useState } from "react";

function App() {
	const [tab, setTab] = useState("Aria2Helper");
	const [RPCTab, setRPCTab] = useState("");
	const addRPC = () => {
		console.log("addRPC");
		setRPCs([...RPCs, { name: "RPC3", url: "http://localhost:6800/jsonrpc" }]);
	};
	const removeRPC = () => {
		console.log("removeRPC");
		setRPCs(RPCs.filter((item) => item.name !== RPCTab));
	};
	const selectRPCTab = (rpcName) => {
		setTab("RPC");
		setRPCTab(rpcName);
	};
	const [RPCs, setRPCs] = useState([
		{ name: "RPC1", url: "http://localhost:6800/jsonrpc" },
		{ name: "RPC2", url: "http://localhost:6800/jsonrpc" },
	]);

	return (
		<div id="main" className="flex flex-row justify-center items-center w-full min-h-lvh relative">
			<div className="flex flex-row w-[90%] max-w-[715px] h-[700px] rounded-xl  overflow-hidden border border-b-accent ">
				<img src={bgimg} alt="" srcSet="" className="absolute top-0 left-0 w-full h-full object-cover -z-1 " />
				<div id="sidebar" className="flex flex-col w-[var(--sidebar-width)] bg-base-100/[0.65] backdrop-blur-md">
					<div id="sidebar-header" className="relative h-[var(--navbar-height)] w-full">
						<TrafficLight className="absolute top-[20px] left-[20px]" />
					</div>
					<div id="sidebar-content" className="flex flex-col py-[10px] px-[10px] gap-[2px] font-semibold">
						<SidebarProfile iconSrc={aria2helperIcon} selected={tab === "About"} title={"Aria2Helper"} subTitle={"v1.3.1"} onClick={() => setTab("About")} />
						<div id="profile-gap" className="w-full h-[var(--profile-gap-height)] bg-transparent"></div>
						<SidebarItem iconSrc={aria2helperIcon} selected={tab === "Aria2Helper"} title={"Aria2Helper"} onClick={() => setTab("Aria2Helper")} />
						<SidebarItem iconSrc={aria2Icon} selected={tab === "Aria2"} title={"Aria2"} onClick={() => setTab("Aria2")} />
						<SidebarItem iconSrc={aria2Icon} selected={tab === "Others"} title={"Others"} onClick={() => setTab("Others")} />
					</div>
					<div id="profile-gap" className="w-full h-[var(--profile-gap-height)] bg-transparent"></div>

					<div id="sidebar-content" className="flex flex-col pt-[10px] px-[10px] gap-[2px] font-semibold">
						<div className="flex flex-row items-center justify-between gap-[10px] text-l font-bold text-gray-600">
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
						<div className="flex flex-col gap-[2px] h-[432px] overflow-scroll pb-[10px]">
							{RPCs.map((rpc, index) => {
								return <SidebarItem key={index} iconSrc={aria2helperIcon} selected={tab === "RPC" && RPCTab === rpc.name} title={rpc.name} onClick={() => selectRPCTab(rpc.name)} />;
							})}
						</div>
					</div>
				</div>
				<div id="content" className=" shadow-gray-400 border-l border-gray-400 shadow relative flex flex-col flex-1 grow bg-base-100/[0.8] backdrop-blur-md">
					<div id="content-header" className="absolute left-0 top-0 h-[var(--navbar-height)] w-full px-20px">
						<div className="content-nav px-[20px] py-[16px] gap-[16px] w-full h-full flex flex-row items-center">
							<div className="flex flex-row gap-[22px]">
								<ChevronBackward className="w-[15px] h-[15px]" color={"#999"}></ChevronBackward>
								<ChevronForward className="w-[15px] h-[15px]" color={"#999"}></ChevronForward>
							</div>
							<div id="nav-title" className="font-semibold text-xl">
								{tab && tab === "Aria2" && "Aria2 Settings"}
								{tab && tab === "Aria2Helper" && "Aria2Helper Settings"}
							</div>
						</div>
					</div>
					<div className="safe-area h-[var(--safe-area-top)] bg-transparent w-full"></div>
					<div className="w-full h-full p-[20px]">
						{tab && tab === "Aria2" && <Aria2Tab className="p-[20px]" />}
						{tab && tab === "Aria2Helper" && <Aria2HelperTab className="p-[20px]" />}
						{tab && tab === "RPC" && RPCTab && <RPCTab RPC="RPCTab" />}
					</div>
				</div>
			</div>
		</div>
	);
}

export default App;
