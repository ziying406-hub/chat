// Serve the worker dependencies from our origin and the same pinned npm package.
const { mkdirSync, copyFileSync } = require('node:fs');
const { join } = require('node:path');
const target = join(__dirname, 'public/firebase-sdk');
mkdirSync(target, { recursive: true });
for (const file of ['firebase-app-compat.js', 'firebase-messaging-compat.js']) {
  copyFileSync(join(__dirname, 'node_modules/firebase', file), join(target, file));
}
