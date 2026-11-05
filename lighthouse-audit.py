"""Run Lighthouse audit via Playwright + Lighthouse CLI."""
import json
import os
import subprocess
import sys
import time
import urllib.request

# Wait for server
for _ in range(15):
    try:
        urllib.request.urlopen('http://localhost:4173/')
        break
    except Exception:
        time.sleep(1)

# Find npx
npx_path = None
for candidate in ['npx', 'npx.cmd']:
    try:
        r = subprocess.run(['where', candidate] if sys.platform == 'win32' else ['which', candidate],
                          capture_output=True, text=True)
        if r.returncode == 0:
            npx_path = r.stdout.strip().split('\n')[0]
            break
    except Exception:
        pass

if not npx_path:
    # Try finding node_modules/.bin/lighthouse
    for root, dirs, files in os.walk('C:\\Code\\Personal porfolio'):
        for f in files:
            if f == 'lighthouse' or f == 'lighthouse.js':
                npx_path = os.path.join(root, f)
                break
        if npx_path:
            break

print(f'Using: {npx_path}')

# Run Lighthouse
result = subprocess.run(
    [npx_path, 'lighthouse', 'http://localhost:4173',
     '--output=json', '--output-path=./lighthouse-report.json',
     '--chrome-flags=--headless --no-sandbox --disable-gpu'],
    capture_output=True, text=True, timeout=180
)

print('STDOUT:', result.stdout[-3000:] if result.stdout else '')
print('STDERR:', result.stderr[-3000:] if result.stderr else '')

report_path = 'C:\\Code\\Personal porfolio\\lighthouse-report.json'
if os.path.exists(report_path):
    with open(report_path) as f:
        report = json.load(f)
    categories = report.get('categories', {})
    for name, cat in categories.items():
        score = cat.get('score', 0)
        print(f"{name}: {score * 100:.0f}")
    audits = report.get('audits', {})
    for key in ['largest-contentful-paint', 'cumulative-layout-shift', 'total-blocking-time', 'interactive']:
        if key in audits:
            print(f"  {key}: {audits[key].get('numericValue', 'N/A')}")
else:
    print('No report file generated')
    sys.exit(1)