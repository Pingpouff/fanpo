# Review of the round 6 advice — 9 October 2026

Applied the imported fantasy-rugby router and its auditing, player analysis,
matchup analysis, optimization, captain, impact-player and final validation
skills. Rules source: `regles_fantasy_rugby.md` at the project root. Player evidence
comes from the Fanpo CLI fiches and player pool fetched in this session.

## Corrections to the previous advice

- Prop sides are interchangeable under the project rules. Montagne's tighthead
  designation is not a lineup advantage over Forletta.
- Historical starts do not determine this round's bench eligibility. Replacing
  Baret simply because he started rounds 4 and 5 was premature.
- Availability flags are insufficient to recommend retaining a player: a player
  can be unflagged but omitted from the club's actual squad.
- Project rules require both fantasy bench players to be real substitutes and
  give both a double multiplier. The public website instead describes one
  designated impact player and a half-score penalty for a real starter on the
  fantasy bench. Follow the supplied reference for this review, but the conflict
  needs resolving before forecasting actual game points.
- The reference locks clubs five minutes before kickoff; the public website says
  kickoff itself. Use the earlier cutoff conservatively. It also differs on the
  precise late-withdrawal rule; no withdrawal assumptions are used in this review.
- Budget correction supplied by the user: the salary cap evolves with player
  performance/value. The current team cap is 11.15 M, rather than the initial
  11.00 M. The original squad costs 11.07 M and has 0.08 M remaining.
  The rules reference has been corrected accordingly.

## Current lineup audit

**Blocking violations:** None identified. Budget passes: 11.07 M ≤ 11.15 M.

**Warnings / unresolved information:** Official round 6 team sheets were not
available on the six relevant LNR match pages checked. Real starter status,
bench eligibility and last-minute withdrawals remain unconfirmed. The project
reference and public game rules disagree on bench scoring and lock timing.

**Validated constraints:** 17 distinct players; 15 starting slots and two bench
slots; API-listed primary/secondary/tertiary positions fit the selected slots,
including Rayasi's secondary ARR at slot 15. Club counts: UBB 3, CO 3, SP 3,
LOU 3, USAP 2, ST 2, SFP 1. Willis occupies starting slot 8 and is captain.
The API reports no clubs started or currently locked.

**Audit status: PROVISIONAL** because official player roles and bench eligibility
remain unresolved. The previously reported budget violation was incorrect.

## Current team-news evidence

