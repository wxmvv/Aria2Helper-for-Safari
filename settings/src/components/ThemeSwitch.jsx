import { t } from "../utils/i18n";
const Sun = () => (
	<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="group:hover:text-gray-100 h-6 w-6">
		<path
			fillRule="evenodd"
			d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"
			clipRule="evenodd"
		/>
	</svg>
);
const Moon = () => (
	<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="group:hover:text-gray-100 h-6 w-6">
		<path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
	</svg>
);
const Monitor = () => (
	<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group:hover:text-gray-100 h-6 w-6">
		<rect x="3" y="3" width="14" height="10" rx="2" ry="2"></rect>
		<line x1="7" y1="17" x2="13" y2="17"></line>
		<line x1="10" y1="13" x2="10" y2="17"></line>
	</svg>
);
const Blank = () => <svg className="h-6 w-6" />;

export const ThemeSwitch = ({ baseTheme, setBaseTheme, title = "Base Theme" }) => {
	return (
		<>
			<div className="flex flex-row items-center justify-between w-full">
				<div>{title}</div>
				<div className="tabs-box flex flex-row items-center justify-center gap-2 w-fit h-fit">
					<div onClick={() => setBaseTheme("light")} className={`tab ${baseTheme === "light" ? "tab-active" : ""}`}>
						{t("light")}
					</div>
					<div onClick={() => setBaseTheme("dark")} className={`tab ${baseTheme === "dark" ? "tab-active" : ""}`}>
						{t("dark")}
					</div>
					<div onClick={() => setBaseTheme("system")} className={`tab ${baseTheme === "system" ? "tab-active" : ""}`}>
						{t("system")}
					</div>
				</div>
			</div>
		</>
	);
};

export const ThemeSelector = ({ title, theme, setTheme, themes }) => {
	return (
		<>
			<div className="flex flex-row items-center justify-between w-full">
				<div>{title}</div>
				<select value={theme} onChange={(e) => setTheme(e.target.value)} className="select w-fit h-fit">
					{themes.map((theme) => (
						<option key={theme} value={theme}>
							{theme}
						</option>
					))}
				</select>
			</div>
		</>
	);
};
