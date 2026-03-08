import { Platform } from "react-native";

import { MedicationsData } from "@/types/medication";

export async function loadMedicationsFull(): Promise<MedicationsData> {
  if (Platform.OS === "web") {
    const { loadMedicationsFull: loadWebMedications } = await import(
      "@/data/loadMedicationsFull.web"
    );

    return loadWebMedications();
  }

  const { loadMedicationsFull: loadNativeMedications } = await import(
    "@/data/loadMedicationsFull.native"
  );

  return loadNativeMedications();
}
