import { ThemeSwitch, ThemeSelector } from "../components/ThemeSwitch";
import { ListGroup } from "../components/ListGroup";
import { ListItem } from "../components/ListItem";
import { useThemeHook } from "../useThemeHook";

export function OtherSettings({ helper, className, onClick }) {
	const { baseTheme, setBaseTheme, lightDaisyTheme, darkDaisyTheme, setLightTheme, setDarkTheme, daisyThemes, mounted } = useThemeHook();

	return (
		<>
			<ListGroup>
				<ListItem>
					<ThemeSwitch baseTheme={baseTheme} setBaseTheme={setBaseTheme} />
				</ListItem>
				<ListItem>
					<ThemeSelector title="LightThemeSelector" theme={lightDaisyTheme} setTheme={setLightTheme} themes={daisyThemes} />
				</ListItem>
				<ListItem>
					<ThemeSelector title="DarkThemeSelector" theme={darkDaisyTheme} setTheme={setDarkTheme} themes={daisyThemes} />
				</ListItem>
			</ListGroup>
		</>
	);
}
