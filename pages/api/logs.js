import { safeLog } from '../../lib/config';

// Simple log storage for demo purposes
let logBuffer = [];
const MAX_LOGS = 100;
const sseClients = new Set();

const log = (level, message, data = {}) => safeLog(level, message, data);

export default function handler(req, res) {
  if (req.method === 'GET') {
    // Check if this is an SSE request
    if (req.headers.accept && req.headers.accept.includes('text/event-stream')) {
      handleSSE(req, res);
    } else {
      // Return the log viewer page
      res.setHeader('Content-Type', 'text/html');
      res.status(200).send(getLogViewerHTML());
    }
  } else if (req.method === 'POST') {
    // Handle log submission from mobile
    handleLogSubmission(req, res);
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}

function handleSSE(req, res) {
  // Set SSE headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Cache-Control'
  });

  // Add this client to the set
  sseClients.add(res);

  // Send initial connection message
  res.write(`data: ${JSON.stringify({
    type: 'system',
    message: '📡 Log streaming connected',
    timestamp: new Date().toISOString()
  })}\n\n`);

  // Send any existing logs
  logBuffer.forEach(log => {
    res.write(`data: ${JSON.stringify(log)}\n\n`);
  });

  // Keep connection alive
  const keepAlive = setInterval(() => {
    try {
      res.write(': heartbeat\n\n');
    } catch (error) {
      // Client disconnected, clean up
      clearInterval(keepAlive);
      sseClients.delete(res);
    }
  }, 30000);

  // Clean up on client disconnect
  req.on('close', () => {
    clearInterval(keepAlive);
    sseClients.delete(res);
  });

  req.on('end', () => {
    clearInterval(keepAlive);
    sseClients.delete(res);
  });
}

function handleLogSubmission(req, res) {
  try {
    const logEntry = {
      type: 'log',
      ...req.body,
      timestamp: new Date().toISOString()
    };

    // Add to buffer
    logBuffer.push(logEntry);
    
    // Keep buffer size manageable
    if (logBuffer.length > MAX_LOGS) {
      logBuffer.shift();
    }

    // Broadcast to all connected SSE clients
    broadcastToClients(logEntry);

    // Log to server console for debugging
    const prefix = `📱 [${logEntry.level?.toUpperCase() || 'LOG'}]`;

    res.status(200).json({ success: true });
  } catch (error) {
    log('error', '📡 Error processing log', { error: error?.message });
    res.status(400).json({ error: 'Invalid log data' });
  }
}

function broadcastToClients(logEntry) {
  const deadClients = [];
  
  sseClients.forEach(client => {
    try {
      client.write(`data: ${JSON.stringify(logEntry)}\n\n`);
    } catch (error) {
      // Client is disconnected, mark for removal
      deadClients.push(client);
    }
  });
  
  // Remove dead clients
  deadClients.forEach(client => {
    sseClients.delete(client);
  });
}

