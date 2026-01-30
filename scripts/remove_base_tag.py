#!/usr/bin/env python3
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
count = 0
for path in ROOT.rglob('*.html'):
    text = path.read_text(encoding='utf-8')
    new = text.replace('\n    <base href="/gotoolly.com/">', '')
    new = new.replace('<base href="/gotoolly.com/">\n', '')
    new = new.replace('<base href="/gotoolly.com/">', '')
    if new != text:
        path.write_text(new, encoding='utf-8')
        count += 1
print(f'Removed base tag from {count} files')