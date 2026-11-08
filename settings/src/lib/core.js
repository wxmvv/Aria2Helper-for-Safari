/**
 * Single access point for the shared extension core (common/*.js).
 * The scripts are loaded by settings.html before this module.
 */
const core = globalThis.Aria2Helper;

if (!core || !core.storage || !core.rpc) {
	throw new Error("Aria2Helper core scripts are missing; check settings.html script order");
}

export default core;
export const { constants, util, files, filters, storage, rpc, i18n, messaging } = core;
