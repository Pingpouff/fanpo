import { colorRating, tone } from "../shared/colors.ts";
import type { Player, PlayersResponse } from "../../api/joueurs/types.ts";
import { type OutputOptions, renderTable } from "../shared/output.ts";

export function renderPlayers(
  response: PlayersResponse,
  options: OutputOptions = {},
): string {
  return options.json
    ? JSON.stringify(response, null, 2)
    : table(response.joueurs);
}

function table(players: Player[]): string {
  if (players.length === 0) return tone("No players found.", "muted");
  return renderTable([
    ["ID", "NAME", "CLUB", "POSITION", "VALUE", "AVERAGE", "AVAILABLE"],
    ...players.map((p) => [
      String(p.id),
      `${p.prenom} ${p.nom}`,
      p.club,
      p.poste,
      p.valeur,
      colorRating(p.moyenne),
      tone(p.indisponible ? "no" : "yes", p.indisponible ? "bad" : "good"),
    ]),
  ]);
}
