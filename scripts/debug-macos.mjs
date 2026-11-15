import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
function run(command, args) {
	const result = spawnSync(command, args, { cwd: root, stdio: "inherit" });
	if (result.error) console.error(result.error.message);
	if (result.status !== 0) process.exit(result.status || 1);
}

run("npm", ["run", "build:debug"]);
run("xcodebuild", [
	"-project", "Aira2Helper.xcodeproj", "-scheme", "Aira2Helper (macOS)",
	"-configuration", "Debug", "-destination", "platform=macOS",
	"-derivedDataPath", "build/debug", "CODE_SIGN_IDENTITY=-",
	"CODE_SIGNING_ALLOWED=YES", "CODE_SIGNING_REQUIRED=NO", "CODE_SIGN_STYLE=Manual", "build",
]);
console.log("\nDebug app: build/debug/Build/Products/Debug/Aira2Helper.app");
console.log("Open with: open build/debug/Build/Products/Debug/Aira2Helper.app");
