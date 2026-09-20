import { NextResponse } from "next/server";
import { checkCoverage } from "@/lib/coverage";
import { business } from "@/config/business";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const postcode = body?.postcode as string | undefined;

  if (!postcode || postcode.trim().length < 5) {
    return NextResponse.json(
      { error: "Enter a full UK postcode." },
      { status: 400 }
    );
  }

  const result = await checkCoverage(
    postcode,
    business.basePostcode,
    business.coverageRadiusMiles
  );

  if (!result.valid) {
    return NextResponse.json(
      { error: "That does not look like a valid UK postcode." },
      { status: 400 }
    );
  }

  return NextResponse.json(result);
}
