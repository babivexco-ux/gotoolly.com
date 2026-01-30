Local vendor files for AI models

Purpose:
- Place production builds of TensorFlow.js and BodyPix here to avoid CDN/CSP issues.

Files expected:
- tf.min.js -> A minified build of TensorFlow.js
- body-pix.min.js -> A minified build of the BodyPix model

How to install:
1. Download the appropriate builds (for web usage) from the official sources:
   - TensorFlow.js (e.g., https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.8.0/dist/tf.min.js)
   - BodyPix (e.g., https://cdn.jsdelivr.net/npm/@tensorflow-models/body-pix@2.0.5/dist/body-pix.min.js)
2. Save them as `tf.min.js` and `body-pix.min.js` inside this directory.

Notes:
- The repo currently contains placeholder files so the loader can attempt to fetch local scripts first.
- Replace placeholders with the real builds to make AI models work on hosted site where CDN access is restricted (CSP, proxy, offline, etc.).
