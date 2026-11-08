import core from "../lib/core.js";

/** Localised string via the shared i18n wrapper; falls back to the key in dev. */
export function t(messageName) {
	return core.i18n.t(messageName);
}
