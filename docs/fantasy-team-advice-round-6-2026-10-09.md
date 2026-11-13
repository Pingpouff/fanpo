# Équipe de Beto — Round 6 advice

> **Updated 10 October 2026, 00:32 Paris time.** Announced roles have been
> refreshed through the Fantasy API. Your current saved team now has **14
> selections**, with slots **11, 14 and 15 empty**, and Dupont already in
> slot 9. The preferred completion costs **11.09 M** and remains
> **PROVISIONAL**.

## Announcement update and current-team audit

The fresh teamsheets confirm the roles used in the previous reassessment; there
is no additional role change among the shortlisted players. The important new
change is your saved composition, which this report now uses as its baseline.

| Item checked                                           | Fresh API result                                        | Advice consequence                                                                                           |
| ------------------------------------------------------ | ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| Current saved composition                              | 14 selections; three vacant starting slots; cost 9.36 M | **INVALID**: complete slots 11, 14 and 15 before the relevant clubs lock.                                    |
| Salary cap                                             | 11.15 M; 1.79 M unspent in the incomplete team          | Compare complete packages against this current cap.                                                          |
| Marta, Attissogbe, Rayasi                              | Absent; now removed from your saved team                | Fill their former slots with selected players rather than treating them as current picks.                    |
| Baret                                                  | Absent and still in slot 17                             | Replace him.                                                                                                 |
| Willis                                                 | Starter                                                 | Retain captain in slot 8.                                                                                    |
| Ludlam, Gorgadze, Rabut, Vargas, Bielle-Biarrey, Lorre | Starters                                                | All proposed additions have confirmed starting roles.                                                        |
| Cassang and Pkhakadze                                  | Substitutes                                             | Evaluate impact using substitute projections; prefer Pkhakadze in the model, with a one-match sample caveat. |
| Serin / El Bibouji                                     | Starter / absent                                        | Do not revive the earlier substitute-dependent bench recommendations.                                        |
| Dupont, Ntamack, Chocobares                            | Unknown: Toulouse not announced in the API              | Retain provisionally; expected totals remain unresolved.                                                     |

The previous report assumed a complete 11.07 M team with Arata and four absent
players. That is historical context, not today's comparison baseline. The
recommendation below keeps your already selected Dupont; restoring Arata is a
separately evaluated lower-cost alternative.

### How the recommendation was built

The decision order was **legality → confirmed availability → matchup context →
individual projection and price → complete lineup comparison**. Completing the
three vacant slots and removing the remaining absent bench player takes priority
over small upgrades to selected players. Club limits and the 11.15 M budget were
checked on whole proposals.

#### Matchup investigation and clubs to target

`analyze matchups` estimates club strength from earlier completed matches,
accounting for opponent strength, recency and home advantage. Current standings
provide context; they are not directly added to the player score. The forecast
then estimates winning and large-margin outcomes using historical forecast
errors. Below, all margins and probabilities refer to the **home club**.

| Home vs away | Forecast margin | Home win | Home win by 20+ | Home lose by 20+ | Home / away player factors |
| ------------ | --------------- | -------- | --------------- | ---------------- | -------------------------- |
| SFP vs MHR   | -0.58           | 67.9%    | 35.7%           | 7.1%             | ×1.029 / ×0.971            |
| USAP vs RCV  | +5.33           | 82.1%    | 46.4%           | 3.6%             | ×1.043 / ×0.957            |
| LOU vs SR    | +5.65           | 85.7%    | 46.4%           | 3.6%             | ×1.043 / ×0.957            |
| SP vs CO     | +11.92          | 89.3%    | 60.7%           | 0.0%             | ×1.061 / ×0.939            |
| RCT vs R92   | +6.13           | 85.7%    | 46.4%           | 3.6%             | ×1.043 / ×0.957            |
| ASM vs UBB   | -2.64           | 64.3%    | 28.6%           | 7.1%             | ×1.021 / ×0.979            |
| ST vs AB     | +12.66          | 89.3%    | 60.7%           | 0.0%             | ×1.061 / ×0.939            |

**Pau and Toulouse are the strongest targets** on projected margin and large-win
potential. Gorgadze is a confirmed Pau starter; Rabut replacing Brau Boirie
frees his club place. Toulouse's attractive matchup supports considering Dupont,
but his unannounced role prevents making him a priority or captain.

**USAP, Lyon and Toulon provide the next favorable group.** Rabut combines a
home matchup with a low price; Lorre offers confirmed selection and four scored
starts; Ludlam improves the third-row projection and frees a Castres place.
Favorable conditions could support attacking volume for backs and carrying or
set-piece opportunities for forwards. These are tactical interpretations, not
additional numerical bonuses or measured possession forecasts.

