import { NextRequest, NextResponse } from "next/server";
import { getLoanDetails } from "~/server/caseFunctions";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const loan_id = searchParams.get("loan_id");
    if (!loan_id) {
      return NextResponse.json(
        { error: "loan_id query parameter is required" },
        { status: 400 },
      );
    }
    const result = await getLoanDetails(loan_id);
    if (result === null) {
      return NextResponse.json({ error: "Loan not found" }, { status: 404 });
    }
    return NextResponse.json(result);
  } catch (error) {
    console.error("[API] GET /api/cases/loans/details:", error);
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 400 },
    );
  }
}
