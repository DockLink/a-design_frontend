import { NextRequest, NextResponse } from "next/server";
import { backendFileFetch } from "@/lib/api/backend-file";
import type { ProvisionFoldersResponse, ProjectFolderRecord } from "@/types/files";

type RouteContext = { params: Promise<{ projectId: string }> };

function unauthorized() {
  return NextResponse.json({ statusCode: 401, message: "Unauthorized" }, { status: 401 });
}

export async function POST(req: NextRequest, context: RouteContext) {
  const authorization = req.headers.get("authorization");
  if (!authorization) return unauthorized();

  const { projectId } = await context.params;

  const result = await backendFileFetch<ProvisionFoldersResponse>(
    `/projects/${projectId}/folders`,
    { method: "POST", headers: { Authorization: authorization } }
  );

  if (!result.ok) {
    return NextResponse.json(result.error, { status: result.status });
  }

  return NextResponse.json(result.data);
}

export async function PATCH(req: NextRequest, context: RouteContext) {
  const authorization = req.headers.get("authorization");
  if (!authorization) return unauthorized();

  const { projectId } = await context.params;
  const body = (await req.json()) as { path: string; newName: string };

  const result = await backendFileFetch<{ data: ProjectFolderRecord }>(
    `/projects/${projectId}/folders`,
    {
      method: "PATCH",
      headers: { Authorization: authorization, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
  );

  if (!result.ok) {
    return NextResponse.json(result.error, { status: result.status });
  }

  return NextResponse.json(result.data);
}

export async function DELETE(req: NextRequest, context: RouteContext) {
  const authorization = req.headers.get("authorization");
  if (!authorization) return unauthorized();

  const { projectId } = await context.params;
  const folderPath = req.nextUrl.searchParams.get("path");

  if (!folderPath) {
    return NextResponse.json({ statusCode: 400, message: "path is required" }, { status: 400 });
  }

  const qs = new URLSearchParams({ path: folderPath });
  const result = await backendFileFetch<{ success: boolean }>(
    `/projects/${projectId}/folders?${qs}`,
    { method: "DELETE", headers: { Authorization: authorization } },
  );

  if (!result.ok) {
    return NextResponse.json(result.error, { status: result.status });
  }

  return NextResponse.json(result.data);
}
