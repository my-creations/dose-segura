export type ProcedureSource = 'builtin' | 'user';

export interface ProcedureDraft {
  title: string;
  materials: string[];
  steps: string[];
  attention: string[];
}

export interface Procedure extends ProcedureDraft {
  id: string;
  source: ProcedureSource;
  /** Catalog template id this user procedure was adopted/duplicated from, when applicable. */
  originId?: string;
  updatedAt: string;
}
