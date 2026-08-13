import { NextResponse } from "next/server";
import { apiFetchWithSession, readApiError } from "@/lib/auth/api-server";

type Params = { params: Promise<{ id: string; action: string }> };

const ALLOWED = new Set(["open", "start", "complete", "archive"]);

export async function POST(_request: Request, { params }: Params) {
  const { id, action } = await params;
  if (!ALLOWED.has(action)) {
    return NextResponse.json({ message: "Ação inválida." }, { status: 400 });
  }
  const response = await apiFetchWithSession(`/cohorts/${id}/${action}`, { method: "POST" });
  if (!response.ok) {
    return NextResponse.json({ message: await readApiError(response) }, { status: response.status });
  }
  return NextResponse.json(await response.json());
}
