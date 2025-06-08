import { ThemeProvider, useTheme } from "next-themes";
import { useEffect } from "react";

export function ThemeProviders({ children, ...props }) {
	return (
		<ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange {...props}>
			<ThemeInitializer />
			{children}
		</ThemeProvider>
	);
}

// 初始化组件
function ThemeInitializer() {
	const { theme, resolvedTheme } = useTheme();

	useEffect(() => {
		const savedConfig = localStorage.getItem("daisyui-theme-config");
		if (savedConfig) {
			try {
				const { light, dark } = JSON.parse(savedConfig);
				const currentTheme = theme === "system" ? (resolvedTheme === "dark" ? dark : light) : theme === "dark" ? dark : light;

				document.documentElement.setAttribute("data-theme", currentTheme);
			} catch (e) {
				console.error("Failed to parse theme config", e);
			}
		}
	}, [theme, resolvedTheme]);

	return null;
}
