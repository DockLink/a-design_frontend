import { NextRequest, NextResponse } from "next/server";

const BACKEND_FILE_URL =
  (process.env.BACKEND_API_URL ?? "http://localhost:3000/v2").replace(
    /\/v\d+\/?$/,
    ""
  );

type RouteContext = { params: Promise<{ projectId: string }> };

function unauthorized() {
  return NextResponse.json({ statusCode: 401, message: "Unauthorized" }, { status: 401 });
}

export async function POST(req: NextRequest, context: RouteContext) {
  const authorization = req.headers.get("authorization");
  if (!authorization) return unauthorized();

  const { projectId } = await context.params;

  // Forward the multipart/form-data body as-is
  const formData = await req.formData();

  const res = await fetch(`${BACKEND_FILE_URL}/projects/${projectId}/files/upload`, {
    method: "POST",
    headers: { Authorization: authorization },
    body: formData,
    cache: "no-store",
  });

  const body = await res.json().catch(() => ({}));

  if (!res.ok) {
    return NextResponse.json(body, { status: res.status });
  }

  return NextResponse.json(body);
}
