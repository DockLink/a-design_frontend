import { NextRequest, NextResponse } from "next/server";

import { backendFetch } from "@/lib/api/backend";
import type { TaskWithAssignees } from "@/types/tasks";

type RouteContext = { params: Promise<{ taskId: string }> };

function unauthorized() {
  return NextResponse.json({ statusCode: 401, message: "Unauthorized" }, { status: 401 });
}

export async function GET(req: NextRequest, context: RouteContext) {
  const authorization = req.headers.get("authorization");
  if (!authorization) return unauthorized();

  const { taskId } = await context.params;
  const result = await backendFetch<TaskWithAssignees>(`/tasks/${taskId}/assignees`, {
    method: "GET",
    headers: { Authorization: authorization },
  });

  if (!result.ok) return NextResponse.json(result.error, { status: result.status });
  return NextResponse.json(result.data);
}

export async function PUT(req: NextRequest, context: RouteContext) {
  const authorization = req.headers.get("authorization");
  if (!authorization) return unauthorized();

  const { taskId } = await context.params;
  const body = await req.json();

  const result = await backendFetch<TaskWithAssignees>(`/tasks/${taskId}/assignees`, {
    method: "PUT",
    headers: { Authorization: authorization },
    body: JSON.stringify(body),
  });

  if (!result.ok) return NextResponse.json(result.error, { status: result.status });
  return NextResponse.json(result.data);
}
