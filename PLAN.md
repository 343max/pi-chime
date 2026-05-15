# Pi Chime Extension Plan

## Goal
Write a pi extension that plays `agent_done.wav` whenever pi is waiting for user input.

## Decisions

1. **Startup chime?** → **Only after agent responses** (`agent_end`). No chime on `session_start`.
2. **Cross-platform?** → **macOS first** (`afplay`). Linux/Windows fallbacks only if they add ≤ 10 lines of code.
3. **Toggle/mute?** → **`/chime on|off`** toggle command. No custom path support for simplicity.

## Design

### Extension file
`.pi/extensions/chime.ts` (project-local, auto-discovered by pi).

### Events
| Event | When | Action |
|-------|------|--------|
| `agent_end` | Agent finishes, UI idle | Play chime if enabled |

### Audio playback
- **Non-blocking** via `node:child_process` (`spawn` with `detached: true` or `execFile` without await).
- **macOS**: `afplay <path>`
- **Linux fallbacks**: `paplay <path>` → `aplay <path>`
- **Silent failure** if file missing or player exits non-zero (log to stderr optionally).
- Resolve `agent_done.wav` relative to `process.cwd()` (project root).

### Toggle command
```
/chime      → show current status
/chime on   → enable
/chime off  → disable
```

### State
- `enabled: boolean` (default `true`)

## Files to create
- `.pi/extensions/chime.ts` — the extension
- Optional: `README.md` in project root explaining how to use it

## Risks / Edge Cases
- **CWD sensitivity**: Resolve `agent_done.wav` relative to `ctx.cwd` at play time, or resolve once at load time from `process.cwd()`. Since this is a project-local extension, resolving from the project root is correct.
- **Rapid turns**: If `agent_end` fires in quick succession (unlikely in normal use), overlapping audio is acceptable or we could debounce.
- **Headless/SSH**: `afplay` may fail over SSH without audio forwarding. Silent failure handles this.
- **Large wav file**: `agent_done.wav` is ~460KB. `afplay` streams it, so no memory issue.

## Implementation Steps (post-plan approval)
1. Create `.pi/extensions/` directory.
2. Write `chime.ts` with event hooks, player logic, and `/chime` command.
3. Test by running pi in this directory and waiting for a response.

---

**Pending decision:** Please confirm or adjust the assumptions above (especially startup chime and cross-platform scope), then say "let's go" and I'll implement.
