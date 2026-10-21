const { createDefaultCacheHandler } = require("next/dist/server/lib/cache-handlers/default.js");

const ENTRIES = 3000;
const VALUE_BYTES = 1500;
const mb = (n) => (n / 1024 / 1024).toFixed(1);

const entry = (bytes) => ({
  value: new ReadableStream({ start(c) { c.enqueue(new Uint8Array(bytes)); c.close(); } }),
  tags: [], stale: 300, timestamp: Date.now(), expire: 300, revalidate: 120,
});

if (process.env.EXACT_COPY) {
  const concat = Buffer.concat;
  Buffer.concat = (...args) => new Uint8Array(concat(...args));
}

(async () => {
  const handler = createDefaultCacheHandler(50 * 1024 * 1024);
  globalThis.gc();
  const before = process.memoryUsage().arrayBuffers;

  for (let i = 0; i < ENTRIES; i++) {
    await handler.set(`key-${i}`, Promise.resolve(entry(VALUE_BYTES)));
    Buffer.from("x".repeat(20_000)); // other request work using the same buffer pool
  }

  globalThis.gc();
  const after = process.memoryUsage().arrayBuffers;
  console.log(`LRU counts ${mb(ENTRIES * VALUE_BYTES)} MB, arrayBuffers retained after GC: ${mb(after - before)} MB`);
})();
