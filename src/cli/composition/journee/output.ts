import type { HistoricalCompositionResponse } from "../../../api/composition/journee/types.ts";
import { type OutputOptions, renderTable } from "../../shared/output.ts";

export function renderHistoricalComposition(
  response: HistoricalCompositionResponse,
  options: OutputOptions = {},
): string {
  if (options.json) {
    return JSON.stringify(response, null, 2);
  }
  const { compo } = response;
  const slots = compo.slots.length === 0 ? "No slots." : renderTable([
    [
      "#",
      "Player",
      "Club",
      "Paid",
      "Min",
      "Score",
      "Points",
      "",
      ...(options.detailed ? ["Value change"] : []),
    ],
    ...compo.slots.map((slot) => {
      const markers = [
        slot.slot === compo.capitaine_slot
          ? compo.capitaine_auto ? "[C-auto]" : "[C]"
          : "",
        slot.slot === compo.impact_slot ? "[I]" : "",
        slot.titulaire === false ? "SUB" : "",
        slot.forfait ? "FORFAIT" : "",
      ].filter(Boolean).join(" ");
      return [
        String(slot.slot),
        `${slot.jprenom} ${slot.jnom}`,
        slot.jclub,
        slot.prix_paye,
        String(slot.minutes ?? "-"),
        slot.note?.toFixed(2) ?? "-",
        slot.points?.toFixed(2) ?? "-",
        markers,
        ...(options.detailed
          ? [slot.delta_valeur == null ? "-" : String(slot.delta_valeur)]
          : []),
      ];
    }),
  ]);
  return [
    `Round ${response.journee}`,
    `Deadline: ${response.deadline_at}`,
    `Status: ${compo.statut}`,
    `Total points: ${compo.points ?? "-"}`,
    "",
    slots,
  ].join("\n");
}
