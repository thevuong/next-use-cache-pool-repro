import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  // EXACT_COPY=1 on both `pnpm build` and `pnpm start`: the workaround, a handler that stores exact-size copies.
  ...(process.env.EXACT_COPY ? { cacheHandlers: { default: require.resolve("./exact-copy-handler.mjs") } } : {}),
};

export default nextConfig;
