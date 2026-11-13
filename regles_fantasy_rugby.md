# Fantasy Rugby — Règles et objectifs du jeu

> Document de référence pour l’analyse des compositions Fantasy Rugby sur
> fantasy.poneeey.fr. À utiliser comme contraintes systématiques lors de chaque
> analyse de journée.

## 1. Objectif du jeu

L’objectif est de composer, pour chaque journée, un XV de rugby capable de
marquer le maximum de points Fantasy tout en respectant les contraintes de
composition, de budget et de sélection.

La stratégie ne consiste donc pas uniquement à choisir les joueurs ayant la
meilleure moyenne historique. Une bonne composition doit combiner :

- le potentiel individuel du joueur ;
- sa forme récente et ses statistiques ;
- son poste et les statistiques valorisées à ce poste ;
- son statut réel pour le match (titulaire ou remplaçant) ;
- son temps de jeu probable ;
- l’adversaire et le scénario probable du match ;
- le potentiel collectif de son club sur la journée ;
- le coût du joueur et le salary cap ;
- les contraintes de nombre de joueurs par club ;
- le choix du capitaine et des impact players.

L’analyse d’une journée doit chercher à maximiser **l’espérance de points**,
tout en identifiant les choix à fort plafond, les choix sûrs et les risques de
la composition.

---

## 2. Composition d'une équipe

Une équipe comporte **17 joueurs** :

- **15 titulaires** ;
- **2 remplaçants Fantasy**, dont un seul impact player désigné.

La composition doit respecter les postes prévus par le jeu.

### Particularité de la première ligne

Dans ce Fantasy, les piliers droits et gauches sont **interchangeables** pour la
composition.

---

## 3. Salary cap

Chaque joueur possède une valeur.

Le salary cap initial est de **11 M**, mais il évolue selon les performances et
la valorisation des joueurs choisis. La somme des valeurs des 17 joueurs ne doit
pas dépasser le **salary cap actuel de l’équipe**, et non le montant initial.

Le plafond effectif vient de **`equipe.budget`** dans la composition
sélectionnée. Ne pas traiter le champ API générique `cap` comme le plafond
effectif lorsqu’il diffère de ce budget. Les montants d’une analyse précédente
ne constituent pas une valeur actuelle : vérifier à nouveau le budget à chaque
journée et pour chaque compétition.

Le budget doit donc être considéré comme une ressource à optimiser : le joueur
le plus cher n’est pas nécessairement le meilleur choix si un joueur moins cher
offre une espérance de points comparable et permet de renforcer un autre poste.

---

## 4. Limite de joueurs par club

Une équipe Fantasy peut comporter au maximum :

**`club_limit` joueurs du même club**, normalement 3

Cette limite s’applique à l’ensemble de la composition.

Toute recommandation doit vérifier cette contrainte avant de proposer un
changement.

Il est donc impossible, par exemple, de surcharger une composition avec 4
joueurs de l’UBB même si le matchup est particulièrement favorable.

---

## 5. Capitaine

Le capitaine doit être choisi parmi les **15 titulaires**.

Ses points comptent :

**double (×2)**

Le choix du capitaine doit privilégier un joueur combinant :

- forte espérance de points ;
- temps de jeu élevé ;
- rôle important dans son équipe ;
- régularité ;
- matchup favorable ;
- plafond de score élevé.

Le brassard ne doit pas être attribué uniquement sur la réputation du joueur.

---

## 6. Impact players / remplaçants

La composition comporte **2 joueurs sur le banc Fantasy**. Un seul est désigné
impact player (`impact_slot`) et reçoit le multiplicateur **×2**.

Un titulaire réel peut être placé sur le banc Fantasy : sa note est divisée par
**2**, puis le multiplicateur impact éventuel est appliqué. Ce choix est légal ;
il faut comparer sa valeur attendue après pénalité à celle des remplaçants
réels.

Le statut réel vient de la feuille de match : numéros 1–15 titulaires, 16–23
remplaçants. Un club non annoncé signifie statut inconnu, jamais absence.
Privilégier des remplaçants capables de jouer au moins dix minutes, sans
transformer cette préférence stratégique en contrainte de validité.

---

## 7. Temps de jeu minimum

Un joueur qui dispute **moins de 10 minutes** :

- n’est pas noté ;
- rapporte **0 point**.

Le temps de jeu probable est donc particulièrement important pour les
remplaçants.

---

## 8. Forfait de dernière minute

