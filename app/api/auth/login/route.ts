import { NextRequest, NextResponse } from "next/server";

import { backendFetch } from "@/lib/api/backend";
import { clientForwardHeaders } from "@/lib/api/client-forward-headers";
import { normalizeLoginResponse } from "@/lib/auth/normalize-login";
import type { BackendLoginResponse, LoginRequest } from "@/types/auth";

export async function POST(req: NextRequest) {
  const body = (await req.json()) as LoginRequest;

  const result = await backendFetch<BackendLoginResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify(body),
    headers: clientForwardHeaders(req),
  });

  if (!result.ok) {
    return NextResponse.json(result.error, { status: result.status });
  }

  try {
    return NextResponse.json(normalizeLoginResponse(result.data));
  } catch {
    return NextResponse.json(
      { statusCode: 502, message: "Invalid login response from backend" },
      { status: 502 }
    );
  }
}
