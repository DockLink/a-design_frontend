import { NextRequest, NextResponse } from "next/server";

const BACKEND_API_URL =
  process.env.BACKEND_API_URL ?? "http://localhost:3000/v2";

function unauthorized() {
  return NextResponse.json({ statusCode: 401, message: "Unauthorized" }, { status: 401 });
}

export async function POST(req: NextRequest) {
  const authorization = req.headers.get("authorization");
  if (!authorization) return unauthorized();

  const formData = await req.formData();
  const res = await fetch(`${BACKEND_API_URL}/storage/upload`, {
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
