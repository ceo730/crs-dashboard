const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = 3456;
const SHEET_BASE = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQwbnLUfdqpVzVVsS3sI-YdOYesIGm1Br0R2Bxn-puvBqEoBycQBVaq50uVqD6xDC5oPVIwTr8R0x9s/pub';

function fetchGoogleSheet(gid) {
    const sheetUrl = `${SHEET_BASE}?gid=${gid}&single=true&output=csv&_t=${Date.now()}`;
    return new Promise((resolve, reject) => {
        const follow = (reqUrl, redirects) => {
            if (redirects > 5) return reject(new Error('Too many redirects'));
            const mod = reqUrl.startsWith('https') ? https : http;
            mod.get(reqUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
                if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                    return follow(res.headers.location, redirects + 1);
                }
                if (res.statusCode !== 200) return reject(new Error('HTTP ' + res.statusCode));
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => resolve(data));
            }).on('error', reject);
        };
        follow(sheetUrl, 0);
    });
}

const server = http.createServer(async (req, res) => {
    const parsed = url.parse(req.url, true);

    // API: proxy Google Sheets CSV
    if (parsed.pathname === '/api/sheet') {
        const gid = parsed.query.gid;
        if (!gid) {
            res.writeHead(400, { 'Content-Type': 'text/plain' });
            return res.end('gid required');
        }
        try {
            const csv = await fetchGoogleSheet(gid);
            res.writeHead(200, {
                'Content-Type': 'text/csv; charset=utf-8',
                'Cache-Control': 'no-cache',
            });
            res.end(csv);
        } catch (err) {
            res.writeHead(502, { 'Content-Type': 'text/plain' });
            res.end('Fetch error: ' + err.message);
        }
        return;
    }

    // Static files
    let filePath = parsed.pathname === '/' ? '/index.html' : parsed.pathname;
    filePath = path.join(__dirname, filePath);
    const ext = path.extname(filePath);
    const mimeTypes = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.ico': 'image/x-icon' };

    fs.readFile(filePath, (err, content) => {
        if (err) {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            return res.end('Not found');
        }
        res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'text/plain; charset=utf-8' });
        res.end(content);
    });
});

server.listen(PORT, () => {
    console.log(`\n  Dashboard running at http://localhost:${PORT}\n`);
});
