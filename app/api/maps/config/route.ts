import { NextResponse } from "next/server";

export async function GET() {
  const apiKey =
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.trim() ||
    process.env.GOOGLE_MAPS_API_KEY?.trim();

  if (!apiKey) {
    return NextResponse.json(
      { message: "Google Maps API key is not configured on the server." },
      { status: 500 }
    );
  }

  return NextResponse.json({ apiKey });
}
