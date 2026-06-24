import { NextResponse } from "next/server";

import { getApiContext } from "@/lib/auth/api-context";
import type { Database } from "@/types/database";

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_TYPES = ["application/pdf", "image/png", "image/jpeg", "image/jpg"];

type ImportProofRow = Pick<
  Database["public"]["Tables"]["import_logs"]["Row"],
  "id" | "proof_of_payment_storage_path" | "proof_of_payment_file_name"
>;

export async function POST(request: Request) {
  const result = await getApiContext();
  if (!result.ok) return result.response;

  const { supabase, organizationId } = result.context;

  let formData: FormData;

  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data." }, { status: 400 });
  }

  const file = formData.get("file");
  const importId = String(formData.get("importId") ?? "").trim();

  if (!(file instanceof File) || !importId) {
    return NextResponse.json({ error: "File and importId are required." }, { status: 400 });
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: "File must be 10 MB or smaller." }, { status: 400 });
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: "Allowed file types: PDF, PNG, JPEG." },
      { status: 400 }
    );
  }

  const { data: importRecord, error: importError } = await supabase
    .from("import_logs")
    .select("id, proof_of_payment_storage_path")
    .eq("id", importId)
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (importError) {
    return NextResponse.json({ error: importError.message }, { status: 500 });
  }

  if (!importRecord) {
    return NextResponse.json({ error: "Import record not found." }, { status: 404 });
  }

  const record = importRecord as ImportProofRow;

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const storagePath = `${organizationId}/${importId}/${Date.now()}-${safeName}`;

  const buffer = Buffer.from(await file.arrayBuffer());

  const { error: uploadError } = await supabase.storage
    .from("proof-documents")
    .upload(storagePath, buffer, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  if (record.proof_of_payment_storage_path) {
    await supabase.storage
      .from("proof-documents")
      .remove([record.proof_of_payment_storage_path]);
  }

  const { data: updated, error: updateError } = await supabase
    .from("import_logs")
    .update({
      proof_of_payment_file_name: file.name,
      proof_of_payment_storage_path: storagePath,
    } as never)
    .eq("id", importId)
    .eq("organization_id", organizationId)
    .select("proof_of_payment_file_name, proof_of_payment_storage_path")
    .single();

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  const updatedRow = updated as Pick<
    ImportProofRow,
    "proof_of_payment_file_name" | "proof_of_payment_storage_path"
  >;

  return NextResponse.json({
    fileName: updatedRow.proof_of_payment_file_name,
    storagePath: updatedRow.proof_of_payment_storage_path,
  });
}

export async function GET(request: Request) {
  const result = await getApiContext();
  if (!result.ok) return result.response;

  const { supabase, organizationId } = result.context;
  const importId = new URL(request.url).searchParams.get("importId")?.trim();

  if (!importId) {
    return NextResponse.json({ error: "importId is required." }, { status: 400 });
  }

  const { data: importRecord, error } = await supabase
    .from("import_logs")
    .select("proof_of_payment_storage_path, proof_of_payment_file_name")
    .eq("id", importId)
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const proofRecord = importRecord as ImportProofRow | null;

  if (!proofRecord?.proof_of_payment_storage_path) {
    return NextResponse.json({ error: "No proof document found." }, { status: 404 });
  }

  const { data: signed, error: signError } = await supabase.storage
    .from("proof-documents")
    .createSignedUrl(proofRecord.proof_of_payment_storage_path, 3600);

  if (signError || !signed?.signedUrl) {
    return NextResponse.json({ error: signError?.message ?? "Failed to sign URL." }, { status: 500 });
  }

  return NextResponse.json({
    url: signed.signedUrl,
    fileName: proofRecord.proof_of_payment_file_name,
  });
}
