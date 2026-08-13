import { NextResponse } from "next/server";
import { apiFetchWithSession, readApiError } from "@/lib/auth/api-server";

export async function POST(request: Request) {
  const payload = await request.text();
  const response = await apiFetchWithSession("/instructors/invite", {
    method: "POST",
    body: payload,
  });
  if (!response.ok) {
    return NextResponse.json({ message: await readApiError(response) }, { status: response.status });
  }
  return NextResponse.json(await response.json(), { status: 201 });
}
