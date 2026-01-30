#!/usr/bin/env python3
"""
Replace legacy domain occurrences with the Netlify deployment domain.
Usage: python scripts/update_domain.py --domain https://gotoolly.netlify.app [--apply]
Default is dry-run unless --apply is passed.
"""
import argparse
from pathlib import Path

parser = argparse.ArgumentParser(description='Update legacy domain to new domain in files')
parser.add_argument('--domain', default='https://gotoolly.netlify.app', help='New canonical domain')
parser.add_argument('--apply', action='store_true', help='Write changes. Default: dry-run')
args = parser.parse_args()

ROOT = Path(__file__).resolve().parents[1]
OLDS = ['https://gotoolly.com', 'https://www.gotoolly.com']
NEW = args.domain

files_to_check = [
    'sitemap.xml',
    'robots.txt',
    'humans.txt',
    'tools/qr-code-generator.html',
]

updated = []
for rel in files_to_check:
    p = ROOT / rel
    if not p.exists():
        continue
    text = p.read_text(encoding='utf-8')
    replaced = False
    new_text = text
    for old in OLDS:
        if old in new_text:
            new_text = new_text.replace(old, NEW)
            replaced = True

    if replaced:
        if args.apply:
            p.write_text(new_text, encoding='utf-8')
            updated.append(str(p))
        else:
            print(f"[DRY-RUN] Would update: {p}")

if args.apply:
    print(f"Updated {len(updated)} files:")
    for f in updated:
        print(f)
else:
    print('\nDry-run complete. Run with --apply to make changes.')
