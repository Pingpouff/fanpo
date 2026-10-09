# Fantasy Rugby Skills Pack

This archive contains a first-pass modular skill architecture for the Fantasy Rugby project.

## Included skills

- `fantasy-rugby` — top-level router and project context
- `auditing-fantasy-lineup` — legality and structural audit
- `analyzing-fantasy-player` — player evaluation and comparison
- `analyzing-rugby-matchups` — fixture and match-script analysis
- `optimizing-fantasy-lineup` — end-to-end lineup optimization
- `selecting-fantasy-captain` — captain-specific analysis
- `selecting-impact-players` — bench / impact-player analysis
- `validating-fantasy-lineup` — final invariant gate

## Project dependency

Keep `regles_fantasy_rugby.md` in the Fantasy Rugby project context and treat it as the source of truth for rules.

The skills intentionally avoid duplicating permanent numeric rules wherever possible.

## Suggested rollout

Import all skills now, then test and refine them iteratively against real requests from future matchdays.

Recommended test sequence:

1. `fantasy-rugby`
2. `auditing-fantasy-lineup`
3. `optimizing-fantasy-lineup`
4. remaining specialist skills

## Design principles used

- One lightweight routing skill at the top.
- Atomic specialist skills with narrow triggers.
- Trigger descriptions state when to use a skill, not its workflow.
- Deterministic validation is separated from sporting judgment.
- Missing data is represented as unresolved rather than silently inferred.
- Final validation is a separate release gate.
- Cross-skill dependencies are explicit but specialist skills are not force-loaded unnecessarily.
