import { NextRequest, NextResponse } from "next/server";
import { Readable } from "node:stream";

const BACKEND_API_URL =
  process.env.BACKEND_API_URL ?? "http://localhost:3000/v2";

function unauthorized() {
  return NextResponse.json({ statusCode: 401, message: "Unauthorized" }, { status: 401 });
}

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

async function parseResponseBody(res: Response): Promise<unknown> {
  const text = await res.text();
  if (!text) return {};
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return { message: text.trim() };
  }
}

// Allow time for larger gallery photo uploads on self-hosted deployments.
export const maxDuration = 300;

export async function POST(req: NextRequest) {
  const authorization = req.headers.get("authorization");
  if (!authorization) return unauthorized();

  const contentType = req.headers.get("content-type") ?? "";

  // Stream the raw multipart body to the backend instead of buffering with
  // req.formData() — avoids Next.js "Request Entity Too Large" on big photos.
  const body = req.body
    ? (toNodeReadable(req.body) as unknown as BodyInit)
    : undefined;

  const res = await fetch(`${BACKEND_API_URL}/storage/upload`, {
    method: "POST",
    headers: {
      Authorization: authorization,
      ...(contentType ? { "content-type": contentType } : {}),
    },
    body,
    // @ts-expect-error — Node.js fetch (undici) supports duplex streaming.
    duplex: "half",
    cache: "no-store",
  });

  const responseBody = await parseResponseBody(res);

  if (!res.ok) {
    return NextResponse.json(responseBody, { status: res.status });
  }

  return NextResponse.json(responseBody);
}
