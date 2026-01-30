#!/usr/bin/env python3
"""
Remove the legacy "/gotoolly.com" root prefix from HTML/JS/CSS files.
"""
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
exts = ('.html', '.js', '.css')
count = 0
files = []
for path in ROOT.rglob('*'):
    if path.suffix.lower() in exts:
        text = path.read_text(encoding='utf-8')
        if '/gotoolly.com' in text:
            new = text.replace('/gotoolly.com', '')
            path.write_text(new, encoding='utf-8')
            files.append(str(path))
            count += 1
print(f'Removed prefix in {count} files')
for f in files:
    print(f)
