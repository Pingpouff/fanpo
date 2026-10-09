import {
  renderLocks,
  renderRatings,
  renderRound,
  renderTeamsheets,
} from "./output.ts";
import {
  type CommandContext,
  createCommand,
  groupCommand,
} from "../shared/command.ts";
import { renderTable } from "../shared/output.ts";
import { signed, status, tone } from "../shared/colors.ts";
export function contextCommands(
  root: ReturnType<typeof createCommand>,
  context: CommandContext,
) {
  const output = (value: unknown, json?: boolean, rows?: string[][]) =>
    context.setOutput(
      json ? JSON.stringify(value, null, 2) : renderTable(
        rows ?? [["No data."]],
      ),
    );
  root.command(
    "top14",
    groupCommand(
      "Inspect live Top 14 standings, fixtures and results.",
      context,
    )
      .command(
        "standings",
        createCommand().description(
          "Show current Top 14 ranking, league points, record and points difference.",
        )
          .example("League table", "deno task cli top14 standings")
          .option("--json", "Complete API response as JSON.").action(
            async (o) => {
              const value = await context.getClient().getStandings();
              output(
                value,
                o.json,
                o.json ? undefined : [
                  [
                    "Rank",
                    "Club",
                    "Played",
                    "Points",
                    "Wins",
                    "Draws",
                    "Losses",
                    "Diff",
                  ],
                  ...value.classement.map((s) =>
                    [
                      tone(String(s.position)),
                      s.abrev,
                      s.joues,
                      s.points,
                      s.victoires,
                      s.nuls,
                      s.defaites,
                      signed(s.diff, String(s.diff)),
                    ].map(String)
                  ),
                ],
              );
            },
          ),
      )
      .command(
        "matches",
        createCommand().description(
          "Show all season fixtures/results, or one round. Home team is listed first.",
        )
          .example("Round fixtures", "deno task cli top14 matches --round 6")
          .example("All season results", "deno task cli top14 matches --json")
          .option("--json", "Complete API envelope with matching fixtures.")
          .option(
            "--round <round:positiveInteger>",
            "Round number; omit for all fixtures (filtered locally).",
          ).action(async (o) => {
            const value = await context.getClient().getMatches(o.round);
            output(
              value,
              o.json,
              o.json ? undefined : [
                ["Round", "Date", "Home", "Away", "Score", "Status"],
                ...value.matchs.map(
                  (m) => [
                    String(m.journee),
                    m.date,
                    m.dom.abrev,
                    m.ext.abrev,
                    m.dom.score === null || m.ext.score === null
                      ? "-"
                      : `${
                        signed(m.dom.score - m.ext.score, String(m.dom.score))
                      } - ${
                        signed(m.ext.score - m.dom.score, String(m.ext.score))
                      }`,
                    status(m.statut),
                  ],
                ),
              ],
            );
          }),
      ),
  );
  root.command(
    "round",
    createCommand().description(
      "Show the target Fantasy round, deadline and scoring status.",
    ).example("Round", "deno task cli round").option(
      "--json",
      "Complete API response as JSON.",
    ).action(async (o) => {
      const value = await context.getClient().getRound();
      context.setOutput(
        o.json ? JSON.stringify(value, null, 2) : renderRound(value),
      );
    }),
  );
  root.command(
    "teamsheets",
    createCommand().description(
      "Show announced clubs and player shirt numbers: 1-15 starters, 16-23 substitutes.\nUnannounced clubs have unknown roles; omission only confirms absence after a club is announced.",
    ).example("Teamsheets", "deno task cli teamsheets").option(
      "--json",
      "Complete API response as JSON.",
    ).action(async (o) => {
      const value = await context.getClient().getTeamsheets();
      context.setOutput(
        o.json ? JSON.stringify(value, null, 2) : renderTeamsheets(value),
      );
    }),
  );
  root.command(
    "locks",
    createCommand().description(
      "Show server lock status and kickoff times by club.\nUse these server locks before proposing changes; do not infer a local cutoff.",
    ).example("Locks", "deno task cli locks").option(
      "--json",
      "Complete API response as JSON.",
    ).action(async (o) => {
      const value = await context.getClient().getLocks();
      context.setOutput(
        o.json ? JSON.stringify(value, null, 2) : renderLocks(value),
      );
    }),
  );
  root.command(
    "ratings",
    createCommand().description(
      "Show player names, positions, clubs, official ratings, minutes, roles and withdrawal credits.\nThe round is required. Readable output joins the current player catalogue; --json returns raw ratings.\nWithdrawal credit is 30 points before Fantasy multipliers.",
    ).example("Round ratings", "deno task cli ratings --round 5")
      .option(
        "--round <round:positiveInteger>",
        "Fantasy round number (required).",
        { required: true },
      )
      .option("--json", "Complete API response as JSON.").action(async (o) => {
        const value = await context.getClient().getRoundNotes(o.round);
        const players = !o.json &&
            (Object.keys(value.notes).length || value.forfaits.length)
          ? (await context.getClient().getPlayers()).joueurs
          : [];
        context.setOutput(
          o.json
            ? JSON.stringify(value, null, 2)
            : renderRatings(value, o.round, players),
        );
      }),
  );
  root.reset();
}
