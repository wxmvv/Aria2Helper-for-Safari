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
		if (savedConfig) {
			try {
				const { light, dark } = JSON.parse(savedConfig);
				if (DAISYUI_THEMES.includes(light)) setLightTheme(light);
				if (DAISYUI_THEMES.includes(dark)) setDarkTheme(dark);
				// console.log(`Loaded theme config from localStorage: ${savedConfig}`);
			} catch (e) {
				console.error("Failed to parse theme config", e);
			}
		}
	}, []);

	const setLightTheme = (newTheme) => {
		if (!DAISYUI_THEMES.includes(newTheme)) return;
		setLightDaisyTheme(newTheme);
	};

	const setDarkTheme = (newTheme) => {
		if (!DAISYUI_THEMES.includes(newTheme)) return;
		setDarkDaisyTheme(newTheme);
	};

	const setBaseTheme = (newTheme) => {
		setTheme(newTheme);
	};

	const applyDaisyTheme = () => {
		if (!mounted) return;
		const targetTheme = resolvedTheme === "dark" ? darkDaisyTheme : lightDaisyTheme;
		document.documentElement.setAttribute("data-theme", targetTheme);
		document.documentElement.classList.toggle("dark", resolvedTheme === "dark");
		localStorage.setItem("daisyui-theme-config", JSON.stringify({ light: lightDaisyTheme, dark: darkDaisyTheme }));
	};

	useEffect(() => {
		applyDaisyTheme();
	}, [lightDaisyTheme, darkDaisyTheme, resolvedTheme, mounted]); // 添加 resolvedTheme

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
