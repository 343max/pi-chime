import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { spawn } from "node:child_process";

let enabled = true;

/** Resolve the sound file relative to this extension's location in the package. */
const SOUND_PATH = new URL("../agent_done.wav", import.meta.url).pathname;

function playChime(): void {
	if (!enabled) return;

	// macOS — afplay is built-in and streams the file without blocking
	const proc = spawn("afplay", [SOUND_PATH], {
		detached: true,
		stdio: "ignore",
	});

	proc.on("error", () => {
		// Silent fail — audio not available or file missing
	});

	proc.unref();
}

export default function (pi: ExtensionAPI) {
	pi.on("agent_end", async () => {
		playChime();
	});

	pi.registerCommand("chime", {
		description: "Toggle the agent-done chime on or off",
		handler: async (args, ctx) => {
			const arg = args.trim().toLowerCase();

			if (arg === "on") {
				enabled = true;
				ctx.ui.notify("Chime enabled", "success");
			} else if (arg === "off") {
				enabled = false;
				ctx.ui.notify("Chime disabled", "info");
			} else if (!arg) {
				ctx.ui.notify(`Chime is ${enabled ? "on" : "off"}`, "info");
			} else {
				ctx.ui.notify("Usage: /chime [on|off]", "error");
			}
		},
	});
}
