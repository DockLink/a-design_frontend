import { NextRequest, NextResponse } from "next/server";

import { backendFetch } from "@/lib/api/backend";

function unauthorized() {
  return NextResponse.json({ statusCode: 401, message: "Unauthorized" }, { status: 401 });
}

export async function POST(req: NextRequest) {
  const authorization = req.headers.get("authorization");
  if (!authorization) return unauthorized();

  const body = await req.json();

  const result = await backendFetch<Record<string, unknown[]>>("/tasks/batch-assignees", {
    method: "POST",
    headers: { Authorization: authorization },
    body: JSON.stringify(body),
  });

  if (!result.ok) return NextResponse.json(result.error, { status: result.status });
  return NextResponse.json(result.data);
}
