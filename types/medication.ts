export interface Medication {
  id: string;
  name: string;
  aliases: string[];
  highRisk: boolean;
  classification: string[];
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

export type MedicationSection = 
  | 'classification'
  | 'compatibility'
  | 'presentationAndStorage'
  | 'preparation'
  | 'administration'
  | 'stability'
  | 'contraindicationsAndPrecautions'
  | 'nursingCare';

export const SECTION_LABELS: Record<MedicationSection, string> = {
  classification: 'Classificação',
  compatibility: 'Compatibilidade',
  presentationAndStorage: 'Apresentação e Armazenamento',
  preparation: 'Preparação',
  administration: 'Administração',
  stability: 'Estabilidade',
  contraindicationsAndPrecautions: 'Contraindicações e Precauções',
  nursingCare: 'Cuidados de Enfermagem',
};

export const SECTION_ICONS: Record<MedicationSection, string> = {
  classification: 'medical',
  compatibility: 'flask',
  presentationAndStorage: 'cube',
  preparation: 'construct',
  administration: 'medkit',
  stability: 'time',
  contraindicationsAndPrecautions: 'warning',
  nursingCare: 'heart',
};
