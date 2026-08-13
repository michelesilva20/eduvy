import { NextResponse } from "next/server";
import { apiFetchWithSession, readApiError } from "@/lib/auth/api-server";

type Params = { params: Promise<{ id: string; moduleId: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const { id, moduleId } = await params;
  const payload = await request.text();
  const response = await apiFetchWithSession(`/courses/${id}/modules/${moduleId}`, {
    method: "PATCH",
    body: payload,
  });
  if (!response.ok) {
    return NextResponse.json({ message: await readApiError(response) }, { status: response.status });
  }
  return NextResponse.json(await response.json());
}

export async function DELETE(_request: Request, { params }: Params) {
  const { id, moduleId } = await params;
  const response = await apiFetchWithSession(`/courses/${id}/modules/${moduleId}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    return NextResponse.json({ message: await readApiError(response) }, { status: response.status });
  }
  return NextResponse.json(await response.json());
}
