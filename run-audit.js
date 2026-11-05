#!/usr/bin/env node
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const PORT = 4175;
const URL = `http://localhost:${PORT}/`;

// Start preview server
const server = spawn('npx', ['vite', 'preview', '--port', PORT], {
    cwd: 'C:\\Code\\Personal porfolio',
    stdio: 'pipe'
});

server.stdout.on('data', (data) => {
    const str = data.toString();
    if (str.includes('Local:') || str.includes('Network:')) {
        console.log('Server:', str.trim());
    }
});

server.stderr.on('data', (data) => {
    const str = data.toString();
    console.log('Server stderr:', str);
});

// Wait for server to be ready
const checkServer = () => {
    return new Promise((resolve) => {
        const http = require('http');
        const req = http.get(URL, (res) => {
            resolve(true);
        });
        req.on('error', () => {
            setTimeout(() => resolve(false), 1000);
        });
        req.setTimeout(2000);
    });
};

async function runAudit() {
    console.log('Waiting for server...');
    let ready = false;
    for (let i = 0; i < 30; i++) {
        if (await checkServer()) {
            ready = true;
            break;
        }
        await new Promise(r => setTimeout(r, 1000));
    }
    
    if (!ready) {
        console.error('Server not ready');
        server.kill();
        process.exit(1);
    }
    
    console.log('Server ready, running Lighthouse...');
    
    // Run Lighthouse
    const lighthouse = spawn('npx', ['lighthouse', URL,
        '--output=json', '--output-path=./lighthouse-report.json',
        '--port', PORT,
        '--chrome-flags=--headless --no-sandbox'
    ], {
        cwd: 'C:\\Code\\Personal porfolio',
        stdio: 'pipe'
    });
    
    lighthouse.stdout.on('data', (data) => console.log('LH:', data.toString()));
    lighthouse.stderr.on('data', (data) => console.error('LH stderr:', data.toString()));
    
    lighthouse.on('close', (code) => {
        console.log('Lighthouse exit code:', code);
        
        // Read report
        const reportPath = 'C:\\Code\\Personal porfolio\\lighthouse-report.json';
        if (fs.existsSync(reportPath)) {
            const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
            const categories = report.categories || {};
            for (const [name, cat] of Object.entries(categories)) {
                const score = cat.score ?? 0;
                console.log(`${name}: ${Math.round(score * 100)}`);
            }
        }
        
        server.kill();
    });
}

runAudit();