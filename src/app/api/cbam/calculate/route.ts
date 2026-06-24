import { NextResponse } from "next/server";

import { calculateCBAMLiability, CBAMCalculationError } from "@/lib/cbam-calculator";
import { getEtsPrice } from "@/lib/ets-price";
import { MATERIAL_TYPES, type MaterialType } from "@/types/import-record";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { materialType, mass, emissionFactor, foreignPrice } = body;

    if (!MATERIAL_TYPES.includes(materialType)) {
      return NextResponse.json({ error: "Invalid material type." }, { status: 400 });
    }

    const etsPrice = await getEtsPrice();

    const result = calculateCBAMLiability({
      materialType: materialType as MaterialType,
      mass: Number(mass),
      emissionFactor: Number(emissionFactor),
      foreignPrice: foreignPrice !== undefined ? Number(foreignPrice) : 0,
      etsPrice,
    });

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof CBAMCalculationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: "Calculation error: Please check input data." },
      { status: 500 }
    );
  }
}
