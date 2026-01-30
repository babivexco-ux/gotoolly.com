#!/usr/bin/env python3
"""
Batch-fix root-absolute paths in HTML files for GitHub Pages project site.
This script is now opt-in: it performs a dry-run by default and requires --apply to write changes.
It replaces occurrences like href="/... and src="/... (and single-quote variants) with a repo prefix like '/gotoolly.com/...'.
Usage: python scripts/fix_paths.py --prefix /gotoolly.com [--apply]
"""
import argparse
from pathlib import Path

parser = argparse.ArgumentParser(description='Add repo prefix to root-absolute paths (dry-run by default)')
parser.add_argument('--prefix', default='/gotoolly.com', help='Prefix to add to root paths (e.g., /gotoolly.com)')
parser.add_argument('--apply', action='store_true', help='Write changes. Default: dry-run')
args = parser.parse_args()

ROOT = Path(__file__).resolve().parents[1]
count = 0
files_updated = []

for path in ROOT.rglob('*.html'):
    text = path.read_text(encoding='utf-8')
    new_text = text

    prefix = args.prefix.rstrip('/')

    # Replace double-quote attributes
    new_text = new_text.replace(' href="/', f' href="{prefix}/')
    new_text = new_text.replace(' src="/', f' src="{prefix}/')

    # Replace single-quote attributes
    new_text = new_text.replace(" href='/", f" href='{prefix}/")
    new_text = new_text.replace(" src='/", f" src='{prefix}/")

    # Some inline JS uses patterns like l1.href = '/assets/...'
    new_text = new_text.replace("'/assets/", f"'{prefix}/assets/")
    new_text = new_text.replace('"/assets/', f'"{prefix}/assets/')

    if new_text != text:
        files_updated.append(str(path))
        if args.apply:
            path.write_text(new_text, encoding='utf-8')
            count += 1

if args.apply:
    print(f"Updated {count} HTML files")
    for f in files_updated:
        print(f)
else:
    print(f"Dry-run: {len(files_updated)} files would be modified. Run with --apply to write changes.")