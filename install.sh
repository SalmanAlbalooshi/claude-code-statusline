#!/usr/bin/env bash
# Claude Code Statusline — Installer
# Copies scripts and merges settings into your Claude Code configuration

set -e

CLAUDE_DIR="$HOME/.claude"
SCRIPTS_DIR="$CLAUDE_DIR/scripts"
SETTINGS_FILE="$CLAUDE_DIR/settings.json"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "=== Claude Code Statusline Installer ==="
echo ""

# Create scripts directory
mkdir -p "$SCRIPTS_DIR"

# Copy scripts
cp "$SCRIPT_DIR/scripts/statusline.js" "$SCRIPTS_DIR/statusline.js"
cp "$SCRIPT_DIR/scripts/agent-start.js" "$SCRIPTS_DIR/agent-start.js"
cp "$SCRIPT_DIR/scripts/agent-stop.js" "$SCRIPTS_DIR/agent-stop.js"

echo "[OK] Scripts copied to $SCRIPTS_DIR"

# Check if settings.json exists
if [ -f "$SETTINGS_FILE" ]; then
  echo ""
  echo "[!] Found existing settings.json at $SETTINGS_FILE"
  echo "    You need to manually merge the following into your settings.json:"
  echo ""
  echo '  "hooks": {'
  echo '    "SubagentStart": [{'
  echo '      "hooks": [{'
  echo '        "type": "command",'
  echo '        "command": "node ~/.claude/scripts/agent-start.js",'
  echo '        "async": true'
  echo '      }]'
  echo '    }],'
  echo '    "SubagentStop": [{'
  echo '      "hooks": [{'
  echo '        "type": "command",'
  echo '        "command": "node ~/.claude/scripts/agent-stop.js",'
  echo '        "async": true'
  echo '      }]'
  echo '    }]'
  echo '  },'
  echo '  "statusLine": {'
  echo '    "type": "command",'
  echo '    "command": "node ~/.claude/scripts/statusline.js",'
  echo '    "padding": 2'
  echo '  }'
  echo ""
  echo "    Or see settings.example.json for the full block."
else
  cp "$SCRIPT_DIR/settings.example.json" "$SETTINGS_FILE"
  echo "[OK] Created $SETTINGS_FILE with statusline and hooks config"
fi

echo ""
echo "[DONE] Restart Claude Code to see the new status line!"
