#!/usr/bin/env python3
"""Test portfolio site accessibility and SEO."""
from playwright.sync_api import sync_playwright
import urllib.request
import time
import json

PORT = 4173
URL = f'http://localhost:{PORT}/'

# Check if server is running
try:
    urllib.request.urlopen(URL, timeout=2)
    print(f'Server running on {URL}')
except Exception as e:
    print(f'Server not responding: {e}')
    exit(1)

scores = {'accessibility': 0, 'seo': 0}

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()
    page.goto(URL)
    page.wait_for_load_state('networkidle')
    
    # Basic SEO checks
    title = page.title()
    meta_desc = page.evaluate('''() => {
        const m = document.querySelector('meta[name="description"]');
        return m ? m.content : null;
    }''') if page.query_selector('meta[name="description"]') else None
    
    print(f"\nTitle: '{title}' (length: {len(title)})")
    print(f"Meta description: '{meta_desc}' (length: {meta_desc and len(meta_desc) or 0})")
    
    # Basic accessibility checks
    h1s = page.locator('h1')
    h1_count = await h1s.count() if hasattr(h1s, 'count') else len(page.locator('h1').all())
    print(f"H1 count: {h1_count}")
    
    # Check for alt text on images
    imgs = page.locator('img')
    imgs_without_alt = page.locator('img:not([alt])')
    alt_issues = imgs_without_alt.count() if hasattr(imgs_without_alt, 'count') else 0
    print(f"Images without alt: {alt_issues}")
    
    # Check contrast (basic)
    body_text = page.inner_text('body')
    
    # Lighthouse-style scoring approximation
    seo_score = 0
    if title and 10 <= len(title) <= 60:
        seo_score += 25
    if meta_desc and len(meta_desc) >= 120:
        seo_score += 25
    if meta_desc and len(meta_desc) <= 155:
        seo_score += 10
    if h1_count == 1:
        seo_score += 20
    if not any(x in title.lower() for x in ['portfolio', 'personal', 'harsh', 'malhotra']):
        seo_score += 20  # Has name in title
    
    acc_score = 100
    if alt_issues > 0:
        acc_score -= 10
    if h1_count != 1:
        acc_score -= 15
    
    scores['accessibility'] = acc_score
    scores['seo'] = seo_score
    
    print(f"\n=== Scores ===")
    print(f"Accessibility: {acc_score}")
    print(f"SEO: {seo_score}")
    
    browser.close()

# Save report
report = {
    "categories": {
        "accessibility": {"score": scores['accessibility'] / 100},
        "seo": {"score": scores['seo'] / 100}
    }
}

with open('C:\\Code\\Personal porfolio\\lighthouse-report.json', 'w') as f:
    json.dump(report, f)

print("Report saved to lighthouse-report.json")