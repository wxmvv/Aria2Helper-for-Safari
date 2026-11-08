import { useState } from "react";

import { ThemeSwitch, ThemeSelector } from "../components/ThemeSwitch";
import { useThemeHook } from "../useThemeHook";

import { ListGroup } from "../components/ListGroup";
import { ListItem } from "../components/ListItem";
import { ListGroupTitle } from "../components/ListGroupTitle";

import { t } from "../utils/i18n";

export function OtherSettings({ helper }) {
	const { baseTheme, setBaseTheme, lightDaisyTheme, darkDaisyTheme, setLightTheme, setDarkTheme, daisyThemes } = useThemeHook();
	const [liquidGlass, setLiquidGlass] = useState(helper.getSettings().appearance.liquidGlass !== false);
	const [showBackground, setShowBackground] = useState(helper.getSettings().appearance.showBackground !== false);

	const toggleGlass = (enabled) => {
		setLiquidGlass(enabled);
		helper.updateSettings({ appearance: { liquidGlass: enabled } });
		document.documentElement.classList.toggle("glass", enabled);
	};

	const toggleBackground = (enabled) => {
		setShowBackground(enabled);
		helper.updateSettings({ appearance: { showBackground: enabled } });
	};

	return (
		<>
			<ListGroupTitle title={t("appearance")} />
			<ListGroup>
				<ListItem>
					<div>
						<div>{t("liquid_glass")}</div>
						<div className="label whitespace-break-spaces">{t("liquid_glass_hint")}</div>
					</div>
					<input
						type="checkbox"
						checked={liquidGlass}
						onChange={(event) => toggleGlass(event.target.checked)}
						className="toggle checked:bg-primary checked:border-primary checked:text-white"
					/>
				</ListItem>
				<ListItem>
					<div>
						<div>{t("show_background")}</div>
						<div className="label whitespace-break-spaces">{t("show_background_hint")}</div>
					</div>
					<input
						type="checkbox"
						checked={showBackground}
						onChange={(event) => toggleBackground(event.target.checked)}
						className="toggle checked:bg-primary checked:border-primary checked:text-white"
					/>
				</ListItem>
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
