// Hook: SubagentStop — marks agent as done (stays visible briefly, then cleaned up)
const fs = require('fs');
const path = require('path');

let input = '';
process.stdin.on('data', d => input += d);
process.stdin.on('end', () => {
  try {
    const data = JSON.parse(input);
    const agentId = data.agent_id || 'unknown';
    const sessionId = data.session_id || 'unknown';

    const stateFile = path.join(require('os').tmpdir(), `claude-agents-${sessionId}.json`);

    let agents = [];
    try { agents = JSON.parse(fs.readFileSync(stateFile, 'utf8')); } catch {}

    // Mark as done instead of removing — statusline will show "done" badge briefly
    agents = agents.map(a => {
      if (a.id === agentId) {
        return { ...a, done: true, doneAt: Date.now() };
      }
      return a;
    });

    // Clean up expired "done" agents (older than 8 seconds)
    agents = agents.filter(a => !(a.done && Date.now() - a.doneAt > 8000));

    fs.writeFileSync(stateFile, JSON.stringify(agents));
  } catch {}
});
