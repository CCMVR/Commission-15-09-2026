# Tasks: Inscription des élus aux structures Enfance-Jeunesse

**Feature**: `001-inscription-elus-commission`  
**Spec**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md) | **Data Model**: [data-model.md](./data-model.md)  
**Status**: Ready for Implementation

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Initialisation du projet et mise en place de la structure de fichiers statique.

- [X] T001 Créer la structure des répertoires de l'application (`css/`, `js/`, `scripts/`)
- [X] T002 [P] Vérifier l'intégration du logo officiel `logo.png` et l'accès aux classeurs sources `Fiche structures.xlsx` et `Liste des élus.xlsx`
- [X] T003 [P] Développer le script d'extraction automatique et de validation des données sources dans `scripts/extract_referentiel.py`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Données socles, client API Supabase et fondations visuelles indispensables avant toute User Story.

**CRITICAL**: Aucun développement de User Story ne commence avant la validation de cette phase.

- [X] T004 Générer le module de données et référentiel unifié (33 élus, 20 structures, 14 communes normalisées) dans `js/data.js`
- [X] T005 [P] Implémenter le module client REST PostgREST Supabase (`fetch`, headers auth anon, gestion d'erreurs) dans `js/supabase.js`
- [X] T006 [P] Configurer les fondations CSS (variables de couleurs, typographie, disposition CSS Grid/Flexbox, thèmes) dans `css/styles.css`

**Checkpoint**: Référentiel et client Supabase opérationnels — le développement des User Stories peut débuter.

---

## Phase 3: User Story 1 - Consultation et repérage visuel sur la grille interactive (Priority: P1) ⭐ MVP

**Goal**: Offrir aux élus et au coordinateur une vue d'ensemble claire avec logo, marche à suivre, élus en lignes et structures groupées par commune en colonnes.

**Independent Test**: Ouvrir `index.html` en local : vérifier que le logo est net en grand format, que l'encart "Marche à suivre" est lisible, et que les 33 élus et 20 structures s'affichent correctement dans la matrice sans décalage.

- [X] T007 [US1] Créer la structure sémantique de l'application avec en-tête, logo, bandeau "Marche à suivre" et conteneur de grille dans `index.html`
- [X] T008 [P] [US1] Styliser le bandeau "Marche à suivre", les badges de types de services (ALSH, Ados, Crèche, RPE, Solidarités, Ludothèque) et la hiérarchie des en-têtes dans `css/styles.css`
- [X] T009 [US1] Implémenter le moteur de rendu de la matrice interactive (lignes élus, colonnes structures groupées par commune) dans `js/app.js`
- [X] T010 [US1] Valider le rendu complet sans doublon et la lisibilité responsive sur écran large

**Checkpoint**: User Story 1 fonctionnelle de manière autonome (MVP visuel atteint).

---

## Phase 4: User Story 2 - Règle d'incompatibilité communale (Priority: P1)

**Goal**: Empêcher tout élu de s'inscrire sur une structure de sa propre commune en grisant et verrouillant strictement les cellules concernées.

**Independent Test**: Vérifier sur la grille que pour `BEAU Virginie` (Bas-en-Basset), les 3 structures de Bas-en-Basset sont grisées et inactives, tandis que pour `CAPDEVIELLE Florian` (Boisset, sans structure), aucune case n'est grisée.

- [X] T011 [US2] Implémenter la logique d'incompatibilité communale `isBlocked(elu, structure)` avec normalisation des noms de communes dans `js/app.js`
- [X] T012 [P] [US2] Définir les styles visuels des cellules verrouillées (hachures grises, fond sombre, curseur `not-allowed`, infobulle explicative) dans `css/styles.css`
- [X] T013 [US2] Tester et vérifier le verrouillage pour les 33 élus (cas avec structures et cas des 6 communes sans structures)

**Checkpoint**: Les règles déontologiques d'incompatibilité sont strictement appliquées et vérifiables.

---

## Phase 5: User Story 3 - Inscription et hiérarchisation ordonnée des choix (Priority: P1)

**Goal**: Permettre la sélection successive de vœux (Choix 1 à 5 max) au clic, avec annulation au second clic et réindexation automatique sans trou dans les rangs.

**Independent Test**: Cliquer sur 3 structures autorisées pour un élu : vérifier l'attribution des badges "Choix 1", "Choix 2", "Choix 3". Cliquer à nouveau sur le Choix 2 : vérifier sa désélection et le passage du Choix 3 en Choix 2. Tenter un 6ème choix : vérifier l'affichage du message préventif de plafond.

- [X] T014 [US3] Implémenter le gestionnaire d'événement de clic pour l'attribution ordonnée des choix (Choix 1 à 5 max) dans `js/app.js`
- [X] T015 [US3] Implémenter l'algorithme de désélection et de réindexation automatique des choix restants dans `js/app.js`
- [X] T016 [P] [US3] Définir la charte graphique des badges de choix (Choix 1 Or `#f59e0b`, Choix 2 Bleu `#3b82f6`, Choix 3 Vert `#10b981`, Choix 4 Violet `#8b5cf6`, Choix 5 Cyan `#06b6d4`) dans `css/styles.css`
- [X] T017 [US3] Ajouter les retours visuels et alertes ergonomiques (alerte plafond 5 choix, bouton d'effacement de ligne avec confirmation) dans `js/app.js`

**Checkpoint**: Le mécanisme complet de recueil des vœux est interactif et fluide en local.

---

## Phase 6: User Story 4 - Persistance temps réel et synchronisation Supabase (Priority: P2)

**Goal**: Sauvegarder instantanément chaque vœu dans la table Supabase `inscriptions_elus_commission_structures` et synchroniser l'affichage pour tous les utilisateurs connectés.

**Independent Test**: Ouvrir deux fenêtres de navigateur. Enregistrer un vœu dans la première fenêtre, vérifier qu'il apparaît dans la seconde fenêtre et qu'il est présent dans la table Supabase.

- [X] T018 [US4] Connecter les actions de saisie (ajout, suppression, mise à jour des rangs) aux requêtes PostgREST dans `js/app.js` et `js/supabase.js`
- [X] T019 [US4] Implémenter le chargement initial asynchrone des vœux existants au démarrage dans `js/app.js`
- [X] T020 [P] [US4] Intégrer l'indicateur visuel d'état de synchronisation (Enregistré, En cours, Hors-ligne avec bouton Réessayer) dans `index.html` et `css/styles.css`
- [X] T021 [US4] Configurer un rafraîchissement périodique (polling doux toutes les 15 secondes) pour maintenir la grille synchronisée en séance de commission dans `js/app.js`

**Checkpoint**: Synchronisation distante complète, temps réel et résiliente sur la table Supabase dédiée.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Finitions, tableau de bord récapitulatif, export pour la commission et préparation au déploiement GitHub Pages.

- [X] T022 [P] Développer le bandeau tableau de bord récapitulatif (nombre d'élus ayant répondu, total de vœux par structure) dans `index.html` et `js/app.js`
- [X] T023 [P] Implémenter une fonction d'export synthétique (CSV / récapitulatif imprimable) pour le coordinateur dans `js/app.js`
- [X] T024 [P] Optimiser l'ergonomie visuelle pour grand écran et vidéoprojecteur (colonnes des élus et en-têtes de structures figés au défilement `sticky`) dans `css/styles.css`
- [X] T025 Exécuter l'intégralité des scénarios de test décrits dans `specs/001-inscription-elus-commission/quickstart.md`
- [X] T026 Rédiger le guide d'utilisation et de déploiement GitHub Pages dans `README.md`

---

## Dependencies & Execution Order

### Phase Dependencies
- **Phase 1 (Setup)** : Indépendante, démarre immédiatement.
- **Phase 2 (Foundational)** : Dépend de la Phase 1. Bloque toutes les User Stories.
- **Phases 3 à 6 (User Stories)** : Dépendent de la Phase 2.
  - US1 (Grille & Marche à suivre) → US2 (Grisement d'incompatibilité) → US3 (Attribution des vœux 1-5) → US4 (Persistance Supabase).
- **Phase 7 (Polish)** : Dépend de la complétion des User Stories.

### Opportunités de parallélisation
- En Phase 1 : T002 et T003 peuvent être exécutés en parallèle.
- En Phase 2 : T005 (Client Supabase) et T006 (Styles CSS) peuvent être travaillés en parallèle.
- En Phase 3 : T008 (Styles des badges) et T007 (Structure HTML) peuvent être parallélisés.
- En Phase 5 : T016 (Styles des badges de choix) peut être réalisé en parallèle de T014/T015 (Logique métier).

---

## Stratégie d'implémentation (MVP d'abord)

1. **Étape 1** : Réaliser le Setup (T001-T003) et les Fondations (T004-T006).
2. **Étape 2 - MVP** : Réaliser US1 (T007-T010). Valider que la grille complète s'affiche avec le logo et les consignes.
3. **Étape 3** : Ajouter la règle d'incompatibilité communale US2 (T011-T013).
4. **Étape 4** : Implémenter le mécanisme de vœux ordonnés 1 à 5 US3 (T014-T017).
5. **Étape 5** : Brancher la persistance Supabase US4 (T018-T021).
6. **Étape 6** : Finaliser avec le tableau de bord, l'export et le déploiement (T022-T026).
