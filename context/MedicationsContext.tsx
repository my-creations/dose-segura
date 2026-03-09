import medsIndexData from "@/data/meds-index.json";
import { loadMedicationsFull } from "@/data/loadMedicationsFull";
import {
  Medication,
  MedicationsData,
  MedicationsIndexData,
  MedicationSummary,
} from "@/types/medication";
import React, { createContext, useCallback, useContext, useEffect, useMemo } from "react";

export interface MedicationsContextType {
  medications: MedicationSummary[];
  getMedicationSummary: (id: string) => MedicationSummary | undefined;
  getMedicationDetails: (id: string) => Promise<Medication | undefined>;
  searchMedications: (query: string) => MedicationSummary[];
  version: string;
  lastUpdated: string;
}

const MedicationsContext = createContext<MedicationsContextType | undefined>(
  undefined,
);

function normalizeSearchText(value: string) {
  return value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

export function MedicationsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const data = medsIndexData as MedicationsIndexData;

  const medications = useMemo(() => {
    return Object.values(data.medications);
  }, []);

  const searchableMedications = useMemo(() => {
    return medications.map((medication) => ({
      medication,
      normalizedName: normalizeSearchText(medication.name),
      normalizedAliases: medication.aliases.map(normalizeSearchText),
    }));
  }, [medications]);

  const getMedicationSummary = useCallback((id: string): MedicationSummary | undefined => {
    return data.medications[id];
  }, [data.medications]);

  const getMedicationDetails = useCallback(async (
    id: string,
  ): Promise<Medication | undefined> => {
    const fullData = (await loadMedicationsFull()) as MedicationsData;
    return fullData.medications[id];
  }, []);

  const searchMedications = useCallback((query: string): MedicationSummary[] => {
    if (!query.trim()) {
      return medications;
    }

    const normalizedQuery = normalizeSearchText(query);

    return searchableMedications
      .filter(({ normalizedName, normalizedAliases }) => {
        return (
          normalizedName.includes(normalizedQuery) ||
          normalizedAliases.some((alias) => alias.includes(normalizedQuery))
        );
      })
      .map(({ medication }) => medication);
  }, [medications, searchableMedications]);

  const value: MedicationsContextType = {
    medications,
    getMedicationSummary,
    getMedicationDetails,
    searchMedications,
    version: data.version,
    lastUpdated: data.lastUpdated,
  };

  useEffect(() => {
    let cancelled = false;

    const warmMedicationDetails = () => {
      if (!cancelled) {
        void loadMedicationsFull().catch(() => {
          // Keep the first navigation path resilient even if the warmup fails.
        });
      }
    };

    if (typeof requestIdleCallback === "function") {
      const idleId = requestIdleCallback(warmMedicationDetails, { timeout: 1500 });

      return () => {
        cancelled = true;
        cancelIdleCallback(idleId);
      };
    }

    const timeoutId = setTimeout(warmMedicationDetails, 300);

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, []);

  return (
    <MedicationsContext.Provider value={value}>
      {children}
    </MedicationsContext.Provider>
  );
}

export function useMedications() {
  const context = useContext(MedicationsContext);
  if (context === undefined) {
    throw new Error("useMedications must be used within a MedicationsProvider");
  }
  return context;
}
