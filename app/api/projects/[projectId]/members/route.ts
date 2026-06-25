import { NextRequest, NextResponse } from "next/server";

import { backendFetch } from "@/lib/api/backend";
import type { ProjectWithMembers } from "@/types/projects";

type RouteContext = { params: Promise<{ projectId: string }> };

export async function PUT(req: NextRequest, context: RouteContext) {
  const authorization = req.headers.get("authorization");
  if (!authorization) {
    return NextResponse.json(
      { statusCode: 401, message: "Unauthorized" },
      { status: 401 }
    );
  }

  const { projectId } = await context.params;
  const body = await req.json();

  const result = await backendFetch<ProjectWithMembers>(
    `/projects/${projectId}/members`,
    {
      method: "PUT",
      headers: { Authorization: authorization },
      body: JSON.stringify(body),
    }
  );

  if (!result.ok) {
    return NextResponse.json(result.error, { status: result.status });
  }

  return NextResponse.json(result.data);
}
