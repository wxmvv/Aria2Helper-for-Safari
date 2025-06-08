import { useTheme } from "next-themes";
import { useEffect, useState, useRef } from "react";

const DAISYUI_THEMES = [
	"light",
	"dark",
	"cupcake",
	"bumblebee",
	"emerald",
	"corporate",
	"synthwave",
	"retro",
	"cyberpunk",
	"valentine",
	"halloween",
	"garden",
	"forest",
	"aqua",
	"lofi",
	"pastel",
	"fantasy",
	"wireframe",
	"black",
	"luxury",
	"dracula",
	"cmyk",
	"autumn",
	"business",
	"acid",
	"lemonade",
	"night",
	"coffee",
	"winter",
	"dim",
	"nord",
	"sunset",
	"caramellatte",
	"abyss",
	"silk",
];

export function useThemeHook() {
	const { theme, setTheme, resolvedTheme, systemTheme } = useTheme();
	const [mounted, setMounted] = useState(false);

	const [lightDaisyTheme, setLightDaisyTheme] = useState("light");
	const [darkDaisyTheme, setDarkDaisyTheme] = useState("dark");

	useEffect(() => {
		setMounted(true);
		const savedConfig = localStorage.getItem("daisyui-theme-config");
		console.log("init theme config from local storage", savedConfig);
		if (savedConfig) {
			try {
				const { light, dark } = JSON.parse(savedConfig);
				if (DAISYUI_THEMES.includes(light)) setLightTheme(light);
				if (DAISYUI_THEMES.includes(dark)) setDarkTheme(dark);
			} catch (e) {
				console.error("Failed to parse theme config", e);
			}
		}
	}, []);

	const setLightTheme = (newTheme) => {
		setLightDaisyTheme(newTheme);
	};
	const setDarkTheme = (newTheme) => {
		setDarkDaisyTheme(newTheme);
	};
	const setBaseTheme = (newTheme) => {
		setTheme(newTheme);
		if (newTheme === "system") {
			if (systemTheme === "dark") document.documentElement.setAttribute("data-theme", darkDaisyTheme);
			else document.documentElement.setAttribute("data-theme", lightDaisyTheme);
		} else if (newTheme === "dark") {
			document.documentElement.setAttribute("data-theme", darkDaisyTheme);
		} else if (newTheme === "light") {
			document.documentElement.setAttribute("data-theme", lightDaisyTheme);
		} else {
			console.log(`Invalid theme: ${theme}. Please use one of the following: ${DAISYUI_THEMES.join(", ")}`);
		}
	};

	useEffect(() => {
		if (!mounted) return;

		if (theme === "system") {
			if (systemTheme === "dark") document.documentElement.setAttribute("data-theme", darkDaisyTheme);
			else document.documentElement.setAttribute("data-theme", lightDaisyTheme);
		} else if (theme === "dark") {
			document.documentElement.setAttribute("data-theme", darkDaisyTheme);
		} else if (theme === "light") {
			document.documentElement.setAttribute("data-theme", lightDaisyTheme);
		} else {
			console.log(`Invalid theme: ${theme}. Please use one of the following: ${DAISYUI_THEMES.join(", ")}`);
		}
		localStorage.setItem(
			"daisyui-theme-config",
			JSON.stringify({
				light: lightDaisyTheme,
				dark: darkDaisyTheme,
			})
		);
	}, [lightDaisyTheme, darkDaisyTheme, mounted]);

	return {
		setBaseTheme, // 设置基础模式
		baseTheme: theme, // 当前基础模式 (light/dark/system)
		currentDisplayTheme: resolvedTheme, // 当前实际显示的主题
		daisyThemes: DAISYUI_THEMES,
		lightDaisyTheme,
		darkDaisyTheme,
		setLightTheme,
		setDarkTheme,
		mounted,
	};
}
