import { NextRequest, NextResponse } from "next/server";

import { backendFetch } from "@/lib/api/backend";
import type {
  MeetingMinute,
  MeetingMinutesListResponse,
} from "@/types/meeting-minutes";

type RouteContext = { params: Promise<{ projectId: string }> };

function unauthorized() {
  return NextResponse.json({ statusCode: 401, message: "Unauthorized" }, { status: 401 });
}

export async function GET(req: NextRequest, context: RouteContext) {
  const authorization = req.headers.get("authorization");
  if (!authorization) return unauthorized();

  const { projectId } = await context.params;
  const query = req.nextUrl.search;

  const result = await backendFetch<MeetingMinutesListResponse>(
    `/meeting-minutes/projects/${projectId}${query}`,
    { method: "GET", headers: { Authorization: authorization } }
  );

  if (!result.ok) return NextResponse.json(result.error, { status: result.status });
  return NextResponse.json(result.data);
}

export async function POST(req: NextRequest, context: RouteContext) {
  const authorization = req.headers.get("authorization");
  if (!authorization) return unauthorized();

  const { projectId } = await context.params;
  const body = await req.json();

  const result = await backendFetch<MeetingMinute>(
    `/meeting-minutes/projects/${projectId}`,
    {
      method: "POST",
      headers: { Authorization: authorization },
      body: JSON.stringify(body),
    }
  );

  if (!result.ok) return NextResponse.json(result.error, { status: result.status });
  return NextResponse.json(result.data, { status: result.status });
}
