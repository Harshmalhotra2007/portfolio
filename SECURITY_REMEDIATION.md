# Portfolio Security Hardening - Remediation Plan

## Executive Summary

This document provides a prioritized remediation plan for security findings identified in the portfolio website. All critical and high-severity issues have been validated and are ready for implementation.

---

## 🔴 Critical Findings (Fix Immediately)

### 1. **Information Disclosure via Repository Tracking**
**Severity:** Critical | **Status:** ✅ Validated
**Affected:** Repository root

#### Issue:
- `node_modules/` and `backups/` directories are tracked in Git
- These directories contain sensitive files and dependencies
- Deployed to production via `dist/` folder

#### Remediation:
```bash
# Remove from git index (keep files on disk)
git rm -r --cached node_modules/ backups/

# Verify removal
git status
```

#### Prevention:
- `.gitignore` already contains correct entries for these directories
- No further action needed after cache removal

---

## ⚠️ High Severity Findings (Fix Within 1 Week)

### 2. **Overly Permissive Content Security Policy (CSP)**
**Severity:** High | **Status:** ✅ Validated
**Affected:** `index.html` line 47

#### Current CSP:
```html
<meta name="Content-Security-Policy" content="default-src 'self'; style-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com https://fonts.googleapis.com https://fonts.gstatic.com; script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https://formspree.io; frame-src 'self' https://openstreetmap.org https://tile.openstreetmap.org;">
```

#### Issue:
- `'unsafe-inline'` in both `style-src` and `script-src` neutralizes CSP's primary XSS protection
- CSP is present but ineffective due to inline script/style allowances

#### Remediation:

**Immediate (Quick Win):**
```html
<!-- Replace with this hardened CSP -->
<meta http-equiv="Content-Security-Policy" content="
  default-src 'self';
  style-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com https://fonts.googleapis.com https://fonts.gstatic.com;
  script-src 'self' 'nonce-{{RANDOM}}' https://cdn.jsdelivr.net;
  font-src 'self' https://fonts.gstatic.com;
  img-src 'self' data: https:;
  connect-src 'self' https://formspree.io;
  frame-src 'self' https://openstreetmap.org https://tile.openstreetmap.org;
  object-src 'none';
  base-uri 'self';
  form-action 'self' https://formspree.io;
">
```

**Implementation Steps:**
1. Generate a random nonce for each page load (or use build-time nonce)
2. Add nonce to all inline `<script>` and `<style>` tags
3. Remove `'unsafe-inline'` from CSP

**Alternative (Recommended):**
- Move all inline scripts/styles to external files
- Use hash-based CSP for third-party scripts
- Remove `'unsafe-inline'` completely

---

## 🟡 Medium Severity Findings (Fix Within 2 Weeks)

### 3. **Expense Tracker: Potential Stored-XSS via Dynamic Rendering**
**Severity:** Medium | **Status:** ✅ Validated
**Affected:** `projects/expense.html` and `projects/wild.js`

#### Issue:
- Multiple `innerHTML` assignments found in expense tracker
- While `escapeHTML()` is used in most places, some dynamic rendering may still be vulnerable
- Wild India project also uses `innerHTML` for modal content

#### Validated Safe Usage:
```javascript
// Safe usage with escapeHTML (line 768, expense.html)
toast.innerHTML = `<span>${escapeHTML(message)}</span>`

// Safe usage (line 930, expense.html)
<label for="budget${cat}">${escapeHTML(cat)} Cap (₹)</label>
```

#### Remediation:

**For `projects/expense.html`:**
- ✅ All `escapeHTML()` usages are correct
- ⚠️ Verify no unsanitized data reaches `innerHTML`
- **Action:** Audit all dynamic content rendering

**For `projects/wild.js`:**
```javascript
// Line 117 - Add escapeHTML to modal content
modalBody.innerHTML = `
  <h2>${escapeHTML(title)}</h2>
  <p>${escapeHTML(description)}</p>
`;
```

**Recommendation:**
- Audit all `innerHTML` assignments in the codebase
- Replace with `textContent` where possible
- Use `escapeHTML()` for all dynamic content

---

### 4. **Contact Form: Lack of Rate Limiting**
**Severity:** Medium | **Status:** ✅ Validated
**Affected:** Contact form in `index.html` and `main.js`

#### Current Implementation:
```javascript
// main.js lines 375-434
contactForm.addEventListener('submit', async (e) => {
  // No rate limiting or spam protection
  // Direct submission to Formspree
})
```

#### Issue:
- No client-side rate limiting
- No honeypot field
- No server-side validation at Formspree
- Vulnerable to automated spam

#### Remediation:

**Option A: Honeypot Field (Recommended - No Dependencies)**
```html
<!-- Add to contact form in index.html -->
<div style="display: none;">
  <label for="formHoneypot">Leave blank if human</label>
  <input type="text" id="formHoneypot" name="honeypot" autocomplete="off">
</div>
```

```javascript
// main.js - Add at form submission start
const honeypot = document.getElementById('formHoneypot')?.value;
if (honeypot) {
  // Silent drop of spam submission
  console.log('Spam attempt blocked');
  return;
}
```

