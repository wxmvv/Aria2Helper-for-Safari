import { useState } from "react";

import { ThemeSwitch, ThemeSelector } from "../components/ThemeSwitch";
import { useThemeHook } from "../useThemeHook";

import { ListGroup } from "../components/ListGroup";
import { ListItem } from "../components/ListItem";
import { ListGroupTitle } from "../components/ListGroupTitle";

import { t } from "../utils/i18n";

export function OtherSettings({ helper }) {
	const { baseTheme, setBaseTheme, lightDaisyTheme, darkDaisyTheme, setLightTheme, setDarkTheme, daisyThemes } = useThemeHook();
	const [liquidGlass, setLiquidGlass] = useState(helper.getSettings().appearance.liquidGlass === true);
	const [showBackground, setShowBackground] = useState(helper.getSettings().appearance.showBackground === true);

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
			<section aria-label={t("appearance")}>
				<ListGroupTitle title={t("appearance")} />
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
			</section>
			<section aria-label={t("experimental_features")} className="mt-6">
				<ListGroupTitle title={t("experimental_features")} />
				<ListGroup>
					<ListItem className="gap-4">
						<div className="min-w-0 flex-1">
							<div id="liquid-glass-label">{t("liquid_glass")}</div>
							<div id="liquid-glass-hint" className="label whitespace-break-spaces">{t("liquid_glass_hint")}</div>
						</div>
						<input
							type="checkbox"
							aria-labelledby="liquid-glass-label"
							aria-describedby="liquid-glass-hint"
							checked={liquidGlass}
							onChange={(event) => toggleGlass(event.target.checked)}
							className="toggle checked:bg-primary checked:border-primary checked:text-white"
						/>
					</ListItem>
					<ListItem className="gap-4">
						<div className="min-w-0 flex-1">
							<div id="glass-background-label">{t("show_background")}</div>
							<div id="glass-background-hint" className="label whitespace-break-spaces">{t("show_background_hint")}</div>
						</div>
						<input
							type="checkbox"
							aria-labelledby="glass-background-label"
							aria-describedby="glass-background-hint"
							disabled={!liquidGlass}
							checked={showBackground}
							onChange={(event) => toggleBackground(event.target.checked)}
							className="toggle checked:bg-primary checked:border-primary checked:text-white"
						/>
					</ListItem>
				</ListGroup>
			</section>
		</>
	);
}
