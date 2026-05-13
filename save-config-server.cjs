const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3001;
const CONFIG_PATH = path.join(__dirname, 'src', 'config', 'kiosk-config.json');

const server = http.createServer((req, res) => {
  // Handle CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.method === 'POST' && req.url === '/save-config') {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        fs.writeFileSync(CONFIG_PATH, JSON.stringify(data, null, 2));
        console.log(`[Config Bridge] Successfully updated ${CONFIG_PATH}`);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'success' }));
      } catch (err) {
        console.error('[Config Bridge] Error writing file:', err);
        res.writeHead(500);
        res.end(JSON.stringify({ status: 'error', message: err.message }));
      }
    });
  } else {
    res.writeHead(404);
    res.end();
  }
});

server.listen(PORT, () => {
  console.log(`\n🚀 [Kiosk Config Bridge] is running!`);
  console.log(`📡 Listening for save signals on http://localhost:${PORT}`);
  console.log(`📁 Saving updates directly to: ${CONFIG_PATH}`);
  console.log(`\n(Keep this terminal open while you calibrate in the browser)\n`);
});
