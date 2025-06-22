import Aria2HelperTab from "./tabs/Aria2HelperSettings";

import bgimg from "./assets/70_1750.png";
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

import { useState, useEffect, useRef } from "react";

function App({ helper }) {
	const [tab, setTab] = useState("Aria2Helper");
	const [RPCTab, setRPCTab] = useState(helper.getCurrentProfileId());
	const [RPCs, setRPCs] = useState(helper.getProfiles());
	const [showSidebar, setShowSidebar] = useState(true);
	const [isShowAlert, setIsShowAlert] = useState(false);
	const [alertType, setAlertType] = useState("alert-success");
	const [alertTitle, setAlertTitle] = useState("成功！");
	const alertRef = useRef(null);

	const showAlert = (title, alertType) => {
		if (!title) {
			title = "DONE!";
		}
		if (!alertType) {
			alertType = "alert-success";
		}
		setAlertType(alertType);
		setAlertTitle(title);
		setIsShowAlert(true);
		// 我需要独立的timeout
		if (alertRef.current) {
			clearTimeout(alertRef.current);
		}
		alertRef.current = setTimeout(() => {
			setIsShowAlert(false);
		}, 3000);
	};

	const addRPC = () => {
		console.log("addRPC");
		helper.addNewProfile();
		setRPCs(helper.getProfiles());
		setRPCTab(helper.getCurrentProfileId());
		showAlert(t("add_success"), "alert-success");
	};
	const removeRPC = () => {
		console.log("removeRPC");
		helper.removeProfileById(RPCTab);
		setRPCs(helper.getProfiles());
		setRPCTab(helper.getCurrentProfileId());
		showAlert(t("delete_success"), "alert-success");
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
			document.documentElement.style.setProperty("--sidebar-icon-backdrop-blur", "0px");
			setShowSidebar(true);
		} else {
			document.documentElement.style.setProperty("--sidebar-width", "0px");
			document.documentElement.style.setProperty("--sidebar-opacity", "0");
			document.documentElement.style.setProperty("--sidebar-icon-backdrop-blur", "10px");
			setShowSidebar(false);
		}
	};

	return (
		<div id="main" className="text flex flex-col justify-start md:justify-center items-center w-full min-h-lvh relative">
			{/* <img src={bgimg} alt="" srcSet="" className="absolute top-0 left-0 w-full h-full object-cover -z-1 " /> */}
			<div alt="" srcSet="" className="absolute top-0 left-0 w-full h-full object-cover -z-1 bg-primary/15" />
			<div role="alert" className={`z-[999] fixed top-[20px] alert ${alertType} transition-all ${isShowAlert ? "opacity-100 h-[50px]" : "opacity-0 h-0"}`}>
				<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 shrink-0 stroke-current" fill="none" viewBox="0 0 24 24">
					<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
				</svg>
				<span>{alertTitle}</span>
			</div>
			<div className="relative flex flex-row w-[100%] md:w-[90%] max-w-[715px] h-[calc(100lvh-80px)] md:h-[700px] rounded-xl overflow-hidden border border-gray-300/50 shadow-md shadow-primary/15 ">
				<div id="nav" className="flex flex-row z-[99] absolute top-0 left-0 w-full h-[var(--navbar-height)] bg-transparent ">
					<TrafficLight id="nav-traffic-light" className="transition-all opacity-0 md:opacity-[var(--sidebar-opacity)] absolute top-[20px] left-[20px]" />

					<div className="transition-all w-[var(--sidebar-width)] min-w-[60px] pr-2 h-full flex flex-row items-center justify-end backdrop-blur-[var(--sidebar-icon-backdrop-blur)]">
						<button id="nav-sidebar-toggle" onClick={handleToggleClick} className="z-40 w-[32px] h-[32px] p-[5px] active:bg-gray-500/20 rounded-lg">
							<SidebarLeft className=" w-[22px] h-[22px] fill-black dark:fill-white"></SidebarLeft>
						</button>
					</div>

					<div className="transition-all content-nav px-[20px] py-[16px] gap-[16px] h-full flex flex-row items-center backdrop-blur-md grow">
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

				{/* 遮罩层 点击后自动隐藏sidebar */}
				{showSidebar && <div id="sidebar-backdrop" className={`block md:hidden  w-full transition-all opacity-50 absolute top-0 left-0  h-full z-10 bg-black backdrop-blur-md`} onClick={handleToggleClick}></div>}

				<div
					id="sidebar"
					className="transition-all opacity-[var(--sidebar-opacity)] absolute left-0 top-0 h-full z-10 border-r-0 border-r-amber-50/20 md:relative flex flex-col w-[var(--sidebar-width)] bg-base-100/[0.65] backdrop-blur-md"
				>
					<div id="sidebar-header" className=" relative h-[var(--navbar-height)] min-h-[var(--navbar-height)] w-full ">
						{/* <TrafficLight className="absolute top-[20px] left-[20px]" />
						<button onClick={() => setShowSidebar(!showSidebar)} className="absolute top-[12px] right-[20px] w-[32px] h-[32px] p-[5px] active:bg-gray-500/20 rounded-lg">
							<SidebarLeft className=" w-[22px] h-[22px] fill-black dark:fill-white"></SidebarLeft>
						</button> */}
					</div>
					<div id="sidebar-content" className="mb-[var(--profile-gap-height)] flex flex-col py-[10px] px-[10px] gap-[2px] font-semibold">
						<SidebarProfile className="mb-[var(--profile-gap-height)]" iconSrc={aria2helperIcon} selected={tab === "About"} title={t("extension_name")} subTitle={"v1.4.0"} onClick={() => setTab("About")} />
						<SidebarItem iconSrc={aria2helperIcon} selected={tab === "Aria2Helper"} title={t("helper_settings")} onClick={() => setTab("Aria2Helper")} />
						<SidebarItem iconSrc={aria2Icon} selected={tab === "Others"} title={t("other_settings")} onClick={() => setTab("Others")} />
					</div>
					<div id="section-title" className="flex flex-row items-center px-[10px] pt-[10px] justify-between gap-[10px] text-l font-bold text-gray-600">
						<div className="">{t("aria2_settings")}</div>
						{/* 添加 删除rpc按钮 */}
						{/* <div className="flex flex-row gap-[10px]">
							<button className="text-primary" onClick={addRPC}>
								+
							</button>
							<button disabled={!RPCTab || tab !== "RPC"} className={`${!RPCTab || tab !== "RPC" ? "" : "text-primary"}`} onClick={removeRPC}>
								-
							</button>
						</div> */}
					</div>
					<div id="sidebar-content" className="flex flex-col px-[10px] gap-[2px] font-semibold  overflow-scroll grow">
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
					<div className="flex flex-row gap-[10px] p-[10px]">
						<button className="btn btn-primary grow" onClick={addRPC}>
							添加
						</button>
						<button className="btn btn-error grow" disabled={!RPCTab || tab !== "RPC"} onClick={removeRPC}>
							删除
						</button>
					</div>
				</div>

				<div id="content" className="shadow-gray-500/50 shadow relative flex flex-col flex-1 grow bg-base-100/[0.8] ">
					<div id="content-header" className="absolute left-0 top-0 h-[var(--navbar-height)] w-full px-20px bg-transparent  z-[50]">
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
