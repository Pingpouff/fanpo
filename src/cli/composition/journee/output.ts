import {
  colorRating,
  heading,
  signed,
  status,
  tone,
} from "../../shared/colors.ts";
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
  const slots = compo.slots.length === 0
    ? tone("No slots.", "muted")
    : renderTable([
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
        ].filter(Boolean).map((m) =>
          m.startsWith("[C") || m === "[I]" ? tone(m) : status(m)
        ).join(" ");
        return [
          String(slot.slot),
          `${slot.jprenom} ${slot.jnom}`,
          slot.jclub,
          slot.prix_paye,
          String(slot.minutes ?? "-"),
          colorRating(slot.note, slot.note?.toFixed(2) ?? "-"),
          colorRating(
            slot.forfait ? 0 : slot.note,
            slot.points?.toFixed(2) ?? "-",
          ),
          markers,
          ...(options.detailed
            ? [
              signed(
                slot.delta_valeur,
                slot.delta_valeur == null ? "-" : String(slot.delta_valeur),
              ),
            ]
            : []),
        ];
      }),
    ]);
  return [
    heading(`Round ${response.journee}`),
    `Deadline: ${response.deadline_at}`,
    `Status: ${status(compo.statut)}`,
    `Total points: ${tone(String(compo.points ?? "-"))}`,
    "",
    slots,
  ].join("\n");
}