Lorsqu’un joueur bénéficie du forfait tardif officiel (règle publiée : moins de
deux heures avant le coup d’envoi), identifié dans `forfaits` de
`/api/notes-journee?journee=N` :

- il rapporte automatiquement **30 points** ;
- s’il était capitaine ou impact player, ce forfait est également pris en compte
  avec le multiplicateur correspondant.

Cette règle évite qu’un forfait très tardif détruise entièrement une
composition.

---

## 9. Verrouillage de la composition

Le serveur détermine les clubs verrouillés. Consulter `/api/compos/etat-verrou`
(`demarres`, `liberes`, `coups_envoi`) ; ne pas déduire le verrou d’une marge
locale de cinq minutes

Une fois le club verrouillé, les joueurs concernés ne peuvent plus être
modifiés.

La composition doit donc être suivie au fil du week-end, notamment lorsque les
matchs sont répartis sur plusieurs créneaux.

---

## 10. Calcul des points

Les performances sont évaluées par **l’Indice de Performance du jeu**, sur 100,
calculé à partir des statistiques officielles. Ne pas le confondre avec un
indice Opta externe ni ajouter une seconde fois des bonus pour les statistiques
détaillées.

Le calcul est basé sur les statistiques officielles du championnat.

L’IP prend en compte de nombreuses actions réalisées pendant le match, positives
comme négatives.

Les statistiques valorisées dépendent notamment du poste du joueur.

### Exemples de statistiques importantes selon les postes

| Poste           | Statistiques particulièrement importantes           |
| --------------- | --------------------------------------------------- |
| Pilier          | mêlée, travail au ruck, gain de la ligne d’avantage |
| Talonneur       | conquête (mêlée/touche), plaquages, travail au ruck |
| Deuxième ligne  | conquête, activité défensive, travail au ruck       |
| Troisième ligne | courses dominantes, franchissements, plaquages      |
| Demi de mêlée   | qualité de distribution, jeu au pied, mètres gagnés |
| Ouvreur         | qualité de distribution, jeu au pied, mètres gagnés |
| Centre          | franchissements, plaquages, offloads                |
| Ailier          | mètres gagnés, défenseurs battus, jeu aérien        |
| Arrière         | mètres gagnés, défenseurs battus, jeu aérien        |

Cette grille doit être utilisée pour comparer des joueurs **à poste
équivalent**.

---

## 11. Conversion de l'Indice de Performance en points Fantasy

La note moyenne est d’environ **63**.

Les performances sont réparties en grandes catégories :

| Indice de performance | Interprétation             |
| --------------------- | -------------------------- |
| < 50                  | Match insuffisant          |
| 50–59                 | Match moyen                |
| 60–69                 | Match correct / plutôt bon |
| 70–79                 | Très bon match             |
| 80–89                 | Excellent match            |
| 90+                   | Performance exceptionnelle |

La distribution est centrée autour de la zone 60–70 : une note très élevée doit
donc être considérée comme une vraie performance et non comme la norme.

Pour l’analyse Fantasy, il faut regarder à la fois :

- la moyenne ;
- les derniers matchs ;
- la fréquence des gros scores ;
- le plancher ;
- le plafond ;
- la régularité.

---

## 12. Méthode d'analyse à appliquer à chaque journée

Lorsqu’une nouvelle composition est analysée, procéder dans cet ordre :

1. **Vérifier les contraintes du jeu** : 17 joueurs, postes, salary cap, limite
   de club renvoyée par l’API (`club_limit`, normalement 3).
2. **Vérifier les compositions réelles** : titulaires Fantasy = joueurs
   titulaires recherchés ; banc Fantasy = rôle réel et pénalité éventuelle
   vérifiés.
3. **Évaluer les matchs de la journée** : favoris, écarts attendus,
   domicile/extérieur, potentiel offensif et scénario probable.
4. **Identifier les clubs à cibler** sans dépasser la limite de club indiquée
   par l’API.
5. **Analyser chaque joueur** selon sa moyenne, sa forme récente, ses
   statistiques par match, son poste, son temps de jeu et son matchup.
6. **Repérer les maillons faibles** de la composition : faible plafond, mauvaise
   forme, matchup difficile, temps de jeu incertain ou mauvais rapport
   valeur/points.
7. **Proposer plusieurs alternatives** pour les postes faibles, avec
   justification et conséquences sur le budget et la limite par club.
8. **Optimiser le capitaine** en recherchant le meilleur compromis entre
   plancher, plafond et probabilité de grosse performance.
9. **Optimiser les deux joueurs du banc**, puis désigner le seul impact player
   ×2.
