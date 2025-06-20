// browser.i18n.getMessage

export function t(messageName) {
	if (typeof browser !== "undefined" && browser && browser.i18n && browser.i18n.getMessage) return browser.i18n.getMessage(messageName);
	else return messageName;
}
