import { NextRequest, NextResponse } from "next/server";
import { backendFileFetch } from "@/lib/api/backend-file";
import type { ProjectFolderRecord } from "@/types/files";

type RouteContext = { params: Promise<{ projectId: string }> };

function unauthorized() {
  return NextResponse.json({ statusCode: 401, message: "Unauthorized" }, { status: 401 });
}

export async function POST(req: NextRequest, context: RouteContext) {
  const authorization = req.headers.get("authorization");
  if (!authorization) return unauthorized();

  const { projectId } = await context.params;
  const body = (await req.json()) as { name: string; parentPath?: string | null };

  const result = await backendFileFetch<{ data: ProjectFolderRecord }>(
    `/projects/${projectId}/folders/custom`,
    {
      method: "POST",
      headers: { Authorization: authorization, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
  );

  if (!result.ok) {
    return NextResponse.json(result.error, { status: result.status });
  }

  return NextResponse.json(result.data);
}
