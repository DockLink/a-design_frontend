import { NextRequest, NextResponse } from "next/server";
import { backendFileFetch } from "@/lib/api/backend-file";
import type { ShareLinkResponse } from "@/types/files";

type RouteContext = { params: Promise<{ fileId: string }> };

function unauthorized() {
  return NextResponse.json({ statusCode: 401, message: "Unauthorized" }, { status: 401 });
}

export async function POST(req: NextRequest, context: RouteContext) {
  const authorization = req.headers.get("authorization");
  if (!authorization) return unauthorized();

  const { fileId } = await context.params;
  const body = await req.json();

  const result = await backendFileFetch<{ data: ShareLinkResponse }>(
    `/files/${fileId}/share`,
    {
      method: "POST",
      headers: { Authorization: authorization },
      body: JSON.stringify(body),
    }
  );

  if (!result.ok) {
    return NextResponse.json(result.error, { status: result.status });
  }

  return NextResponse.json(result.data);
}
