const fs = require('fs');

const file = 'projects\\wild.html';
let str = fs.readFileSync(file, 'utf8');

// Exact code-point sequences (verified from byte dump):
const logoSeq = '\u00C3\u00B0\u00C5\u00B8\u00C2\u0090\u00C2\u00AF'; // -> 🐾
const menuSeq = '\u00C3\u00A2\u00CB\u0153\u00C2\u00B0';                     // -> ☰
const emDashSeq = '\u00C3\u00A2\u00E2\u201A\u00AC\u00E2\u20AC\u009D'; // -> —
const ellipsisSeq = '\u00C3\u00A2\u00E2\u201A\u00AC\u00C2\u00A6'; // -> …
const magGlassSeq = '\u00C3\u00B0\u00C5\u00B8\u00E2\u20AC\u009D\u00C2\u008D'; // -> 🔍

const replacements = [
    { re: new RegExp(logoSeq, 'g'), to: '🐾' },
    { re: new RegExp(menuSeq, 'g'), to: '☰' },
    { re: new RegExp(emDashSeq, 'g'), to: '—' },
    { re: new RegExp(ellipsisSeq, 'g'), to: '…' },
    { re: new RegExp(magGlassSeq, 'g'), to: '🔍' },
];

let changed = false;
for (const { re, to } of replacements) {
    if (re.test(str)) {
        str = str.replace(re, to);
        changed = true;
    }
}

// Remove stray lone surrogates left over from partial replacements.
const before = str.length;
str = str.replace(/[\uD800-\uDFFF]/g, '');
if (str.length !== before) changed = true;

const c1 = str.match(/[\u0080-\u009F]/g);
if (c1) {
    console.error('C1 control characters still present:', c1.length);
    process.exit(1);
}

fs.writeFileSync(file, str, 'utf8');
console.log(changed ? 'wild.html repaired.' : 'No changes made.');