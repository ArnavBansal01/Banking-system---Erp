import { NextRequest, NextResponse } from "next/server";
import { resolveCase, type ResolveCaseInput } from "~/server/caseFunctions";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as ResolveCaseInput;
    const result = await resolveCase(body);
    return NextResponse.json(result);
  } catch (error) {
    console.error("[API] POST /api/cases/loans/resolve:", error);
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 400 },
    );
  }
}
