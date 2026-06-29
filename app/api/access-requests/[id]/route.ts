import { NextRequest, NextResponse } from "next/server";

import { backendFetch } from "@/lib/api/backend";

type RouteContext = { params: Promise<{ id: string }> };

function unauthorized() {
  return NextResponse.json({ statusCode: 401, message: "Unauthorized" }, { status: 401 });
}

export async function DELETE(req: NextRequest, context: RouteContext) {
  const authorization = req.headers.get("authorization");
  if (!authorization) return unauthorized();

  const { id } = await context.params;
  const result = await backendFetch<{ id: string; deleted: boolean }>(
    `/access-requests/${id}`,
    {
      method: "DELETE",
      headers: { Authorization: authorization },
    }
  );

  if (!result.ok) return NextResponse.json(result.error, { status: result.status });
  return NextResponse.json(result.data);
}
