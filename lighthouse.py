#!/usr/bin/env python3
"""Run Lighthouse audit and print accessibility/SEO scores."""
import json
import os
import subprocess
import sys
import time
import urllib.request

PORT = 4175
URL = f'http://localhost:{PORT}/'

# Wait for server
for i in range(20):
    try:
        urllib.request.urlopen(URL, timeout=3)
        print(f'Server ready on {URL}')
        break
    except Exception as e:
        print(f'Waiting... ({i}) {e}')
        time.sleep(1)
else:
    print('Server not ready')
    sys.exit(1)

# Run Lighthouse
print('Running Lighthouse...')
result = subprocess.run(
    ['npx', 'lighthouse', URL,
     '--output=json', '--output-path=./lighthouse-report.json',
     '--port', str(PORT),
     '--chrome-flags=--headless --no-sandbox'],
    capture_output=True, text=True, timeout=180
)

# Print result
print('STDOUT:', result.stdout[-2000:] if result.stdout else 'none')
print('STDERR:', result.stderr[-2000:] if result.stderr else 'none')
print('Return code:', result.returncode)

report_path = '/workspace/lighthouse-report.json'
if not os.path.exists(report_path):
    report_path = 'C:\\Code\\Personal porfolio\\lighthouse-report.json'
    
if os.path.exists(report_path):
    with open(report_path) as f:
        report = json.load(f)
    categories = report.get('categories', {})
    for name, cat in categories.items():
        score = cat.get('score', 0)
        print(f'{name}: {score * 100:.0f}')
else:
    print('No report file generated')