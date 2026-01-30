#!/usr/bin/env python3
"""
generate_clean_pages.py

Purpose:
 - For GitHub Pages (static host), create directory-based clean URL copies from files under /pages/
   e.g. pages/contact.html -> /contact/index.html
 - Optionally add a <link rel="canonical"> tag to legacy /pages/... files pointing to their clean URL
 - Optionally add a meta refresh redirect in legacy page to forward visitors to the clean URL
 - Safe: creates backups (.bak) before modifying files and supports dry-run

Usage examples:
 - Dry-run listing planned changes:
     python scripts/generate_clean_pages.py --root .
 - Create clean pages and update old pages with canonical only:
     python scripts/generate_clean_pages.py --apply --canonical-old --domain https://gotoolly.com
 - Add meta-refresh redirect to legacy pages (not recommended for SEO long-term):
     python scripts/generate_clean_pages.py --apply --redirect-old --redirect-type meta

Notes:
 - This script is intentionally conservative. It will not delete or overwrite existing clean copies unless --force is set.
 - It handles nested paths: pages/guides/seo.html -> guides/seo/index.html
"""

import argparse
import pathlib
import shutil
import re
from datetime import datetime

ROOT = pathlib.Path(__file__).resolve().parent.parent
PAGES_DIR = ROOT / 'pages'
EXCLUDE_DIRS = {'assets', '.git'}

HTML_EXT = '.html'

CANONICAL_RE = re.compile(r'(<link[^>]*rel=["\']canonical["\'][^>]*href=["\'])([^"\']+)(["\'][^>]*>)', re.I)


def find_page_files(root: pathlib.Path):
    if not (root / 'pages').exists():
        return []
    files = list((root / 'pages').rglob('*.html'))
    # exclude files in assets, etc (though pages should not contain these)
    results = [f for f in files if not any(p in EXCLUDE_DIRS for p in f.parts)]
    return results


def ensure_dir(path: pathlib.Path):
    path.mkdir(parents=True, exist_ok=True)


def add_canonical_to_html(content: str, canonical_url: str) -> (str, bool):
    # If a canonical exists, replace href with canonical_url; else, insert in head
    changed = False
    if CANONICAL_RE.search(content):
        new_content = CANONICAL_RE.sub(lambda m: m.group(1) + canonical_url + m.group(3), content)
        if new_content != content:
            changed = True
        return new_content, changed
    else:
        # Insert canonical just before </head>
        insert = f'  <link rel="canonical" href="{canonical_url}">\n'
        if '</head>' in content:
            new_content = content.replace('</head>', insert + '</head>')
            return new_content, True
        else:
            # fallback: append at beginning
            new_content = insert + content
            return new_content, True


def add_meta_refresh(content: str, target_url: str, seconds: int = 0) -> (str, bool):
    # Add <meta http-equiv="refresh" content="0; url=/target"> just after head
    changed = False
    meta = f'<meta http-equiv="refresh" content="{seconds}; url={target_url}">\n'
    if meta in content:
        return content, False
    if '</head>' in content:
        # insert before </head>
        new_content = content.replace('</head>', '  ' + meta + '</head>')
        return new_content, True
    else:
        new_content = meta + content
        return new_content, True


def write_backup(path: pathlib.Path):
    bak = path.with_suffix(path.suffix + '.bak')
    shutil.copy2(path, bak)
    return bak


def run(dry_run=True, apply=False, canonical_old=False, redirect_old=False, redirect_type='meta', domain='https://gotoolly.com', force=False):
    files = find_page_files(ROOT)
    created = []
    modified = []

    for f in files:
        # compute path relative to pages
        rel = f.relative_to(PAGES_DIR)
        target_dir = ROOT / rel.with_suffix('')  # e.g., pages/about.html -> /about
        target_index = target_dir / 'index.html'
        clean_url = domain.rstrip('/') + '/' + str(rel.with_suffix('')).replace('\\', '/')
        # for root index pages (e.g., pages/index.html), map to /
        if str(rel.with_suffix('')) == 'index':
            target_dir = ROOT
            target_index = ROOT / 'index.html'
            clean_url = domain.rstrip('/') + '/'

        if dry_run:
            print(f"[DRY] Will create: {target_index}  (from {f})  canonical: {clean_url}")
        else:
            # create target_dir
            if target_index.exists() and not force:
                print(f"Skipping existing target {target_index}; use --force to overwrite")
            else:
                ensure_dir(target_dir)
                # read source
                content = f.read_text(encoding='utf-8')
                # update canonical in the created clean page to point to clean URL
                new_content, changed_canon = add_canonical_to_html(content, clean_url)
                # write target_index
                write_backup_target = False
                if target_index.exists() and force:
                    write_backup_target = True
                    write_backup(target_index)
                target_index.write_text(new_content, encoding='utf-8')
                created.append(target_index)
                print(f"Created {target_index}")

            # Optionally modify old page (canonical or redirect)
            if canonical_old or redirect_old:
                orig_content = f.read_text(encoding='utf-8')
                new_orig = orig_content
                changed_any = False
                if canonical_old:
                    new_orig, changed = add_canonical_to_html(new_orig, clean_url)
                    changed_any = changed_any or changed
                if redirect_old and redirect_type == 'meta':
                    new_orig, changed = add_meta_refresh(new_orig, '/' + str(rel.with_suffix('')).replace('\\', '/'), seconds=0)
                    changed_any = changed_any or changed
                if changed_any:
                    write_backup(f)
                    f.write_text(new_orig, encoding='utf-8')
                    modified.append(f)
                    print(f"Updated legacy file {f} (canonical/redirect added)")

    print(f"Done. Created {len(created)} pages, modified {len(modified)} legacy files.")


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--apply', action='store_true', help='Actually write files (not dry-run)')
    parser.add_argument('--canonical-old', action='store_true', help='Add canonical link to legacy /pages/*.html pointing to clean URL')
    parser.add_argument('--redirect-old', action='store_true', help='Add meta-refresh redirect to legacy /pages/*.html to forward users to clean URL')
    parser.add_argument('--redirect-type', choices=['meta'], default='meta', help='Type of redirect to add to old pages (meta only for now)')
    parser.add_argument('--domain', default='https://gotoolly.com', help='Site domain used to build canonical URLs')
    parser.add_argument('--force', action='store_true', help='Overwrite existing clean copies')
    args = parser.parse_args()

    run(dry_run=not args.apply, apply=args.apply, canonical_old=args.canonical_old, redirect_old=args.redirect_old, redirect_type=args.redirect_type, domain=args.domain, force=args.force)
