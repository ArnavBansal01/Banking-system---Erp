import { NextRequest, NextResponse } from "next/server";
import { resolveCaseQuery, type ResolveCaseQueryInput } from "~/server/caseFunctions";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as ResolveCaseQueryInput;
    const result = await resolveCaseQuery(body);
    return NextResponse.json(result);
  } catch (error) {
    console.error("[API] POST /api/cases/queries/resolve:", error);
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 400 },
    );
  }
}
