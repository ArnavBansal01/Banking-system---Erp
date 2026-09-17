import { NextRequest, NextResponse } from "next/server";
import { updateLoanStage, type UpdateLoanStageInput } from "~/server/caseFunctions";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as UpdateLoanStageInput;
    const result = await updateLoanStage(body);
    return NextResponse.json(result);
  } catch (error) {
    console.error("[API] POST /api/cases/loans/stage:", error);
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 400 },
    );
  }
}
