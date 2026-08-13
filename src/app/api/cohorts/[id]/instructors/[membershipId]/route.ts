import { NextResponse } from "next/server";
import { apiFetchWithSession, readApiError } from "@/lib/auth/api-server";

type Params = { params: Promise<{ id: string; membershipId: string }> };

export async function DELETE(_request: Request, { params }: Params) {
  const { id, membershipId } = await params;
  const response = await apiFetchWithSession(
    `/cohorts/${id}/instructors/${membershipId}`,
    { method: "DELETE" },
  );
  if (!response.ok) {
    return NextResponse.json({ message: await readApiError(response) }, { status: response.status });
  }
  return NextResponse.json(await response.json());
}
