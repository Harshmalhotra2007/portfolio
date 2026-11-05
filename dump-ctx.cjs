const fs = require('fs');
const f = process.argv[2];
const str = fs.readFileSync(f, 'utf8');
const seen = new Set();
for (let i = 0; i < str.length; i++) {
    const cp = str.codePointAt(i);
    if (cp <= 0x7F) continue;
    const key = `${cp.toString(16)}@${str.slice(i, i + 8)}`;
    // dedupe by (char, 8-char lookahead)
    const dedupeKey = cp.toString(16) + '|' + str.slice(i, Math.min(i + 10, str.length));
    if (seen.has(dedupeKey)) continue;
    seen.add(dedupeKey);
    const ctx = str.slice(Math.max(0, i - 20), i + 20);
    console.log(`pos ${i}: U+${cp.toString(16).padStart(4,'0')} ctx=${JSON.stringify(ctx)}`);
    i += 7; // skip ahead to reduce noise
}