# Claude Code Statusline

A custom status line for [Claude Code](https://claude.ai/claude-code) that shows real-time session metrics and color-coded subagent activity in your terminal.

**Zero dependencies. Pure Node.js. Works on macOS, Linux, and Windows.**

![Status Line Screenshot](./screenshots/statusline.png)

## What It Does

### Line 1 — Session Metrics

```
Opus 4.6  |  context:23%  |  cost:$1.45  |  5h rate:12%  |  session:14m 32s
```

| Metric | Description |
|--------|-------------|
| **Model** | Active Claude model name |
| **Context** | Context window usage — green (< 50%), yellow (50-80%), red (> 80%) |
| **Cost** | Running token cost in USD for the session |
| **5h rate** | Rate limit usage over the 5-hour window (color-coded) |
| **Session** | How long the current session has been running |

### Line 2 — Live Agent Tracker

When Claude spawns subagents (via the `Agent` tool), they appear as color-coded entries with live elapsed time:

```
agents (3): ● Explore "Find config files" (12s)  |  ● general-purpose "Build endpoint" (8s)  |  ● Plan "Design approach" (5s)
```

When an agent completes, it briefly shows a green checkmark before fading out:

```
agents (1): ● Plan "Design approach" (24s)  |  ✓ Explore done in 15s
```

### Auto-Color Assignment

Built-in Claude Code agents (`Explore`, `Plan`, `Bash`, `general-purpose`) have fixed colors. **Any custom agent type you define is automatically assigned a consistent color** from the palette — no configuration needed.

You can also pin specific colors for your own agents by adding them to the `COLORS` object in `statusline.js`:

```js
const COLORS = {
  // Built-in
  'Explore': '\x1b[36m',         // cyan
  'Plan': '\x1b[33m',            // yellow

  // Add your own custom agents here
  'my-researcher': '\x1b[34m',   // blue
  'my-builder': '\x1b[31m',      // red
};
```

**Default color palette for auto-assignment:**

| Color | Code |
|-------|------|
| ![#e06c75](https://placehold.co/12x12/e06c75/e06c75.png) Red | `\x1b[31m` |
| ![#61afef](https://placehold.co/12x12/61afef/61afef.png) Blue | `\x1b[34m` |
| ![#56b6c2](https://placehold.co/12x12/56b6c2/56b6c2.png) Cyan | `\x1b[36m` |
| ![#98c379](https://placehold.co/12x12/98c379/98c379.png) Green | `\x1b[32m` |
| ![#e5c07b](https://placehold.co/12x12/e5c07b/e5c07b.png) Yellow | `\x1b[33m` |
| ![#c678dd](https://placehold.co/12x12/c678dd/c678dd.png) Magenta | `\x1b[35m` |

## How It Looks

```
┌──────────────────────────────────────────────────────────────────────┐
│  Opus 4.6  |  context:23%  |  cost:$1.45  |  session:14m 32s        │
│  agents (2): ● Explore "Search codebase" (5s)  |  ● Plan (3s)       │
└──────────────────────────────────────────────────────────────────────┘
```

```
┌──────────────────────────────────────────────────────────────────────────┐
│  Sonnet 4.6  |  context:41%  |  cost:$0.80  |  session:8m 15s          │
│  agents (1): ● my-agent "Design API" (18s)  |  ✓ Explore done in 9s    │
└──────────────────────────────────────────────────────────────────────────┘
```

```
┌──────────────────────────────────────────────────────────────────────────┐
│  Opus 4.6  |  context:87%  |  cost:$8.50  |  5h rate:62%               │
│             ^^^ RED ^^^                      ^^^ YELLOW ^^^             │
└──────────────────────────────────────────────────────────────────────────┘
```

> Replace `screenshots/statusline.png` with your own screenshot to see the real colors!

## Prerequisites

- [Claude Code](https://docs.anthropic.com/en/docs/claude-code) (CLI, Desktop app, or IDE extension)
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

The installer copies scripts to `~/.claude/scripts/` and either creates or prompts you to merge `settings.json`.

### Option 2: Manual

1. **Copy the scripts** to your Claude config:

```bash
mkdir -p ~/.claude/scripts
cp scripts/statusline.js ~/.claude/scripts/
cp scripts/agent-start.js ~/.claude/scripts/
cp scripts/agent-stop.js ~/.claude/scripts/
```

2. **Add hooks and statusLine** to `~/.claude/settings.json`:

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

> If you already have a `settings.json`, merge the `hooks` and `statusLine` keys into your existing config. Don't overwrite your other settings.

3. **Restart Claude Code** — the status line appears immediately.

## How It Works

```
┌──────────────────┐     stdin (session JSON)     ┌──────────────────┐
│   Claude Code    │ ──────────────────────────▶  │  statusline.js   │ ──▶ renders line 1 + line 2
│                  │                               │  (reads temp file│
│  fires hooks:    │                               │   for agent data)│
│  SubagentStart ──┼──▶ agent-start.js ──▶ writes  └──────────────────┘
│  SubagentStop  ──┼──▶ agent-stop.js  ──▶ to temp file
└──────────────────┘
```

| File | Purpose |
|------|---------|
| `statusline.js` | Renders the status bar — reads session JSON from stdin + agent state from a temp file |
| `agent-start.js` | `SubagentStart` hook — appends agent info (ID, type, description, timestamp) to a session-scoped temp file |
| `agent-stop.js` | `SubagentStop` hook — marks agents as "done" so the status line shows a completion badge before auto-cleanup |

- **Temp files** are stored in your OS temp directory and are session-scoped (no cross-session leaks)
- **Completed agents** show a green checkmark for 8 seconds, then auto-clean

## Customization

### Pin colors for your custom agents

```js
// In scripts/statusline.js — add entries to the COLORS object:
const COLORS = {
  'Explore': '\x1b[36m',
  'Plan': '\x1b[33m',
  'Bash': '\x1b[32m',
  'general-purpose': '\x1b[37m',
  'general': '\x1b[37m',

  // Your custom agents:
  'code-reviewer': '\x1b[35m',   // magenta
  'test-runner': '\x1b[31m',     // red
  'doc-writer': '\x1b[34m',      // blue
};
```

### Change completion badge timeout

In all three scripts, the cleanup threshold is `8000` ms (8 seconds). Search for `8000` and change it:

```js
// Keep done agents visible for 15 seconds instead of 8
agents = agents.filter(a => !(a.done && Date.now() - a.doneAt > 15000));
```

### Change status line padding

```json
"statusLine": {
  "padding": 2
}
```

Higher values add more blank lines between the status bar and the conversation.

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Status line not showing | Verify `statusLine` is in `~/.claude/settings.json` and restart Claude Code |
| Agents not tracked | Verify `hooks.SubagentStart` and `hooks.SubagentStop` are in `settings.json` |
| Colors not rendering | Your terminal must support ANSI escape codes (most modern terminals do) |
| Stale agents stuck | Delete temp files: `rm $TMPDIR/claude-agents-*.json` (they auto-recreate) |
| `node` not found | Ensure Node.js is in your PATH |

## Contributing

PRs welcome! Some ideas:

- Additional metrics (tokens in/out, cache hits)
- Configurable color themes via a JSON config file
- Bright / 256-color / true-color support
- Agent grouping by color category

## License

MIT
