import { NextResponse } from "next/server";
import { getAllLoans } from "~/server/caseFunctions";

export async function GET() {
  try {
    const loans = await getAllLoans();
    return NextResponse.json(loans);
  } catch (error) {
    console.error("[API] GET /api/cases/loans:", error);
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 },
    );
  }
}
