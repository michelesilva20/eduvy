import { NextResponse } from "next/server";
import { apiFetchWithSession, readApiError } from "@/lib/auth/api-server";

type Params = { params: Promise<{ id: string }> };

export async function POST(_request: Request, { params }: Params) {
  const { id } = await params;
  const response = await apiFetchWithSession(`/courses/${id}/archive`, { method: "POST" });

  if (!response.ok) {
    const message = await readApiError(response);
    return NextResponse.json({ message }, { status: response.status });
  }

  return NextResponse.json(await response.json());
}
