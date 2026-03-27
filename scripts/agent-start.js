// Hook: SubagentStart — records active agent info to temp file
const fs = require('fs');
const path = require('path');

let input = '';
process.stdin.on('data', d => input += d);
process.stdin.on('end', () => {
  try {
    const data = JSON.parse(input);
    const agentId = data.agent_id || 'unknown';
    const agentType = data.agent_type || 'unknown';
    const sessionId = data.session_id || 'unknown';
    const description = data.description || '';
    const startedAt = Date.now();
    const timestamp = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    const stateFile = path.join(require('os').tmpdir(), `claude-agents-${sessionId}.json`);

    let agents = [];
    try { agents = JSON.parse(fs.readFileSync(stateFile, 'utf8')); } catch {}

    // Clean up expired "done" agents (older than 8 seconds)
    agents = agents.filter(a => !(a.done && Date.now() - a.doneAt > 8000));

    agents.push({ id: agentId, type: agentType, started: timestamp, startedAt, description });
    fs.writeFileSync(stateFile, JSON.stringify(agents));
  } catch {}
});
