import medsIndexData from '@/data/meds-index.json';
import { loadMedicationsFull } from '@/data/loadMedicationsFull';
import { createMedicationCatalog, MedicationCatalog } from '@/catalog/createMedicationCatalog';
import { MedicationsIndexData } from '@/types/medication';
import React, { createContext, useContext, useEffect, useMemo } from 'react';

export type MedicationsContextType = MedicationCatalog;

const MedicationsContext = createContext<MedicationsContextType | undefined>(undefined);

export function MedicationsProvider({ children }: { children: React.ReactNode }) {
  const catalog = useMemo(
    () =>
      createMedicationCatalog({
        index: medsIndexData as MedicationsIndexData,
        loadFull: loadMedicationsFull,
      }),
    [],
  );

  useEffect(() => {
    let cancelled = false;

    const warm = () => {
      if (!cancelled) {
        catalog.warmDetails();
      }
    };

    if (typeof requestIdleCallback === 'function') {
      const idleId = requestIdleCallback(warm, { timeout: 1500 });

      return () => {
        cancelled = true;
        cancelIdleCallback(idleId);
      };
    }

    const timeoutId = setTimeout(warm, 300);

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [catalog]);

  return <MedicationsContext.Provider value={catalog}>{children}</MedicationsContext.Provider>;
}

export function useMedications() {
  const context = useContext(MedicationsContext);
  if (context === undefined) {
    throw new Error('useMedications must be used within a MedicationsProvider');
  }
  return context;
}
