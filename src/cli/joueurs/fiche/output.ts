import type { PlayerSheetResponse } from "../../../api/joueurs/fiche/types.ts";
import { type OutputOptions, renderTable } from "../../shared/output.ts";

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
