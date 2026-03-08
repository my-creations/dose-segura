import medsIndexData from "@/data/meds-index.json";
import { loadMedicationsFull } from "@/data/loadMedicationsFull";
import {
  Medication,
  MedicationsData,
  MedicationsIndexData,
  MedicationSummary,
} from "@/types/medication";
import React, { createContext, useContext, useMemo } from "react";

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

export function MedicationsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const data = medsIndexData as MedicationsIndexData;

  const medications = useMemo(() => {
    return Object.values(data.medications);
  }, []);

  const getMedicationSummary = (id: string): MedicationSummary | undefined => {
    return data.medications[id];
  };

  const getMedicationDetails = async (
    id: string,
  ): Promise<Medication | undefined> => {
    const fullData = (await loadMedicationsFull()) as MedicationsData;
    return fullData.medications[id];
  };

  const searchMedications = (query: string): MedicationSummary[] => {
    if (!query.trim()) {
      return medications;
    }

    const normalizedQuery = query
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

    return medications.filter((med) => {
      const normalizedName = med.name
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");

      const normalizedAliases = med.aliases.map((alias) =>
        alias
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, ""),
      );

      return (
        normalizedName.includes(normalizedQuery) ||
        normalizedAliases.some((alias) => alias.includes(normalizedQuery))
      );
    });
  };

  const value: MedicationsContextType = {
    medications,
    getMedicationSummary,
    getMedicationDetails,
    searchMedications,
    version: data.version,
    lastUpdated: data.lastUpdated,
  };

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
