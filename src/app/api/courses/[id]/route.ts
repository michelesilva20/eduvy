import { NextResponse } from "next/server";
import { apiFetchWithSession, readApiError } from "@/lib/auth/api-server";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { id } = await params;
  const response = await apiFetchWithSession(`/courses/${id}`);
  const body = await response.text();
  return new NextResponse(body, {
    status: response.status,
    headers: { "Content-Type": "application/json" },
  });
}

export async function PATCH(request: Request, { params }: Params) {
  const { id } = await params;
  const payload = await request.text();
  const response = await apiFetchWithSession(`/courses/${id}`, {
    method: "PATCH",
    body: payload,
  });

  if (!response.ok) {
    const message = await readApiError(response);
    return NextResponse.json({ message }, { status: response.status });
  }

  return NextResponse.json(await response.json());
}

export async function DELETE(_request: Request, { params }: Params) {
  const { id } = await params;
  const response = await apiFetchWithSession(`/courses/${id}`, { method: "DELETE" });

  if (!response.ok) {
    const message = await readApiError(response);
    return NextResponse.json({ message }, { status: response.status });
  }

  return NextResponse.json(await response.json());
}
