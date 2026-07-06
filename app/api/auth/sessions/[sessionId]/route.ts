import { NextRequest, NextResponse } from "next/server";

import { backendFetch } from "@/lib/api/backend";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const authorization = req.headers.get("authorization");

  if (!authorization) {
    return NextResponse.json(
      { statusCode: 401, message: "Unauthorized" },
      { status: 401 }
    );
  }

  const { sessionId } = await params;

  const result = await backendFetch<{ success: boolean }>(
    `/auth/sessions/${sessionId}`,
    {
      method: "DELETE",
      headers: { Authorization: authorization },
    }
  );

  if (!result.ok) {
    return NextResponse.json(result.error, { status: result.status });
  }

  return NextResponse.json(result.data);
}
