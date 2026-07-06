import { NextRequest, NextResponse } from "next/server";

import { backendFetch } from "@/lib/api/backend";
import { clientForwardHeaders } from "@/lib/api/client-forward-headers";
import { normalizeLoginResponse } from "@/lib/auth/normalize-login";
import type { BackendLoginResponse } from "@/types/auth";

export async function POST(req: NextRequest) {
  const body = (await req.json()) as { refresh_token?: string };

  if (!body.refresh_token) {
    return NextResponse.json(
      { statusCode: 400, message: "Missing refresh token" },
      { status: 400 }
    );
  }

  const result = await backendFetch<BackendLoginResponse>("/auth/refresh", {
    method: "POST",
    body: JSON.stringify({ refresh_token: body.refresh_token }),
    headers: clientForwardHeaders(req),
  });

  if (!result.ok) {
    return NextResponse.json(result.error, { status: result.status });
  }

  try {
    return NextResponse.json(normalizeLoginResponse(result.data));
  } catch {
    return NextResponse.json(
      { statusCode: 502, message: "Invalid refresh response from backend" },
      { status: 502 }
    );
  }
}
