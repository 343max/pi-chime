# pi-chime

Play the `agent_done.wav` chime whenever pi finishes responding and is waiting for your input.

The chime sound is from the [Zed editor](https://zed.dev/) project — see [`assets/sounds/agent_done.wav`](https://github.com/zed-industries/zed/blob/main/assets/sounds/agent_done.wav).

## Install

```bash
pi install git:github.com/343max/pi-chime
```

Or add to your project settings (`.pi/settings.json`):

```json
{
  "packages": ["git:github.com/343max/pi-chime"]
}
```

## Usage

Just use pi normally. When the agent finishes, you'll hear the chime and
a 🔵 indicator appears in the terminal tab title. The dot disappears
automatically when you switch back to the pi tab (via terminal focus
reporting), or when you start your next prompt.

### Toggle

```
/chime      → show current status
/chime on   → enable chime
/chime off  → disable chime
```

## Requirements

- macOS (uses `afplay`)
- The chime is non-blocking and fails silently if audio is unavailable
- 🔵 tab indicator uses xterm focus reporting (`CSI ? 1004 h`); supported
  by Kitty, iTerm2, WezTerm, Ghostty, and Windows Terminal

## License

MIT
