const fs = require('fs');
const str = fs.readFileSync('projects\\wild.html', 'utf8');
const c1 = str.match(/[\u0080-\u009F]/g);
console.log('C1 count:', c1 ? c1.length : 0);
for (let i = 0; i < str.length; i++) {
    const cp = str.codePointAt(i);
    if (cp > 0x7F) {
        const ch = String.fromCodePoint(cp);
        const ctx = str.slice(Math.max(0, i - 15), i + 15);
        console.log(`pos ${i}: U+${cp.toString(16).padStart(4,'0')} ${JSON.stringify(ch)} ctx=${JSON.stringify(ctx)}`);
    }
}