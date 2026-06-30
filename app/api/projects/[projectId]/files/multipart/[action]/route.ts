import { NextRequest, NextResponse } from "next/server";
import { backendFileFetch } from "@/lib/api/backend-file";

type RouteContext = {
  params: Promise<{ projectId: string; action: string }>;
};

const ALLOWED_ACTIONS = new Set(["initiate", "presign", "complete", "abort"]);

function unauthorized() {
  return NextResponse.json(
    { statusCode: 401, message: "Unauthorized" },
    { status: 401 }
  );
}

// Only small JSON control messages flow through here — the file bytes go
// directly from the browser to S3 via presigned URLs.
export async function POST(req: NextRequest, context: RouteContext) {
  const authorization = req.headers.get("authorization");
  if (!authorization) return unauthorized();

  const { projectId, action } = await context.params;
  if (!ALLOWED_ACTIONS.has(action)) {
    return NextResponse.json(
      { statusCode: 404, message: "Unknown multipart action" },
      { status: 404 }
    );
  }

  const body = await req.json().catch(() => ({}));

  const result = await backendFileFetch<unknown>(
    `/projects/${projectId}/files/multipart/${action}`,
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
