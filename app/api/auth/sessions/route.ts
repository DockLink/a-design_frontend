import { NextRequest, NextResponse } from "next/server";

import { backendFetch } from "@/lib/api/backend";
import { clientForwardHeaders } from "@/lib/api/client-forward-headers";

export async function GET(req: NextRequest) {
  const authorization = req.headers.get("authorization");

  if (!authorization) {
    return NextResponse.json(
      { statusCode: 401, message: "Unauthorized" },
      { status: 401 }
    );
  }

  const result = await backendFetch<unknown[]>("/auth/sessions", {
    method: "GET",
    headers: {
      Authorization: authorization,
      ...clientForwardHeaders(req),
    },
  });

  if (!result.ok) {
    return NextResponse.json(result.error, { status: result.status });
  }

  return NextResponse.json(result.data);
}
