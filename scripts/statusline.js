// Claude Code Statusline — model, context, cost, rate limits, session time, active agents with colors
const fs = require('fs');
const path = require('path');

// ──────────────────────────────────────────────────────────────────────
// COLORS: Built-in Claude Code agent types get fixed colors.
// Any custom/unknown agent type is automatically assigned a color
// from the palette below (consistent per session via hashing).
//
// To pin a specific color for your own agents, just add them here:
//   'my-custom-agent': '\x1b[36m',
// ──────────────────────────────────────────────────────────────────────
const COLORS = {
  // Built-in Claude Code agents
  'Explore':         '\x1b[36m',  // cyan
  'Plan':            '\x1b[33m',  // yellow
  'Bash':            '\x1b[32m',  // green
  'general-purpose': '\x1b[37m',  // white
  'general':         '\x1b[37m',  // white
};

// Color palette for auto-assignment of unknown agent types
const COLOR_PALETTE = [
  '\x1b[31m',  // red
  '\x1b[34m',  // blue
  '\x1b[36m',  // cyan
  '\x1b[32m',  // green
  '\x1b[33m',  // yellow
  '\x1b[35m',  // magenta
];

// Simple string hash for consistent color assignment
function hashColor(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return COLOR_PALETTE[Math.abs(hash) % COLOR_PALETTE.length];
}

function getColor(agentType) {
  return COLORS[agentType] || hashColor(agentType);
}

const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';
const DIM = '\x1b[2m';
const GREEN = '\x1b[32m';

function formatElapsed(ms) {
  const secs = Math.floor(ms / 1000);
  if (secs < 60) return `${secs}s`;
  if (secs < 3600) return `${Math.floor(secs / 60)}m ${secs % 60}s`;
  return `${Math.floor(secs / 3600)}h ${Math.floor((secs % 3600) / 60)}m`;
}

function truncate(str, max) {
  if (!str || str.length <= max) return str;
  return str.slice(0, max - 1) + '\u2026';
}

let input = '';
process.stdin.on('data', d => input += d);
process.stdin.on('end', () => {
  try {
    const data = JSON.parse(input);

    const model = data.model?.display_name || 'unknown';
    const ctxPct = Math.round(data.context_window?.used_percentage || 0);
    const cost = data.cost?.total_cost_usd || 0;
    const sessionId = data.session_id || 'unknown';
    const rate5h = data.rate_limits?.five_hour?.used_percentage;

    // Context color
    let ctxColor = '\x1b[32m'; // green
    if (ctxPct > 80) ctxColor = '\x1b[31m'; // red
    else if (ctxPct > 50) ctxColor = '\x1b[33m'; // yellow

    // Session duration
    let sessionDur = '';
    const sessionStartFile = path.join(require('os').tmpdir(), `claude-session-start-${sessionId}`);
    let sessionStart;
    try {
      sessionStart = parseInt(fs.readFileSync(sessionStartFile, 'utf8'));
    } catch {
      sessionStart = Date.now();
      fs.writeFileSync(sessionStartFile, String(sessionStart));
    }
    sessionDur = formatElapsed(Date.now() - sessionStart);

    // Line 1: Model | Context | Cost | Rate | Session
    let line1 = `${BOLD}${model}${RESET}  ${DIM}|${RESET}  ${ctxColor}context:${ctxPct}%${RESET}`;

    if (cost > 0) {
      line1 += `  ${DIM}|${RESET}  cost:$${cost.toFixed(2)}`;
    }

    if (rate5h !== undefined && rate5h !== null) {
      let rateColor = '\x1b[32m';
      if (rate5h > 80) rateColor = '\x1b[31m';
      else if (rate5h > 50) rateColor = '\x1b[33m';
      line1 += `  ${DIM}|${RESET}  ${rateColor}5h rate:${Math.round(rate5h)}%${RESET}`;
    }

    line1 += `  ${DIM}|${RESET}  ${DIM}session:${sessionDur}${RESET}`;

    console.log(line1);

    // Line 2: Active agents
    const stateFile = path.join(require('os').tmpdir(), `claude-agents-${sessionId}.json`);
    try {
      let agents = JSON.parse(fs.readFileSync(stateFile, 'utf8'));

      // Clean up expired "done" agents (older than 8 seconds)
      const now = Date.now();
      const cleaned = agents.filter(a => !(a.done && now - a.doneAt > 8000));
      if (cleaned.length !== agents.length) {
        fs.writeFileSync(stateFile, JSON.stringify(cleaned));
        agents = cleaned;
      }

      if (agents.length > 0) {
        const active = agents.filter(a => !a.done);

        const parts = agents.map(a => {
          const color = getColor(a.type);

          // Completion flash badge
          if (a.done) {
            const doneElapsed = a.startedAt ? formatElapsed(a.doneAt - a.startedAt) : '';
            const desc = a.description ? ` ${DIM}"${truncate(a.description, 25)}"${RESET}` : '';
            return `${GREEN}\u2713 ${a.type}${RESET}${desc} ${DIM}done in ${doneElapsed}${RESET}`;
          }

          // Colored dot prefix + task description
          let elapsed = '';
          if (a.startedAt) {
            elapsed = formatElapsed(now - a.startedAt);
          } else {
            elapsed = a.started;
          }
          const desc = a.description ? ` ${DIM}"${truncate(a.description, 25)}"${RESET}` : '';
          return `${color}\u25cf ${BOLD}${a.type}${RESET}${desc} ${DIM}(${elapsed})${RESET}`;
        });

        // Agent count prefix
        const countLabel = active.length > 0
          ? `${BOLD}agents (${active.length})${RESET}`
          : `${DIM}agents${RESET}`;

        console.log(`${countLabel}: ${parts.join(`  ${DIM}|${RESET}  `)}`);
      }
    } catch {}
  } catch {}
});
