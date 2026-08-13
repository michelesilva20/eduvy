import { NextResponse } from "next/server";
import { apiFetchWithSession } from "@/lib/auth/api-server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const qs = searchParams.toString();
  const response = await apiFetchWithSession(`/instructors${qs ? `?${qs}` : ""}`);
  const body = await response.text();
  return new NextResponse(body, {
    status: response.status,
    headers: { "Content-Type": "application/json" },
  });
}
