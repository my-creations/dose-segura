import medsData from '@/data/meds.json';
import { Medication, MedicationsData } from '@/types/medication';
import React, { createContext, useContext, useMemo } from 'react';

interface MedicationsContextType {
  medications: Medication[];
  getMedication: (id: string) => Medication | undefined;
  searchMedications: (query: string) => Medication[];
  version: string;
  lastUpdated: string;
}

const MedicationsContext = createContext<MedicationsContextType | undefined>(undefined);

export function MedicationsProvider({ children }: { children: React.ReactNode }) {
  const data = medsData as MedicationsData;
  
  const medications = useMemo(() => {
    return Object.values(data.medications);
  }, []);

  const getMedication = (id: string): Medication | undefined => {
    return data.medications[id];
  };

  const searchMedications = (query: string): Medication[] => {
    if (!query.trim()) {
      return medications;
    }

    const normalizedQuery = query
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

    return medications.filter((med) => {
      const normalizedName = med.name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
      
      const normalizedAliases = med.aliases.map((alias) =>
        alias
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
      );

      return (
        normalizedName.includes(normalizedQuery) ||
        normalizedAliases.some((alias) => alias.includes(normalizedQuery))
      );
    });
  };

  const value: MedicationsContextType = {
    medications,
    getMedication,
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
    throw new Error('useMedications must be used within a MedicationsProvider');
  }
  return context;
}
