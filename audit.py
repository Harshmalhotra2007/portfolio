#!/usr/bin/env python3
"""Audit local portfolio for accessibility (WCAG) and SEO."""
from playwright.sync_api import sync_playwright
import json
import time
import subprocess
import sys
import urllib.request

PORT = 4175
URL = f'http://localhost:{PORT}/'

# First check if server is running, if not start it
try:
    urllib.request.urlopen(URL, timeout=2)
    print(f'Server already running on {URL}')
except:
    print('Starting server...')
    subprocess.Popen(['npx', 'vite', 'preview', '--port', PORT], cwd='C:\\Code\\Personal porfolio')
    time.sleep(5)
    urllib.request.urlopen(URL, timeout=5)
    print(f'Server started on {URL}')

results = {}

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()
    page.goto(URL)
    page.wait_for_load_state('networkidle')
    
    # Run Lighthouse via page.evaluate (using lighthouse-ci-node if available)
    # Or just check basic accessibility elements
    
    # Check title
    title = page.title()
    results['title'] = title
    print(f'Title: {title}')
    
    # Check meta description
    meta_desc = page.evaluate('''() => {
        const m = document.querySelector('meta[name="description"]');
        return m ? m.content : null;
    }''')
    results['meta_description'] = meta_desc
    print(f'Meta description: {meta_desc}')
    
    # Check H1 tags
    h1_count = page.evaluate('''() => document.querySelectorAll('h1').length''')
    results['h1_count'] = h1_count
    print(f'H1 count: {h1_count}')
    
    # Check lang attribute
    lang = page.evaluate('''() => document.documentElement.lang''')
    results['lang'] = lang
    print(f'Language: {lang}')
    
    # Screenshot for basic check
    page.screenshot(path='C:\\Code\\Personal porfolio\\audit-screenshot.png', full_page=True)
    
    browser.close()

print('\n=== Basic SEO Check ===')
print(f'Title present: {len(title) > 0 and len(title) < 60}')
print(f'Meta description: {meta_desc is not None and len(meta_desc) > 0}')
print(f'H1 count: {h1_count == 1}')
print(f'Language declared: {len(lang) > 0}')