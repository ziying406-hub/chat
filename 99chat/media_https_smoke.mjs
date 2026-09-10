// Run with the HTTPS /object/... URL of a newly uploaded test image.
// Detects missing object proxying, HTTP signed URLs and SPA/404 image responses.
import assert from 'node:assert/strict'

const objectURL = new URL(process.argv[2])
assert.equal(objectURL.protocol, 'https:')
const redirect = await fetch(objectURL, { redirect: 'manual' })
assert.equal(redirect.status, 302, 'Object route must resolve to signed storage')
const storageURL = new URL(redirect.headers.get('location'), objectURL)
assert.equal(storageURL.protocol, 'https:', 'Storage must not cause mixed content')
const image = await fetch(storageURL)
assert.equal(image.status, 200, 'Signed storage download must succeed')
assert.match(image.headers.get('content-type') || '', /^image\//)
assert.ok((await image.arrayBuffer()).byteLength > 0, 'Image must not be empty')
console.log('PASS: HTTPS object redirect and signed image download')