**Castres away at Pau is a concern**, yet Vargas remains an economical,
confirmed replacement for an absent winger. His projection already includes the
unfavorable factor. Defensive workload can still benefit players on the weaker
side; winning-club selection is therefore a preference, not a rule. The advised
squad still has three Castres players because this bounded search balances cost,
positions and availability rather than rebuilding every slot.

**Bordeaux is selected for individual value despite its matchup penalty.**
Willis retains strong historical ratings, Bielle-Biarrey replaces an absence,
and Pkhakadze offers an inexpensive confirmed bench role. These choices do not
claim Bordeaux is the forecast's preferred club.

Treat the percentages as exploratory: the replay has only **28 errors**, and its
**16.03** mean absolute error trails the **15.79** home-only baseline. The
empirical residual distribution can also give a negative expected margin but a
home win probability above 50%, as for SFP and ASM. This disagreement is another
reason to avoid ranking players solely by the displayed win percentage.

#### Selection strength and rotation review — 10 October, 00:40 Paris

**Starter lists are available for all six Saturday fixtures.** The Fantasy API
announces **SFP, MHR, USAP, RCV, LOU, SR, SP, CO, RCT, R92, ASM and UBB**;
Toulouse and Bayonne remain unannounced. The role evidence here is teamsheets
snapshot **#144**, fetched **9 October 22:36:18.793 UTC**, target round
**#142**. Club announcements and match previews dated 9 October provide the
additional rotation and injury context below. This supplements the report's
earlier lineup comparison; it is not a new numerical scoring model.

**Important model limitation:** v1 uses teamsheets to resolve an individual
player's role, but its club-strength forecast uses earlier match results and
home advantage, **not the quality of the announced XV or bench**. A weakened
opposition can therefore be missing from the numerical forecast. The existing
CLI has no selection-strength or rotation comparison operation; published
announcements are the bounded evidence source for this qualitative review.

