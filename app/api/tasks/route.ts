import { NextRequest, NextResponse } from "next/server";

import { backendFetch } from "@/lib/api/backend";
import type { Task, TasksListResponse } from "@/types/tasks";

function unauthorized() {
  return NextResponse.json({ statusCode: 401, message: "Unauthorized" }, { status: 401 });
}

export async function GET(req: NextRequest) {
  const authorization = req.headers.get("authorization");
  if (!authorization) return unauthorized();

  const query = req.nextUrl.search;
  const result = await backendFetch<TasksListResponse>(`/tasks${query}`, {
    method: "GET",
    headers: { Authorization: authorization },
  });

  if (!result.ok) return NextResponse.json(result.error, { status: result.status });
  return NextResponse.json(result.data);
}

export async function POST(req: NextRequest) {
  const authorization = req.headers.get("authorization");
  if (!authorization) return unauthorized();

  const body = await req.json();
  const result = await backendFetch<Task>("/tasks", {
    method: "POST",
    headers: { Authorization: authorization },
    body: JSON.stringify(body),
  });

  if (!result.ok) return NextResponse.json(result.error, { status: result.status });
  return NextResponse.json(result.data, { status: result.status });
}