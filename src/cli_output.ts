import type { Player, PlayerSheetResponse, PlayersResponse } from "./types.ts";

export interface OutputOptions {
  json?: boolean;
  detailed?: boolean;
}

export function renderPlayers(
  response: PlayersResponse,
  options: OutputOptions = {},
): string {
  return options.json
    ? JSON.stringify(response, null, 2)
    : table(response.joueurs);
}

export function renderPlayerSheet(
  sheet: PlayerSheetResponse,
  options: OutputOptions = {},
): string {
  if (options.json) {
    return JSON.stringify(
      options.detailed ? sheet : quickSheet(sheet),
      null,
      2,
    );
  }
  return options.detailed ? sheetDetails(sheet) : sheetSummary(sheet);
}

function table(players: Player[]): string {
  if (players.length === 0) return "No players found.";
  return renderTable([
    ["ID", "NAME", "CLUB", "POSITION", "VALUE", "AVERAGE", "AVAILABLE"],
    ...players.map((p) => [
      String(p.id),
      `${p.prenom} ${p.nom}`,
      p.club,
      p.poste,
      p.valeur,
      String(p.moyenne ?? "-"),
      p.indisponible ? "no" : "yes",
    ]),
  ]);
}

function renderTable(input: string[][]): string {
  const rows = input.map((row) => row.map((cell) => cell.replace(/\s+/g, " ")));
  const widths = rows[0].map((_, i) =>
    Math.max(...rows.map((row) => row[i].length))
  );
  return rows.map((row) =>
    row.map((cell, i) => cell.padEnd(widths[i])).join("  ").trimEnd()
  )
    .join("\n");
}

function quickSheet(sheet: PlayerSheetResponse) {
  const { stats: _stats, perfs, ...rest } = sheet;
  return {
    ...rest,
    perfs: perfs.map(({ stats: _stats, ...performance }) => performance),
  };
}

function sheetDetails(sheet: PlayerSheetResponse): string {
  return [
    sheetSummary(sheet),
    "Aggregate stats:",
    renderTable(
      Object.entries(sheet.stats).map((
        [key, value],
      ) => [key, String(value ?? "-")]),
    ),
    ...sheet.perfs.map((perf) =>
      `Round ${perf.numero} stats:\n` +
      (Object.keys(perf.stats).length === 0 ? "No match stats." : renderTable(
        Object.entries(perf.stats).map((
          [key, value],
        ) => [key, String(value)]),
      ))
    ),
  ].join("\n\n");
}

function sheetSummary(sheet: PlayerSheetResponse): string {
  const { joueur: player, perfs, stats } = sheet;
  const positions = [
    player.poste_principal,
    player.poste_secondaire,
    player.poste_tertiaire,
  ]
    .filter((position) => position != null).join(" / ");
  const performances = perfs.length === 0
    ? "No performances yet."
    : renderTable([
      ["Round", "Opp", "H/A", "Starter", "Min", "Score"],
      ...perfs.map((perf) => [
        String(perf.numero),
        perf.adversaire ?? "-",
        perf.domicile == null ? "-" : perf.domicile ? "Home" : "Away",
        perf.titulaire == null ? "-" : perf.titulaire ? "yes" : "no",
        String(perf.minutes_jouees ?? "-"),
        perf.note ?? "-",
      ]),
    ]);
  return [
    `${player.prenom} ${player.nom} — ${player.club_nom}`,
    positions,
    `Value: ${player.valeur}`,
    "",
    performances,
    "",
    `Average: ${stats.moyenne?.toFixed(2) ?? "-"}`,
    `Best: ${stats.meilleure?.toFixed(2) ?? "-"}`,
    `Worst: ${stats.pire?.toFixed(2) ?? "-"}`,
    `Tries: ${stats.essais}`,
  ].join("\n");
}