| Fixture                      | Selection evidence                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                | Interpretation for the forecast                                                                                                                                                                                                                                                      |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Lyon / La Rochelle           | La Rochelle lists Alldritt, Le Garrec, Skelton, Bourgarit and Danty among its injured players; the Fantasy API confirms all five absent. Boudehent moves into the second row. [Club injury bulletin](https://www.staderochelais.com/actualites/news/le-point-infirmerie-avant-lyon-0), [club selection preview](https://www.staderochelais.com/actualites/news/l-equipage-pour-l-escale-lyonnaise).                                                                                                                                                                               | The clearest injury-weakened selection concern. Qualitatively supports Lyon and a possible wider margin than v1's **+5.65**. Some absences may already affect recent results, so their full effect cannot be added again. This is not evidence of intentionally conceding the match. |
| Clermont / Bordeaux          | Clermont makes nine changes, restoring its front row, Plummer, Darricarrère and Delguy after its rotated away selection. Bordeaux changes six, starts Retière at fly-half for the first time in his professional career and gives Ibsaiene his first Top 14 start; nevertheless its XV contains 12 internationals. [ASM announcement](https://www.asm-rugby.com/actus/2026-10-09-17-58-18-des-cadres-de-retour-et-des-nouveautes), [UBB announcement](https://www.ubbrugby.com/actualites/10541-la-compo-pour-le-deplacement-a-clermont.html).                                    | Evidence favors moving the qualitative assessment toward Clermont relative to v1's **-2.64 home margin**. Nine changes strengthen ASM here: change count alone would give the wrong conclusion. Bordeaux remains an experienced side, not an established reserve XV.                 |
| Pau / Castres                | Castres misses Ducat and Staniforth, retains its front row, Vanverberghe, Delaporte and Arata, and starts Vidal instead of Le Brun. Pau also rests Marta and Attissogbe while restoring Brau Boirie/Gailleton. [Castres selection analysis](https://www.ladepeche.fr/2026/10/09/pau-castres-babillot-capitaine-goodhue-toujours-la-decouvrez-le-xv-de-depart-du-co-13593445.php), [both selections](https://www.rugbyrama.fr/2026/10/09/top-14-les-compositions-de-pau-castres-fabien-brau-boirie-et-emilien-gailleton-au-centre-theo-vidal-titulaire-a-louverture-13593136.php). | Castres has depth concerns, but Pau's own changes offset an automatic upgrade. Retain Pau as a favorable context; do not inflate **+11.92** merely because Castres rotates.                                                                                                          |
| Perpignan / Vannes           | Vannes rotates primarily among the forwards; Ruru/Lafage and Gorrissen/Kalamafoni remain starters. USAP changes both half-backs. [Selection review](https://www.rugbyrama.fr/2026/10/09/top-14-les-compositions-de-perpignan-vannes-paolo-garbisi-retrouve-louverture-le-rcv-fait-tourner-ses-avants-13593145.php).                                                                                                                                                                                                                                                               | Moderate pack-rotation signal, not enough to label Vannes a B team or increase USAP's **+5.33** numerically. USAP remains a useful context for Rabut, Montgaillard and Forletta.                                                                                                     |
| Toulon / Racing              | Racing makes four changes and retains an experienced core including Bamba, Taofifenua, Tuisova and Habosi. Toulon also has established starters but changes at full-back. [Racing club announcement](https://www.racing92.fr/article/composition-toulon-racing-92-antoine-gibert-fete-son-200e-match-a-mayol/65967/), [match selection review](https://www.rugbyrama.fr/2026/10/09/top-14-les-compositions-de-toulon-racing-92-rebbadj-a-larriere-le-racing-92-aligne-du-lourd-13593151.php).                                                                                     | No convincing evidence Racing has sent a reserve side. Do not promote Toulon's **+6.13** into an assumed rout; Ludlam's selection remains supported by his own projection.                                                                                                           |
| Stade Français / Montpellier | Paris makes eight changes; Montpellier also rotates. Both retain experienced starters, including Iscaro/Carbonel for Paris and Verhaeghe/Vunipola for Montpellier. [Selection review](https://www.rugbyrama.fr/2026/10/09/top-14-les-compositions-de-stade-francais-montpellier-jack-iscaro-et-louis-carbonel-enchainent-valentin-welsch-demarre-a-gauche-13593133.php).                                                                                                                                                                                                          | Rotation on both sides makes its direction ambiguous. No supported basis for turning the near-even **-0.58 home margin** into a large mismatch.                                                                                                                                      |

La Rochelle's selection page contains an internal inconsistency: its heading and
prose identify Bouju at scrum-half, while the written XV lists Le Garrec. The
injury bulletin, Fantasy API absence and match selection review agree on Le
Garrec being unavailable. This review uses that corroborated status rather than
silently accepting the inconsistent list.

**Fantasy implications:** Lyon's Lorre and Guillard receive additional
qualitative support; Bordeaux selections, including captain Willis and
Bielle-Biarrey, face more opposition-strength risk than the original historical
margin alone suggests. For Willis, extra defensive work could still generate
points: the rotation finding does not establish that his individual projection
falls. Gorgadze remains a credible captain alternative already evaluated in the
CLI. These findings alone do not warrant a new transfer package or an untested
captain switch.

The probabilities, player scores and compared lineup totals in this report
remain **unadjusted v1 outputs**. No extra margin points or player multiplier
have been invented. A future selection-aware forecast should compare the current
23 with recent regular selections, distinguish new injuries from longstanding
absences, include bench strength and calibrate the incremental margin effect. A
team can rotate for injuries, workload or tactics while still intending to win;
there is no verified evidence here of a club conceding in advance.

#### How the matchup enters each player score

The production model uses this calculation separately for starters and
substitutes:

```text
baseline = weighted mean of comparable historical ratings
           (up to five earlier consolidated appearances; recency weights 0.8^i;
            only appearances with 10+ minutes and a known rating enter the mean)
domination = P(club wins by 20+) − P(club loses by 20+)
matchup factor = 1 + 0.10 × domination
role projection = clamp(baseline × matchup factor, 0, 100)
                  × estimated chance of playing 10+ minutes
Fantasy contribution = role projection × captain/impact multiplier
                       × 0.5 if a real starter occupies a Fantasy bench slot
```

For away players the club domination is the opposite of the home figure. Known
absences contribute zero; unknown roles stay unresolved. There are no extra try,
tackle or positional bonuses added on top of the historical rating.

For example, Ludlam's displayed starter baseline is **79.25**, and Toulon's
factor is approximately **1.043**, producing **82.65** with a 100% historical
10+ minute rate. Vargas' **74.93** baseline falls to **70.38** with Castres'
**0.939** factor. Displayed inputs are rounded; the CLI uses full precision.
These examples show how the forecast influences both the upside and the cost of
selecting a player from an unfavorable club.

### Preferred completion of your current team

Use the complete proposal input
[round-6-availability-repair-dupont.json](../.data/round-6-availability-repair-dupont.json).
The seven changes below are compared **together** for positions, cost and club
quotas. Keep **Dupont**, **Ntamack** and **Chocobares** provisionally; keep
**Willis captain** and designate **Pkhakadze impact**.

| Slot | Change from the current saved team | New price | Reason and main tradeoff                                                                                                         |
| ---- | ---------------------------------- | --------- | -------------------------------------------------------------------------------------------------------------------------------- |
| 6    | Delaporte → Ludlam #116, RCT       | 0.71 M    | 82.65 versus 72.53; better forecast context and frees a Castres place for Vargas. Three scored starts only.                      |
| 7    | Woki → Gorgadze #825, SP           | 0.95 M    | 87.57 versus 77.60; Pau's favorable home fixture. Frees a Bordeaux place for the full replacement package.                       |
| 11   | Vacant → Vargas #600, CO           | 0.47 M    | Confirmed starter, projected 70.38; economical, but Castres face the unfavorable away matchup. Only two scored starts.           |
| 13   | Brau Boirie → Rabut #1247, USAP    | 0.43 M    | Saves 0.42 M, projection 83.23 versus 80.73, favorable home fixture; three scored starts only. Frees the Pau place for Gorgadze. |
| 14   | Vacant → Bielle-Biarrey #38, UBB   | 0.91 M    | Confirmed starter, projected 73.29; historical starter scores vary from 48.08 to 89.69.                                          |
| 15   | Vacant → Lorre #243, LOU           | 0.62 M    | Confirmed starter, projected 78.33; four scored starts, favorable home context.                                                  |
| 17   | Baret → Pkhakadze #1158, UBB       | 0.19 M    | Confirmed substitute; 85.08 before impact, based on just one scored substitute appearance.                                       |

**Complete cost: 11.09 M; remaining: 0.06 M.** Club counts: **SFP 1, USAP 3, LOU
3, CO 2, RCT 1, SP 1, UBB 3, ST 3**. These are mutually compatible moves;
independent additional transfers can break the quotas or budget.

### Current lineup versus advised lineup

Contributions come directly from `compare`'s `before.slots[].expected` and
`after.slots[].expected`, including matchup, actual announced roles and
captain/impact effects. **S = starter, B = substitute, A = absent, ? =
unknown**. An empty slot is **vacant**, not a confirmed zero-scoring player.
Unknown projections remain **?**.

| Slot | Current player / role             | Contribution | Advised player / role             | Contribution | Change        |
| ---- | --------------------------------- | ------------ | --------------------------------- | ------------ | ------------- |
| 1    | Jack Iscaro (SFP) / S             | 80.58        | Jack Iscaro (SFP) / S             | 80.58        | —             |
| 2    | Victor Montgaillard (USAP) / S    | 82.55        | Victor Montgaillard (USAP) / S    | 82.55        | —             |
| 3    | Enzo Forletta (USAP) / S          | 73.88        | Enzo Forletta (USAP) / S          | 73.88        | —             |
| 4    | Mickael Guillard (LOU) / S        | 81.50        | Mickael Guillard (LOU) / S        | 81.50        | —             |
| 5    | Florent Vanverberghe (CO) / S     | 76.59        | Florent Vanverberghe (CO) / S     | 76.59        | —             |
| 6    | Baptiste Delaporte (CO) / S       | 72.53        | Lewis Ludlam (RCT) / S            | 82.65        | +10.12        |
| 7    | Cameron Woki (UBB) / S            | 77.60        | Beka Gorgadze (SP) / S            | 87.57        | +9.98         |
| 8    | Tom Willis (UBB) / S, captain     | 176.96       | Tom Willis (UBB) / S, captain     | 176.96       | —             |
| 9    | Antoine Dupont (ST) / ?           | ?            | Antoine Dupont (ST) / ?           | ?            | Unresolved    |
| 10   | Romain Ntamack (ST) / ?           | ?            | Romain Ntamack (ST) / ?           | ?            | Unresolved    |
| 11   | **Vacant**                        | —            | Adam Vargas (CO) / S              | 70.38        | Fills vacancy |
| 12   | Santiago Chocobares (ST) / ?      | ?            | Santiago Chocobares (ST) / ?      | ?            | Unresolved    |
| 13   | Fabien Brau Boirie (SP) / S       | 80.73        | Maelan Rabut (USAP) / S           | 83.23        | +2.50         |
| 14   | **Vacant**                        | —            | Louis Bielle-Biarrey (UBB) / S    | 73.29        | Fills vacancy |
| 15   | **Vacant**                        | —            | Gabin Lorre (LOU) / S             | 78.33        | Fills vacancy |
| 16   | Charlie Cassang (LOU) / B, impact | 113.88       | Charlie Cassang (LOU) / B         | 56.94        | -56.94        |
| 17   | Lilian Baret (LOU) / A            | 0.00         | Lasha Pkhakadze (UBB) / B, impact | 170.15       | +170.15       |

Differences subtract existing CLI contributions; displayed rounding may affect
hundredths. Read both bench rows together: Pkhakadze receives the impact
multiplier while Cassang loses it. His **170.15** impact projection is not a
standalone gain over the current bench. It relies on one substitute appearance
(**86.94 in 29 minutes**); choosing Cassang as impact is a reasonable
alternative if you prefer to avoid that thin sample. Neither projection
guarantees ten minutes or a repeat performance.

| Team comparison                    | Current saved team         | Advised complete team | Difference                                        |
| ---------------------------------- | -------------------------- | --------------------- | ------------------------------------------------- |
| Selections                         | 14                         | 17                    | Three vacancies filled                            |
| Cost                               | 9.36 M                     | 11.09 M               | +1.73 M                                           |
| Remaining budget                   | 1.79 M                     | 0.06 M                | -1.73 M                                           |
| Selected known absences            | 1: Baret                   | 0                     | Absent bench pick replaced                        |
| Unknown real roles                 | 3                          | 3                     | Dupont, Ntamack, Chocobares pending               |
| Validation                         | INVALID                    | PROVISIONAL           | Structure repaired; selection uncertainty remains |
| Expected team points               | Unresolved                 | Unresolved            | **Expected gain unresolved**                      |
| CLI conditional all-starters total | 1141.47, incomplete roster | 1409.76               | **+268.29 conditional points**                    |

The conditional difference is
`after.conditionalAllStarters −
before.conditionalAllStarters`. The CLI sums the
**14 supplied selections** in the invalid baseline; it does not invent players
for the vacancies. Its scenario also counterfactually treats the real
substitutes as starters, with Fantasy bench penalties, while known absences stay
zero. Consequently **+268.29 is not an expected improvement over a complete
legal team**. It combines filling empty positions with transfers and a
counterfactual role assumption. The expected team-total gain remains unavailable
until the necessary roles are resolved.

### Different complete lineups evaluated

Each variant is a complete local input `.data/round-6-<variant>.json` and was
compared against the current saved composition. All proposed lineups have no
blocking errors and are **PROVISIONAL**; all `expectedDelta` values are
unresolved. The totals below use the identical `conditionalAllStarters` scenario
described above, not an expected-score ranking.

| Variant                                                                                          | Cost / remaining M | Conditional all-starters total |
| ------------------------------------------------------------------------------------------------ | ------------------ | ------------------------------ |
| availability-repair-dupont — Preferred: retain Dupont; Willis captain; Pkhakadze impact          | 11.09 / 0.06       | 1409.76                        |
| availability-repair-dupont-cassang-impact — Same players; Cassang impact                         | 11.09 / 0.06       | 1419.15                        |
| availability-repair-dupont-gorgadze-captain — Same players; Gorgadze captain                     | 11.09 / 0.06       | 1408.85                        |
| availability-repair-dupont-captain — Same players; Dupont captain, role unknown                  | 11.09 / 0.06       | 1409.99                        |
| availability-repair — Restore Arata instead of Dupont                                            | 10.86 / 0.29       | 1396.21                        |
| availability-wing-alternative — Arata; keep Woki; Wainiqolo/Vargas/Niniashvili in slots 11/14/15 | 10.92 / 0.23       | 1394.58                        |

**Why retain the Dupont version?** You have already selected him. This package
completes the team without reversing that choice, within budget. If you want
more reserve cash or to reduce exposure to unannounced Toulouse roles, restoring
Arata reduces the cost to **10.86 M**, leaving **0.29 M**. Dupont's starter
projection is **88.70**, his substitute projection **68.01**, versus confirmed
starter Arata's **75.15**: neither outcome should be assumed before Toulouse's
announcement. The recommendation to retain Dupont is provisional, not a claim
that his unresolved expected value exceeds Arata's.

**Captain:** retain confirmed starter Willis, whose four scored starts ranged
**88.05–94.47**. Gorgadze is a confirmed alternative; Dupont's tiny
starter-scenario edge does not justify an unknown-role captain. The captain
variants were checked on the same Dupont roster, rather than mixed with the
Arata options.

**Wing alternative:** the Wainiqolo/Vargas/Niniashvili route also fills
vacancies and replaces Baret, but restores Arata and keeps Woki. Its cheaper
10.92 M cost is useful; its different conditional total alone cannot establish
inferiority while expected scores remain unresolved. It is a separate package,
not a set of extra transfers to add to the preferred squad.

### Actions around the first matches

Times below are **Europe/Paris** and describe scheduled kickoffs, not locally
inferred lock deadlines. The server's club-lock state controls whether a move is
still possible; refresh it before acting.

- **Saturday 10 October, 14:30 — SFP/MHR:** Iscaro is a confirmed starter. No
  change proposed in that fixture.
- **Saturday 10 October, 16:35 — USAP/RCV, LOU/SR, SP/CO, RCT/R92:** complete
  the linked Rabut, Ludlam, Gorgadze, Vargas and Lorre moves while the affected
  clubs remain editable. Rabut and Gorgadze must be considered together because
  of Pau's quota. Baret is absent; plan his replacement with the full package.
- **Saturday 10 October, 21:00 — ASM/UBB:** Bielle-Biarrey and Willis are
  starters; Pkhakadze is a substitute. Confirm the selections, impact slot and
  any late withdrawal before the server locks these clubs.
- **Sunday 11 October, 21:05 — ST/AB:** recheck Dupont, Ntamack and Chocobares
  when Toulouse is announced. Do not leave their roles implicit. With only
  **0.06 M** spare, any replacement must be checked as a complete lineup and
  respect clubs already locked; earlier budget-saving swaps may no longer be
  possible by then.

### Final validation and evidence

The final proposal was checked with `analyze lineup` after comparing the
variants. The current team fails the 17-selection requirement; the proposal has
no blocking errors but remains **PROVISIONAL**.

| Constraint                       | Current team                      | Advised team                                  |
| -------------------------------- | --------------------------------- | --------------------------------------------- |
| Roster structure                 | FAIL — 14 selections              | PASS — 17 selections                          |
| Positions of supplied selections | PASS; three slots vacant          | PASS                                          |
| Budget                           | PASS — 9.36 M ≤ 11.15 M           | PASS — 11.09 M ≤ 11.15 M                      |
| Club limits                      | PASS                              | PASS — maximum three per club                 |
| Captain eligibility              | PASS — Willis, slot 8             | PASS — Willis, slot 8                         |
| Impact eligibility               | PASS — Cassang, slot 16           | PASS — Pkhakadze, slot 17                     |
| Lock / timing constraints        | PASS at recorded check            | PASS at recorded check; refresh before acting |
| Real-match selection             | Three unknown roles; Baret absent | UNKNOWN — Dupont, Ntamack, Chocobares         |
| Overall status                   | INVALID                           | PROVISIONAL                                   |

Scope: **https://fantasy.poneeey.fr**, season **2026-27**, profile **default**,
composition **1**, database **.data/fanpo.sqlite**, target round **6**, model
**fanpo-v1**. Core team and teamsheets were refreshed at **2026-10-09 22:29:50
UTC = 10 October 00:29:50 Paris**. Final commands reported required data
current; evidence below records the exact acquisition times. The API confirms
roles among the players discussed, rather than requiring assumptions from the
Fantasy bench slots.

| Stored source                  | Snapshot | Fetched UTC              |
| ------------------------------ | -------- | ------------------------ |
| `/api/journees/cible`          | #135     | 2026-10-09T22:29:49.858Z |
| `/api/top14/matchs`            | #111     | 2026-10-09T18:06:17.706Z |
| `/api/top14/classement`        | #112     | 2026-10-09T18:06:17.706Z |
| `/api/joueurs`                 | #138     | 2026-10-09T22:29:50.009Z |
| `/api/feuilles`                | #140     | 2026-10-09T22:29:50.009Z |
| `/api/notes-journee?journee=6` | #136     | 2026-10-09T22:29:50.009Z |
| `/api/compos/1`                | #137     | 2026-10-09T22:29:50.009Z |
| `/api/compos/etat-verrou`      | #141     | 2026-10-09T22:32:42.673Z |
| `/api/joueurs/479/fiche`       | #119     | 2026-10-09T18:06:17.993Z |
| `/api/joueurs/1133/fiche`      | #121     | 2026-10-09T18:06:17.993Z |
| `/api/joueurs/989/fiche`       | #120     | 2026-10-09T18:06:17.993Z |
| `/api/joueurs/277/fiche`       | #118     | 2026-10-09T18:06:17.993Z |
| `/api/joueurs/622/fiche`       | #123     | 2026-10-09T18:06:17.993Z |
| `/api/joueurs/116/fiche`       | #66      | 2026-10-09T16:06:21.291Z |
| `/api/joueurs/825/fiche`       | #75      | 2026-10-09T16:06:21.291Z |
| `/api/joueurs/1160/fiche`      | #125     | 2026-10-09T18:06:17.993Z |
| `/api/joueurs/755/fiche`       | #76      | 2026-10-09T16:06:21.291Z |
| `/api/joueurs/808/fiche`       | #127     | 2026-10-09T18:06:17.993Z |
| `/api/joueurs/600/fiche`       | #89      | 2026-10-09T17:30:42.635Z |
| `/api/joueurs/811/fiche`       | #129     | 2026-10-09T18:06:17.993Z |
| `/api/joueurs/1247/fiche`      | #68      | 2026-10-09T16:06:21.291Z |
| `/api/joueurs/38/fiche`        | #93      | 2026-10-09T17:30:42.635Z |
| `/api/joueurs/243/fiche`       | #94      | 2026-10-09T17:30:42.635Z |
| `/api/joueurs/231/fiche`       | #132     | 2026-10-09T18:06:17.993Z |
| `/api/joueurs/1158/fiche`      | #79      | 2026-10-09T16:06:21.291Z |

The first refresh on 9 October around 20:06 Paris confirmed the earlier
teamsheets and original full team. A later refresh at 00:29 Paris found your
changed, incomplete saved composition (#137), which supersedes that baseline.
The previous #97–102 comparison against the 11.07 M roster is historical. The
current report uses #135–140 for target round, ratings, composition, catalogue
and teamsheets, with locks refreshed again as **#141 at 22:32:42.673 UTC**.
Fixtures and standings were refreshed as #111–112; the forecast outputs did not
change. Fresh candidate fiches were reused from SQLite. No API-response JSON
exports or scratch scoring were used.

Commands used include:

```sh
deno task cli data status
deno task cli sync
# One forced refresh checked for announcements inside the cache TTL:
deno task cli sync --force
deno task cli analyze lineup --offline
deno task cli analyze matchups --offline
deno task cli data players --position TL --available
deno task cli analyze player 479 1133 989 277 622 612 11 1160 755 808 811 834 231 265 116 825 600 1247 38 243 1158 --offline
deno task cli compare --alternative .data/round-6-availability-repair-dupont.json
deno task cli compare --alternative .data/round-6-availability-repair-dupont-cassang-impact.json --offline
deno task cli compare --alternative .data/round-6-availability-repair-dupont-gorgadze-captain.json --offline
deno task cli analyze lineup --lineup .data/round-6-availability-repair-dupont.json --offline
```

Additional `compare` calls covered each listed variant, and player-analysis
batches covered Serin, El Bibouji and the wing alternatives. Proposal files are
local complete inputs; the team on the server was not edited. Revalidate after
any selection, price, withdrawal or lock change.

## Historical report — 9 October 2026, 18:08 Paris

The following original analysis is preserved for traceability. Use the
reassessment above for the revised proposal and its evidence.

**Analysis date:** 9 October 2026. **Status:** PROVISIONAL — awaiting
teamsheets.

My preferred **provisional plan** is **Brau Boirie → Rabut, Delaporte → Ludlam,
and Arata → Dupont**. It costs **10.90 M**, leaving **0.25 M** for adjustments
once teamsheets arrive.

I used the Fantasy Rugby analysis skills and queried SQLite directly, refreshing
stale inputs and fetching only missing candidate fiches.

## Current squad assessment

Your current squad has a strong foundation. You spend **11.07 M against 11.15
M**, with no blocking position or club-limit violations. Montgaillard and Iscaro
offer good value; Willis is an excellent captain candidate; Attissogbe benefits
from Pau hosting Castres.

The main exposures are:

- **Three Castres players away at Pau:** Vanverberghe, Delaporte and Arata. Pau
  are second in the stored standings; Castres are twelfth. Defensive workload
  can still help the forwards, but this is a less attractive collective setting.
- **Forletta’s role and form:** his last three ratings were **61.05, 68.76 and
  69.94**, with the latest appearance coming as a substitute.
- **Bench efficiency:** Cassang’s impact value depends heavily on his real role.
  Baret’s available history contains only starts, so his substitute projection
  remains unresolved.

## Three priority changes

The projections below assume each player starts. They include the v1 matchup
adjustment; they are estimates, not guaranteed scores.

| Change                                           | Budget effect    | Starter projection | Why I prefer it—and the risk                                                                                                                                                                                     |
| ------------------------------------------------ | ---------------- | ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Brau Boirie → Maëlan Rabut**, USAP, **0.43 M** | Saves **0.42 M** | **80.7 → 83.2**    | Rabut’s three ratings are tightly grouped at **79.07–80.54**, and USAP host bottom-placed Vannes. Excellent funding option. **Risk:** his recorded appearances stop at round three; selection must be confirmed. |
| **Delaporte → Lewis Ludlam**, Toulon, **0.71 M** | Costs **0.02 M** | **72.5 → 82.6**    | Ludlam’s recorded starts produced **76.29–86.07** over **69–80 minutes**. His latest match included 15 tackles and 41 metres. Toulon host Racing. **Risk:** only three appearances, none recorded in round five. |
| **Arata → Antoine Dupont**, Toulouse, **0.89 M** | Costs **0.23 M** | **75.2 → 88.7**    | Toulouse host Bayonne. Dupont’s last recorded start produced **83.84**, with 119 metres, nine defenders beaten and two tries. **Risk:** rotation; a substitute appearance changes the comparison substantially.  |

Together, these changes save **0.17 M** and improve the **conditional starter
scenario by roughly 26 points**. USAP and Toulouse reach **three players each**;
Castres drops to one.

## Other useful alternatives

These are separate options; they should not all be combined.

| Option                                        | Reason to consider it                                                                                                                                              | Budget and quota implications                                                                                                                                                     |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Vanverberghe → Jonny Gray**, **0.59 M**     | Starter projection **82.7 versus 76.6**. His recorded ratings range **69.90–92.35**: greater upside, with volatility.                                              | Costs **0.06 M**. Together with Ludlam replacing Delaporte, total cost is **11.15 M**. USAP reaches three, so **Rabut cannot also join** without another USAP departure.          |
| **Delaporte → Florian Verhaeghe**, **0.91 M** | His last two starts scored **87.06 and 88.02**; the latest included 14 own-throw lineout wins. Strong individual evidence despite Montpellier travelling to Paris. | Costs **0.22 M**, requiring savings elsewhere, such as Rabut replacing Brau Boirie. Montpellier would have one player.                                                            |
| **Forletta → Jérôme Rey**, **0.79 M**         | Recorded starts scored **78.78 and 89.16**; starter projection approximately **88.2**.                                                                             | Costs **0.09 M** and would exceed Lyon’s quota alone. Pairing it with **Baret → El Bibouji** resolves both constraints: total **11.09 M**. Rey has only two recorded appearances. |

I would **keep Montgaillard**, rather than spending more at hooker, and retain
Ntamack, Chocobares and Attissogbe if they start.

## Captain and bench decisions

Keep **Willis as captain if he starts**. His four recorded starts scored
**88.05–94.47**, giving him the strongest observed floor among your leading
candidates. Dupont is the main alternative after the proposed transfer, but
their projected scores are practically level: **88.7 versus 88.5**. That
difference is too small to justify changing captain by itself.

For your remaining **0.25 M after the main package**, choose according to
teamsheets:

- **If Baptiste Serin is a substitute:** consider replacing Cassang for **0.14 M
  extra**, keeping the impact designation. Serin’s two substitute appearances
  lasted **19 and 27 minutes**, scoring **54.28 and 86.60**. Conditional impact
  projection: approximately **151 points**, versus Cassang’s **114**. Total
  squad cost: **11.04 M**. The wide score range is the main downside.
- **If Beka Gorgadze starts:** replacing Woki costs **0.21 M**, bringing the
  squad to **11.11 M**. His starter projection is **87.6 versus Woki’s 77.6**,
  helped by Pau’s home fixture. This becomes legal after Rabut frees a Pau
  place.
- **If Hayam El Bibouji is named on Vannes’ bench:** he is a **0.20 M**
  alternative to Baret, saving **0.07 M**. His sole recorded appearance produced
  **74.34 in 29 minutes**, including eight tackles. Useful budget potential, but
  one appearance cannot establish a reliable floor.

**Do not combine the Serin and Gorgadze upgrades without further savings.**
Also, a real starter on your Fantasy bench remains legal but receives the
half-score penalty before the impact multiplier.

## Final validation

The main three-change package passes roster structure, positions, budget, club
limits, captain and impact-slot eligibility. No clubs were locked at the latest
check. Its overall status is **PROVISIONAL**, because **no round-six teamsheets
were published**.

| Check                                                              | Status                           |
| ------------------------------------------------------------------ | -------------------------------- |
| Roster structure: 17 players, 15 starters and two bench selections | PASS                             |
| Positions                                                          | PASS                             |
| Budget: 10.90 M against 11.15 M                                    | PASS                             |
| Club limits: maximum three per club                                | PASS                             |
| Captain eligibility: Willis in starting slot 8                     | PASS                             |
| Impact eligibility: designated bench slot 16                       | PASS                             |
| Lock / timing constraints at latest check                          | PASS                             |
| Real-match selection and roles                                     | UNKNOWN — teamsheets unpublished |

## Evidence and limitations

Team/catalogue/teamsheets snapshots **#60–63**, candidate fiches **#64–81**, and
lock snapshot **#82**, checked on **9 October 2026 at 18:08 Paris time**.
Existing fresh player fiches were reused from SQLite; fixtures and standings
came from snapshots **#2–3**, fetched at **14:43 UTC** that day. Target round:
**6**, snapshot **#58**.

The matchup model remains exploratory: its replay error is slightly worse than
the simple home-advantage baseline, so confirmed roles should decide the final
changes. The replay uses 28 forecast errors, with mean absolute error **16.03**
against **15.79** for the home-advantage baseline. No unconditional team-total
forecast is available while real roles remain unknown.
