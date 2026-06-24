"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import type {
  CBAMApiResult,
  ImportRecord,
  ImportRecordEditInput,
  ImportRecordInput,
  MaterialType,
} from "@/types/import-record";
import { validateImportInput, hasValidationErrors } from "@/types/import-record";

interface MutationResult {
  success: boolean;
  errors?: ReturnType<typeof validateImportInput>;
  error?: string;
}

interface ImportsContextValue {
  imports: ImportRecord[];
  isLoading: boolean;
  addImport: (input: ImportRecordInput) => Promise<MutationResult>;
  updateImport: (record: ImportRecord, input: ImportRecordEditInput) => Promise<void>;
  deleteImport: (id: string) => Promise<void>;
  refreshImports: () => Promise<void>;
  totalMass: number;
  totalTaxLiability: number;
  totalEmbeddedEmissions: number;
  averageEmissionFactor: number;
}

const ImportsContext = createContext<ImportsContextValue | null>(null);

async function fetchCBAMCalculation(
  materialType: MaterialType,
  mass: number,
  emissionFactor: number,
  foreignPrice: number
): Promise<CBAMApiResult> {
  const response = await fetch("/api/cbam/calculate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ materialType, mass, emissionFactor, foreignPrice }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error ?? "Calculation error: Please check input data.");
  }

  return data as CBAMApiResult;
}

function buildImportRecord(
  base: Partial<ImportRecord> & Pick<ImportRecord, "id" | "materialType">,
  calculation: CBAMApiResult,
  overrides: Partial<ImportRecord> = {}
): ImportRecord {
  return {
    id: base.id,
    materialType: base.materialType,
    mass: overrides.mass ?? base.mass ?? 0,
    originCountry: overrides.originCountry ?? base.originCountry ?? "",
    emissionFactor: overrides.emissionFactor ?? base.emissionFactor ?? 0,
    embeddedEmissions: calculation.embeddedEmissions,
    benchmark: calculation.benchmark,
    freeAllocation: calculation.freeAllocation,
    foreignPrice: calculation.foreignPrice,
    foreignCarbonPriceDeduction: calculation.foreignCarbonPriceDeduction,
    etsPrice: calculation.etsPrice,
    taxLiability: calculation.liability,
    proofOfPaymentFileName: overrides.proofOfPaymentFileName ?? base.proofOfPaymentFileName,
    proofOfPaymentUrl: overrides.proofOfPaymentUrl ?? base.proofOfPaymentUrl,
    proofOfPaymentMimeType: overrides.proofOfPaymentMimeType ?? base.proofOfPaymentMimeType,
    createdAt: base.createdAt ?? new Date().toISOString(),
  };
}

