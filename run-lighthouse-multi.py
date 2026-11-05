#!/usr/bin/env python3
"""Run Lighthouse audits on multiple portfolio pages."""
import json
import subprocess
import sys

def run_lighthouse(url, output_path):
    result = subprocess.run(
        ['C:\\Users\\harsh\\AppData\\Roaming\\npm\\npx', 'lighthouse', url,
         '--output=json', '--output-path=' + output_path,
         '--chrome-flags=--headless --no-sandbox'],
        capture_output=True, text=True, timeout=180,
        cwd='C:\\Code\\Personal porfolio'
    )
    
    try:
        with open(output_path) as f:
            report = json.load(f)
        categories = report.get('categories', {})
        return {
            'accessibility': categories.get('accessibility', {}).get('score', 0) * 100,
            'seo': categories.get('seo', {}).get('score', 0) * 100,
            'performance': categories.get('performance', {}).get('score', 0) * 100,
        }
    except Exception as e:
        print(f'Error reading {output_path}: {e}')
        return None

pages = [
    ('http://localhost:4173/', 'lighthouse-index.json'),
    ('http://localhost:4173/projects/weather.html', 'lighthouse-weather.json'),
    ('http://localhost:4173/projects/expense.html', 'lighthouse-expense.json'),
]

print("=" * 60)
print("Lighthouse Audit Results")
print("=" * 60)

results = []
for url, output in pages:
    print(f"\nAuditing: {url}")
    scores = run_lighthouse(url, output)
    if scores:
        page_name = url.split('/')[-1].replace('.html', '') or 'index'
        acc_pass = "PASS" if scores['accessibility'] >= 90 else "FAIL"
        seo_pass = "PASS" if scores['seo'] >= 90 else "FAIL"
        print(f"  Accessibility: {scores['accessibility']:.0f} ({acc_pass})")
        print(f"  SEO:           {scores['seo']:.0f} ({seo_pass})")
        print(f"  Performance:   {scores['performance']:.0f}")
        results.append((page_name, scores['accessibility'], scores['seo']))
    else:
        print(f"  ERROR: Could not get scores")
        results.append((url, 0, 0))

print("\n" + "=" * 60)
print("SUMMARY (Accessibility ≥90, SEO ≥90)")
print("=" * 60)
all_pass = True
for name, acc, seo in results:
    acc_ok = "✓" if acc >= 90 else "✗"
    seo_ok = "✓" if seo >= 90 else "✗"
    if acc < 90 or seo < 90:
        all_pass = False
    print(f"{name}: Acc {acc_ok}{acc:.0f} | SEO {seo_ok}{seo:.0f}")

print("\n" + ("ALL AUDITS PASSED ✓" if all_pass else "SOME AUDITS FAILED ✗") + "\n")