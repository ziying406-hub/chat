const assert = require('node:assert/strict');

(async () => {
  const { createServer } = await import('vite');
  const vite = await createServer({ root: __dirname, logLevel: 'error', server: { middlewareMode: true } });
  try {
    const { formatVoiceDuration } = await vite.ssrLoadModule('/src/utils/format.ts');

    assert.equal(formatVoiceDuration(0), '');
    assert.equal(formatVoiceDuration(undefined), '');
    assert.equal(formatVoiceDuration(8), '8"');
    console.log('Unavailable voice durations do not render a zero-second label.');
  } finally {
    await vite.close();
  }
})().catch((error) => { console.error(error); process.exit(1); });