export function ImportsProvider({ children }: { children: ReactNode }) {
  const [imports, setImports] = useState<ImportRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refreshImports = useCallback(async () => {
    setIsLoading(true);

    try {
      const response = await fetch("/api/import-logs");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Failed to load import logs.");
      }

      setImports(data.imports ?? []);
    } catch {
      setImports((prev) => prev);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshImports();
  }, [refreshImports]);

  const persistImport = useCallback(async (record: ImportRecord, method: "POST" | "PATCH") => {
    const id = record.id?.trim();
    if (!id) {
      console.error("No ID found for operation");
      throw new Error("No ID found for operation");
    }

    const url = method === "POST" ? "/api/import-logs" : `/api/import-logs/${id}`;
    console.log(`Attempting to ${method === "POST" ? "create" : "edit"} ID:`, id);

    const response = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(record),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error ?? "Failed to save import record.");
    }

    return data.import as ImportRecord;
  }, []);

  const addImport = useCallback(
    async (input: ImportRecordInput): Promise<MutationResult> => {
      const errors = validateImportInput(input);

      if (hasValidationErrors(errors)) {
        return { success: false, errors };
      }

      try {
        const calculation = await fetchCBAMCalculation(
          input.materialType as MaterialType,
          Number(input.mass),
          Number(input.emissionFactor),
          Number(input.foreignPrice) || 0
        );

        const record = buildImportRecord(
          {
            id: crypto.randomUUID(),
            materialType: input.materialType as MaterialType,
          },
          calculation,
          {
            mass: Number(input.mass),
            originCountry: input.originCountry.trim(),
            emissionFactor: Number(input.emissionFactor),
            proofOfPaymentFileName: input.proofOfPayment?.name,
            proofOfPaymentUrl: input.proofOfPayment
              ? URL.createObjectURL(input.proofOfPayment)
              : undefined,
            proofOfPaymentMimeType: input.proofOfPayment?.type,
          }
        );

        const saved = await persistImport(record, "POST");
        setImports((prev) => [
          {
            ...saved,
            proofOfPaymentUrl: record.proofOfPaymentUrl,
            proofOfPaymentMimeType: record.proofOfPaymentMimeType,
          },
          ...prev.filter((item) => item.id !== saved.id),
        ]);
        return { success: true };
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Calculation error: Please check input data.";
        return { success: false, error: message };
      }
    },
    [persistImport]
  );

  const updateImport = useCallback(
    async (record: ImportRecord, input: ImportRecordEditInput): Promise<void> => {
      const id = record.id?.trim();

      if (!id) {
        console.error("No ID found for operation");
        throw new Error("No ID found for operation");
      }

      console.log("Attempting to edit ID:", id);

      const calculation = await fetchCBAMCalculation(
        record.materialType,
        Number(input.mass),
        Number(input.emissionFactor),
        record.foreignPrice
      );

      const updated = buildImportRecord(record, calculation, {
        mass: Number(input.mass),
        originCountry: input.originCountry.trim(),
        emissionFactor: Number(input.emissionFactor),
      });

      const saved = await persistImport(updated, "PATCH");
      setImports((prev) =>
        prev.map((item) =>
          item.id === id
            ? {
                ...saved,
                proofOfPaymentUrl: record.proofOfPaymentUrl ?? item.proofOfPaymentUrl,
                proofOfPaymentMimeType: record.proofOfPaymentMimeType ?? item.proofOfPaymentMimeType,
              }
            : item
        )
      );
    },
    [persistImport]
  );

  const deleteImport = useCallback(async (id: string): Promise<void> => {
    const normalizedId = id?.trim();

    if (!normalizedId) {
      console.error("No ID found for operation");
      throw new Error("No ID found for operation");
    }

    console.log("Attempting to delete ID:", normalizedId);

    let proofUrl: string | undefined;
    setImports((prev) => {
      proofUrl = prev.find((item) => item.id === normalizedId)?.proofOfPaymentUrl;
      return prev;
    });

    const response = await fetch(`/api/import-logs/${normalizedId}`, { method: "DELETE" });
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error ?? "Failed to delete import record.");
    }

    if (proofUrl) {
      URL.revokeObjectURL(proofUrl);
    }

    setImports((prev) => prev.filter((item) => item.id !== normalizedId));
  }, []);

  const totalMass = useMemo(
    () => imports.reduce((sum, record) => sum + record.mass, 0),
    [imports]
  );

  const totalTaxLiability = useMemo(
    () => imports.reduce((sum, record) => sum + record.taxLiability, 0),
    [imports]
  );

  const totalEmbeddedEmissions = useMemo(
    () => imports.reduce((sum, record) => sum + record.embeddedEmissions, 0),
    [imports]
  );

  const averageEmissionFactor = useMemo(() => {
    if (imports.length === 0) return 0;
    const totalFactor = imports.reduce((sum, record) => sum + record.emissionFactor, 0);
    return totalFactor / imports.length;
  }, [imports]);

  const value = useMemo(
    () => ({
      imports,
      isLoading,
      addImport,
      updateImport,
      deleteImport,
      refreshImports,
      totalMass,
      totalTaxLiability,
      totalEmbeddedEmissions,
      averageEmissionFactor,
    }),
    [
      imports,
      isLoading,
      addImport,
      updateImport,
      deleteImport,
      refreshImports,
      totalMass,
      totalTaxLiability,
      totalEmbeddedEmissions,
      averageEmissionFactor,
    ]
  );

  return <ImportsContext.Provider value={value}>{children}</ImportsContext.Provider>;
}

export function useImports() {
  const context = useContext(ImportsContext);
  if (!context) {
    throw new Error("useImports must be used within an ImportsProvider");
  }
  return context;
}
