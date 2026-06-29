import { NextRequest, NextResponse } from "next/server";
import { backendFileFetch } from "@/lib/api/backend-file";
import type { ProjectFile } from "@/types/files";

type RouteContext = { params: Promise<{ projectId: string }> };

function unauthorized() {
  return NextResponse.json({ statusCode: 401, message: "Unauthorized" }, { status: 401 });
}

export async function GET(req: NextRequest, context: RouteContext) {
  const authorization = req.headers.get("authorization");
  if (!authorization) return unauthorized();

  const { projectId } = await context.params;
  const folderPath = req.nextUrl.searchParams.get("folderPath");

  if (!folderPath) {
    return NextResponse.json({ statusCode: 400, message: "folderPath is required" }, { status: 400 });
  }

  const qs = new URLSearchParams({ folderPath });
  const result = await backendFileFetch<{ data: ProjectFile[] }>(
    `/projects/${projectId}/files?${qs}`,
    { method: "GET", headers: { Authorization: authorization } }
  );

  if (!result.ok) {
    return NextResponse.json(result.error, { status: result.status });
  }

  return NextResponse.json(result.data);
}
