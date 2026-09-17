import { NextRequest, NextResponse } from "next/server";
import { getLoansByStage } from "~/server/caseFunctions";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const stage = searchParams.get("stage");
    if (!stage) {
      return NextResponse.json(
        { error: "stage query parameter is required" },
        { status: 400 },
      );
    }
    const result = await getLoansByStage(stage);
    return NextResponse.json(result);
  } catch (error) {
    console.error("[API] GET /api/cases/loans/by-stage:", error);
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 400 },
    );
  }
}
