import { NextRequest, NextResponse } from "next/server";

import { backendFetch } from "@/lib/api/backend";
import type { AppAppearanceSettings } from "@/types/app-settings";

function unauthorized() {
  return NextResponse.json(
    { statusCode: 401, message: "Unauthorized" },
    { status: 401 }
  );
}

export async function GET(req: NextRequest) {
  const authorization = req.headers.get("authorization");
  if (!authorization) return unauthorized();

  const result = await backendFetch<AppAppearanceSettings>("/app-settings/appearance", {
    headers: { Authorization: authorization },
  });

  if (!result.ok) {
    return NextResponse.json(result.error, { status: result.status });
  }

  return NextResponse.json(result.data);
}

export async function PATCH(req: NextRequest) {
  const authorization = req.headers.get("authorization");
  if (!authorization) return unauthorized();

  const body = await req.json();

  const result = await backendFetch<AppAppearanceSettings>("/app-settings/appearance", {
    method: "PATCH",
    headers: { Authorization: authorization },
    body: JSON.stringify(body),
  });

  if (!result.ok) {
    return NextResponse.json(result.error, { status: result.status });
  }

  return NextResponse.json(result.data);
}
