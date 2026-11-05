#!/usr/bin/env python3
"""Run full Lighthouse audit via Playwright."""
from playwright.sync_api import sync_playwright
import urllib.request
import time
import json
import subprocess
import os

PORT = 4173
URL = f'http://localhost:{PORT}/'

# Check if server is running, start if not
try:
    urllib.request.urlopen(URL, timeout=2)
    print(f'Server running on {URL}')
except:
    print('Starting server...')
    proc = subprocess.Popen(
        ['npx', 'vite', 'preview', '--port', str(PORT)],
        cwd='C:\\Code\\Personal porfolio',
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE
    )
    time.sleep(5)
    urllib.request.urlopen(URL, timeout=5)
    print(f'Server started on {URL}')
    server_started = True
else:
    server_started = False

print('\nRunning Lighthouse via CLI...')
result = subprocess.run(
    ['npx', 'lighthouse', URL,
     '--output=json', '--output-path=./lighthouse-report.json',
     '--port', str(PORT),
     '--chrome-flags=--headless --no-sandbox'],
    capture_output=True, text=True, timeout=180,
    cwd='C:\\Code\\Personal porfolio'
)

print('STDOUT:', result.stdout[-2000:] if result.stdout else '')
print('STDERR:', result.stderr[-2000:] if result.stderr else '')

# Read report
report_path = os.path.join('C:\\Code\\Personal porfolio', 'lighthouse-report.json')
if os.path.exists(report_path):
    with open(report_path) as f:
        report = json.load(f)
    
    categories = report.get('categories', {})
    for name, cat in categories.items():
        score = cat.get('score', 0)
        print(f'{name.upper()}: {score * 100:.0f}')
    
    # Check thresholds
    acc = categories.get('accessibility', {}).get('score', 0)
    seo = categories.get('seo', {}).get('score', 0)
    
    print(f'\n=== AUDIT RESULTS ===')
    print(f'Accessibility: {acc * 100:.0f} (need ≥90): {"PASS" if acc >= 0.9 else "FAIL"}')
    print(f'SEO: {seo * 100:.0f} (need ≥90): {"PASS" if seo >= 0.9 else "FAIL"}')
else:
    print('No report generated')

# Cleanup
if server_started:
    proc.terminate()