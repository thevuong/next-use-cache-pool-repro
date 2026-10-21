import { connection } from "next/server";

export async function GET() {
  await connection();
  (globalThis as { gc?: () => void }).gc?.();

  return Response.json(process.memoryUsage());
}
