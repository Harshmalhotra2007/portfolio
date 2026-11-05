"""Run Lighthouse via Playwright and capture scores."""
import json
import subprocess
import sys
import time
import os

# Start preview server
proc = subprocess.Popen(
    ['npm', 'run', 'preview'],
    cwd='C:\\Code\\Personal porfolio',
    stdout=subprocess.PIPE,
    stderr=subprocess.PIPE
)

# Wait for server
time.sleep(5)

# Check server is up
import urllib.request
for _ in range(10):
    try:
        urllib.request.urlopen('http://localhost:4173/')
        break
    except Exception:
        time.sleep(1)

# Run Lighthouse
result = subprocess.run(
    ['npx', 'lighthouse', 'http://localhost:4173',
     '--output=json', '--output-path=./lighthouse-report.json',
     '--chrome-flags=--headless --no-sandbox'],
    cwd='C:\\Code\\Personal porfolio',
    capture_output=True, text=True, timeout=120
)

print('STDOUT:', result.stdout[-2000:] if result.stdout else '')
print('STDERR:', result.stderr[-2000:] if result.stderr else '')

# Read report
if os.path.exists('C:\\Code\\Personal porfolio\\lighthouse-report.json'):
    with open('C:\\Code\\Personal porfolio\\lighthouse-report.json') as f:
        report = json.load(f)
    categories = report.get('categories', {})
    for name, cat in categories.items():
        print(f"{name}: {cat.get('score', 0) * 100:.0f}")
else:
    print('No report file generated')

proc.terminate()