import type { CompositionResponse } from "../../api/composition/types.ts";
import { colorRating, heading, status, tone } from "../shared/colors.ts";
import { type OutputOptions, renderTable } from "../shared/output.ts";

export function renderComposition(
  response: CompositionResponse,
  options: OutputOptions = {},
): string {
  if (options.json) {
    return JSON.stringify(response, null, 2);
  }
  const { compo, journee } = response;
  const slots = !compo || compo.slots.length === 0
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
        ...(options.detailed ? ["Position"] : []),
      ],
      ...compo.slots.map((slot) => [
        String(slot.slot),
        `${slot.prenom} ${slot.nom}`,
        slot.club,
        slot.prix_paye,
        "-",
        colorRating(null),
        "-",
        [
          slot.slot === compo.capitaine_slot ? "[C]" : "",
          slot.slot === compo.impact_slot ? "[I]" : "",
        ].filter(Boolean).map((m) => tone(m)).join(" "),
        ...(options.detailed ? [slot.poste] : []),
      ]),
    ]);
  return [
    heading(`Round ${journee.numero}`),
    `Deadline: ${journee.deadline_at}`,
    `Status: ${status(compo?.statut ?? "-")}`,
    "Total points: -",
    `Team: ${response.equipe.nom}`,
    `Budget: ${response.equipe.budget} (effective salary cap) / Cap: ${response.cap} (reference)`,
    "",
    slots,
  ].join("\n");
}
