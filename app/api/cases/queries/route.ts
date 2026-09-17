import { NextRequest, NextResponse } from "next/server";
import { createCaseQuery, type CreateCaseQueryInput } from "~/server/caseFunctions";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as CreateCaseQueryInput;
    const result = await createCaseQuery(body);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("[API] POST /api/cases/queries:", error);
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 400 },
    );
  }
}
