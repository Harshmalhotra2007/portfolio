const fs = require('fs');
const files = ['projects\\expense.html', 'projects\\weather.html', 'projects\\wild.js', 'projects\\wild.css', 'assets\\js\\main.js', 'assets\\css\\styles.css', 'index.html'];
for (const f of files) {
    let str;
    try { str = fs.readFileSync(f, 'utf8'); } catch { console.log(f, 'MISSING'); continue; }
    const c1 = str.match(/[\u0080-\u009F]/g);
    const cps = [...new Set([...str].map(c => c.codePointAt(0)))].filter(cp => cp > 0x7F);
    console.log(`${f}: C1=${c1 ? c1.length : 0} nonAscii=${cps.map(c => 'U+' + c.toString(16).padStart(4,'0')).join(' ')}`);
}