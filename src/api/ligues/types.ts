export interface League {
  id: number;
  nom?: string;
  format: string;
  mode: string;
  est_globale?: boolean;
  est_officielle?: boolean;
  [field: string]: unknown;
}
