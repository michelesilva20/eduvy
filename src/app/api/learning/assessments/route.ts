import { NextResponse } from "next/server";
import { apiFetchWithSession } from "@/lib/auth/api-server";

export async function GET() {
  const response = await apiFetchWithSession("/learning/assessments");
  const body = await response.text();
  return new NextResponse(body, {
    status: response.status,
    headers: { "Content-Type": "application/json" },
  });
}
