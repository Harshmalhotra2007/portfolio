const fs = require('fs');

// Repair script for double-encoded ₹ signs
const files = ['projects\\expense.html'];

for (const file of files) {
    let str = fs.readFileSync(file, 'utf8');
    const before = str.length;
    
    // Replace corrupted ₹ (â‚¹ which is U+00E2 U+20AC U+00B9 = €¹ in latin-1 interpreted as UTF-8)
    const rupeeCorr = '\u00E2\u20AC\u00B9';  // â‚¹ - this is actually €¹ displayed as mojibake
    const rupeeCorrect = '₹';
    
    const count = (str.match(new RegExp(rupeeCorr, 'g')) || []).length;
    if (count > 0) {
        str = str.split(rupeeCorr).join(rupeeCorrect);
        console.log(`${file}: replaced ${count} corrupted ₹ symbols`);
    }
    
    // Also fix the up-arrow indicators: â–¼ (U+00E2 U+2013 U+00B4) for up, â–² (U+00E2 U+2013 U+00B2) for down
    // These display as ◣ and ◤ when properly rendered, but currently as â–¼ and â–²
    // The correct Unicode should be U+25B2 (▲) and U+25BC (▼) for up/down arrows
    
    fs.writeFileSync(file, str, 'utf8');
    console.log(`${file}: ${str.length === before ? 'no change' : 'modified'}`);
}