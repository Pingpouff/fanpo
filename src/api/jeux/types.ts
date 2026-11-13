export interface Game {
  id: number;
  code: string;
  nom: string;
  principal: boolean;
  label?: string;
  club_limit?: number;
  journee_min?: number;
  membre?: boolean;
  [field: string]: unknown;
}

export interface GamesResponse {
  multi: boolean;
  jeux: Game[];
  [field: string]: unknown;
}