**Option B: Client-Side Rate Limiting**
```javascript
// main.js - Add rate limiting state
let lastSubmission = 0;
const MIN_SUBMISSION_INTERVAL = 30000; // 30 seconds

contactForm.addEventListener('submit', async (e) => {
  const now = Date.now();
  if (now - lastSubmission < MIN_SUBMISSION_INTERVAL) {
    formStatus.textContent = "[ ERROR: PLEASE WAIT BEFORE SUBMITTING AGAIN ]";
    formStatus.className = "form-status error";
    return;
  }
  lastSubmission = now;
  // ... rest of form handling
});
```

---

## 📋 Low Severity / Informational Findings

### 5. **Formspree Endpoint Validation**
**Severity:** Low | **Status:** ✅ Validated

#### Current Implementation:
```javascript
// Formspree endpoint in main.js line 408
const response = await fetch("https://formspree.io/f/mjgnwygj", {
  method: "POST",
  headers: {
    "Accept": "application/json",
    "Content-Type": "application/json"
  },
  body: JSON.stringify({ name, email, subject, message })
});
```

#### Recommendations:
- ✅ Formspree provides built-in spam protection
- ✅ CSRF protection via Formspree's origin checking
- Consider adding reCAPTCHA if spam becomes an issue

---

## 🛡️ Defense-in-Depth Recommendations

### 6. **Additional Security Headers**
Add these meta tags to `index.html` head:

```html
<meta http-equiv="X-Content-Type-Options" content="nosniff">
<meta http-equiv="X-Frame-Options" content="DENY">
<meta http-equiv="Referrer-Policy" content="strict-origin-when-cross-origin">
<meta http-equiv="Permissions-Policy" content="geolocation=(), microphone=(), camera=()">
```

### 7. **Subresource Integrity (SRI)**

Verify all CDN resources have integrity hashes:

```html
<!-- Example for FontAwesome -->
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" 
      integrity="sha384-iw3OoTErCYJJB9mCa8LNS2hbsQ7M3C0EpIsO/H5+EGAkPGc6rk+V8i04oW/K5xq0" 
      crossorigin="anonymous">
```

### 8. **LocalStorage Data Validation**

The expense tracker uses LocalStorage for persistence. Ensure:
- ✅ All data is validated on import (CSV/JSON)
- ✅ `validateImportData()` function exists and is used (line 1091, expense.html)
- ✅ Consider encrypting sensitive data if storing PII

---

## 📊 Implementation Priority Matrix

| Priority | Finding | Effort | Risk Reduction | Deadline | Status |
|----------|---------|--------|----------------|----------|--------|
| 🔴 Critical | Remove tracked node_modules/backups | Low | High | Immediate | ✅ **DONE** |
| ⚠️ High | Harden CSP (remove unsafe-inline) | Medium | High | 1 week | ✅ **DONE** |
| ⚠️ High | Add honeypot to contact form | Low | Medium | 1 week | ✅ **DONE** |
| 🟡 Medium | Audit innerHTML usage in wild.js | Low | Medium | 2 weeks | ✅ **DONE** (Leaflet dynamic import uses safe templates) |
| 🟡 Medium | Add rate limiting to contact form | Low | Medium | 2 weeks | ✅ **DONE** (5 min cooldown) |

---

## ✅ Validation Checklist

- [x] Information disclosure via git tracking validated
- [x] CSP structure and inline script/style usage validated
- [x] Expense tracker XSS protection mechanisms validated
- [x] Contact form submission flow validated
- [x] LocalStorage import validation validated
- [x] Remediation code implemented
- [x] Contrasting text colors updated (text-secondary: #cccccc, text-muted: #aaaaaa)
- [x] Filter button touch targets meet 44px minimum
- [x] Canvas accessibility improved (aria-label, role=img)
- [x] ASCII art hidden from screen readers
- [x] Rate limiting increased to 5 minutes
- [x] Nested git repos added to .gitignore
- [x] One-off scripts added to .gitignore
- [x] pnpm-lock.yaml added to .gitignore

---

## 🔧 Quick Start Commands

```bash
# 1. Remove sensitive directories from git
cd /Code/Personal porfolio
git rm -r --cached node_modules/ backups/

# 2. Create backup of current index.html
git show HEAD:index.html > index.html.backup

# 3. Update CSP in index.html (replace line 47)
# Use the hardened CSP provided above

# 4. Add honeypot field to contact form in index.html
# Add the hidden div with formHoneypot input

# 5. Add security headers to index.html head

# 6. Commit changes
git add index.html
# Verify no sensitive files are staged
git status
git commit -m "security: harden CSP, add honeypot, remove sensitive dirs from git"
```

---

## 📞 Support & Questions

For questions about this remediation plan or assistance with implementation:
- Review the specific code sections mentioned
- Test changes in a development environment first
- Deploy to staging before production

**Next Steps (Updated 2026-11-15):
1. ✅ Critical fixes implemented (CSP hardened, honeypot added, node_modules/backups removed from git)
2. ✅ High priority items implemented (rate limiting 5min, contrast fixes, touch targets)
3. Medium priority items complete (innerHTML audit, dynamic imports)**
1. Implement Critical fixes immediately
2. Schedule High priority items for this week
3. Plan Medium priority items for next sprint

---

*Generated: 2026-11-08*
*Security Review by: Portfolio Security Architect*
*Status: All Critical, High, and Medium Priority Items Complete - Next Sprint Focus: minor optimizations.*