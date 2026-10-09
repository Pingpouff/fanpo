import { colorRating, heading, tone } from "../../shared/colors.ts";
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

export function renderPlayerSheets(
  sheets: readonly PlayerSheetResponse[],
  options: OutputOptions = {},
): string {
  if (options.json) {
    return JSON.stringify(
      options.detailed ? sheets : sheets.map(quickSheet),
      null,
      2,
    );
  }
  return sheets.map((sheet) => renderPlayerSheet(sheet, options)).join("\n\n");
}

function sheetDetails(sheet: PlayerSheetResponse): string {
  return [
    sheetSummary(sheet),
    heading("Aggregate stats:"),
    renderTable(
      Object.entries(sheet.stats).map((
        [key, value],
      ) => [
        key,
        ["moyenne", "meilleure", "pire"].includes(key)
          ? colorRating(value as number | null, String(value ?? "-"))
          : String(value ?? "-"),
      ]),
      { header: false },
    ),
    ...sheet.perfs.map((perf) =>
      heading(`Round ${perf.numero} stats:`) + "\n" +
      (Object.keys(perf.stats).length === 0
        ? tone("No match stats.", "muted")
        : renderTable(
          Object.entries(perf.stats).map((
            [key, value],
          ) => [key, String(value)]),
          { header: false },
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
    ? tone("No performances yet.", "muted")
    : renderTable([
      ["Round", "Opp", "H/A", "Starter", "Min", "Score"],
      ...perfs.map((perf) => [
        String(perf.numero),
        perf.adversaire ?? "-",
        perf.domicile == null ? "-" : perf.domicile ? "Home" : "Away",
        perf.titulaire == null ? tone("-", "muted") : tone(
          perf.titulaire ? "yes" : "no",
          perf.titulaire ? "good" : "caution",
        ),
        String(perf.minutes_jouees ?? "-"),
        colorRating(perf.note),
      ]),
    ]);
  return [
    heading(`${player.prenom} ${player.nom} — ${player.club_nom}`),
    positions,
    `Value: ${tone(player.valeur)}`,
    "",
    performances,
    "",
    `Average: ${colorRating(stats.moyenne, stats.moyenne?.toFixed(2) ?? "-")}`,
    `Best: ${colorRating(stats.meilleure, stats.meilleure?.toFixed(2) ?? "-")}`,
    `Worst: ${colorRating(stats.pire, stats.pire?.toFixed(2) ?? "-")}`,
    `Tries: ${stats.essais}`,
  ].join("\n");
}
