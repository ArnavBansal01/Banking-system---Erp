import { NextRequest, NextResponse } from "next/server";
import { createNewEnquiry, type CreateNewEnquiryInput } from "~/server/caseFunctions";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as CreateNewEnquiryInput;
    const result = await createNewEnquiry(body);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("[API] POST /api/cases/loans/enquiry:", error);
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 400 },
    );
  }
}
