import { NextRequest, NextResponse } from "next/server";
import { recordLoanPayment, type RecordLoanPaymentInput } from "~/server/caseFunctions";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as RecordLoanPaymentInput;
    const result = await recordLoanPayment(body);
    return NextResponse.json(result);
  } catch (error) {
    console.error("[API] POST /api/cases/loans/payment:", error);
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 400 },
    );
  }
}
