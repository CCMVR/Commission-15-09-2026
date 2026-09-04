# Implementation Plan: Inscription des élus aux structures Enfance-Jeunesse

**Branch**: `001-inscription-elus-commission` | **Date**: 2026-09-04 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-inscription-elus-commission/spec.md`

---

## Summary

Développement d'une application web interactive moderne déployable directement sur GitHub Pages, permettant aux 33 élus de la commission Enfance Jeunesse Solidarités Prévention de s'inscrire sur les structures d'accueil du territoire. L'application présente une matrice dynamique ordonnée par élu (lignes) et par structure groupée par commune (colonnes), avec grisement strict de la commune d'origine, sélection séquentielle de vœux hiérarchisés (Choix 1 à 5 max) avec réindexation automatique à la désélection, guide d'utilisation "Marche à suivre" en en-tête, et synchronisation temps réel avec une table isolée et non-destructive dans Supabase (`inscriptions_elus_commission_structures`).

---

## Technical Context

**Language/Version**: HTML5, Modern CSS3 (Grid/Flexbox/CSS Variables), JavaScript Vanilla (ES2022+)  
**Primary Dependencies**: Aucun bundler lourd; API REST Supabase native via `fetch` standard  
**Storage**: PostgreSQL distant (Supabase REST API v1 avec clé publique `anon`)  
**Testing**: Scénarios de validation manuels et automatisés documentés dans `quickstart.md`, scripts de vérification de schéma et tests d'intégrité de données  
**Target Platform**: GitHub Pages (tous navigateurs modernes : Chrome, Edge, Firefox, Safari)  
**Project Type**: Single Page Application (SPA statique Web)  
**Performance Goals**: Temps de chargement initial < 1s, réponse au clic < 50ms, persistance Supabase < 500ms  
**Constraints**:
- Déploiement GitHub Pages direct sans pipeline de compilation
- Table Supabase strictement isolée (`inscriptions_elus_commission_structures`), zéro suppression ou altération de tables tierces
- Lisibilité optimale sur écran large / vidéoprojecteur en séance de commission  
**Scale/Scope**: 33 élus, 14 communes, 20 structures d'accueil enfance-jeunesse, 5 choix max par élu

---

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principe / Règle | Statut | Justification |
|---|:---:|---|
| **I. Simplicité & Lisibilité (KISS)** | PASS | Architecture Web statique native sans dépendances npm inutiles. |
| **II. Non-Destructivité des Données** | PASS | Script SQL `CREATE TABLE IF NOT EXISTS` dédié avec préfixe unique, aucun `DROP`/`TRUNCATE`. |
| **III. Sécurité & RLS** | PASS | Row Level Security (RLS) activé sur la table dédiée avec politiques ciblées. |
| **IV. Validation & Testabilité** | PASS | Guide de validation `quickstart.md` couvrant l'ensemble des règles métiers et cas limites. |

---

## Project Structure

### Documentation (this feature)

```text
specs/001-inscription-elus-commission/
├── spec.md              # Spécification fonctionnelle validée
├── plan.md              # Ce plan d'implémentation
├── research.md          # Résultats de recherche Phase 0
├── data-model.md        # Modèle de données conceptuel et relationnel Phase 1
├── quickstart.md        # Guide de test et scénarios de validation Phase 1
├── contracts/           # Contrats d'interfaces
│   ├── supabase-schema.sql  # Script SQL non destructif pour Supabase
│   └── api-contract.md      # Spécification des endpoints REST PostgREST
└── checklists/
    └── requirements.md  # Checklist de conformité des exigences
```

### Source Code (repository root)

```text
.
├── index.html           # Page principale de l'application (Header, logo, marche à suivre, grille, dashboard)
├── css/
│   └── styles.css       # Styles CSS modernes (CSS Grid, sticky header/columns, thèmes des choix 1-5, badges)
├── js/
│   ├── data.js          # Référentiel unifié des 33 élus et 20 structures avec normalisation des communes
│   ├── supabase.js      # Client d'intégration REST PostgREST avec Supabase (sauvegarde, chargement, sync)
│   └── app.js           # Contrôleur d'interface (interactions, attribution des choix 1-5, réindexation, filtres)
├── logo.png             # Logo officiel de la collectivité
├── Fiche structures.xlsx # Données sources structures
├── Liste des élus.xlsx  # Données sources élus
├── .specify/            # Configuration et mémoires Spec Kit
└── specs/               # Spécifications et artefacts de conception
```

**Structure Decision**: Architecture Web statique modulaire à la racine du dépôt, garantissant une compatibilité immédiate avec GitHub Pages tout en maintenant une stricte séparation des responsabilités (`data`, `supabase`, `app`, `styles`).

---

## Complexity Tracking

*Aucune dérogation ni violation constitutionnelle identifiée.*
