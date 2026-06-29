import { NextRequest, NextResponse } from "next/server";

import { backendFetch } from "@/lib/api/backend";
import type { TaskableHoldRequest } from "@/types/hold-requests";

type RouteContext = { params: Promise<{ id: string }> };

function unauthorized() {
  return NextResponse.json({ statusCode: 401, message: "Unauthorized" }, { status: 401 });
}

export async function GET(req: NextRequest, context: RouteContext) {
  const authorization = req.headers.get("authorization");
  if (!authorization) return unauthorized();

  const { id } = await context.params;
  const result = await backendFetch<TaskableHoldRequest>(
    `/taskable-hold-requests/${id}`,
    { method: "GET", headers: { Authorization: authorization } }
  );

  if (!result.ok) return NextResponse.json(result.error, { status: result.status });
  return NextResponse.json(result.data);
}

export async function PATCH(req: NextRequest, context: RouteContext) {
  const authorization = req.headers.get("authorization");
  if (!authorization) return unauthorized();

  const { id } = await context.params;
  const body = await req.json();
  const result = await backendFetch<TaskableHoldRequest>(
    `/taskable-hold-requests/${id}`,
    {
      method: "PATCH",
      headers: { Authorization: authorization },
      body: JSON.stringify(body),
    }
  );

  if (!result.ok) return NextResponse.json(result.error, { status: result.status });
  return NextResponse.json(result.data);
}

export async function DELETE(req: NextRequest, context: RouteContext) {
  const authorization = req.headers.get("authorization");
  if (!authorization) return unauthorized();

  const { id } = await context.params;
  const result = await backendFetch<{ success: boolean }>(
    `/taskable-hold-requests/${id}`,
    { method: "DELETE", headers: { Authorization: authorization } }
  );

  if (!result.ok) return NextResponse.json(result.error, { status: result.status });
  return NextResponse.json(result.data);
}
