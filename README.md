# Claude Code Statusline + Agent Colors

A custom status line for [Claude Code](https://claude.ai/claude-code) that displays real-time session info and color-coded agent activity directly in your terminal.

![Status Line Screenshot](./screenshots/statusline.png)

## What It Does

### Status Line (Line 1)
Displays key session metrics at the bottom of your Claude Code terminal:

```
Opus 4.6  |  memory:23%  |  token cost:$1.45  |  5h quota:12%  |  session:14m 32s
```

- **Model name** — which Claude model is active
- **Memory (context)** — how much of the context window is used (green < 50%, yellow 50-80%, red > 80%)
- **Token cost** — running USD cost for the session
- **5h quota** — rate limit usage over the 5-hour window (color-coded)
- **Session duration** — how long the current session has been running

### Agent Tracker (Line 2)
When Claude spawns subagents, they appear as color-coded entries with live elapsed time:

```
agents (3): ● researcher "Find API docs" (12s)  |  ● fullstack-developer "Build endpoint" (8s)  |  ● qa-tester "Write tests" (5s)
```

When an agent completes, it briefly shows a completion badge before disappearing:

```
agents (1): ● architect "Design schema" (24s)  |  ✓ researcher done in 15s
```

### Agent Color Map

Each agent type has a distinct color so you can instantly tell what's running:

| Color | Agents |
|-------|--------|
| ![#e06c75](https://placehold.co/12x12/e06c75/e06c75.png) **Red** | `transformation-lead`, `architect`, `risk-controls` |
| ![#61afef](https://placehold.co/12x12/61afef/61afef.png) **Blue** | `business-analyst`, `brd-test-runner`, `researcher` |
| ![#56b6c2](https://placehold.co/12x12/56b6c2/56b6c2.png) **Cyan** | `fullstack-developer`, `Explore` |
| ![#98c379](https://placehold.co/12x12/98c379/98c379.png) **Green** | `qa-tester`, `excel-dashboard`, `Bash` |
| ![#e5c07b](https://placehold.co/12x12/e5c07b/e5c07b.png) **Yellow** | `personal-assistant`, `pmo-delivery`, `Plan` |
| ![#c678dd](https://placehold.co/12x12/c678dd/c678dd.png) **Magenta** | `presentation-reporting`, `ux-ui` |
| ![#abb2bf](https://placehold.co/12x12/abb2bf/abb2bf.png) **White** | `general`, `general-purpose` |

You can customize these colors by editing the `COLORS` object in `scripts/statusline.js`.

## How It Looks

### Status line with session info
```
┌─────────────────────────────────────────────────────────────────────┐
│  Opus 4.6  |  memory:23%  |  token cost:$1.45  |  session:14m 32s │
│  agents (2): ● researcher "Search docs" (5s)  |  ● Explore (3s)   │
└─────────────────────────────────────────────────────────────────────┘
```

### Agents completing
```
┌──────────────────────────────────────────────────────────────────────────┐
│  Opus 4.6  |  memory:41%  |  token cost:$3.20  |  session:22m 10s      │
│  agents (1): ● architect "Design API" (18s)  |  ✓ researcher done in 9s│
└──────────────────────────────────────────────────────────────────────────┘
```

### High context usage (color warning)
```
┌────────────────────────────────────────────────────────────────────────┐
│  Opus 4.6  |  memory:87%  |  token cost:$8.50  |  5h quota:62%       │
│                            ^^^ RED ^^^            ^^^ YELLOW ^^^      │
└────────────────────────────────────────────────────────────────────────┘
```

> **Add your own screenshot!** Take a screenshot of your terminal with agents running and replace `screenshots/statusline.png`.

## Prerequisites

- [Claude Code](https://claude.ai/claude-code) (CLI, Desktop, or VS Code extension)
- Node.js (already installed if you have Claude Code)

## Installation

### Option 1: Automated (recommended)

**macOS / Linux / Git Bash on Windows:**
```bash
git clone https://github.com/SalmanAlbalooshi/claude-code-statusline.git
cd claude-code-statusline
bash install.sh
```

**Windows PowerShell:**
```powershell
git clone https://github.com/SalmanAlbalooshi/claude-code-statusline.git
cd claude-code-statusline
.\install.ps1
```

### Option 2: Manual

1. **Copy the scripts** to `~/.claude/scripts/`:

```bash
mkdir -p ~/.claude/scripts
cp scripts/statusline.js ~/.claude/scripts/
cp scripts/agent-start.js ~/.claude/scripts/
cp scripts/agent-stop.js ~/.claude/scripts/
```

2. **Add the hooks and statusLine config** to your `~/.claude/settings.json`:

```json
{
  "hooks": {
    "SubagentStart": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "node ~/.claude/scripts/agent-start.js",
            "async": true
          }
        ]
      }
    ],
    "SubagentStop": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "node ~/.claude/scripts/agent-stop.js",
            "async": true
          }
        ]
      }
    ]
  },
  "statusLine": {
    "type": "command",
    "command": "node ~/.claude/scripts/statusline.js",
    "padding": 2
  }
}
```

> If you already have a `settings.json`, merge the `hooks` and `statusLine` keys into your existing config.

3. **Restart Claude Code** — the status line appears immediately.

## How It Works

The system uses three components:

| File | Purpose |
|------|---------|
| `scripts/statusline.js` | Renders the status bar — reads session data from stdin (provided by Claude Code) and agent state from a temp file |
| `scripts/agent-start.js` | Hook triggered on `SubagentStart` — writes agent info (ID, type, description, timestamp) to a session-specific temp file |
| `scripts/agent-stop.js` | Hook triggered on `SubagentStop` — marks agents as "done" so the status line can show a completion badge before cleanup |

**Data flow:**
1. Claude Code calls `statusline.js` on every render cycle, piping session JSON to stdin
2. When a subagent starts, the `SubagentStart` hook fires `agent-start.js`, which appends the agent to a temp file
3. When a subagent stops, the `SubagentStop` hook fires `agent-stop.js`, which marks it as done
4. `statusline.js` reads the temp file and renders colored dots for active agents + checkmarks for recently completed ones
5. Completed agents auto-clean after 8 seconds

**Temp files** are stored in your OS temp directory (`$TMPDIR` / `%TEMP%`) and are session-scoped, so they don't leak between sessions.

## Customization

### Change agent colors
Edit the `COLORS` object in `scripts/statusline.js`. Use any ANSI escape code:

```js
const COLORS = {
  'my-custom-agent': '\x1b[36m',  // cyan
  // ...
};
```

Common ANSI color codes:
| Code | Color |
|------|-------|
| `\x1b[31m` | Red |
| `\x1b[32m` | Green |
| `\x1b[33m` | Yellow |
| `\x1b[34m` | Blue |
| `\x1b[35m` | Magenta |
| `\x1b[36m` | Cyan |
| `\x1b[37m` | White |

### Change completion badge timeout
In all three scripts, the cleanup threshold is `8000` ms. Change this value to keep completed agents visible longer or shorter.

### Change status line padding
In `settings.json`, adjust the `padding` value:
```json
"statusLine": {
  "padding": 2
}
```

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Status line not showing | Verify `statusLine` is in `settings.json` and restart Claude Code |
| Agents not tracked | Verify `hooks.SubagentStart` and `hooks.SubagentStop` are in `settings.json` |
| Colors not showing | Your terminal must support ANSI escape codes (most modern terminals do) |
| Stale agents stuck | Delete temp files: `rm $TMPDIR/claude-agents-*.json` (they auto-recreate) |

## Screenshots

> **Please add a screenshot!** Run Claude Code with some agents, then take a screenshot and save it to `screenshots/statusline.png`.

You can create the screenshots directory:
```bash
mkdir -p screenshots
```

## License

MIT
