import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: "dashboard-soul",
    timestamp: new Date().toISOString(),
  });
}