function getLogViewerHTML() {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Mobile Console Logs - Devello Inc</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace; 
            background: #1a1a1a; 
            color: #e0e0e0; 
            height: 100vh; 
            display: flex; 
            flex-direction: column;
        }
        .header {
            background: #2d2d2d;
            padding: 1rem;
            border-bottom: 1px solid #444;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .title { color: #4ade80; font-weight: bold; }
        .status { 
            padding: 0.25rem 0.75rem; 
            border-radius: 1rem; 
            font-size: 0.875rem; 
            font-weight: bold;
        }
        .status.connected { background: #065f46; color: #10b981; }
        .status.disconnected { background: #7f1d1d; color: #ef4444; }
        .controls {
            display: flex;
            gap: 1rem;
            align-items: center;
        }
        .btn {
            padding: 0.5rem 1rem;
            border: none;
            border-radius: 0.375rem;
            cursor: pointer;
            font-size: 0.875rem;
            font-weight: 500;
        }
        .btn-clear { background: #dc2626; color: white; }
        .btn-clear:hover { background: #b91c1c; }
        .logs-container {
            flex: 1;
            overflow-y: auto;
            padding: 1rem;
            background: #0f0f0f;
        }
        .log-entry {
            margin-bottom: 0.5rem;
            padding: 0.5rem;
            border-radius: 0.25rem;
            border-left: 3px solid;
            font-size: 0.875rem;
            line-height: 1.4;
        }
        .log-entry.log { border-color: #6b7280; background: #1f2937; }
        .log-entry.warn { border-color: #f59e0b; background: #451a03; color: #fbbf24; }
        .log-entry.error { border-color: #ef4444; background: #450a0a; color: #fca5a5; }
        .log-entry.info { border-color: #3b82f6; background: #1e3a8a; color: #93c5fd; }
        .log-entry.system { border-color: #10b981; background: #064e3b; color: #6ee7b7; }
        .timestamp { 
            color: #6b7280; 
            font-size: 0.75rem; 
            margin-right: 0.5rem; 
        }
        .user-agent {
            color: #9ca3af;
            font-size: 0.75rem;
            margin-top: 0.25rem;
            opacity: 0.7;
        }
        .args {
            margin-top: 0.25rem;
            padding-left: 1rem;
            color: #d1d5db;
            white-space: pre-wrap;
        }
        .empty-state {
            text-align: center;
            color: #6b7280;
            margin-top: 2rem;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1 class="title">📱 Mobile Console Logs</h1>
        <div class="controls">
            <div id="status" class="status disconnected">Disconnected</div>
            <button class="btn btn-clear" onclick="clearLogs()">Clear Logs</button>
        </div>
    </div>
    
    <div class="logs-container" id="logsContainer">
        <div class="empty-state">
            <p>Waiting for mobile console logs...</p>
            <p style="margin-top: 0.5rem; font-size: 0.875rem;">
                Make sure log streaming is enabled on your mobile device.
            </p>
        </div>
    </div>

    <script>
        let eventSource = null;
        let logCount = 0;
        const maxLogs = 1000;
        
        function connect() {
            const sseUrl = window.location.origin + '/api/logs';
            
            eventSource = new EventSource(sseUrl);
            
            eventSource.onopen = () => {
                updateStatus('connected');
            };
            
            eventSource.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    addLogEntry(data);
                } catch (error) {
                    console.error('Error parsing log message:', error);
                }
            };
            
            eventSource.onerror = (error) => {
                console.error('📡 SSE error:', error);
                updateStatus('disconnected');
                
                // Attempt to reconnect after 3 seconds
                setTimeout(connect, 3000);
            };
        }
        
        function updateStatus(status) {
            const statusEl = document.getElementById('status');
            statusEl.className = 'status ' + status;
            statusEl.textContent = status === 'connected' ? 'Connected' : 'Disconnected';
        }
        
        function addLogEntry(data) {
            const container = document.getElementById('logsContainer');
            
            // Remove empty state
            const emptyState = container.querySelector('.empty-state');
            if (emptyState) {
                emptyState.remove();
            }
            
            // Create log entry
            const entry = document.createElement('div');
            entry.className = 'log-entry ' + (data.type || data.level || 'log');
            
            const timestamp = new Date(data.timestamp).toLocaleTimeString();
            const userAgent = data.userAgent ? 
                (data.userAgent.includes('iPhone') ? '📱 iPhone' :
                 data.userAgent.includes('Android') ? '📱 Android' : '📱 Mobile') : '';
            
            entry.innerHTML = 
                '<span class="timestamp">' + timestamp + '</span>' +
                '<strong>' + (data.message || '') + '</strong>' +
                (data.args && data.args.length > 0 ? 
                    '<div class="args">' + data.args.join('\\n') + '</div>' : '') +
                (userAgent ? '<div class="user-agent">' + userAgent + '</div>' : '');
            
            container.appendChild(entry);
            
            // Limit number of logs
            logCount++;
            if (logCount > maxLogs) {
                const firstLog = container.querySelector('.log-entry');
                if (firstLog) {
                    firstLog.remove();
                    logCount--;
                }
            }
            
            // Auto-scroll to bottom
            container.scrollTop = container.scrollHeight;
        }
        
        function clearLogs() {
            const container = document.getElementById('logsContainer');
            const logs = container.querySelectorAll('.log-entry');
            logs.forEach(log => log.remove());
            logCount = 0;
            
            container.innerHTML = '<div class="empty-state"><p>Logs cleared</p></div>';
        }
        
        // Connect on page load
        connect();
    </script>
</body>
</html>
  `;
} 
