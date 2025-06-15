import { ThemeSwitch, ThemeSelector } from "../components/ThemeSwitch";
import { useThemeHook } from "../useThemeHook";

import { ListGroup } from "../components/ListGroup";
import { ListItem } from "../components/ListItem";
import { ListGroupTitle } from "../components/ListGroupTitle";

export function OtherSettings({ helper, className }) {
	const { baseTheme, setBaseTheme, lightDaisyTheme, darkDaisyTheme, setLightTheme, setDarkTheme, daisyThemes, mounted } = useThemeHook();

	return (
		<>
			<ListGroupTitle title="Setting View Theme" />
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
