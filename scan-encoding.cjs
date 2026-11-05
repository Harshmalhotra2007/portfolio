const fs = require('fs');
const path = require('path');

function walk(dir, files = []) {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
        if (['node_modules', 'dist', '.git', 'backups'].includes(e.name)) continue;
        const p = path.join(dir, e.name);
        if (e.isDirectory()) walk(p, files);
        else if (/\.(html|css|js|md|json|py)$/.test(e.name)) files.push(p);
    }
    return files;
}

const files = walk('.');
let report = [];
for (const f of files) {
    const buf = fs.readFileSync(f);
    const str = buf.toString('utf8');
    const c1 = str.match(/[\u0080-\u009F]/g);
    const moj = str.match(/Ã[\u0080-\u00BF]/g);
    const latin1Repairable = [...new Set(str)].every(ch => ch.codePointAt(0) <= 0xFF);
    if (c1 || moj) {
        report.push({
            file: f,
            c1Count: c1 ? c1.length : 0,
            mojibakeChars: moj ? [...new Set(moj)].join('') : '',
            latin1Repairable,
            totalBytes: buf.length,
        });
    }
}
console.log(JSON.stringify(report, null, 2));
if (report.length === 0) console.log('No encoding issues found.');