[Rugbyrama's probable teams, published 8 October](https://www.rugbyrama.fr/2026/10/08/top-14-les-compositions-probables-de-la-6eme-journee-13590932.php)
place Baret and Cassang on Lyon's bench, Rayasi on Bordeaux's bench, and omit
Woki, Marta and Attissogbe. This moves squad participation ahead of the previous
Forletta-focused recommendations. These are predictions, not official selection.

The LNR match pages checked explicitly say lineups are unavailable:
[Lyon–La Rochelle](https://top14.lnr.fr/feuille-de-match/2026-2027/j6/11856-lyon-la-rochelle),
[Clermont–Bordeaux](https://top14.lnr.fr/feuille-de-match/2026-2027/j6/11855-clermont-bordeaux-begles),
[Pau–Castres](https://top14.lnr.fr/feuille-de-match/2026-2027/j6/11858-pau-castres),
[Perpignan–Vannes](https://top14.lnr.fr/feuille-de-match/2026-2027/j6/11854-perpignan-vannes),
[Paris–Montpellier](https://top14.lnr.fr/feuille-de-match/2026-2027/j6/11857-paris-montpellier),
[Toulouse–Bayonne](https://top14.lnr.fr/feuille-de-match/2026-2027/j6/11860-toulouse-bayonne).

## Matchup implications

The [LNR round 6 schedule](https://top14.lnr.fr/calendrier-et-resultats/2026-2027/j6)
places Pau second at home to twelfth-placed Castres; Perpignan eleventh at home
to fourteenth-placed Vannes; and first-placed Toulouse at home to third-placed
Bayonne. Clermont hosts Bordeaux, and Lyon hosts La Rochelle.

These are conditional sporting interpretations rather than quantified forecasts:

- Pau's home context and standings advantage favor attacking opportunity. That
  does not justify retaining omitted players. Castres forwards may gain tackle
  volume while its backs face less possession; this is a risk for Arata, not an
  automatic reason to sell him.
- Perpignan's home fixture offers a reason to reassess Forletta more favorably
  than his recent scores alone suggest, and supports keeping Montgaillard if
  selected. Rabut becomes a plausible budget candidate if his return is confirmed.
- Toulouse has home advantage, but Bayonne is third: do not assume a mismatch.
  Coly's away setting and thin sample weaken the proposed automatic downgrade
  from Ntamack. Bayonne backs could have kick-return opportunities, but neither
  volume nor efficiency is established.
- Bordeaux's trip to Clermont and the provisional squad changes reduce certainty
  in the original Bordeaux trio. Willis remains a strong historical candidate,
  but his opponents and supporting lineup matter.
- Lyon–La Rochelle is a close standings pairing (sixth versus seventh). There
  is insufficient evidence to project a dominant bench-friendly match script.

## Conditional alternatives

All prices are M. No expected score is equated with historical average. The
observed ranges below are descriptions of samples, not projected floors/ceilings.

| Decision | Alternative | Evidence and upside | Downside / dependency | Price change and quota effect |
|---|---|---|---|---|
| Woki if omitted | Verhaeghe | Average 83.08 over four scored games; observed 78.38–88.02; last three recorded starts lasted 80 minutes. Strong central historical production. | Must confirm selection and role; expensive, away at Paris. His possible real back-row role also changes production context. | +0.17; UBB 3→2, MHR 0→1; savings elsewhere needed with original budget. |
| Woki if omitted | Ludlam | Average 79.95 across three games; observed 76.29–86.07; 69–80 minutes. Better budget balance. | Current role unconfirmed; a smaller sample than Woki and no defensible exact forecast. | −0.03; UBB 3→2, RCT 0→1; alone leaves total at 11.04, with 0.11 remaining. |
| Marta if omitted | Bielle-Biarrey | Average 74.36 over three games, observed 48.08–89.69; latest score 89.69 in 80 minutes. High observed upside. | Volatile and expensive; need official starting status. | +0.42; requires freeing an UBB place first, e.g. Woki out. |
| Marta if omitted | Niniashvili | Average 78.03 over two games, observed 67.08–88.97; latest 80-minute score 88.97. AIL/ARR/CEN flexibility. | Very small sample and away at Lyon; selection must be confirmed. | +0.44; SR 0→1, SP 3→2; requires funding. |
| Attissogbe if omitted | Orabe | ARR/AIL eligibility; his one full scored appearance was 81.25. Saves money. | One scored match gives no credible distribution; another appearance lasted three minutes and was unscored. Away at Toulouse. | −0.21; AB 0→1, SP 3→2. |
| Attissogbe if omitted | Niniashvili | Two scored appearances offer more evidence than Orabe; useful back-three eligibility. | Cost, small sample, and away fixture. Cannot also replace Marta with the same player. | +0.11; SR 0→1, SP 3→2. |
| Forletta, after participation issues | Montagne | Average 76.46 over four games; observed 65.32–85.22. Last three recorded appearances were starts. | Latest score 65.32; improvement is uncertain. Side of scrum is irrelevant to fantasy eligibility. | −0.05; USAP 2→1, ASM 0→1; alone leaves 11.02, with 0.13 remaining. |
| Forletta, after participation issues | Penverne | Average 76.31 over five games; observed 69.22–87.95. Latest three appearances were starts of 48–56 minutes. | Real starting role unresolved; do not use as a starting-slot solution if named on the bench. | −0.19; USAP 2→1, SR 0→1; alone brings cost to 10.88, with 0.27 remaining. |
| Brau Boirie as funding option | Rabut | Average 79.77 across three games, observed 79.07–80.54; large saving and home fixture. | No recorded appearance since round 3; narrow range cannot be trusted as a future floor. Confirm return and starting status. | −0.42; USAP 2→3, SP 3→2. No further USAP addition unless another USAP player leaves. |
| Ntamack as funding option | Coly | DM/OUV eligibility; one scored match of 77.58 in 57 minutes; saves 0.36. | Not a demonstrated upgrade; one scored match, another unscored four-minute appearance, and away at Toulouse. | −0.36; ST 2→1, AB 0→1. |

Do not add Vargas while retaining all three Castres players. Do not add Gorgadze
while retaining all three Pau players. These require another club-specific change.

## Captain review

Willis remains the primary conditional recommendation. Five scored appearances
range from 76.08 to 94.47, averaging 87.75. Recent scores 89.01, 88.05 and 91.14
support both strong central production and observed upside. Recorded minutes
range 34–62: he is not an 80-minute certainty. Do not label the historical minimum
a guaranteed floor, especially away at Clermont.

Guillard is a meaningful existing-squad alternative: four recorded starts of
80 minutes, average 79.02, observed range 72.73–83.88. He offers better historical
minutes certainty but less observed scoring upside. Verhaeghe is another option
if bought and confirmed starting: average 83.08, range 78.38–88.02. Official role
and opponent adjustments remain unresolved for all captain choices.

## Impact-player review

Eligibility is UNRESOLVED for Cassang and Baret until official sheets confirm
substitute status. The current probable team supports retaining both as candidates,
not replacing Baret automatically.

- Cassang: latest bench appearance 21 minutes, 54.60. Entry-time and production
  risk are real; his 71.86 total average combines different roles and is not a
  reliable bench projection.
- Baret: the two scored appearances were starts of 55 and 59 minutes. Those
  performances do not establish how he will score in a shorter substitute role.
- Tagi: two historical substitute appearances of 30 and 40 minutes scored 68.54
  and 83.14. That is relevant bench evidence, but not round 6 eligibility evidence.
  He remains an alternative, not a confirmed upgrade; replacing Baret costs 0.19
  and changes LOU 3→2, AB 0→1.
- Rayasi: current provisional news suggests a substitute role. A move to the
  fantasy bench could be explored if confirmed, but requires filling his starting
  slot and recalculating budget/quota. His two scored matches were starts and do
  not establish a bench-role expectation. Merely moving him without rebalancing
  the squad is not a complete recommendation.

## Validation of my previous three-swap proposal

Previous changes: Forletta→Montagne; Baret→Tagi; Ntamack→Coly.

| Check | Status | Evidence |
|---|---|---|
| Roster structure | PASS | 17 distinct players; 15 starting slots and two bench slots. |
| Positions | PASS | Prop-to-prop; Coly is OUV eligible; bench replacement is structurally allowed. |
| Budget | PASS | 10.85 M against the current 11.15 M cap; 0.30 M remaining. |
| Club limits | PASS | UBB 3, CO 3, SP 3, LOU 2, AB 2, SFP 1, USAP 1, ASM 1, ST 1. |
| Captain eligibility | PASS | Willis remains in starting slot 8. |
| Impact-player eligibility | UNKNOWN | Cassang/Tagi official substitute status not confirmed. |
| Lock / timing constraints | PASS | No club currently locked; enforce the reference's earlier cutoff. |

**Final status: PROVISIONAL.** The arithmetic and structural checks pass, but the
proposal is no longer my preferred sporting recommendation: it leaves the
Woki/Marta/Attissogbe participation concerns and Rayasi role concern untouched.

## Revised decision

Withdraw the previous three swaps as a ready-to-use recommendation. First confirm
Woki, Marta, Attissogbe and Rayasi roles, plus both bench players. Prioritize
replacing confirmed omissions; preserve Baret if he is an official substitute and
offers credible entry time. Keep Willis as captain only with confirmed selection.
Choose mutually compatible alternatives from the shortlist after official sheets
arrive, then rerun the final validation. No team changes have been made.
