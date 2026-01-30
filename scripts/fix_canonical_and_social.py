#!/usr/bin/env python3
"""
Fix <link rel="canonical">, og:url, twitter:url, and og/twitter image tags to be absolute
using the given domain. Dry-run by default; use --apply to write changes.
"""
import argparse
from pathlib import Path
import re

parser = argparse.ArgumentParser()
parser.add_argument('--domain', default='https://gotoolly.netlify.app')
parser.add_argument('--apply', action='store_true')
args = parser.parse_args()

ROOT = Path(__file__).resolve().parents[1]
changed = []

# Helpers

def page_url_for(path: Path, domain: str) -> str:
    rel = path.relative_to(ROOT).as_posix()
    if rel.endswith('index.html'):
        parent = Path(rel).parent.as_posix()
        if parent == '.':
            return domain + '/'
        else:
            return domain + '/' + parent
    else:
        # remove .html extension
        return domain + '/' + rel[:-5]

can_re = re.compile(r'<link\s+rel=(?:"|\')canonical(?:"|\')\s+href=(?:"|\')([^"\']*)(?:"|\')\s*>', re.I)
og_url_re = re.compile(r'<meta\s+property=(?:"|\')og:url(?:"|\')\s+content=(?:"|\')([^"\']*)(?:"|\')\s*>', re.I)
twitter_url_re = re.compile(r'<meta\s+name=(?:"|\')twitter:url(?:"|\')\s+content=(?:"|\')([^"\']*)(?:"|\')\s*>', re.I)
og_image_re = re.compile(r'<meta\s+property=(?:"|\')og:image(?:"|\')\s+content=(?:"|\')([^"\']*)(?:"|\')\s*>', re.I)
twitter_image_re = re.compile(r'<meta\s+name=(?:"|\')twitter:image(?:"|\')\s+content=(?:"|\')([^"\']*)(?:"|\')\s*>', re.I)

assets_pattern = re.compile(r'^(?:https?://)?(?:www\.)?[^/]*(/assets/.*)$')

for path in ROOT.rglob('*.html'):
    text = path.read_text(encoding='utf-8')
    original = text
    url = page_url_for(path, args.domain)

    # canonical
    def repl_canonical(m):
        return f'<link rel="canonical" href="{url}">' 
    text = can_re.sub(repl_canonical, text)

    # og:url
    text = og_url_re.sub(f'<meta property="og:url" content="{url}">', text)

    # twitter:url
    text = twitter_url_re.sub(f'<meta name="twitter:url" content="{url}">', text)

    # og:image
    def fix_image(m):
        src = m.group(1)
        # if src already absolute on other host or starts with /assets or assets/ or https://assets
        m2 = assets_pattern.match(src)
        if m2:
            asset_path = m2.group(1)
            return f'<meta property="og:image" content="{args.domain}{asset_path}">' 
        # If it is relative like "assets/..."
        if src.startswith('assets/') or src.startswith('/assets/'):
            path_part = src if src.startswith('/') else '/' + src
            return f'<meta property="og:image" content="{args.domain}{path_part}">' 
        return m.group(0)

    text = og_image_re.sub(fix_image, text)

    # twitter:image
    def fix_t_image(m):
        src = m.group(1)
        m2 = assets_pattern.match(src)
        if m2:
            asset_path = m2.group(1)
            return f'<meta name="twitter:image" content="{args.domain}{asset_path}">'
        if src.startswith('assets/') or src.startswith('/assets/'):
            path_part = src if src.startswith('/') else '/' + src
            return f'<meta name="twitter:image" content="{args.domain}{path_part}">'
        return m.group(0)

    text = twitter_image_re.sub(fix_t_image, text)

    if text != original:
        changed.append(str(path))
        if args.apply:
            path.write_text(text, encoding='utf-8')

if args.apply:
    print(f'Updated {len(changed)} files:')
    for p in changed:
        print(p)
else:
    print('Dry-run: would update', len(changed), 'files')
    for p in changed[:40]:
        print(p)
    if len(changed) > 40:
        print('...')