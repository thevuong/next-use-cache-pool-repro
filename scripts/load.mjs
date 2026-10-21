const BASE = process.env.BASE ?? "http://localhost:3000";
const URLS = Number(process.env.URLS ?? 5000);
const CONCURRENCY = 8;
const RUN = Date.now();
const VALUE_BYTES = 1500;
const mb = (n) => (n / 1024 / 1024).toFixed(1);

const memory = async () => (await (await fetch(`${BASE}/api/memory`)).json()).arrayBuffers;

const before = await memory();
let next = 0;

await Promise.all(
  Array.from({ length: CONCURRENCY }, async () => {
    while (next < URLS) {
      const response = await fetch(`${BASE}/item-${RUN}-${next++}`);
      await response.text();
    }
  }),
);

const after = await memory();

console.log(`${URLS} distinct /[id] URLs, ~${mb(URLS * VALUE_BYTES)} MB of 'use cache' values (budget 50 MB)`);
console.log(`arrayBuffers retained after GC: +${mb(after - before)} MB`);
