import { NextResponse } from "next/server";
import { apiFetchWithSession, readApiError } from "@/lib/auth/api-server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const qs = searchParams.toString();
  const response = await apiFetchWithSession(`/courses${qs ? `?${qs}` : ""}`);
  const body = await response.text();
  return new NextResponse(body, {
    status: response.status,
    headers: { "Content-Type": "application/json" },
  });
}

export async function POST(request: Request) {
  const payload = await request.text();
  const response = await apiFetchWithSession("/courses", {
    method: "POST",
    body: payload,
  });

  if (!response.ok) {
    const message = await readApiError(response);
    return NextResponse.json({ message }, { status: response.status });
  }

  return NextResponse.json(await response.json(), { status: 201 });
}
