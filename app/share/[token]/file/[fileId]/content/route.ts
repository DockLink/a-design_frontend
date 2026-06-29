import { NextRequest, NextResponse } from "next/server";

const BACKEND_FILE_URL =
  (process.env.BACKEND_API_URL ?? "http://localhost:3000/v2").replace(
    /\/v\d+\/?$/,
    ""
  );

type RouteContext = { params: Promise<{ token: string; fileId: string }> };

/**
 * Public proxy — no auth required.
 * Forwards to the NestJS ShareController which validates the token,
 * checks expiry/revocation, then streams the S3 object back.
 * Content-Disposition (inline vs attachment) is set by the backend
 * based on the share link's allowDownload flag.
 */
export async function GET(req: NextRequest, context: RouteContext) {
  const { token, fileId } = await context.params;

  const backendRes = await fetch(
    `${BACKEND_FILE_URL}/share/${token}/file/${fileId}/content`,
    { cache: "no-store" }
  );

  if (!backendRes.ok) {
    const status = backendRes.status;
    if (status === 404) {
      return new NextResponse("Share link not found or has expired.", { status: 404 });
    }
    return new NextResponse("Failed to retrieve file.", { status });
  }

  // Forward the stream with the original headers from the backend
  const contentType = backendRes.headers.get("content-type") ?? "application/octet-stream";
  const contentDisposition = backendRes.headers.get("content-disposition") ?? "inline";
  const cacheControl = backendRes.headers.get("cache-control") ?? "private, no-store";

  return new NextResponse(backendRes.body, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": contentDisposition,
      "Cache-Control": cacheControl,
    },
  });
}
