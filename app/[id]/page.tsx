import { connection } from "next/server";
import { Suspense } from "react";

// About 1.5 KB per entry, keyed by the URL segment: one cache entry per distinct URL.
async function getItem(id: string) {
  "use cache";

  return { id, description: "x".repeat(1500) };
}

async function Item({ params }: { params: Promise<{ id: string }> }) {
  // Request-time rendering, like a page that reads cookies or headers: no per-URL page cache.
  await connection();
  const { id } = await params;
  const item = await getItem(id);

  return (
    <p>
      {item.id}: {item.description.length} bytes
    </p>
  );
}

export default function Page({ params }: PageProps<"/[id]">) {
  return (
    <Suspense>
      <Item params={params} />
    </Suspense>
  );
}