10. **Faire un contrôle final** de toutes les contraintes avant de recommander
    la composition.

---

## 13. Principes stratégiques pour les recommandations

### Ne pas optimiser uniquement sur la moyenne

La moyenne historique constitue une base, mais elle ne suffit pas.

Un joueur légèrement moins performant historiquement peut devenir un meilleur
choix si :

- son équipe est largement favorite ;
- il joue à domicile ;
- son adversaire correspond bien à son profil ;
- il traverse une bonne période ;
- son rôle a récemment augmenté ;
- son prix est nettement inférieur.

### Exploiter les matchups collectifs

Lorsqu’un club est susceptible de dominer fortement son adversaire, ses joueurs
peuvent bénéficier :

- de davantage de possession ;
- de davantage de mètres parcourus ;
- de davantage de situations offensives ;
- de davantage d’essais et d’actions positives.

Il peut donc être pertinent d’utiliser les **3 places autorisées** sur un club
particulièrement bien placé.

### Mais éviter la concentration aveugle

La limite de club renvoyée par l’API est une limite, pas un objectif.

Il faut comparer le troisième joueur d’un club avec les alternatives disponibles
dans les autres équipes.

### Distinguer plancher et plafond

Pour chaque choix important, l’analyse doit idéalement distinguer :

- **plancher** : score attendu même dans un match moyen ;
- **projection centrale** : performance la plus probable ;
- **plafond** : potentiel en cas de très bon scénario.

Cette distinction est particulièrement importante pour le capitaine et les
impact players.

---

## 14. Checklist avant validation d'une composition

Avant de considérer une équipe comme validée :

- [ ] 17 joueurs sélectionnés.
- [ ] 15 titulaires Fantasy + 2 joueurs sur le banc, un seul impact désigné.
- [ ] Postes valides.
- [ ] Valeur totale des 17 joueurs ≤ salary cap actuel de l’équipe, vérifié pour
      la journée.
- [ ] Limite de club de l’API respectée.
- [ ] Pénalité de moitié appliquée aux titulaires réels sur le banc Fantasy.
- [ ] Statut réel vérifié ; inconnu reste provisoire.
- [ ] Aucun joueur avec un temps de jeu manifestement trop incertain sans
      justification.
- [ ] Matchups de la journée pris en compte.
- [ ] Forme récente prise en compte.
- [ ] Rapport valeur / potentiel vérifié.
- [ ] Capitaine choisi parmi les titulaires.
- [ ] Capitaine optimisé pour le multiplicateur ×2.
- [ ] Un seul impact player optimisé pour le multiplicateur ×2.
- [ ] Dernières compositions / forfaits vérifiés avant verrouillage.
- [ ] Limite de club API revérifiée après chaque changement.

---

## 15. Format attendu pour les futures analyses

Une analyse de journée doit idéalement produire :

**Diagnostic de la composition** — niveau global, forces principales et
exposition aux différents matchs.

**Points faibles prioritaires** — les 2 à 4 choix qui méritent le plus d’être
challengés.

**Alternatives** — plusieurs remplaçants possibles pour chaque point faible,
avec justification statistique, matchup, budget et contrainte de club.

**Capitaine** — choix recommandé et principales alternatives.

**Banc et impact** — vérifier les rôles réels, appliquer les pénalités et
comparer le seul impact ×2.

**Contrôle réglementaire final** — budget, nombre de joueurs par club, postes et
statut titulaire/remplaçant.

**Verdict** — composition finale recommandée et éventuels changements à
surveiller avant les coups d’envoi.

---

## Règle de priorité pour l'assistant

Lorsqu’une recommandation issue des statistiques entre en conflit avec une règle
du jeu, **la règle du jeu prime toujours**.

Ne jamais recommander une composition invalide pour gagner quelques points
théoriques.

## Sources et couche d’analyse v1

Règles recoupées le 9 octobre 2026 avec https://fantasy.poneeey.fr/regles et le
calcul affiché sur https://fantasy.poneeey.fr/equipe. Les points historiques
renvoyés par le serveur restent inchangés.

Utiliser `sync`, `data status`, `analyze player`, `analyze matchups`,
`analyze lineup` et `compare` décrits dans README.md. Citer les identifiants et
horodatages des snapshots. Une donnée ancienne ou une composition réelle
inconnue empêche une recommandation présentée comme entièrement vérifiée. Le
modèle v1 applique une seule fois le facteur `1 + 0.10 × domination` ; il ne
prédit pas les prochaines annonces d’équipe.
