export interface MedicationSummary {
  id: string;
  name: string;
  aliases: string[];
  highRisk: boolean;
  classification: string[];
}

export interface Medication extends MedicationSummary {
  compatibility: string[];
  presentationAndStorage: string[];
  preparation: string[];
  administration: string[];
  stability: string[];
  contraindicationsAndPrecautions: string[];
  nursingCare: string[];
}

export interface MedicationsData {
  version: string;
  lastUpdated: string;
  medications: Record<string, Medication>;
}

export interface MedicationsIndexData {
  version: string;
  lastUpdated: string;
  medications: Record<string, MedicationSummary>;
}

export type MedicationSection =
  | 'classification'
  | 'compatibility'
  | 'presentationAndStorage'
  | 'preparation'
  | 'administration'
  | 'stability'
  | 'contraindicationsAndPrecautions'
  | 'nursingCare';

/** @deprecated Prefer MedicationSection */
export type SectionKey = MedicationSection;
