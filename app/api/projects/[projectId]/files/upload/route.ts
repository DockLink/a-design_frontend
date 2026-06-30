import { NextRequest, NextResponse } from "next/server";
import { Readable } from "node:stream";

const BACKEND_FILE_URL =
  (process.env.BACKEND_API_URL ?? "http://localhost:3000/v2").replace(
    /\/v\d+\/?$/,
    ""
  );

type RouteContext = { params: Promise<{ projectId: string }> };

function unauthorized() {
  return NextResponse.json(
    { statusCode: 401, message: "Unauthorized" },
    { status: 401 }
  );
}

/**
 * Convert a WHATWG ReadableStream (Next.js request body) to a Node.js Readable
 * so we can pipe it directly to the backend without buffering in memory.
 */
function toNodeReadable(stream: ReadableStream<Uint8Array>): Readable {
  const reader = stream.getReader();
  return new Readable({
    async read() {
      try {
        const { done, value } = await reader.read();
        if (done) {
          this.push(null);
        } else {
          this.push(Buffer.from(value));
        }
      } catch (err) {
        this.destroy(err as Error);
      }
    },
  });
}

// Allow up to 5 minutes for very large uploads (Vercel Pro: 60 s max; self-hosted: no limit).
export const maxDuration = 300;

export async function POST(req: NextRequest, context: RouteContext) {
  const authorization = req.headers.get("authorization");
  if (!authorization) return unauthorized();

  const { projectId } = await context.params;
  const contentType = req.headers.get("content-type") ?? "";

  // Stream the raw multipart body straight to the backend instead of
  // buffering with req.formData() — this is the key fix for large files.
  const body = req.body
    ? (toNodeReadable(req.body) as unknown as BodyInit)
    : undefined;

  const res = await fetch(
    `${BACKEND_FILE_URL}/projects/${projectId}/files/upload`,
    {
      method: "POST",
      headers: {
        Authorization: authorization,
        // Forward the content-type with the multipart boundary.
        ...(contentType ? { "content-type": contentType } : {}),
      },
      body,
      // @ts-expect-error — Node.js fetch (undici) supports duplex streaming.
      duplex: "half",
      cache: "no-store",
    }
  );

  const responseBody = await res.json().catch(() => ({}));

  if (!res.ok) {
    return NextResponse.json(responseBody, { status: res.status });
  }

  return NextResponse.json(responseBody);
}
