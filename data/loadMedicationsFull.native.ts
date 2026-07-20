import medsData from '@/data/meds.json';
import { MedicationsData } from '@/types/medication';

const data = medsData as MedicationsData;

export async function loadMedicationsFull() {
  return data;
}
