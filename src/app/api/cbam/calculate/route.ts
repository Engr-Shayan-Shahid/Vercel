import { NextResponse } from "next/server";

import { calculateCBAMLiability, CBAMCalculationError } from "@/lib/cbam-calculator";
import { getEtsPrice } from "@/lib/ets-price";
import { createClient } from "@/lib/supabase/server";
import { MATERIAL_TYPES, type MaterialType } from "@/types/import-record";

const RATE_LIMIT_MAX = 30;
const RATE_LIMIT_WINDOW_MS = 60_000;

const rateLimitMap = new Map<string, number[]>();

function isRateLimited(userId: string): boolean {
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW_MS;
  const timestamps = (rateLimitMap.get(userId) ?? []).filter((t) => t > windowStart);

  if (timestamps.length >= RATE_LIMIT_MAX) {
    rateLimitMap.set(userId, timestamps);
    return true;
  }

  timestamps.push(now);
  rateLimitMap.set(userId, timestamps);
  return false;
}

export async function POST(request: Request) {
  const supabase = await createClient();

  if (!supabase) {
    return NextResponse.json(
      { error: "Supabase is not configured." },
      { status: 503 }
    );
  }

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  if (isRateLimited(user.id)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

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
