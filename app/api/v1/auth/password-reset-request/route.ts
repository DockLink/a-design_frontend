import { NextRequest, NextResponse } from "next/server";
import { clientForwardHeaders } from "@/lib/api/client-forward-headers";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    const baseUrl = (process.env.BACKEND_API_URL || "http://localhost:3001/v2").replace(/\/v2\/?$/, "/v1");
    
    const result = await fetch(`${baseUrl}/auth/password-reset-request`, {
      method: "POST",
      body: JSON.stringify(body),
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...clientForwardHeaders(req),
      },
      cache: "no-store",
    });

    const resBody = await result.json().catch(() => ({}));

    if (!result.ok) {
      return NextResponse.json(resBody, { status: result.status });
    }

    return NextResponse.json(resBody);
  } catch (error) {
    return NextResponse.json(
      { statusCode: 500, message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
