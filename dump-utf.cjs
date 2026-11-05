const fs = require('fs');
const buf = fs.readFileSync('projects\\expense.html');
const str = buf.toString('utf8');

// Find the rupee symbol at line 119
const lines = str.split('\n');
const line119 = lines[118]; // 0-indexed
console.log('Line 119:', JSON.stringify(line119));

// Find the exact codepoints
const idx = line119.indexOf('â‚¹');
if (idx >= 0) {
    console.log('Found â‚¹ at position', idx);
    for (let i = 0; i < 10; i++) {
        const cp = line119.charCodeAt(idx + i);
        if (cp > 0) console.log(`  offset ${i}: U+${cp.toString(16).padStart(4,'0')} '${line119[idx+i]}'`);
    }
}