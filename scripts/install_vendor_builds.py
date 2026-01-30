#!/usr/bin/env python3
"""
Download production builds of TensorFlow.js and BodyPix into assets/vendor.
Usage: python scripts/install_vendor_builds.py [--apply]
- Dry-run by default; use --apply to actually write files.
"""
import argparse
import requests
from pathlib import Path

parser = argparse.ArgumentParser()
parser.add_argument('--apply', action='store_true')
args = parser.parse_args()

ROOT = Path(__file__).resolve().parents[1]
VENDOR = ROOT / 'assets' / 'vendor'
VENDOR.mkdir(parents=True, exist_ok=True)

files = [
    ('https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.8.0/dist/tf.min.js', VENDOR / 'tf.min.js'),
    ('https://cdn.jsdelivr.net/npm/@tensorflow-models/body-pix@2.0.5/dist/body-pix.min.js', VENDOR / 'body-pix.min.js'),
]

for url, path in files:
    print(f"Would download: {url} -> {path}")
    if args.apply:
        print(f"Downloading {url}...")
        resp = requests.get(url, timeout=30)
        resp.raise_for_status()
        path.write_bytes(resp.content)
        print(f"Saved {path}")

if not args.apply:
    print('\nDry-run complete. Pass --apply to download files.')
