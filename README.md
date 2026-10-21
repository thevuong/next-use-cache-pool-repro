# `'use cache'` default handler: 64 KB buffer-pool slab per small entry

Next's default `'use cache'` handler (`createDefaultCacheHandler`) stores each value as the result of
`streamToBuffer`, which is `Buffer.concat`. A result smaller than `Buffer.poolSize >>> 1` is a slice of
Node's shared 64 KB pool slab, so every long-lived small entry keeps a whole slab alive. The LRU sizes the
entry by `value.byteLength`, so `cacheMaxMemorySize` counts a fraction of the memory the cache holds.

`app/[id]/page.tsx` renders at request time and calls a `'use cache'` function keyed by the URL segment
(about 1.5 KB per entry). `scripts/load.mjs` requests 5,000 distinct URLs and reads
`process.memoryUsage().arrayBuffers` after a full GC (`/api/memory`, server started with `--expose-gc`).

## Run

Node 24.

```bash
pnpm install
pnpm build && pnpm start      # terminal 1
pnpm load                     # terminal 2
```

With the workaround, a handler that stores exact-size copies (`exact-copy-handler.mjs`):

```bash
EXACT_COPY=1 pnpm build && EXACT_COPY=1 pnpm start
pnpm load
```

The handler alone, without a server: `pnpm handler` (and `EXACT_COPY=1 pnpm handler`).

## Results (macOS arm64, Node 24.21.0, next 16.4.1)

| Handler | Values stored | `arrayBuffers` retained after GC |
| --- | --- | --- |
| default | ~7.2 MB (5,000 × 1.5 KB) | +116 to +127 MB |
| exact-size copy | ~7.2 MB | +7.5 MB |

A heap snapshot of the default run shows ~1,780 retained 64 KB `ArrayBuffer`s, each retained through
`Buffer.buffer ← Object.value ← LRUNode.data`, where the objects are the default handler's entries
(`entry, value, isErrored`) keyed by the `'use cache'` function id and `["item-…"]`.
