const fs = require('fs');
const buf = fs.readFileSync('projects\\wild.html');
const str = buf.toString('utf8');
for (let i = 0; i < str.length; i++) {
    const cp = str.codePointAt(i);
    if (cp <= 0x7F) continue;
    const ch = String.fromCodePoint(cp);
    const enc = Buffer.from(ch, 'utf8').toString('hex');
    console.log(`pos ${i}: U+${cp.toString(16).padStart(4,'0')} ${JSON.stringify(ch)} utf8=${enc}`);
}