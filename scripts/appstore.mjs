import fs from "node:fs";
import path from "node:path";
import { spawnSync, execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import assert from "node:assert/strict";

const root = fileURLToPath(new URL("../", import.meta.url));
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const json = (file) => JSON.parse(read(file));
function plist(file) {
	return JSON.parse(execFileSync("plutil", ["-convert", "json", "-o", "-", path.resolve(root, file)], { encoding: "utf8" }));
}
function run(command, args) {
	const result = spawnSync(command, args, { cwd: root, stdio: "inherit" });
	if (result.error) throw result.error;
	if (result.status !== 0) process.exit(result.status || 1);
}

function check() {
	const version = json("package.json").version;
	assert.equal(json("settings/package.json").version, version, "settings version differs");
	assert.equal(json("Shared (Extension)/Resources/manifest.json").version, version, "extension version differs");
	const project = read("Aira2Helper.xcodeproj/project.pbxproj");
	const nativeVersions = [...project.matchAll(/MARKETING_VERSION = ([0-9.]+);/g)].map((m) => m[1]);
	assert.equal(nativeVersions.length, 8, "expected Debug/Release versions on all four native targets");
	assert.ok(nativeVersions.every((v) => v === version), "native version differs");
	const builds = [...project.matchAll(/CURRENT_PROJECT_VERSION = (\d+);/g)].map((m) => m[1]);
	assert.equal(builds.length, 8);
	assert.ok(builds.every((v) => v === builds[0]), "native build numbers differ");
	assert.equal((project.match(/INFOPLIST_KEY_ITSAppUsesNonExemptEncryption = NO;/g) || []).length, 8);
	for (const target of ["macOS (App)", "macOS (Extension)", "iOS (App)", "iOS (Extension)"]) {
		const privacy = plist(`${target}/PrivacyInfo.xcprivacy`);
		assert.equal(privacy.NSPrivacyTracking, false);
		assert.deepEqual(privacy.NSPrivacyTrackingDomains, []);
		assert.deepEqual(privacy.NSPrivacyCollectedDataTypes, []);
		assert.deepEqual(privacy.NSPrivacyAccessedAPITypes, []);
	}
	const resources = "Shared (Extension)/Resources";
	for (const file of ["settings.js", "settings.css", "settings.html"]) {
		assert.ok(!/sourceMappingURL=|\/__dev\/|\/@vite\/client|localhost:5173|127\.0\.0\.1:5173/.test(read(`${resources}/${file}`)), `${file} contains debug resources`);
		assert.ok(!fs.existsSync(path.join(root, resources, `${file}.map`)), `${file}.map must not ship`);
	}
	assert.ok(read(`${resources}/settings.js`).length < 500000, "settings bundle appears unminified; run build:settings");
	const html = read(`${resources}/settings.html`);
	for (const match of html.matchAll(/(?:src|href)="([^"]+)"/g)) {
		const url = match[1];
		assert.ok(!/^(?:[a-z]+:|\/\/|\/)/i.test(url), `settings resource is not relative: ${url}`);
		assert.ok(fs.existsSync(path.join(root, resources, url)), `missing bundled resource: ${url}`);
	}
	const exportOptions = plist("release/ExportOptions.plist");
	assert.equal(exportOptions.method, "app-store-connect");
	assert.equal(exportOptions.destination, "export", "preparation must not upload automatically");
	assert.equal(exportOptions.manageAppVersionAndBuildNumber, false);
	for (const locale of ["en-US", "zh-Hans"]) {
		const metadata = json(`release/metadata/${locale}.json`);
		for (const [field, limit] of Object.entries({ name: 30, subtitle: 30, promotionalText: 170, description: 4000, whatsNew: 4000 })) {
			assert.ok(metadata[field]?.length && [...metadata[field]].length <= limit, `${locale}/${field} exceeds ${limit} characters or is empty`);
		}
		assert.ok(Buffer.byteLength(metadata.keywords, "utf8") <= 100, `${locale}/keywords exceeds 100 UTF-8 bytes`);
		for (const field of ["supportURL", "marketingURL", "privacyPolicyURL"]) assert.equal(new URL(metadata[field]).protocol, "https:");
	}
	console.log(`App Store source checks passed: ${version} (${builds[0]})`);
	return { version, build: builds[0] };
}

