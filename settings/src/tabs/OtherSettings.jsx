import { ThemeSwitch, ThemeSelector } from "../components/ThemeSwitch";
import { useThemeHook } from "../useThemeHook";

import { ListGroup } from "../components/ListGroup";
import { ListItem } from "../components/ListItem";
import { ListGroupTitle } from "../components/ListGroupTitle";

import { t } from "../utils/i18n";

export function OtherSettings({ helper, className }) {
	const { baseTheme, setBaseTheme, lightDaisyTheme, darkDaisyTheme, setLightTheme, setDarkTheme, daisyThemes, mounted } = useThemeHook();

	return (
		<>
			<ListGroupTitle title={t("setting_view_theme")} />
			<ListGroup>
				<ListItem>
					<ThemeSwitch title={t("base_theme")} baseTheme={baseTheme} setBaseTheme={setBaseTheme} />
				</ListItem>
				<ListItem>
					<ThemeSelector title={t("light_theme")} theme={lightDaisyTheme} setTheme={setLightTheme} themes={daisyThemes} />
				</ListItem>
				<ListItem>
					<ThemeSelector title={t("dark_theme")} theme={darkDaisyTheme} setTheme={setDarkTheme} themes={daisyThemes} />
				</ListItem>
			</ListGroup>
		</>
	);
}
