import { NextResponse } from "next/server";
import { apiFetchWithSession } from "@/lib/auth/api-server";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { id } = await params;
  const response = await apiFetchWithSession(`/courses/${id}/structure`);
  const body = await response.text();
  return new NextResponse(body, {
    status: response.status,
    headers: { "Content-Type": "application/json" },
  });
}
