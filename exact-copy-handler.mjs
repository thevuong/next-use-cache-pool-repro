// Minimal 'use cache' handler that stores each value as an exact-size copy.
// Same budget as the default handler; tags are ignored to keep it short.
const MAX_BYTES = 50 * 1024 * 1024;
const entries = new Map();
const pending = new Map();
let total = 0;

export default {
  async get(key) {
    await pending.get(key);
    const stored = entries.get(key);
    if (!stored || Date.now() > stored.entry.timestamp + stored.entry.revalidate * 1000) return undefined;
    entries.delete(key);
    entries.set(key, stored);
    return {
      ...stored.entry,
      value: new ReadableStream({
        start(controller) {
          controller.enqueue(stored.value);
          controller.close();
        },
      }),
    };
  },
  async set(key, pendingEntry) {
    let done;
    pending.set(key, new Promise((resolve) => (done = resolve)));
    try {
      const { value: stream, ...entry } = await pendingEntry;
      const chunks = [];
      for await (const chunk of stream) chunks.push(chunk);
      const value = new Uint8Array(chunks.reduce((sum, chunk) => sum + chunk.byteLength, 0));
      let offset = 0;
      for (const chunk of chunks) {
        value.set(chunk, offset);
        offset += chunk.byteLength;
      }
      const old = entries.get(key);
      if (old) total -= old.value.byteLength;
      entries.delete(key);
      entries.set(key, { entry, value });
      total += value.byteLength;
      for (const [oldest, stored] of entries) {
        if (total <= MAX_BYTES) break;
        entries.delete(oldest);
        total -= stored.value.byteLength;
      }
    } finally {
      done();
      pending.delete(key);
    }
  },
  async refreshTags() {},
  async getExpiration() {
    return 0;
  },
  async updateTags() {},
};
