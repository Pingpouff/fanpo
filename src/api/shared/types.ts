/** Known fields; additional fields returned by the API are preserved. */
export interface Matchday {
  id: number;
  numero: number;
  type: string;
  deadline_at: string;
  statut: string;
  [field: string]: unknown;
}
