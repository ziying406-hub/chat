const assert = require('node:assert/strict');

(async () => {
  const { createServer } = await import('vite');
  const vite = await createServer({ root: __dirname, logLevel: 'error', server: { middlewareMode: true } });
  try {
    const { formatMessageDate, isSameCalendarDay } = await vite.ssrLoadModule('/src/utils/format.ts');
    const first = 1788934451423; // 2026-09-09 14:14:11 Asia/Kuala_Lumpur
    const sameDay = 1788969599000;
    const nextDay = 1788969600000;

    assert.equal(formatMessageDate(first), '9月9日');
    assert.equal(isSameCalendarDay(first, sameDay), true);
    assert.equal(isSameCalendarDay(first, nextDay), false);
    console.log('OpenIM millisecond timestamps render the expected calendar date.');
  } finally {
    await vite.close();
  }
})().catch((error) => { console.error(error); process.exit(1); });
