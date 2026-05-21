import type { ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent";
import { spawn } from "node:child_process";
import * as path from "node:path";

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

/** Build the base tab title mirroring pi's own format. */
function getBaseTitle(ctx: ExtensionContext): string {
	const cwdBasename = path.basename(ctx.cwd);
	const sessionName = ctx.sessionManager.getSessionName();
	if (sessionName) {
		return `π - ${sessionName} - ${cwdBasename}`;
	}
	return `π - ${cwdBasename}`;
}

function setDot(ctx: ExtensionContext): void {
	const base = getBaseTitle(ctx);
	ctx.ui.setTitle(`🔵 ${base}`);
	process.stdout.write("\x1b[?1004h");
}

function clearDot(ctx: ExtensionContext): void {
	ctx.ui.setTitle(getBaseTitle(ctx));
	process.stdout.write("\x1b[?1004l");
}

export default function (pi: ExtensionAPI) {
	let focusCleanup: (() => void) | null = null;

	function stopFocusDetection(): void {
		if (focusCleanup) {
			focusCleanup();
			focusCleanup = null;
		}
	}

	function startFocusDetection(ctx: ExtensionContext): void {
		stopFocusDetection();

		let buffer = "";

		const onData = (data: string | Buffer) => {
			buffer += typeof data === "string" ? data : data.toString("utf8");

			// Scan for focus-in (\x1b[I) or focus-out (\x1b[O) at buffer start.
			// Only consume when we match, and keep buffer capped to avoid
			// unbounded growth from regular keyboard input.
			while (buffer.length >= 3) {
				if (buffer.startsWith("\x1b[I")) {
					clearDot(ctx);
					stopFocusDetection();
					buffer = buffer.slice(3);
				} else if (buffer.startsWith("\x1b[O")) {
					buffer = buffer.slice(3);
				} else {
					// Non-focus data — skip to next potential escape start.
					// Focus events are only emitted alone (not interleaved with
					// keyboard input), so this is safe.
					const escIdx = buffer.indexOf("\x1b", 1);
					if (escIdx === -1) {
						// No escape in buffer, keep up to 2 tail bytes
						buffer = buffer.slice(-2);
						break;
					}
					buffer = buffer.slice(escIdx);
				}
			}
		};

		process.stdin.on("data", onData);

		focusCleanup = () => {
			process.stdin.off("data", onData);
		};
	}

	pi.on("agent_end", async (event, ctx) => {
		playChime();
		setDot(ctx);
		startFocusDetection(ctx);
	});

	pi.on("agent_start", async (event, ctx) => {
		// Clear dot when user starts interacting (handles terminals that
		// don't support focus reporting, or if focus event was missed).
		clearDot(ctx);
		stopFocusDetection();
	});

	pi.on("session_shutdown", async () => {
		stopFocusDetection();
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