try {
	const [action = "check", platform, ...options] = process.argv.slice(2);
	assert.ok(["check", "archive", "export", "verify"].includes(action), "Use check, archive ios|macos, export ios|macos, or verify ios|macos");
	assert.ok(options.every((option) => option === "--allow-provisioning-updates" && action === "export"), "Unknown option");
	if (action !== "check") assert.ok(["ios", "macos"].includes(platform), "Choose ios or macos");
	if (action === "archive") {
		run("npm", ["run", "build:settings"]);
	}
	const { version, build } = check();
	if (action !== "check") {
		const platformName = platform === "ios" ? "iOS" : "macOS";
		const output = path.join(root, "build/appstore", `${version}-${build}`);
		const archive = path.join(output, `Aira2Helper-${platformName}.xcarchive`);
		if (action === "archive") {
			run("xcodebuild", ["-project", "Aira2Helper.xcodeproj", "-scheme", `Aira2Helper (${platformName})`,
				"-configuration", "Release", "-destination", `generic/platform=${platformName}`,
				"-derivedDataPath", path.join(root, "build/appstore", `derived-${platform}`),
				"-archivePath", archive, "archive"]);
			// Clean copied release products only; source files retain their attributes.
			run("python3", ["scripts/verify-store-export.py", "--remove-quarantine", archive]);
			console.log(`Archive: ${archive}`);
		} else if (action === "export") {
			assert.ok(fs.existsSync(archive), `Archive missing: ${archive}`);
			run("python3", ["scripts/verify-store-export.py", "--remove-quarantine", archive]);
			run("codesign", ["--verify", "--deep", "--strict", path.join(archive, "Products/Applications/Aira2Helper.app")]);
			run("xcodebuild", ["-exportArchive", "-archivePath", archive, "-exportOptionsPlist", path.join(root, "release/ExportOptions.plist"), "-exportPath", path.join(output, `export-${platform}`), ...(options.includes("--allow-provisioning-updates") ? ["-allowProvisioningUpdates"] : [])]);
			run("python3", ["scripts/verify-store-export.py", platform]);
		} else {
			run("python3", ["scripts/verify-store-export.py", "--check-quarantine", archive]);
			const app = path.join(archive, "Products/Applications/Aira2Helper.app");
			const mac = platform === "macos";
			const contents = mac ? path.join(app, "Contents") : app;
			const extension = path.join(contents, "PlugIns/Aira2Helper Extension.appex");
			const extContents = mac ? path.join(extension, "Contents") : extension;
			const resources = mac ? path.join(extContents, "Resources") : extContents;
			for (const bundle of [contents, extContents]) {
				const info = plist(path.join(bundle, "Info.plist"));
				assert.equal(info.CFBundleShortVersionString, version);
				assert.equal(info.CFBundleVersion, build);
				assert.equal(info.ITSAppUsesNonExemptEncryption, false, "export compliance must be a plist Boolean");
				assert.equal(plist(path.join(bundle, mac ? "Resources/PrivacyInfo.xcprivacy" : "PrivacyInfo.xcprivacy")).NSPrivacyTracking, false);
				const executable = path.join(bundle, mac ? "MacOS" : "", info.CFBundleExecutable);
				const archs = execFileSync("lipo", ["-archs", executable], { encoding: "utf8" }).trim().split(/\s+/);
				assert.ok(archs.includes("arm64"));
				if (mac) assert.ok(archs.includes("x86_64"), "Mac archive must include Intel support");
			}
			const extManifest = JSON.parse(fs.readFileSync(path.join(resources, "manifest.json"), "utf8"));
			assert.equal(extManifest.version, version);
			for (const file of ["settings.js", "settings.css", "settings.html", "background.js", "popup.js", "content.js", "common/constants.js", "common/storage.js", "common/rpc.js"]) {
				assert.ok(fs.readFileSync(path.join(resources, file)).equals(fs.readFileSync(path.join(root, "Shared (Extension)/Resources", file))), `Archive contains stale ${file}`);
			}
			run("codesign", ["--verify", "--deep", "--strict", "--verbose=2", app]);
			// The archive plist also contains Date values, which plutil cannot
			// convert to JSON; extract only the properties needed for the report.
			const properties = JSON.parse(execFileSync("plutil", ["-extract", "ApplicationProperties", "json", "-o", "-", path.join(archive, "Info.plist")], { encoding: "utf8" }));
			const exportDir = path.join(output, `export-${platform}`);
			const artifacts = fs.existsSync(exportDir) ? fs.readdirSync(exportDir).filter((file) => /\.(ipa|pkg)$/.test(file)) : [];
			const report = { platform, version, build, archive, sourceCommit: execFileSync("git", ["rev-parse", "HEAD"], { cwd: root, encoding: "utf8" }).trim(), sourceHasUncommittedChanges: Boolean(execFileSync("git", ["status", "--porcelain"], { cwd: root, encoding: "utf8" }).trim()), signingIdentity: properties.SigningIdentity, archiveVerified: true, appStoreExportArtifacts: artifacts };
			fs.writeFileSync(path.join(output, `validation-${platform}.json`), JSON.stringify(report, null, 2) + "\n");
			console.log(`Archive verified: ${archive}. Distribution export is a separate step.`);
		}
	}
} catch (error) {
	console.error(`[appstore] ${error.message}`);
	process.exitCode = 1;
}
