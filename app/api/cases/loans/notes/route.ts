import { NextRequest, NextResponse } from "next/server";
import { getLoanNotes, addLoanNote, type AddLoanNoteInput } from "~/server/caseFunctions";

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
    const result = await getLoanNotes(loan_id);
    return NextResponse.json(result);
  } catch (error) {
    console.error("[API] GET /api/cases/loans/notes:", error);
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 400 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as AddLoanNoteInput;
    const result = await addLoanNote(body);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("[API] POST /api/cases/loans/notes:", error);
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 400 },
    );
  }
}
